import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { env } from "../../config/env.js";
import { authService } from "./auth.service.js";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.cookie(env.ACCESS_TOKEN_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: result.user,
        redirectPath: result.redirectPath
      }
    });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(env.ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/"
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Signed out successfully"
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user
    });
  })
};
