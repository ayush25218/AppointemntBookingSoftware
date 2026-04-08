import "dotenv/config";
import { hashSync } from "bcryptjs";
import { AppointmentStatus, PaymentMethod, PaymentStatus, PrismaClient, RoleCode, TransactionStatus } from "@prisma/client";

const prisma = new PrismaClient();

const baseWorkingHours = [
  { dayOfWeek: 1, windows: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }] },
  { dayOfWeek: 2, windows: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }] },
  { dayOfWeek: 3, windows: [{ start: "09:00", end: "13:00" }] },
  { dayOfWeek: 4, windows: [{ start: "10:00", end: "14:00" }, { start: "17:00", end: "20:00" }] },
  { dayOfWeek: 5, windows: [{ start: "09:30", end: "12:30" }] }
] as const;

async function main(): Promise<void> {
  const roles = [
    { code: RoleCode.SUPER_ADMIN, displayName: "Super Admin", description: "System level administrator with full access" },
    { code: RoleCode.DOCTOR, displayName: "Doctor", description: "Medical practitioner managing appointments and reviews" },
    { code: RoleCode.PATIENT, displayName: "Patient", description: "Patient booking consultations and managing appointments" },
    { code: RoleCode.RECEPTION, displayName: "Reception", description: "Reception staff coordinating schedules and check-ins" }
  ] as const;

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { displayName: role.displayName, description: role.description },
      create: role
    });
  }

  const doctorRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.DOCTOR } });
  const patientRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.PATIENT } });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.SUPER_ADMIN } });
  const receptionRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.RECEPTION } });

  await prisma.user.upsert({
    where: { email: "admin@apollocare.in" },
    update: {},
    create: {
      roleId: adminRole.id,
      fullName: "Aarav Mehta",
      email: "admin@apollocare.in",
      phone: "+919810001001",
      passwordHash: hashSync("Admin@123", 10),
      city: "Bengaluru",
      state: "Karnataka",
      country: "India"
    }
  });

  await prisma.user.upsert({
    where: { email: "reception@apollocare.in" },
    update: {},
    create: {
      roleId: receptionRole.id,
      fullName: "Naina Kapoor",
      email: "reception@apollocare.in",
      phone: "+919810001002",
      passwordHash: hashSync("Reception@123", 10),
      city: "Bengaluru",
      state: "Karnataka",
      country: "India"
    }
  });

  const doctors = [
    {
      fullName: "Dr. Riya Sharma",
      email: "riya.sharma@apollocare.in",
      phone: "+919810001011",
      specialty: "Cardiology",
      fee: "1500.00",
      averageRating: "4.8",
      totalReviews: 128,
      qualification: "MD, DM Cardiology",
      registrationNumber: "KMC-2013-44821",
      clinicCity: "Bengaluru"
    },
    {
      fullName: "Dr. Daniel Fernandes",
      email: "daniel.fernandes@apollocare.in",
      phone: "+919810001012",
      specialty: "Neurology",
      fee: "1800.00",
      averageRating: "4.7",
      totalReviews: 96,
      qualification: "MD, DM Neurology",
      registrationNumber: "MMC-2011-33802",
      clinicCity: "Mumbai"
    },
    {
      fullName: "Dr. Aisha Khan",
      email: "aisha.khan@apollocare.in",
      phone: "+919810001013",
      specialty: "Pediatrics",
      fee: "1200.00",
      averageRating: "4.9",
      totalReviews: 142,
      qualification: "MD Pediatrics",
      registrationNumber: "DMC-2015-22567",
      clinicCity: "Delhi"
    }
  ] as const;

  for (const doctor of doctors) {
    const user = await prisma.user.upsert({
      where: { email: doctor.email },
      update: { roleId: doctorRole.id, fullName: doctor.fullName, phone: doctor.phone },
      create: {
        roleId: doctorRole.id,
        fullName: doctor.fullName,
        email: doctor.email,
        phone: doctor.phone,
        passwordHash: hashSync("Doctor@123", 10),
        city: doctor.clinicCity,
        state: doctor.clinicCity === "Mumbai" ? "Maharashtra" : doctor.clinicCity === "Delhi" ? "Delhi" : "Karnataka",
        country: "India"
      }
    });

    await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        specialty: doctor.specialty,
        consultationFee: doctor.fee,
        qualification: doctor.qualification,
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews
      },
      create: {
        userId: user.id,
        registrationNumber: doctor.registrationNumber,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        yearsOfExperience: 9,
        consultationFee: doctor.fee,
        slotDurationMinutes: 30,
        timezone: "Asia/Kolkata",
        workingHoursJson: baseWorkingHours,
        clinicAddressLine1: "Apollo Care Hospital, 12 Residency Road",
        clinicCity: doctor.clinicCity,
        clinicState: doctor.clinicCity === "Mumbai" ? "Maharashtra" : doctor.clinicCity === "Delhi" ? "Delhi" : "Karnataka",
        clinicCountry: "India",
        clinicPostalCode: doctor.clinicCity === "Mumbai" ? "400001" : doctor.clinicCity === "Delhi" ? "110001" : "560025",
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews
      }
    });
  }

  await prisma.user.upsert({
    where: { email: "vikram.patel@gmail.com" },
    update: {},
    create: {
      roleId: patientRole.id,
      fullName: "Vikram Patel",
      email: "vikram.patel@gmail.com",
      phone: "+919810001201",
      passwordHash: hashSync("Patient@123", 10),
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India"
    }
  });

  await prisma.user.upsert({
    where: { email: "sophia.dias@gmail.com" },
    update: {},
    create: {
      roleId: patientRole.id,
      fullName: "Sophia Dias",
      email: "sophia.dias@gmail.com",
      phone: "+919810001202",
      passwordHash: hashSync("Patient@123", 10),
      city: "Goa",
      state: "Goa",
      country: "India"
    }
  });

  const appointmentCount = await prisma.appointment.count();

  if (appointmentCount === 0) {
    const [vikram, sophia, riya, daniel, aisha] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: "vikram.patel@gmail.com" } }),
      prisma.user.findUniqueOrThrow({ where: { email: "sophia.dias@gmail.com" } }),
      prisma.doctorProfile.findFirstOrThrow({ where: { user: { email: "riya.sharma@apollocare.in" } } }),
      prisma.doctorProfile.findFirstOrThrow({ where: { user: { email: "daniel.fernandes@apollocare.in" } } }),
      prisma.doctorProfile.findFirstOrThrow({ where: { user: { email: "aisha.khan@apollocare.in" } } })
    ]);

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const buildSlot = (dayOffset: number, hour: number, minute: number, durationMinutes = 30) => {
      const start = new Date(baseDate);
      start.setDate(start.getDate() + dayOffset);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMinutes);

      const dateOnly = new Date(baseDate);
      dateOnly.setDate(dateOnly.getDate() + dayOffset);

      return {
        start,
        end,
        dateOnly
      };
    };

    const seededAppointments = [
      {
        patientUserId: vikram.id,
        doctorProfileId: riya.id,
        reasonForVisit: "Recurring chest tightness and fatigue review",
        slot: buildSlot(0, 9, 30),
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.UPI,
        transactionStatus: TransactionStatus.SUCCESS
      },
      {
        patientUserId: sophia.id,
        doctorProfileId: daniel.id,
        reasonForVisit: "Migraine follow-up consultation",
        slot: buildSlot(0, 10, 0),
        status: AppointmentStatus.CHECKED_IN,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        transactionStatus: TransactionStatus.SUCCESS
      },
      {
        patientUserId: vikram.id,
        doctorProfileId: aisha.id,
        reasonForVisit: "Pediatric immunization follow-up for younger sibling",
        slot: buildSlot(0, 11, 0),
        status: AppointmentStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.UPI,
        transactionStatus: TransactionStatus.INITIATED
      },
      {
        patientUserId: sophia.id,
        doctorProfileId: riya.id,
        reasonForVisit: "ECG and medication review after discharge",
        slot: buildSlot(1, 10, 30),
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.NET_BANKING,
        transactionStatus: TransactionStatus.SUCCESS
      },
      {
        patientUserId: vikram.id,
        doctorProfileId: daniel.id,
        reasonForVisit: "Dizziness assessment and MRI discussion",
        slot: buildSlot(-1, 12, 0),
        status: AppointmentStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        paymentMethod: PaymentMethod.CARD,
        transactionStatus: TransactionStatus.REFUNDED
      },
      {
        patientUserId: sophia.id,
        doctorProfileId: aisha.id,
        reasonForVisit: "Routine vaccination consultation",
        slot: buildSlot(-1, 15, 0),
        status: AppointmentStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        transactionStatus: TransactionStatus.SUCCESS
      }
    ] as const;

    for (const seededAppointment of seededAppointments) {
      const appointment = await prisma.appointment.create({
        data: {
          patientUserId: seededAppointment.patientUserId,
          doctorProfileId: seededAppointment.doctorProfileId,
          bookedByUserId: seededAppointment.patientUserId,
          appointmentDate: seededAppointment.slot.dateOnly,
          appointmentStartAt: seededAppointment.slot.start,
          appointmentEndAt: seededAppointment.slot.end,
          patientTimezone: "Asia/Kolkata",
          status: seededAppointment.status,
          paymentStatus: seededAppointment.paymentStatus,
          reasonForVisit: seededAppointment.reasonForVisit
        }
      });

      await prisma.transaction.create({
        data: {
          appointmentId: appointment.id,
          patientUserId: seededAppointment.patientUserId,
          amount:
            seededAppointment.doctorProfileId === riya.id
              ? "1500.00"
              : seededAppointment.doctorProfileId === daniel.id
                ? "1800.00"
                : "1200.00",
          paymentMethod: seededAppointment.paymentMethod,
          status: seededAppointment.transactionStatus,
          currency: "INR"
        }
      });

      if (seededAppointment.status === AppointmentStatus.COMPLETED) {
        await prisma.review.create({
          data: {
            appointmentId: appointment.id,
            patientUserId: seededAppointment.patientUserId,
            doctorProfileId: seededAppointment.doctorProfileId,
            rating: 5,
            title: "Very reassuring consultation",
            comment: "Doctor explained the treatment plan clearly and on time."
          }
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
