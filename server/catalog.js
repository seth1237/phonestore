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

function mapVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      id: String(item?.id || ""),
      color: String(item?.color || "").trim(),
      storage: String(item?.storage || "").trim(),
      sku: String(item?.sku || "").trim(),
      price: Number(item?.price) || 0,
      stock: Math.max(0, Number(item?.stock) || 0),
      images: (Array.isArray(item?.images) ? item.images : [])
        .filter((image) => image?.url)
        .map((image) => ({ url: image.url, thumb: image.url, publicId: image.publicId || "" })),
    }))
    .filter((item) => item.id && (item.color || item.storage || item.sku || item.images.length));
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
  const [erpProducts, saved] = await Promise.all([loadErpProducts(), savedProducts()]);
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
      const images = [];
      const seen = new Set();
      for (const product of members) {
        for (const photo of product.photos) {
          if (!photo.url || seen.has(photo.url)) continue;
          seen.add(photo.url);
          images.push(photo.url);
        }
        for (const variant of product.variants || []) {
          for (const photo of variant.images) {
            if (!photo.url || seen.has(photo.url)) continue;
            seen.add(photo.url);
            images.push(photo.url);
          }
        }
      }
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        count: members.length,
        image: images[0] || "",
        images,
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
  if ("variants" in patch) update.variants = normalizeVariants(patch.variants);
  await products.updateOne({ erpId: String(erpId) }, { $set: update, $setOnInsert: { erpId: String(erpId) } }, { upsert: true });
  clearCatalogCache();
  if ("variants" in patch) {
    const saved = await products.findOne({ erpId: String(erpId) });
    return mapVariants(saved?.variants);
  }
  return null;
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
  addProductImages,
  addVariantImages,
  removeProductImage,
  removeVariantImage,
};
