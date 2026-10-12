const { createHmac, timingSafeEqual } = require("node:crypto");

const COOKIE = "rai_admin";
const SESSION_DAYS = 7;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
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
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

function passwordsMatch(input, stored) {
  const left = Buffer.from(String(input));
  const right = Buffer.from(String(stored));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function authenticate(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || "";
  const expectedEmail = process.env.ADMIN_EMAIL || expectedUser;
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  if (!expectedPassword || !expectedUser) return null;
  const name = String(username || "").trim().toLowerCase();
  const userOk = name === expectedUser.toLowerCase() || name === expectedEmail.toLowerCase();
  if (!userOk || !passwordsMatch(password, expectedPassword)) return null;
  return { email: expectedEmail };
}

function createSession(email) {
  const payload = Buffer.from(JSON.stringify({
    email,
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
  return verify(readCookie(req));
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = {
  COOKIE,
  SESSION_DAYS,
  authenticate,
  createSession,
  sessionFromRequest,
  cookieHeader,
  verify,
};
