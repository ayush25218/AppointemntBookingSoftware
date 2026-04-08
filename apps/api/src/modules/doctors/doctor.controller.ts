import type { Request, Response } from "express";
import type { ValidatedLocals } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import type { ListDoctorsQuery } from "./doctor.schema.js";
import type { DoctorFilters } from "./doctor.repository.js";
import { doctorService } from "./doctor.service.js";

export const doctorController = {
  listDoctors: asyncHandler(async (_req: Request, res: Response) => {
    const { query } = (res.locals as ValidatedLocals<unknown, ListDoctorsQuery>).validated;
    const filters: DoctorFilters = {
      page: query.page,
      limit: query.limit
    };

    if (query.specialty) {
      filters.specialty = query.specialty;
    }

    if (query.city) {
      filters.city = query.city;
    }

    const result = await doctorService.listDoctors(filters);

    res.status(200).json({
      success: true,
      ...result
    });
  })
};
