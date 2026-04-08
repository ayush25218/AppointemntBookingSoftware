import { getPagination } from "../../common/utils/pagination.js";
import { doctorRepository, type DoctorFilters } from "./doctor.repository.js";

export const doctorService = {
  async listDoctors(filters: DoctorFilters) {
    const { items, total } = await doctorRepository.findMany(filters);
    const { page, limit } = getPagination(filters);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};

