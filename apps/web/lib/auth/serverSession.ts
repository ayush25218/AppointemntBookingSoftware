import { getServerAccessToken } from "@/lib/api/server";
import { verifySessionToken } from "@/lib/auth/session";

export async function getServerSession() {
  const token = await getServerAccessToken();

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

