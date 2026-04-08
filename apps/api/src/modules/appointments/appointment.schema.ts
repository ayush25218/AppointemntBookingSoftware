import { PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../common/utils/pagination.js";

export const appointmentStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
]);

export const bookAppointmentBodySchema = z.object({
  doctorProfileId: z.coerce.bigint().positive(),
  appointmentStartLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Use local datetime format like 2026-05-10T14:30:00"),
  patientTimezone: z.string().trim().min(3).max(64),
  patientEmail: z.string().trim().email().optional(),
  reasonForVisit: z.string().trim().min(10).max(255),
  symptoms: z.array(z.string().trim().min(2).max(80)).max(10).optional(),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod)
});

export const cancelAppointmentParamsSchema = z.object({
  appointmentId: z.coerce.bigint().positive()
});

export const cancelAppointmentBodySchema = z.object({
  cancelReason: z.string().trim().min(5).max(255)
});

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  status: appointmentStatusSchema.optional()
});

export const updateAppointmentStatusParamsSchema = z.object({
  appointmentId: z.coerce.bigint().positive()
});

export const updateAppointmentStatusBodySchema = z.object({
  status: appointmentStatusSchema
});

export type BookAppointmentBody = z.infer<typeof bookAppointmentBodySchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type CancelAppointmentBody = z.infer<typeof cancelAppointmentBodySchema>;
export type CancelAppointmentParams = z.infer<typeof cancelAppointmentParamsSchema>;
export type UpdateAppointmentStatusBody = z.infer<typeof updateAppointmentStatusBodySchema>;
export type UpdateAppointmentStatusParams = z.infer<typeof updateAppointmentStatusParamsSchema>;
