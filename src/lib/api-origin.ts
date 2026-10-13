const deployedApi = "https://raibackend.codewithseth.co.ke";

function configuredOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.API_ORIGIN || "").replace(/\/$/, "");
}

function isLoopback(url: string) {
  return !url || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(url);
}

function onVercel() {
  return Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL);
}

export function usesEmbeddedApi() {
  return false;
}

export function apiOrigin() {
  const configured = configuredOrigin();
  if (configured && !isLoopback(configured)) return configured;
  if (onVercel()) return deployedApi;
  return "http://127.0.0.1:3001";
}

export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin()}${suffix}`;
}
