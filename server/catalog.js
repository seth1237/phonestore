const { loadProducts: loadErpProducts } = require("./erp");
const { collection } = require("./mongo");
const { assignSlugs } = require("./slug");

let cache = { at: 0, products: null, categories: null };
const CACHE_MS = 30_000;

function clearCatalogCache() {
  cache = { at: 0, products: null, categories: null };
}

async function productCollection() {
  const products = await collection("products");
  await products.createIndex({ erpId: 1 }, { unique: true });
  return products;
}

async function savedProducts() {
  try {
    const products = await productCollection();
    return products.find({}).toArray();
  } catch (error) {
    console.error("Product metadata is unavailable:", error.message);
    return [];
  }
}

function colorHex(value) {
  const raw = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return "";
}

function normalizeSpecs(raw) {
  if (!Array.isArray(raw)) return [];
  const specs = [];
  const seen = new Set();
  for (const item of raw) {
    const label = String(item?.label || "").replace(/\s+/g, " ").trim();
    const value = String(item?.value || "").trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    specs.push({ label, value });
  }
  return specs.slice(0, 40);
}

function storageValue(explicit, specs) {
  const typed = String(explicit || "").trim();
  if (typed) return typed;
  const match = specs.find((item) => item.label.toLowerCase() === "storage");
  return match?.value || "";
}

function mapVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const specs = normalizeSpecs(item?.specs);
      return {
        id: String(item?.id || ""),
        color: String(item?.color || "").trim(),
        hex: colorHex(item?.hex),
        storage: storageValue(item?.storage, specs),
        sku: String(item?.sku || "").trim(),
        price: Number(item?.price) || 0,
        stock: Math.max(0, Number(item?.stock) || 0),
        specs,
        images: (Array.isArray(item?.images) ? item.images : [])
          .filter((image) => image?.url)
          .map((image) => ({ url: image.url, thumb: image.url, publicId: image.publicId || "" })),
      };
    })
    .filter((item) => item.id && (item.color || item.hex || item.storage || item.sku || item.images.length || item.specs.length));
}

function normalizeVariants(raw) {
  const { randomUUID } = require("node:crypto");
  return mapVariants(
    (Array.isArray(raw) ? raw : []).map((item) => ({
      ...item,
      id: item?.id || randomUUID(),
    })),
  );
}

function fallbackCategoryImages(members) {
  const images = [];
  const seen = new Set();
  for (const product of members.slice(0, 3)) {
    const urls = [
      ...(product.photos || []).map((photo) => photo.url),
      ...((product.variants || []).flatMap((variant) => (variant.images || []).map((photo) => photo.url))),
    ];
    if (!urls.length && (product.thumb || product.image)) urls.push(product.thumb || product.image);
    for (const url of urls) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      images.push(url);
    }
  }
  return images;
}

