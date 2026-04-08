import type { AppointmentStatus, PaymentMethod, PaymentStatus, TransactionStatus } from "@prisma/client";

export const ACTIVE_APPOINTMENT_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED"
] as const satisfies ReadonlyArray<AppointmentStatus>;

export interface BookAppointmentInput {
  doctorProfileId: bigint;
  appointmentStartLocal: string;
  patientTimezone: string;
  reasonForVisit: string;
  patientEmail?: string;
  symptoms?: string[];
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface BookAppointmentCommand extends BookAppointmentInput {
  patientUserId: bigint;
  bookedByUserId?: bigint;
}

export interface DoctorAvailabilityWindow {
  start: string;
  end: string;
}

export interface DoctorAvailabilityDay {
  dayOfWeek: number;
  windows: DoctorAvailabilityWindow[];
}

export interface BookedAppointmentResponse {
  id: bigint;
  doctorProfileId: bigint;
  patientUserId: bigint;
  appointmentStartAt: Date;
  appointmentEndAt: Date;
  appointmentDate: Date;
  patientTimezone: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  consultationFee: string;
  transactionStatus: TransactionStatus;
}
