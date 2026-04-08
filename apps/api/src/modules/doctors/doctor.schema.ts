import { z } from "zod";
import { paginationQuerySchema } from "../../common/utils/pagination.js";

export const listDoctorsQuerySchema = paginationQuerySchema.extend({
  specialty: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().min(2).max(80).optional()
});

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

