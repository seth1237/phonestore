const DEFAULT_BASE_URL = "https://backend.codewithseth.co.ke";
const CACHE_MS = 60_000;

let catalogCache = { at: 0, products: null };
let catalogRequest = null;
const ERP_TIMEOUT_MS = 8_000;

function baseUrl() {
  return (process.env.ERP_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function orgId() {
  return process.env.ERP_ORG_ID || "69d63bdcc81e84290298784d";
}

function displayCategory(name) {
  const value = String(name || "").trim().replace(/-\d{10,}$/, "");
  return value || "General";
}

function imageUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${baseUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
}

function mapProduct(row) {
  const image = imageUrl(row.imageUrl);
  const quantity = Number(row.currentQuantity) || 0;
  const stock = row.productType === "service" ? Math.max(quantity, 1) : quantity;
  return {
    id: String(row._id),
    name: row.productName || row.name || "Product",
    description: row.description || null,
    price: Number(row.sellingPrice) || 0,
    stock,
    photos: image ? [{ url: image, thumb: image }] : [],
    thumb: image,
    image,
    categoryId: row.category ? String(row.category) : null,
    category: displayCategory(row.categoryName),
  };
}

async function erpFetch(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(ERP_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "X-Org-Id": orgId(),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json") || type.includes("text/")) {
    const body = await response.json().catch(() => null);
    return { response, body, buffer: null };
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return { response, body: null, buffer };
}

function fail(response, body, fallback) {
  const error = new Error(body?.message || fallback);
  error.status = response.status || 502;
  return error;
}

async function refreshProducts() {
  const now = Date.now();
  try {
    const { response, body } = await erpFetch(`/api/stock/public/products?orgId=${encodeURIComponent(orgId())}`);
    if (!response.ok || !body?.success || !Array.isArray(body.data)) {
      throw fail(response, body, "The product catalog could not be loaded.");
    }
    const products = body.data.filter((row) => row.isActive !== false).map(mapProduct);
    catalogCache = { at: now, products };
    return products;
  } catch (error) {
    if (catalogCache.products) {
      console.error("ERP catalog refresh failed. Serving the last catalog:", error.message);
      catalogCache = { ...catalogCache, at: now };
      return catalogCache.products;
    }
    throw error;
  } finally {
    catalogRequest = null;
  }
}

async function loadProducts() {
  const now = Date.now();
  if (catalogCache.products && now - catalogCache.at < CACHE_MS) return catalogCache.products;
  if (!catalogRequest) catalogRequest = refreshProducts();
  return catalogRequest;
}

async function loadCategories() {
  const products = await loadProducts();
  const groups = new Map();
  for (const product of products) {
    if (!product.categoryId) continue;
    const existing = groups.get(product.categoryId);
    if (!existing) {
      groups.set(product.categoryId, {
        id: product.categoryId,
        name: product.category || "General",
        count: 1,
        image: product.image || "",
      });
      continue;
    }
    existing.count += 1;
    if (!existing.image && product.image) existing.image = product.image;
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

async function createQuotation({ clientName, clientNumber, clientLocation, email, items }) {
  const { response, body } = await erpFetch("/api/stock/public/quote-requests", {
    method: "POST",
    body: JSON.stringify({
      orgId: orgId(),
      clientName,
      clientNumber,
      clientLocation,
      contactPerson: clientName,
      email,
      items,
    }),
  });
  if (!response.ok || !body?.success) {
    throw fail(response, body, "The quotation could not be created.");
  }
  return body.data;
}

async function requestInvoice(quotationId) {
  const { response, body, buffer } = await erpFetch(
    `/api/stock/public/quotations/${encodeURIComponent(quotationId)}/request-invoice?orgId=${encodeURIComponent(orgId())}`,
    { method: "POST", body: "{}" },
  );
  if (!response.ok || !buffer) {
    throw fail(response, body, "The invoice is not ready yet.");
  }
  return { buffer, type: response.headers.get("content-type") || "application/pdf" };
}

module.exports = { loadProducts, loadCategories, createQuotation, requestInvoice };
