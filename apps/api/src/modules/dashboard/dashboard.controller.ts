import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { dashboardService } from "./dashboard.service.js";

export const dashboardController = {
  admin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getAdminDashboard();

    res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  }),

  patient: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const data = await dashboardService.getPatientDashboard(req.user);

    res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  }),

  doctor: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const data = await dashboardService.getDoctorDashboard(req.user);

    res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  })
};

