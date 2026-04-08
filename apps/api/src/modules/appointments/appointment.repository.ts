import {
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  TransactionStatus,
  type PrismaClient
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ACTIVE_APPOINTMENT_STATUSES, type BookAppointmentCommand, type BookedAppointmentResponse, type DoctorAvailabilityDay } from "./appointment.types.js";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface LockedDoctorProfileRow {
  id: bigint;
  consultation_fee: Prisma.Decimal;
  slot_duration_minutes: number;
  timezone: string;
  working_hours_json: Prisma.JsonValue;
  is_accepting_new_patients: number;
}

interface ConflictingAppointmentRow {
  id: bigint;
}

interface LockedAppointmentStatusRow {
  id: bigint;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
}

export const appointmentRepository = {
  async findManyByActor(params: {
    actorId: bigint;
    actorRole: "SUPER_ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTION";
    page: number;
    limit: number;
    status?: AppointmentStatus;
  }) {
    const where: Prisma.AppointmentWhereInput =
      params.actorRole === "PATIENT"
        ? { patientUserId: params.actorId }
        : params.actorRole === "DOCTOR"
          ? { doctorProfile: { userId: params.actorId } }
          : {};

    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { appointmentStartAt: "asc" },
        include: {
          patient: {
            select: { fullName: true, phone: true }
          },
          doctorProfile: {
            select: {
              specialty: true,
              user: {
                select: { fullName: true }
              }
            }
          }
        }
      }),
      prisma.appointment.count({ where })
    ]);

    return { items, total };
  },

  async lockDoctorForScheduleValidation(doctorProfileId: bigint) {
    const rows = await prisma.$queryRaw<LockedDoctorProfileRow[]>`
      SELECT
        id,
        consultation_fee,
        slot_duration_minutes,
        timezone,
        working_hours_json,
        is_accepting_new_patients
      FROM doctor_profiles
      WHERE id = ${doctorProfileId}
    `;

    return rows[0]
      ? {
          id: rows[0].id,
          consultationFee: rows[0].consultation_fee.toString(),
          slotDurationMinutes: rows[0].slot_duration_minutes,
          timezone: rows[0].timezone,
          workingHours: rows[0].working_hours_json as unknown as DoctorAvailabilityDay[],
          isAcceptingNewPatients: rows[0].is_accepting_new_patients === 1
        }
      : null;
  },

  async bookAppointment(command: BookAppointmentCommand & { appointmentStartAt: Date; appointmentEndAt: Date; appointmentDate: Date }) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const lockedDoctorRows = await tx.$queryRaw<LockedDoctorProfileRow[]>`
            SELECT
              id,
              consultation_fee,
              slot_duration_minutes,
              timezone,
              working_hours_json,
              is_accepting_new_patients
            FROM doctor_profiles
            WHERE id = ${command.doctorProfileId}
            FOR UPDATE
          `;

          const lockedDoctor = lockedDoctorRows[0];

          if (!lockedDoctor) {
            throw new Error("DOCTOR_NOT_FOUND");
          }

          if (lockedDoctor.is_accepting_new_patients !== 1) {
            throw new Error("DOCTOR_NOT_ACCEPTING_BOOKINGS");
          }

          const conflictingRows = await tx.$queryRaw<ConflictingAppointmentRow[]>`
            SELECT id
            FROM appointments
            WHERE doctor_profile_id = ${command.doctorProfileId}
              AND appointment_start_at < ${command.appointmentEndAt}
              AND appointment_end_at > ${command.appointmentStartAt}
              AND status IN (${Prisma.join(ACTIVE_APPOINTMENT_STATUSES)})
            LIMIT 1
            FOR UPDATE
          `;

          if (conflictingRows.length > 0) {
            throw new Error("SLOT_ALREADY_BOOKED");
          }

          const createdAppointment = await appointmentRepository.createAppointmentWithTransaction(
            tx,
            command,
            lockedDoctor.consultation_fee.toString()
          );

          return {
            ...createdAppointment,
            consultationFee: lockedDoctor.consultation_fee.toString()
          } satisfies BookedAppointmentResponse;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("SLOT_ALREADY_BOOKED");
      }

      throw error;
    }
  },

  async createAppointmentWithTransaction(
    tx: TxClient,
    command: BookAppointmentCommand & { appointmentStartAt: Date; appointmentEndAt: Date; appointmentDate: Date },
    consultationFee: string
  ): Promise<BookedAppointmentResponse> {
    const appointment = await tx.appointment.create({
      data: {
        patientUserId: command.patientUserId,
        doctorProfileId: command.doctorProfileId,
        bookedByUserId: command.bookedByUserId ?? null,
        appointmentDate: command.appointmentDate,
        appointmentStartAt: command.appointmentStartAt,
        appointmentEndAt: command.appointmentEndAt,
        patientTimezone: command.patientTimezone,
        status: AppointmentStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        reasonForVisit: command.reasonForVisit,
        symptomsJson: command.symptoms ? command.symptoms : Prisma.JsonNull,
        notes: command.notes ?? null
      }
    });

    const transaction = await tx.transaction.create({
      data: {
        appointmentId: appointment.id,
        patientUserId: command.patientUserId,
        amount: consultationFee,
        paymentMethod: command.paymentMethod,
        status: TransactionStatus.INITIATED,
        currency: "INR"
      }
    });

    return {
      id: appointment.id,
      doctorProfileId: appointment.doctorProfileId,
      patientUserId: appointment.patientUserId,
      appointmentStartAt: appointment.appointmentStartAt,
      appointmentEndAt: appointment.appointmentEndAt,
      appointmentDate: appointment.appointmentDate,
      patientTimezone: appointment.patientTimezone,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      consultationFee,
      transactionStatus: transaction.status
    };
  },

  async cancelAppointment(params: {
    appointmentId: bigint;
    actorId: bigint;
    actorRole: "SUPER_ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTION";
    cancelReason: string;
  }) {
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: params.appointmentId
      },
      include: {
        doctorProfile: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    const canCancel =
      params.actorRole === "SUPER_ADMIN" ||
      params.actorRole === "RECEPTION" ||
      (params.actorRole === "PATIENT" && appointment.patientUserId === params.actorId) ||
      (params.actorRole === "DOCTOR" && appointment.doctorProfile.userId === params.actorId);

    if (!canCancel) {
      throw new Error("FORBIDDEN");
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new Error("APPOINTMENT_ALREADY_CANCELLED");
    }

    return prisma.appointment.update({
      where: {
        id: params.appointmentId
      },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: params.cancelReason,
        paymentStatus: appointment.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : appointment.paymentStatus
      },
      include: {
        patient: {
          select: {
            fullName: true
          }
        },
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
    });
  },

  async updateAppointmentStatus(params: {
    appointmentId: bigint;
    nextStatus: AppointmentStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<LockedAppointmentStatusRow[]>`
        SELECT id, status, payment_status
        FROM appointments
        WHERE id = ${params.appointmentId}
        FOR UPDATE
      `;

      const lockedAppointment = lockedRows[0];

      if (!lockedAppointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }

      if (
        params.nextStatus !== lockedAppointment.status &&
        (lockedAppointment.status === AppointmentStatus.CANCELLED || lockedAppointment.status === AppointmentStatus.COMPLETED)
      ) {
        throw new Error("APPOINTMENT_STATUS_LOCKED");
      }

      const nextPaymentStatus =
        params.nextStatus === AppointmentStatus.CANCELLED && lockedAppointment.payment_status === PaymentStatus.PAID
          ? PaymentStatus.REFUNDED
          : lockedAppointment.payment_status;

      if (nextPaymentStatus === PaymentStatus.REFUNDED) {
        await tx.transaction.updateMany({
          where: {
            appointmentId: params.appointmentId,
            status: TransactionStatus.SUCCESS
          },
          data: {
            status: TransactionStatus.REFUNDED
          }
        });
      }

      return tx.appointment.update({
        where: {
          id: params.appointmentId
        },
        data: {
          status: params.nextStatus,
          paymentStatus: nextPaymentStatus,
          cancelReason:
            params.nextStatus === AppointmentStatus.CANCELLED ? "Cancelled from admin panel" : null
        },
        include: {
          patient: {
            select: {
              fullName: true
            }
          },
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
      });
    });
  }
};
