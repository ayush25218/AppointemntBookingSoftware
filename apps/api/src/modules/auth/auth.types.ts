import type { RoleCode } from "@prisma/client";

export interface AuthenticatedUser {
  id: bigint;
  email: string;
  role: RoleCode;
}

