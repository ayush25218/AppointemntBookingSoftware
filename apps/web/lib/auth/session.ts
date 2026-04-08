import { jwtVerify } from "jose";
import type { SessionPayload } from "./types";

const textEncoder = new TextEncoder();

export const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }

  return textEncoder.encode(secret);
};

export const getAccessTokenCookieName = (): string => {
  return process.env.ACCESS_TOKEN_COOKIE_NAME ?? "hospital_access_token";
};

export const verifySessionToken = async (token: string): Promise<SessionPayload> => {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return {
    sub: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    role: String(payload.role ?? "") as SessionPayload["role"],
    ...(typeof payload.exp === "number" ? { exp: payload.exp } : {}),
    ...(typeof payload.iat === "number" ? { iat: payload.iat } : {})
  };
};
