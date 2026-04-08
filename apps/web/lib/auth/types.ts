export type AppRole = "SUPER_ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTION";

export interface SessionPayload {
  sub: string;
  email: string;
  role: AppRole;
  exp?: number;
  iat?: number;
}