function normalizeCovers(raw) {
  if (!Array.isArray(raw)) return [];
  const images = [];
  const seen = new Set();
  for (const item of raw) {
    const url = String(item?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    images.push({ url, publicId: String(item?.publicId || "") });
  }
  return images.slice(0, 12);
}

async function savedCovers() {
  try {
    const covers = await collection("categoryCovers");
    return covers.find({}).toArray();
  } catch (error) {
    console.error("Category covers are unavailable:", error.message);
    return [];
  }
}

async function saveCategoryCovers(categoryId, images) {
  const covers = await collection("categoryCovers");
  await covers.createIndex({ categoryId: 1 }, { unique: true });
  const clean = normalizeCovers(images);
  await covers.updateOne(
    { categoryId: String(categoryId) },
    { $set: { images: clean, updatedAt: new Date() }, $setOnInsert: { categoryId: String(categoryId) } },
    { upsert: true },
  );
  clearCatalogCache();
  return clean;
}

function imageList(product, saved) {
  const images = [];
  const seen = new Set();
  for (const image of saved?.images || []) {
    if (!image?.url || seen.has(image.url)) continue;
    seen.add(image.url);
    images.push({ url: image.url, thumb: image.url, publicId: image.publicId || "" });
  }
  if (product.image && !seen.has(product.image)) {
    images.push({ url: product.image, thumb: product.thumb || product.image, publicId: "" });
  }
  return images;
}

async function buildCatalog({ includeHidden = false } = {}) {
  const now = Date.now();
  if (!includeHidden && cache.products && now - cache.at < CACHE_MS) {
    return { products: cache.products, categories: cache.categories };
  }
  const [erpProducts, saved, coverDocs] = await Promise.all([loadErpProducts(), savedProducts(), savedCovers()]);
  const coversById = new Map(coverDocs.map((item) => [String(item.categoryId), normalizeCovers(item.images)]));
  const savedById = new Map(saved.map((item) => [String(item.erpId), item]));
  const named = erpProducts
    .map((product) => {
      const extra = savedById.get(product.id);
      if (!includeHidden && extra?.hidden) return null;
      const name = extra?.name || product.name;
      const description = extra?.description ?? product.description;
      const photos = imageList(product, extra);
      const variants = mapVariants(extra?.variants);
      const priced = variants.map((item) => item.price).filter((price) => price > 0);
      const lead = variants.find((item) => item.images.length)?.images[0];
      const primary = lead || photos[0];
      return {
        ...product,
        name,
        description,
        price: priced.length ? Math.min(...priced) : product.price,
        stock: variants.length ? variants.reduce((sum, item) => sum + item.stock, 0) : product.stock,
        hidden: Boolean(extra?.hidden),
        relatedIds: Array.isArray(extra?.relatedIds) ? extra.relatedIds.map(String) : [],
        specs: normalizeSpecs(extra?.specs),
        variants,
        photos,
        image: primary?.url || "",
        thumb: primary?.thumb || "",
        category: product.category,
      };
    })
    .filter(Boolean);

  const withProductSlugs = assignSlugs(named, (item) => item.name);
  const categoryNames = new Map();
  for (const product of withProductSlugs) {
    if (!product.categoryId) continue;
    if (!categoryNames.has(product.categoryId)) categoryNames.set(product.categoryId, product.category || "General");
  }
  const categorySlugs = assignSlugs(
    [...categoryNames.entries()].map(([id, name]) => ({ id, name })),
    (item) => item.name,
  );
  const slugByCategory = new Map(categorySlugs.map((item) => [item.id, item.slug]));
  const products = withProductSlugs.map((product) => ({
    ...product,
    categorySlug: product.categoryId ? slugByCategory.get(product.categoryId) || "" : "",
  }));
  const byId = new Map(products.map((product) => [product.id, product]));
  const linked = products.map((product) => ({
    ...product,
    related: product.relatedIds
      .map((id) => byId.get(id))
      .filter((item) => item && item.id !== product.id)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        thumb: item.thumb,
        category: item.category,
        categorySlug: item.categorySlug,
      })),
  }));

  const categories = categorySlugs
    .map((category) => {
      const members = linked.filter((product) => product.categoryId === category.id);
      const covers = coversById.get(category.id) || [];
      const images = covers.length ? covers.map((item) => item.url) : fallbackCategoryImages(members);
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        count: members.length,
        image: images[0] || "",
        images,
        covers,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  if (!includeHidden) cache = { at: now, products: linked, categories };
  return { products: linked, categories };
}

async function loadProducts() {
  return (await buildCatalog()).products;
}

async function loadCategories() {
  return (await buildCatalog()).categories;
}

async function loadAdminCatalog() {
  return buildCatalog({ includeHidden: true });
}

async function saveProductMeta(erpId, patch) {
  const products = await productCollection();
  const update = { updatedAt: new Date() };
  if ("name" in patch) update.name = String(patch.name || "").trim();
  if ("description" in patch) update.description = patch.description == null ? null : String(patch.description);
  if ("hidden" in patch) update.hidden = Boolean(patch.hidden);
  if ("relatedIds" in patch) update.relatedIds = (patch.relatedIds || []).map(String).filter((id) => id && id !== erpId);
  if ("specs" in patch) update.specs = normalizeSpecs(patch.specs);
  if ("variants" in patch) update.variants = normalizeVariants(patch.variants);
  const labels = [
    ...(update.specs || []).map((item) => item.label),
    ...(update.variants || []).flatMap((item) => (item.specs || []).map((spec) => spec.label)),
  ];
  if (labels.length) await rememberSpecFields(labels);
  await products.updateOne({ erpId: String(erpId) }, { $set: update, $setOnInsert: { erpId: String(erpId) } }, { upsert: true });
  clearCatalogCache();
  const saved = await products.findOne({ erpId: String(erpId) });
  return {
    variants: "variants" in patch ? mapVariants(saved?.variants) : null,
    specs: normalizeSpecs(saved?.specs),
    fields: await listSpecFields(),
  };
}

const STARTER_SPECS = [
  "Screen size",
  "Display",
  "Resolution",
  "RAM",
  "Storage",
  "Processor",
  "Operating System",
  "Battery",
  "Camera",
  "Network",
  "Dimension",
];

async function specFieldCollection() {
  const fields = await collection("specFields");
  await fields.createIndex({ key: 1 }, { unique: true });
  return fields;
}

async function rememberSpecFields(labels) {
  const names = [...new Set(labels.map((label) => String(label || "").replace(/\s+/g, " ").trim()).filter(Boolean))];
  if (!names.length) return;
  const fields = await specFieldCollection();
  const now = new Date();
  await fields.bulkWrite(
    names.map((name) => ({
      updateOne: {
        filter: { key: name.toLowerCase() },
        update: { $setOnInsert: { name, key: name.toLowerCase(), createdAt: now } },
        upsert: true,
      },
    })),
  );
}

async function listSpecFields() {
  try {
    const fields = await specFieldCollection();
    const count = await fields.countDocuments();
    if (!count) await rememberSpecFields(STARTER_SPECS);
    const rows = await fields.find({}).sort({ name: 1 }).toArray();
    return rows.map((row) => row.name).filter(Boolean);
  } catch (error) {
    console.error("Spec fields are unavailable:", error.message);
    return STARTER_SPECS;
  }
}

async function addProductImages(erpId, images) {
  const products = await productCollection();
  await products.updateOne(
    { erpId: String(erpId) },
    { $setOnInsert: { erpId: String(erpId) }, $push: { images: { $each: images } }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
  clearCatalogCache();
}

async function addVariantImages(erpId, variantId, images) {
  const products = await productCollection();
  const result = await products.updateOne(
    { erpId: String(erpId), "variants.id": String(variantId) },
    { $push: { "variants.$.images": { $each: images } }, $set: { updatedAt: new Date() } },
  );
  clearCatalogCache();
  if (!result.matchedCount) {
    const error = new Error("Save the color before uploading its photos.");
    error.status = 400;
    throw error;
  }
}

async function removeVariantImage(erpId, variantId, publicId) {
  const products = await productCollection();
  await products.updateOne(
    { erpId: String(erpId), "variants.id": String(variantId) },
    { $pull: { "variants.$.images": { publicId } }, $set: { updatedAt: new Date() } },
  );
  clearCatalogCache();
}

async function removeProductImage(erpId, publicId) {
  const products = await productCollection();
  await products.updateOne({ erpId: String(erpId) }, { $pull: { images: { publicId } }, $set: { updatedAt: new Date() } });
  clearCatalogCache();
}

module.exports = {
  clearCatalogCache,
  loadProducts,
  loadCategories,
  loadAdminCatalog,
  saveProductMeta,
  saveCategoryCovers,
  listSpecFields,
  addProductImages,
  addVariantImages,
  removeProductImage,
  removeVariantImage,
};
