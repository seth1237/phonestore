const PRODUCTION_ORIGIN = "https://raimerchants.co.ke";

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback =
    process.env.NODE_ENV === "production"
      ? PRODUCTION_ORIGIN
      : `http://localhost:${process.env.WEB_PORT || "3000"}`;

  if (!configured) return fallback;

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    if (process.env.NODE_ENV === "production" && /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname)) {
      return PRODUCTION_ORIGIN;
    }
    return url.origin;
  } catch {
    return fallback;
  }
}

export function absoluteSiteUrl(path: string) {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${siteOrigin()}/`).toString();
}
