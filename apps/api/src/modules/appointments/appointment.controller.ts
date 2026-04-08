import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/AppError.js";
import type { ValidatedLocals } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import type {
  BookAppointmentBody,
  CancelAppointmentBody,
  CancelAppointmentParams,
  ListAppointmentsQuery,
  UpdateAppointmentStatusBody,
  UpdateAppointmentStatusParams
} from "./appointment.schema.js";
import { appointmentService } from "./appointment.service.js";

export const appointmentController = {
  bookAppointment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const { body } = (res.locals as ValidatedLocals<BookAppointmentBody>).validated;
    const appointment = await appointmentService.bookAppointment(req.user, body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    });
  }),

  listAppointments: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const { query } = (res.locals as ValidatedLocals<unknown, ListAppointmentsQuery>).validated;
    const result = await appointmentService.listAppointments(req.user, query);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result
    });
  }),

  cancelAppointment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const { body, params } = (res.locals as ValidatedLocals<CancelAppointmentBody, unknown, CancelAppointmentParams>).validated;
    const result = await appointmentService.cancelAppointment(req.user, params.appointmentId, body.cancelReason);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: result
    });
  }),

  updateAppointmentStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const { body, params } = (res.locals as ValidatedLocals<UpdateAppointmentStatusBody, unknown, UpdateAppointmentStatusParams>).validated;
    const result = await appointmentService.updateAppointmentStatus(req.user, params.appointmentId, body.status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Appointment status updated successfully",
      data: result
    });
  })
};
