const express = require("express");
const { pool } = require("./db");
const { ensureSchema } = require("./schema");
const { seed } = require("./seed");

const DAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function mapProduct(row) {
  const image = row.image || "";
  const thumb = row.thumb || image;
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price),
    photos: image ? [{ url: image, thumb }] : [],
    thumb,
    image,
    categoryId: row.category_id == null ? null : Number(row.category_id),
    category: row.category || "",
  };
}

function reviewStats(rows) {
  const counts = [0, 0, 0, 0, 0];
  for (const row of rows) {
    const rating = Number(row.rating);
    if (rating >= 1 && rating <= 5) counts[rating - 1] += 1;
  }
  const total = rows.length;
  const sum = rows.reduce((totalRating, row) => totalRating + Number(row.rating), 0);
  return {
    average_rating: total ? Math.round((sum / total) * 100) / 100 : 0,
    rating_total: total,
    review_total: rows.filter((row) => String(row.body || "").trim()).length,
    five_star_reviews: counts[4],
    four_star_reviews: counts[3],
    three_star_reviews: counts[2],
    two_star_reviews: counts[1],
    one_star_reviews: counts[0],
  };
}

function mapReview(row) {
  return {
    id: Number(row.id),
    rating: Number(row.rating),
    text: row.body,
    name: row.reviewer,
    date: String(row.reviewed_on).slice(0, 10),
    verified: Boolean(row.verified),
    reply: row.reply,
  };
}

async function loadProducts() {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.image, p.thumb, p.category_id, c.name AS category
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.id`,
  );
  return rows.map(mapProduct);
}

async function loadCategories() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name,
            COUNT(p.id) AS product_count,
            COALESCE((
              SELECT image FROM products
              WHERE category_id = c.id AND image <> ''
              ORDER BY id LIMIT 1
            ), '') AS image
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id, c.name, c.sort_order
     ORDER BY c.sort_order, c.name`,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    count: Number(row.product_count),
    image: row.image || "",
  }));
}

