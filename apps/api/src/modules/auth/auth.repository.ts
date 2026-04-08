import { prisma } from "../../lib/prisma.js";

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: true
      }
    });
  },

  async findUserById(userId: bigint) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        doctorProfile: {
          select: {
            id: true,
            specialty: true,
            consultationFee: true,
            averageRating: true,
            totalReviews: true
          }
        }
      }
    });
  },

  async findPatientByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        role: {
          code: "PATIENT"
        }
      },
      include: {
        role: true
      }
    });
  }
};
