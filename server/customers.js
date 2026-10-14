const { createHmac, randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

const COOKIE = "rai_customer";
const SESSION_DAYS = 30;

function secret() {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(String(password), salt, 32);
  const left = Buffer.from(hash, "hex");
  if (left.length !== next.length) return false;
  return timingSafeEqual(left, next);
}

function sign(value) {
  const hmac = createHmac("sha256", secret()).update(value).digest("base64url");
  return `${value}.${hmac}`;
}

function verify(token) {
  if (!token || !secret()) return null;
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const value = token.slice(0, split);
  const sig = token.slice(split + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString());
    if (data.kind !== "customer" || !data.id || !data.email || !data.exp || data.exp < Date.now()) return null;
    return { id: Number(data.id), email: data.email };
  } catch {
    return null;
  }
}

function createSession(customer) {
  const payload = Buffer.from(JSON.stringify({
    kind: "customer",
    id: customer.id,
    email: customer.email,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  })).toString("base64url");
  return sign(payload);
}

function readCookie(req) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function sessionFromRequest(req) {
  const header = String(req.headers.authorization || "");
  if (header.startsWith("Bearer ")) return verify(header.slice(7).trim());
  return verify(readCookie(req));
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = {
  COOKIE,
  SESSION_DAYS,
  hashPassword,
  passwordMatches,
  createSession,
  sessionFromRequest,
  cookieHeader,
};
