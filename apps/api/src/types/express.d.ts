import type { RoleCode } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: bigint;
        email: string;
        role: RoleCode;
      };
    }
  }
}

export {};

