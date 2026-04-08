import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export interface AvailabilityDay {
  dayOfWeek: number;
  windows: AvailabilityWindow[];
}

export const toUtcDateFromLocal = (localDateTime: string, timezone: string): Date => {
  const parsedDate = fromZonedTime(localDateTime, timezone);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid appointmentStartLocal or timezone supplied", StatusCodes.BAD_REQUEST, "INVALID_SLOT_TIME");
  }

  return parsedDate;
};

export const addSlotDuration = (appointmentStartUtc: Date, slotDurationMinutes: number): Date => {
  return addMinutes(appointmentStartUtc, slotDurationMinutes);
};

export const isOnSlotBoundary = (appointmentStartUtc: Date, doctorTimezone: string, slotDurationMinutes: number): boolean => {
  const zonedDate = toZonedTime(appointmentStartUtc, doctorTimezone);
  const minutes = zonedDate.getMinutes();
  return minutes % slotDurationMinutes === 0;
};

export const assertSlotFallsWithinSchedule = (
  appointmentStartUtc: Date,
  appointmentEndUtc: Date,
  doctorTimezone: string,
  workingHours: AvailabilityDay[]
): void => {
  const zonedStart = toZonedTime(appointmentStartUtc, doctorTimezone);
  const zonedEnd = toZonedTime(appointmentEndUtc, doctorTimezone);
  const weekday = zonedStart.getDay();
  const matchingDay = workingHours.find((day) => day.dayOfWeek === weekday);

  if (!matchingDay) {
    throw new AppError("Doctor is not available on the selected day", StatusCodes.CONFLICT, "DOCTOR_NOT_AVAILABLE");
  }

  const startLabel = formatInTimeZone(appointmentStartUtc, doctorTimezone, "HH:mm");
  const endLabel = formatInTimeZone(appointmentEndUtc, doctorTimezone, "HH:mm");
  const isCovered = matchingDay.windows.some((window) => window.start <= startLabel && window.end >= endLabel);

  if (!isCovered || zonedEnd.getDate() !== zonedStart.getDate()) {
    throw new AppError("Selected slot is outside the doctor's working hours", StatusCodes.CONFLICT, "SLOT_OUTSIDE_WORKING_HOURS");
  }
};

