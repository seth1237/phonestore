function token() {
  return String(process.env.MPESA_CALLBACK_TOKEN || "").trim();
}

function baseUrl() {
  return String(process.env.ERP_API_BASE_URL || "https://backend.codewithseth.co.ke").replace(/\/$/, "");
}

async function syncWebsiteOrder(order) {
  const callbackToken = token();
  if (!callbackToken || !order) return;
  try {
    await fetch(`${baseUrl()}/api/website-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-callback-token": callbackToken },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    console.error("ElevateHub did not store the website order:", error.message);
  }
}

module.exports = { syncWebsiteOrder };
