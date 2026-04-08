import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "DOCTOR", "PATIENT", "RECEPTION"])
});

export const requireAuth = (allowedRoles?: ReadonlyArray<z.infer<typeof accessTokenPayloadSchema>["role"]>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.replace("Bearer ", "")
        : undefined;
      const cookieToken = req.cookies[env.ACCESS_TOKEN_COOKIE_NAME] as string | undefined;
      const token = bearerToken ?? cookieToken;

      if (!token) {
        throw new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED");
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      const parsed = accessTokenPayloadSchema.parse(decoded);

      if (allowedRoles && !allowedRoles.includes(parsed.role)) {
        throw new AppError("You do not have permission to access this resource", StatusCodes.FORBIDDEN, "FORBIDDEN");
      }

      req.user = {
        id: BigInt(parsed.sub),
        email: parsed.email,
        role: parsed.role
      };

      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError("Invalid or expired access token", StatusCodes.UNAUTHORIZED, "INVALID_ACCESS_TOKEN")
      );
    }
  };
};

