import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/AppError.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { dashboardRepository } from "./dashboard.repository.js";

export const dashboardService = {
  async getAdminDashboard() {
    return dashboardRepository.getAdminDashboard();
  },

  async getPatientDashboard(user: AuthenticatedUser) {
    return dashboardRepository.getPatientDashboard(user.id);
  },

  async getDoctorDashboard(user: AuthenticatedUser) {
    const dashboard = await dashboardRepository.getDoctorDashboard(user.id);

    if (!dashboard) {
      throw new AppError("Doctor profile not found", StatusCodes.NOT_FOUND, "DOCTOR_PROFILE_NOT_FOUND");
    }

    return dashboard;
  }
};

