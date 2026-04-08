import { cookies } from "next/headers";
import { getAccessTokenCookieName } from "@/lib/auth/session";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getAccessTokenCookieName())?.value ?? null;
}

export async function apiFetchServer<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    token?: string | null;
  }
): Promise<T> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const init: RequestInit = {
    method: options?.method ?? "GET",
    headers,
    cache: "no-store"
  };

  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

export async function safeApiFetchServer<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    token?: string | null;
  }
): Promise<T | null> {
  try {
    return await apiFetchServer<T>(path, options);
  } catch {
    return null;
  }
}
