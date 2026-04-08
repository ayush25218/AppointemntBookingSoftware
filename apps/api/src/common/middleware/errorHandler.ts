import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        message: "A unique constraint blocked this request",
        details: error.meta ?? null
      });
      return;
    }

    if (error.code === "P2025") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        code: "RESOURCE_NOT_FOUND",
        message: "The requested resource was not found"
      });
      return;
    }
  }

  console.error(error);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong on the server"
  });
};

