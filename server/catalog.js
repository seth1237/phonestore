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
      const primary = photos[0];
      return {
        ...product,
        name,
        description,
        hidden: Boolean(extra?.hidden),
        relatedIds: Array.isArray(extra?.relatedIds) ? extra.relatedIds.map(String) : [],
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
  await products.updateOne({ erpId: String(erpId) }, { $set: update, $setOnInsert: { erpId: String(erpId) } }, { upsert: true });
  clearCatalogCache();
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
  removeProductImage,
};
