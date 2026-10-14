const FAIL_RESULT_CODES = new Set(["1", "17", "26", "1001", "1019", "1025", "1032", "1037", "2001"]);

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function configured() {
  return Boolean(env("MPESA_CONSUMER_KEY") && env("MPESA_CONSUMER_SECRET") && env("MPESA_SHORTCODE") && env("MPESA_PASSKEY"));
}

function party() {
  const shortcode = env("MPESA_SHORTCODE");
  const till = env("MPESA_TILL_NUMBER");
  const mode = env("MPESA_MODE").toLowerCase();
  const useTill = mode === "till" || (Boolean(till) && mode !== "paybill");
  const businessShortCode = useTill ? till || shortcode : shortcode;
  const transactionType = env("MPESA_TRANSACTION_TYPE") || (useTill ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline");
  return {
    businessShortCode,
    partyB: useTill ? till || shortcode : shortcode,
    transactionType,
    label: useTill ? `Till ${till || businessShortCode}` : `Paybill ${businessShortCode}`,
  };
}

function normalizePhone(rawPhone) {
  const country = env("MPESA_DEFAULT_COUNTRY_CODE", "254");
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `${country}${digits.slice(1)}`;
  if (digits.startsWith(country)) return digits;
  return digits;
}

function timestampAndPassword(businessShortCode) {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const password = Buffer.from(`${businessShortCode}${env("MPESA_PASSKEY")}${ts}`).toString("base64");
  return { ts, password };
}

let tokenCache = { token: "", expiresAt: 0 };

async function accessToken() {
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 30_000) {
    return { token: tokenCache.token, message: "" };
  }
  const key = env("MPESA_CONSUMER_KEY");
  const secret = env("MPESA_CONSUMER_SECRET");
  const base = env("MPESA_BASE_URL", "https://sandbox.safaricom.co.ke").replace(/\/$/, "");
  let response;
  try {
    response = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("M-Pesa token request failed:", error.message);
    return { token: "", message: "Safaricom could not be reached for an M-Pesa token." };
  }
  const body = await response.json().catch(() => null);
  const token = String(body?.access_token || "");
  if (!token) {
    const message = String(body?.errorMessage || body?.error || `Safaricom refused the M-Pesa token (${response.status}).`);
    console.error("M-Pesa token refused:", response.status, message);
    return { token: "", message };
  }
  const seconds = Number(body?.expires_in) || 3599;
  tokenCache = { token, expiresAt: Date.now() + seconds * 1000 };
  return { token, message: "" };
}

async function initiateStkPush({ phone, amount, accountReference, transactionDesc }) {
  const normalizedPhone = normalizePhone(phone);
  if (!/^254\d{9}$/.test(normalizedPhone)) {
    return { success: false, responseMessage: "Enter a Safaricom number, for example 07XX XXX XXX." };
  }
  const rounded = Math.round(Number(amount) || 0);
  if (rounded < 1) return { success: false, responseMessage: "The order total must be at least KSh 1." };
  if (!configured()) {
    return {
      success: true,
      simulated: true,
      checkoutRequestId: `SIM-${Date.now()}`,
      merchantRequestId: `SIM-M-${Date.now()}`,
      responseMessage: "M-Pesa is in local test mode. The payment will confirm in a few seconds.",
    };
  }

  try {
    const issued = await accessToken();
    const token = issued.token;
    if (!token) return { success: false, responseMessage: issued.message || "M-Pesa did not issue an access token." };
    const target = party();
    const { ts, password } = timestampAndPassword(target.businessShortCode);
    const base = env("MPESA_BASE_URL", "https://sandbox.safaricom.co.ke").replace(/\/$/, "");
    const response = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: target.businessShortCode,
        Password: password,
        Timestamp: ts,
        TransactionType: target.transactionType,
        Amount: rounded,
        PartyA: normalizedPhone,
        PartyB: target.partyB,
        PhoneNumber: normalizedPhone,
        CallBackURL: env("MPESA_CALLBACK_URL"),
        AccountReference: String(accountReference || "Rai").slice(0, 12),
        TransactionDesc: String(transactionDesc || "Rai order").slice(0, 13),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json().catch(() => ({}));
    const success = String(data?.ResponseCode || "") === "0";
    return {
      success,
      checkoutRequestId: data?.CheckoutRequestID || "",
      merchantRequestId: data?.MerchantRequestID || "",
      responseMessage: String(data?.ResponseDescription || data?.errorMessage || "M-Pesa did not accept the prompt."),
    };
  } catch (error) {
    return { success: false, responseMessage: error.message || "The M-Pesa prompt could not be sent." };
  }
}

async function queryStkPush(checkoutRequestId) {
  const id = String(checkoutRequestId || "").trim();
  if (!id) return { success: false, pending: false, resultDesc: "Missing M-Pesa checkout id." };
  if (!configured() || id.startsWith("SIM-")) {
    return { success: true, pending: false, resultCode: "0", resultDesc: "Simulated M-Pesa payment confirmed.", simulated: true };
  }
  try {
    const issued = await accessToken();
    const token = issued.token;
    if (!token) return { success: false, pending: true, resultDesc: issued.message || "Waiting for the customer to enter their M-Pesa PIN." };
    const target = party();
    const { ts, password } = timestampAndPassword(target.businessShortCode);
    const base = env("MPESA_BASE_URL", "https://sandbox.safaricom.co.ke").replace(/\/$/, "");
    const response = await fetch(`${base}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: target.businessShortCode,
        Password: password,
        Timestamp: ts,
        CheckoutRequestID: id,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json().catch(() => ({}));
    const resultCode = String(data?.ResultCode ?? "");
    const resultDesc = String(data?.ResultDesc || data?.ResponseDescription || data?.errorMessage || "");
    if (resultCode === "0") {
      return { success: true, pending: false, resultCode, resultDesc: resultDesc || "M-Pesa payment confirmed." };
    }
    if (FAIL_RESULT_CODES.has(resultCode)) {
      return { success: false, pending: false, resultCode, resultDesc: resultDesc || "The M-Pesa payment was not completed." };
    }
    return { success: false, pending: true, resultCode, resultDesc: "Waiting for the customer to enter their M-Pesa PIN." };
  } catch {
    return { success: false, pending: true, resultDesc: "Waiting for the customer to enter their M-Pesa PIN." };
  }
}

function callbackTokenOk(req) {
  const expected = env("MPESA_CALLBACK_TOKEN");
  if (!expected) return true;
  const provided = String(req.headers["x-callback-token"] || req.query.token || "").trim();
  return provided === expected;
}

function parseStkCallback(body) {
  const stk = body?.Body?.stkCallback || {};
  const items = Array.isArray(stk?.CallbackMetadata?.Item) ? stk.CallbackMetadata.Item : [];
  const value = (name) => items.find((item) => String(item?.Name || "") === name)?.Value;
  return {
    checkoutRequestId: String(stk.CheckoutRequestID || "").trim(),
    merchantRequestId: String(stk.MerchantRequestID || "").trim(),
    resultCode: Number(stk.ResultCode),
    resultDesc: String(stk.ResultDesc || "").trim(),
    receipt: String(value("MpesaReceiptNumber") || "").trim(),
    amount: Number(value("Amount") || 0),
    phone: String(value("PhoneNumber") || "").trim(),
  };
}

module.exports = {
  configured,
  party,
  normalizePhone,
  initiateStkPush,
  queryStkPush,
  callbackTokenOk,
  parseStkCallback,
};
