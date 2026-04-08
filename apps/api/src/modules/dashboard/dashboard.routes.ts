import { Router } from "express";
import { requireAuth } from "../../common/middleware/requireAuth.js";
import { dashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/admin", requireAuth(["SUPER_ADMIN", "RECEPTION"]), dashboardController.admin);
dashboardRouter.get("/patient", requireAuth(["PATIENT"]), dashboardController.patient);
dashboardRouter.get("/doctor", requireAuth(["DOCTOR"]), dashboardController.doctor);

