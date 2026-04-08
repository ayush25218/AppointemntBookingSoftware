import { Prisma } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { notFoundHandler } from "./common/middleware/notFound.js";
import { apiRouter } from "./routes/index.js";

export const createApp = (): Express => {
  const app = express();

  app.set("json replacer", (_key: string, value: unknown) => {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value instanceof Prisma.Decimal) {
      return value.toString();
    }

    return value;
  });

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Hospital Appointment API is healthy"
    });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
