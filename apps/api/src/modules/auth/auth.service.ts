import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { authRepository } from "./auth.repository.js";
import type { LoginBody } from "./auth.schema.js";

const getRedirectPathByRole = (roleCode: string): string => {
  switch (roleCode) {
    case "SUPER_ADMIN":
    case "RECEPTION":
      return "/admin";
    case "DOCTOR":
      return "/doctor";
    case "PATIENT":
      return "/patient";
    default:
      return "/";
  }
};

const demoUsers = [
  {
    id: "1",
    fullName: "Aarav Mehta",
    email: "admin@apollocare.in",
    password: "Admin@123",
    role: "SUPER_ADMIN"
  },
  {
    id: "2",
    fullName: "Naina Kapoor",
    email: "reception@apollocare.in",
    password: "Reception@123",
    role: "RECEPTION"
  },
  {
    id: "3",
    fullName: "Dr. Riya Sharma",
    email: "riya.sharma@apollocare.in",
    password: "Doctor@123",
    role: "DOCTOR"
  },
  {
    id: "4",
    fullName: "Vikram Patel",
    email: "vikram.patel@gmail.com",
    password: "Patient@123",
    role: "PATIENT"
  }
] as const;

const buildAuthResponse = (user: { id: string; fullName: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d"
    }
  );

  return {
    accessToken,
    user,
    redirectPath: getRedirectPathByRole(user.role)
  };
};

const attemptDevFallbackLogin = (payload: LoginBody) => {
  if (env.NODE_ENV === "production" || !env.ENABLE_DEV_AUTH_FALLBACK) {
    return null;
  }

  const matchedUser = demoUsers.find((user) => user.email === payload.email && user.password === payload.password);

  if (!matchedUser) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
  }

  return buildAuthResponse({
    id: matchedUser.id,
    fullName: matchedUser.fullName,
    email: matchedUser.email,
    role: matchedUser.role
  });
};

export const authService = {
  async login(payload: LoginBody) {
    let user;

    try {
      user = await authRepository.findUserByEmail(payload.email);
    } catch (error) {
      if (error instanceof PrismaClientInitializationError) {
        const fallbackResult = attemptDevFallbackLogin(payload);

        if (fallbackResult) {
          return fallbackResult;
        }

        throw new AppError("Database is unavailable for sign-in", StatusCodes.SERVICE_UNAVAILABLE, "DATABASE_UNAVAILABLE");
      }

      throw error;
    }

    if (!user) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("This account is not active", StatusCodes.FORBIDDEN, "ACCOUNT_INACTIVE");
    }

    return buildAuthResponse({
      id: user.id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role.code
    });
  },

  async getCurrentUser(userId: bigint) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    return {
      id: user.id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role.code,
      status: user.status,
      city: user.city,
      state: user.state,
      doctorProfile: user.doctorProfile
        ? {
            id: user.doctorProfile.id.toString(),
            specialty: user.doctorProfile.specialty,
            consultationFee: user.doctorProfile.consultationFee.toString(),
            averageRating: user.doctorProfile.averageRating.toString(),
            totalReviews: user.doctorProfile.totalReviews
          }
        : null
    };
  }
};
