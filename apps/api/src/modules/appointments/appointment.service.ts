import type { AppointmentStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/AppError.js";
import { addSlotDuration, assertSlotFallsWithinSchedule, isOnSlotBoundary, toUtcDateFromLocal } from "../../common/utils/dateUtils.js";
import { getPagination } from "../../common/utils/pagination.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { authRepository } from "../auth/auth.repository.js";
import type { BookAppointmentBody, ListAppointmentsQuery, UpdateAppointmentStatusBody } from "./appointment.schema.js";
import { appointmentRepository } from "./appointment.repository.js";

export const appointmentService = {
  async listAppointments(actor: AuthenticatedUser, query: ListAppointmentsQuery) {
    const { page, limit } = getPagination(query);
    const repositoryParams: {
      actorId: bigint;
      actorRole: "SUPER_ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTION";
      page: number;
      limit: number;
      status?: AppointmentStatus;
    } = {
      actorId: actor.id,
      actorRole: actor.role,
      page,
      limit
    };

    if (query.status) {
      repositoryParams.status = query.status as AppointmentStatus;
    }

    const { items, total } = await appointmentRepository.findManyByActor(repositoryParams);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async bookAppointment(actor: AuthenticatedUser, payload: BookAppointmentBody) {
    if (actor.role !== "PATIENT" && actor.role !== "RECEPTION" && actor.role !== "SUPER_ADMIN") {
      throw new AppError("Only patients or front-desk staff can create appointments", StatusCodes.FORBIDDEN, "FORBIDDEN");
    }

    let patientUserId = actor.id;

    if (actor.role !== "PATIENT") {
      if (!payload.patientEmail) {
        throw new AppError("patientEmail is required for admin or reception bookings", StatusCodes.BAD_REQUEST, "PATIENT_EMAIL_REQUIRED");
      }

      const patientUser = await authRepository.findPatientByEmail(payload.patientEmail);

      if (!patientUser) {
        throw new AppError("Patient account not found for the provided email", StatusCodes.NOT_FOUND, "PATIENT_NOT_FOUND");
      }

      patientUserId = patientUser.id;
    }

    const doctorProfile = await appointmentRepository.lockDoctorForScheduleValidation(payload.doctorProfileId);

    if (!doctorProfile) {
      throw new AppError("Doctor profile not found", StatusCodes.NOT_FOUND, "DOCTOR_NOT_FOUND");
    }

    if (!doctorProfile.isAcceptingNewPatients) {
      throw new AppError("Doctor is not accepting appointments right now", StatusCodes.CONFLICT, "DOCTOR_NOT_ACCEPTING_BOOKINGS");
    }

    const appointmentStartAt = toUtcDateFromLocal(payload.appointmentStartLocal, payload.patientTimezone);

    if (!isOnSlotBoundary(appointmentStartAt, doctorProfile.timezone, doctorProfile.slotDurationMinutes)) {
      throw new AppError(
        `Appointment must start on a ${doctorProfile.slotDurationMinutes}-minute slot boundary`,
        StatusCodes.BAD_REQUEST,
        "INVALID_SLOT_BOUNDARY"
      );
    }

    const appointmentEndAt = addSlotDuration(appointmentStartAt, doctorProfile.slotDurationMinutes);
    assertSlotFallsWithinSchedule(appointmentStartAt, appointmentEndAt, doctorProfile.timezone, doctorProfile.workingHours);

    try {
      const command: Parameters<typeof appointmentRepository.bookAppointment>[0] = {
        doctorProfileId: payload.doctorProfileId,
        patientUserId,
        bookedByUserId: actor.id,
        appointmentStartLocal: payload.appointmentStartLocal,
        patientTimezone: payload.patientTimezone,
        reasonForVisit: payload.reasonForVisit,
        paymentMethod: payload.paymentMethod,
        appointmentStartAt,
        appointmentEndAt,
        appointmentDate: new Date(appointmentStartAt.toISOString().slice(0, 10))
      };

      if (payload.patientEmail) {
        command.patientEmail = payload.patientEmail;
      }

      if (payload.symptoms) {
        command.symptoms = payload.symptoms;
      }

      if (payload.notes) {
        command.notes = payload.notes;
      }

      return await appointmentRepository.bookAppointment(command);
    } catch (error) {
      if (error instanceof Error && error.message === "SLOT_ALREADY_BOOKED") {
        throw new AppError(
          "This doctor slot was booked just now. Please choose another available time.",
          StatusCodes.CONFLICT,
          "SLOT_ALREADY_BOOKED"
        );
      }

      if (error instanceof Error && error.message === "DOCTOR_NOT_FOUND") {
        throw new AppError("Doctor profile not found", StatusCodes.NOT_FOUND, "DOCTOR_NOT_FOUND");
      }

      if (error instanceof Error && error.message === "DOCTOR_NOT_ACCEPTING_BOOKINGS") {
        throw new AppError(
          "Doctor is not accepting appointments right now",
          StatusCodes.CONFLICT,
          "DOCTOR_NOT_ACCEPTING_BOOKINGS"
        );
      }

      throw error;
    }
  },

  async cancelAppointment(actor: AuthenticatedUser, appointmentId: bigint, cancelReason: string) {
    try {
      return await appointmentRepository.cancelAppointment({
        appointmentId,
        actorId: actor.id,
        actorRole: actor.role,
        cancelReason
      });
    } catch (error) {
      if (error instanceof Error && error.message === "APPOINTMENT_NOT_FOUND") {
        throw new AppError("Appointment not found", StatusCodes.NOT_FOUND, "APPOINTMENT_NOT_FOUND");
      }

      if (error instanceof Error && error.message === "FORBIDDEN") {
        throw new AppError("You cannot cancel this appointment", StatusCodes.FORBIDDEN, "FORBIDDEN");
      }

      if (error instanceof Error && error.message === "APPOINTMENT_ALREADY_CANCELLED") {
        throw new AppError("Appointment is already cancelled", StatusCodes.CONFLICT, "APPOINTMENT_ALREADY_CANCELLED");
      }

      throw error;
    }
  },

  async updateAppointmentStatus(actor: AuthenticatedUser, appointmentId: bigint, nextStatus: UpdateAppointmentStatusBody["status"]) {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "RECEPTION") {
      throw new AppError("Only admin and reception users can update appointment status", StatusCodes.FORBIDDEN, "FORBIDDEN");
    }

    try {
      return await appointmentRepository.updateAppointmentStatus({
        appointmentId,
        nextStatus
      });
    } catch (error) {
      if (error instanceof Error && error.message === "APPOINTMENT_NOT_FOUND") {
        throw new AppError("Appointment not found", StatusCodes.NOT_FOUND, "APPOINTMENT_NOT_FOUND");
      }

      if (error instanceof Error && error.message === "APPOINTMENT_STATUS_LOCKED") {
        throw new AppError(
          "This appointment is already finalized and its status can no longer be changed.",
          StatusCodes.CONFLICT,
          "APPOINTMENT_STATUS_LOCKED"
        );
      }

      throw error;
    }
  }
};
