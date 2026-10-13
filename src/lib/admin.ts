import { cookies } from "next/headers";
import { apiUrl, usesEmbeddedApi } from "@/lib/api-origin";

export async function adminFetch<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  if (usesEmbeddedApi()) {
    const { callApi } = await import("@/lib/embedded-api");
    const result = await callApi("GET", path, { headers: { cookie } });
    if (result.status === 401) return null;
    if (result.status >= 400) throw new Error(`Admin API ${path} returned ${result.status}`);
    return JSON.parse(result.body.toString("utf8")) as T;
  }
  const response = await fetch(apiUrl(path), {
    headers: { cookie },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}
