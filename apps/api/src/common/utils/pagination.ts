import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const getPagination = (query: PaginationQuery): { page: number; limit: number; offset: number } => {
  const page = query.page;
  const limit = query.limit;

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};
