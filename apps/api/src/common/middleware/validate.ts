import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { AppError } from "../errors/AppError.js";

type ValidationShape = {
  body?: ZodTypeAny;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

export type ValidatedLocals<TBody = unknown, TQuery = unknown, TParams = unknown> = {
  validated: {
    body: TBody;
    query: TQuery;
    params: TParams;
  };
};

export const validate = <TBody = unknown, TQuery = unknown, TParams = unknown>(
  schemas: ValidationShape
) => {
  return (req: Request, res: Response<unknown, ValidatedLocals<TBody, TQuery, TParams>>, next: NextFunction): void => {
    try {
      const body = (schemas.body ? schemas.body.parse(req.body) : req.body) as TBody;
      const query = (schemas.query ? schemas.query.parse(req.query) : req.query) as TQuery;
      const params = (schemas.params ? schemas.params.parse(req.params) : req.params) as TParams;

      res.locals.validated = {
        body,
        query,
        params
      };

      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError("Request validation failed", StatusCodes.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", error)
      );
    }
  };
};
