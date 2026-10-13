function configuredOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.API_ORIGIN || "").replace(/\/$/, "");
}

function isLoopback(url: string) {
  return !url || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(url);
}

export function usesEmbeddedApi() {
  const hosted = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL);
  return hosted && isLoopback(configuredOrigin());
}

export function apiOrigin() {
  if (usesEmbeddedApi()) return "";
  return configuredOrigin() || "http://127.0.0.1:3001";
}

export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin()}${suffix}`;
}
