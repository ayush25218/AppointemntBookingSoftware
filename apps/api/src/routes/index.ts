import { Router } from "express";
import { appointmentRouter } from "../modules/appointments/appointment.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { doctorRouter } from "../modules/doctors/doctor.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/appointments", appointmentRouter);
