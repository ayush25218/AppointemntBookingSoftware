import { AppointmentStatus, PaymentStatus } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";
import { prisma } from "../../lib/prisma.js";

const activeStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING_PAYMENT,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.COMPLETED
];

export const dashboardRepository = {
  async getAdminDashboard() {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const [doctorCount, todayAppointments, pendingPayments, averageRatingResult, recentAppointments, doctorProfiles] = await Promise.all([
      prisma.doctorProfile.count(),
      prisma.appointment.count({
        where: {
          appointmentStartAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.appointment.count({
        where: {
          paymentStatus: PaymentStatus.PENDING,
          status: {
            in: activeStatuses
          }
        }
      }),
      prisma.doctorProfile.aggregate({
        _avg: {
          averageRating: true
        }
      }),
      prisma.appointment.findMany({
        take: 8,
        orderBy: [{ appointmentStartAt: "asc" }],
        include: {
          patient: {
            select: {
              fullName: true
            }
          },
          doctorProfile: {
            select: {
              specialty: true,
              consultationFee: true,
              user: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      }),
      prisma.doctorProfile.findMany({
        include: {
          user: {
            select: {
              fullName: true
            }
          },
          appointments: {
            where: {
              appointmentStartAt: {
                gte: today,
                lt: tomorrow
              },
              status: {
                in: [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN]
              }
            },
            orderBy: {
              appointmentStartAt: "asc"
            },
            select: {
              appointmentStartAt: true
            }
          }
        }
      })
    ]);

    return {
      stats: {
        totalDoctors: doctorCount,
        todayAppointments,
        pendingPayments,
        averageRating: Number(averageRatingResult._avg.averageRating ?? 0).toFixed(1)
      },
      recentAppointments,
      doctorLoad: doctorProfiles.map((profile) => ({
        doctorName: profile.user.fullName,
        specialty: profile.specialty,
        queueCount: profile.appointments.length,
        nextFreeSlot: profile.appointments[0]?.appointmentStartAt ?? null
      })),
      paymentAlerts: recentAppointments
        .filter((appointment) => appointment.paymentStatus !== PaymentStatus.PAID)
        .map((appointment) => ({
          id: appointment.id,
          patientName: appointment.patient.fullName,
          doctorName: appointment.doctorProfile.user.fullName,
          paymentStatus: appointment.paymentStatus,
          consultationFee: appointment.doctorProfile.consultationFee.toString()
        }))
    };
  },

  async getPatientDashboard(patientUserId: bigint) {
    const now = new Date();

    const [upcomingAppointments, pendingPayments, completedAppointments, reviewEligibleCount, recentTransactions] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientUserId,
          appointmentStartAt: {
            gte: now
          },
          status: {
            in: [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN]
          }
        },
        take: 5,
        orderBy: {
          appointmentStartAt: "asc"
        },
        include: {
          doctorProfile: {
            select: {
              specialty: true,
              consultationFee: true,
              user: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      }),
      prisma.appointment.count({
        where: {
          patientUserId,
          paymentStatus: PaymentStatus.PENDING
        }
      }),
      prisma.appointment.count({
        where: {
          patientUserId,
          status: AppointmentStatus.COMPLETED
        }
      }),
      prisma.appointment.count({
        where: {
          patientUserId,
          status: AppointmentStatus.COMPLETED,
          review: null
        }
      }),
      prisma.transaction.findMany({
        where: {
          patientUserId
        },
        take: 5,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          appointment: {
            select: {
              appointmentStartAt: true,
              doctorProfile: {
                select: {
                  specialty: true,
                  user: {
                    select: {
                      fullName: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    ]);

    return {
      stats: {
        upcomingCount: upcomingAppointments.length,
        pendingPayments,
        completedAppointments,
        reviewEligibleCount
      },
      upcomingAppointments,
      recentTransactions
    };
  },

  async getDoctorDashboard(doctorUserId: bigint) {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: {
        userId: doctorUserId
      },
      include: {
        user: {
          select: {
            fullName: true
          }
        },
        appointments: {
          where: {
            appointmentStartAt: {
              gte: today,
              lt: tomorrow
            }
          },
          orderBy: {
            appointmentStartAt: "asc"
          },
          include: {
            patient: {
              select: {
                fullName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!doctorProfile) {
      return null;
    }

    return {
      profile: {
        id: doctorProfile.id.toString(),
        fullName: doctorProfile.user.fullName,
        specialty: doctorProfile.specialty,
        consultationFee: doctorProfile.consultationFee.toString(),
        averageRating: doctorProfile.averageRating.toString(),
        totalReviews: doctorProfile.totalReviews
      },
      stats: {
        todayConsultations: doctorProfile.appointments.length,
        checkedInCount: doctorProfile.appointments.filter((appointment) => appointment.status === AppointmentStatus.CHECKED_IN).length,
        completedCount: doctorProfile.appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length,
        nextAppointmentAt: doctorProfile.appointments.find((appointment) => appointment.appointmentStartAt >= new Date())?.appointmentStartAt ?? null
      },
      todayAppointments: doctorProfile.appointments
    };
  }
};
