import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { doctorController } from "./doctor.controller.js";
import { listDoctorsQuerySchema } from "./doctor.schema.js";

export const doctorRouter = Router();

doctorRouter.get("/", validate({ query: listDoctorsQuerySchema }), doctorController.listDoctors);

