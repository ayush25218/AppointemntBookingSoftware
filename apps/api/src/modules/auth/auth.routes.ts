import { Router } from "express";
import { requireAuth } from "../../common/middleware/requireAuth.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import { loginBodySchema } from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginBodySchema }), authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth(["SUPER_ADMIN", "DOCTOR", "PATIENT", "RECEPTION"]), authController.me);
