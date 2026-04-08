import { Prisma } from "@prisma/client";
import { getPagination, type PaginationQuery } from "../../common/utils/pagination.js";
import { prisma } from "../../lib/prisma.js";

export interface DoctorFilters extends PaginationQuery {
  specialty?: string;
  city?: string;
}

export const doctorRepository = {
  async findMany(filters: DoctorFilters) {
    const { limit, offset } = getPagination(filters);

    const where: Prisma.DoctorProfileWhereInput = {
      isAcceptingNewPatients: true
    };

    if (filters.specialty) {
      where.specialty = {
        contains: filters.specialty
      };
    }

    if (filters.city) {
      where.clinicCity = {
        equals: filters.city
      };
    }

    const [items, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ averageRating: "desc" }, { consultationFee: "asc" }],
        select: {
          id: true,
          specialty: true,
          qualification: true,
          consultationFee: true,
          yearsOfExperience: true,
          slotDurationMinutes: true,
          timezone: true,
          workingHoursJson: true,
          clinicCity: true,
          clinicState: true,
          averageRating: true,
          totalReviews: true,
          user: {
            select: {
              fullName: true,
              avatarUrl: true
            }
          }
        }
      }),
      prisma.doctorProfile.count({ where })
    ]);

    return {
      items,
      total
    };
  }
};
