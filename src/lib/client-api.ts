import { apiUrl } from "@/lib/api-origin";

export { apiUrl };

const sessionSeconds = 7 * 24 * 60 * 60;

export function storeAdminSession(token: string) {
  window.sessionStorage.setItem("rai_admin_token", token);
  document.cookie = `rai_admin=${encodeURIComponent(token)}; Path=/; Max-Age=${sessionSeconds}; SameSite=Lax`;
}

export function clearAdminSession() {
  window.sessionStorage.removeItem("rai_admin_token");
  document.cookie = "rai_admin=; Path=/; Max-Age=0; SameSite=Lax";
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof window !== "undefined") {
    const token = window.sessionStorage.getItem("rai_admin_token");
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...init, headers, credentials: "include" });
}
