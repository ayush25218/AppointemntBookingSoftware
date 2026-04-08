import { Router } from "express";
import { requireAuth } from "../../common/middleware/requireAuth.js";
import { validate } from "../../common/middleware/validate.js";
import { appointmentController } from "./appointment.controller.js";
import {
  bookAppointmentBodySchema,
  cancelAppointmentBodySchema,
  cancelAppointmentParamsSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusBodySchema,
  updateAppointmentStatusParamsSchema
} from "./appointment.schema.js";

export const appointmentRouter = Router();

appointmentRouter.get(
  "/",
  requireAuth(["SUPER_ADMIN", "DOCTOR", "PATIENT", "RECEPTION"]),
  validate({ query: listAppointmentsQuerySchema }),
  appointmentController.listAppointments
);

appointmentRouter.post(
  "/book",
  requireAuth(["SUPER_ADMIN", "PATIENT", "RECEPTION"]),
  validate({ body: bookAppointmentBodySchema }),
  appointmentController.bookAppointment
);

appointmentRouter.patch(
  "/:appointmentId/cancel",
  requireAuth(["SUPER_ADMIN", "PATIENT", "RECEPTION"]),
  validate({ params: cancelAppointmentParamsSchema, body: cancelAppointmentBodySchema }),
  appointmentController.cancelAppointment
);

appointmentRouter.patch(
  "/:appointmentId/status",
  requireAuth(["SUPER_ADMIN", "RECEPTION"]),
  validate({ params: updateAppointmentStatusParamsSchema, body: updateAppointmentStatusBodySchema }),
  appointmentController.updateAppointmentStatus
);