async function loadSite() {
  const [shops] = await pool.query("SELECT * FROM shop WHERE id = 1");
  const shop = shops[0];
  if (!shop) return null;
  const [phones] = await pool.query("SELECT number FROM phones ORDER BY sort_order, id");
  const [hours] = await pool.query("SELECT day_name, day_key, open_time, close_time FROM hours ORDER BY sort_order, id");
  const [popular] = await pool.query("SELECT day_key, hour, visits FROM popular_hours ORDER BY day_key, hour");
  const popularHours = {};
  for (const key of DAY_KEYS) popularHours[key] = Array(24).fill(0);
  for (const row of popular) {
    const key = row.day_key;
    if (!popularHours[key]) popularHours[key] = Array(24).fill(0);
    popularHours[key][Number(row.hour)] = Number(row.visits);
  }
  const phoneNumbers = phones.map((row) => row.number);
  return {
    name: shop.name,
    legalName: shop.legal_name,
    tagline: shop.tagline,
    heroTitle: shop.hero_title,
    heroBody: shop.hero_body,
    heroCta: shop.hero_cta,
    logo: shop.logo,
    cover: shop.cover,
    phones: phoneNumbers,
    phone: phoneNumbers.join(" / "),
    email: shop.email || "",
    whatsapp: shop.whatsapp || "",
    address: shop.address,
    coordinates: { lat: Number(shop.lat), lng: Number(shop.lng) },
    currency: shop.currency,
    footerBlurb: shop.footer_blurb,
    credit: { label: shop.credit_label, href: shop.credit_href },
    social: { facebook: shop.facebook || "", instagram: shop.instagram || "", website: shop.website || "" },
    seo: {
      title: shop.seo_title,
      description: shop.seo_description,
      keywords: String(shop.seo_keywords || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    },
    hours: hours.map((row) => ({ day: row.day_name, open: row.open_time, close: row.close_time })),
    popularHours,
  };
}

function text(value) {
  return String(value || "").trim();
}

async function main() {
  await ensureSchema(pool);
  const [shops] = await pool.query("SELECT id FROM shop WHERE id = 1");
  if (!shops.length) await seed(pool);

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/site", async (_req, res, next) => {
    try {
      const site = await loadSite();
      if (!site) return res.status(404).json({ error: "Shop profile is not seeded." });
      res.json(site);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories", async (_req, res, next) => {
    try {
      res.json(await loadCategories());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories/:id", async (req, res, next) => {
    try {
      const categories = await loadCategories();
      const category = categories.find((item) => item.id === Number(req.params.id));
      if (!category) return res.status(404).json({ error: "Category not found." });
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories/:id/products", async (req, res, next) => {
    try {
      const products = await loadProducts();
      res.json(products.filter((product) => product.categoryId === Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products", async (_req, res, next) => {
    try {
      res.json(await loadProducts());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const products = await loadProducts();
      const product = products.find((item) => item.id === Number(req.params.id));
      if (!product) return res.status(404).json({ error: "Product not found." });
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/search", async (req, res, next) => {
    try {
      const needle = text(req.query.q).toLowerCase();
      if (needle.length < 3) return res.json({ products: [], categories: [] });
      const [products, categories] = await Promise.all([loadProducts(), loadCategories()]);
      res.json({
        products: products
          .filter((product) => `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase().includes(needle))
          .slice(0, 18),
        categories: categories.filter((category) => category.name.toLowerCase().includes(needle)).slice(0, 4),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reviews", async (_req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT * FROM reviews ORDER BY reviewed_on DESC, id DESC");
      res.json({ stats: reviewStats(rows), reviews: rows.map(mapReview) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews", async (req, res, next) => {
    try {
      const name = text(req.body?.name);
      const body = text(req.body?.text);
      const rating = Number(req.body?.rating);
      if (!name || body.length < 3 || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Name, a rating from 1 to 5, and a review of at least 3 characters are required." });
      }
      const today = new Date().toISOString().slice(0, 10);
      const [result] = await pool.query(
        "INSERT INTO reviews (rating, body, reviewer, reviewed_on, verified, reply) VALUES (?, ?, ?, ?, 0, NULL)",
        [rating, body, name, today],
      );
      const [rows] = await pool.query("SELECT * FROM reviews ORDER BY reviewed_on DESC, id DESC");
      const created = rows.find((row) => Number(row.id) === Number(result.insertId));
      res.status(201).json({ review: mapReview(created), stats: reviewStats(rows) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/offers", async (_req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT * FROM offers ORDER BY valid_from DESC");
      res.json(
        rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          validFrom: String(row.valid_from).replace(" ", "T"),
          validUntil: String(row.valid_until).replace(" ", "T"),
          paused: Boolean(row.paused),
        })),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts", async (_req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT slug, kicker, title, cover_alt, blocks FROM posts ORDER BY slug");
      res.json(
        rows.map((row) => ({
          slug: row.slug,
          kicker: row.kicker,
          title: row.title,
          coverAlt: row.cover_alt,
          blocks: typeof row.blocks === "string" ? JSON.parse(row.blocks) : row.blocks,
        })),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/posts/:slug", async (req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT slug, kicker, title, cover_alt, blocks FROM posts WHERE slug = ?", [req.params.slug]);
      const row = rows[0];
      if (!row) return res.status(404).json({ error: "Post not found." });
      res.json({
        slug: row.slug,
        kicker: row.kicker,
        title: row.title,
        coverAlt: row.cover_alt,
        blocks: typeof row.blocks === "string" ? JSON.parse(row.blocks) : row.blocks,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/messages", async (req, res, next) => {
    try {
      const name = text(req.body?.name);
      const phone = text(req.body?.phone);
      const email = text(req.body?.email);
      const message = text(req.body?.message);
      if (!name || !phone || !email || message.length < 3) {
        return res.status(400).json({ error: "Name, phone, email, and a message are required." });
      }
      const [result] = await pool.query(
        "INSERT INTO messages (name, phone, email, message) VALUES (?, ?, ?, ?)",
        [name, phone, email, message],
      );
      res.status(201).json({ id: result.insertId });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders", async (req, res, next) => {
    const name = text(req.body?.name);
    const phone = text(req.body?.phone);
    const email = text(req.body?.email);
    const notes = text(req.body?.notes);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!name || !phone || !email || !items.length) {
      return res.status(400).json({ error: "Name, phone, email, and at least one item are required." });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      let total = 0;
      const lines = [];
      for (const item of items) {
        const qty = Number(item.qty);
        const productId = Number(item.productId);
        if (!productId || qty < 1) throw new Error("Each item needs a product and a quantity.");
        const [rows] = await connection.query("SELECT id, name, price FROM products WHERE id = ?", [productId]);
        const product = rows[0];
        if (!product) throw new Error("One of the products is no longer in the catalog.");
        const price = Number(product.price);
        total += price * qty;
        lines.push({ productId, name: product.name, qty, price });
      }
      const [order] = await connection.query(
        "INSERT INTO orders (customer_name, phone, email, notes, total) VALUES (?, ?, ?, ?, ?)",
        [name, phone, email, notes, total],
      );
      for (const line of lines) {
        await connection.query(
          "INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)",
          [order.insertId, line.productId, line.name, line.qty, line.price],
        );
      }
      await connection.commit();
      res.status(201).json({ id: order.insertId, total });
    } catch (error) {
      await connection.rollback();
      if (error.message && !error.code) return res.status(400).json({ error: error.message });
      next(error);
    } finally {
      connection.release();
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "The shop API could not complete that request." });
  });

  const port = Number(process.env.API_PORT || 3001);
  app.listen(port, "127.0.0.1", () => {
    console.log(`Shop API listening on http://127.0.0.1:${port}`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
