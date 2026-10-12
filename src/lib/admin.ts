import { cookies } from "next/headers";

const origin = process.env.API_ORIGIN || "http://127.0.0.1:3001";

export async function adminFetch<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  const response = await fetch(`${origin}${path}`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Admin API ${path} returned ${response.status}`);
  return response.json() as Promise<T>;
}
