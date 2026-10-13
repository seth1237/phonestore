require("./env");
const express = require("express");
const { pool } = require("./db");
const { ensureSchema } = require("./schema");
const { seed } = require("./seed");
const { createQuotation, requestInvoice } = require("./erp");
const { loadProducts, loadCategories } = require("./catalog");
const { listReviews, createReview } = require("./reviews");
const { mountAdmin } = require("./admin-routes");
const { fallbackContent } = require("./seed");

const DAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

async function loadSite() {
  try {
    return await loadSiteFromMysql();
  } catch (error) {
    console.error("Shop profile is being served without MySQL:", error.message);
    return fallbackContent().site;
  }
}

async function loadSiteFromMysql() {
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

async function buildApp() {
  try {
    await ensureSchema(pool);
    const [shops] = await pool.query("SELECT id FROM shop WHERE id = 1");
    if (!shops.length) await seed(pool);
  } catch (error) {
    console.error("MySQL is unavailable. Shop pages use the saved profile.", error.message);
  }

  const app = express();
  const allowedOrigins = String(process.env.WEB_ORIGIN || "http://127.0.0.1:3000,http://localhost:3000,https://phonestore-gilt.vercel.app")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    let allowed = origin && allowedOrigins.includes(origin);
    if (origin && !allowed) {
      try {
        const host = new URL(origin).hostname;
        allowed = host === "phonestore-gilt.vercel.app" || (host.endsWith(".vercel.app") && host.startsWith("phonestore"));
      } catch {
        allowed = false;
      }
    }
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
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
      const category = categories.find((item) => item.slug === req.params.id || item.id === req.params.id);
      if (!category) return res.status(404).json({ error: "Category not found." });
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories/:id/products", async (req, res, next) => {
    try {
      const products = await loadProducts();
      const category = (await loadCategories()).find((item) => item.slug === req.params.id || item.id === req.params.id);
      res.json(products.filter((product) => (category ? product.categoryId === category.id : product.categorySlug === req.params.id)));
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
      const product = products.find((item) => item.slug === req.params.id || item.id === req.params.id);
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
      res.json(await listReviews(pool));
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
      res.status(201).json(await createReview({ name, text: body, rating }));
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
      console.error("Offers are being served without MySQL:", error.message);
      res.json(fallbackContent().offers);
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
      console.error("Posts are being served without MySQL:", error.message);
      res.json(fallbackContent().posts);
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
      const post = fallbackContent().posts.find((item) => item.slug === req.params.slug);
      if (!post) return res.status(404).json({ error: "Post not found." });
      console.error("Post is being served without MySQL:", error.message);
      res.json(post);
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
      try {
        const { collection } = require("./mongo");
        const messages = await collection("messages");
        const result = await messages.insertOne({ name, phone, email, message, createdAt: new Date() });
        res.status(201).json({ id: String(result.insertedId) });
      } catch (mongoError) {
        console.error("Message was not saved:", mongoError.message);
        next(error);
      }
    }
  });

  app.post("/api/orders", async (req, res, next) => {
    const name = text(req.body?.name);
    const phone = text(req.body?.phone);
    const email = text(req.body?.email);
    const location = text(req.body?.location);
    const notes = text(req.body?.notes);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!name || !phone || !email || !location || !items.length) {
      return res.status(400).json({ error: "Name, phone, email, location, and at least one item are required." });
    }
    let connection;
    try {
      const catalog = await loadProducts();
      const lines = [];
      for (const item of items) {
        const qty = Number(item.qty);
        const productId = text(item.productId);
        if (!productId || qty < 1) {
          return res.status(400).json({ error: "Each item needs a product and a quantity." });
        }
        const product = catalog.find((entry) => entry.id === productId);
        if (!product) return res.status(400).json({ error: "One of the products is no longer in the catalog." });
        if (product.stock < qty) return res.status(400).json({ error: `${product.name} does not have enough stock.` });
        lines.push({ productId, name: product.name, qty, price: product.price });
      }
      const quote = await createQuotation({
        clientName: name,
        clientNumber: phone,
        clientLocation: location,
        email,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.qty,
          unitPrice: line.price,
        })),
      });
      const quotation = quote?.quotation || {};
      const total = Number(quotation.subTotal) || lines.reduce((sum, line) => sum + line.price * line.qty, 0);
      let orderId = null;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [order] = await connection.query(
          "INSERT INTO orders (customer_name, phone, email, notes, total, quotation_id, quotation_number) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [name, phone, email, notes, total, quotation._id || null, quotation.quotationNumber || null],
        );
        for (const line of lines) {
          await connection.query(
            "INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)",
            [order.insertId, line.productId, line.name, line.qty, line.price],
          );
        }
        await connection.commit();
        orderId = order.insertId;
      } catch (error) {
        console.error("Quotation was created. The local order row was not saved:", error.message);
        if (connection) {
          try {
            await connection.rollback();
          } catch {
            /* no open transaction */
          }
        }
      }
      res.status(201).json({
        id: orderId,
        total,
        quotationId: quotation._id || null,
        quotationNumber: quotation.quotationNumber || null,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch {
          /* no open transaction */
        }
      }
      if (error.status) return res.status(error.status).json({ error: error.message });
      if (error.message && !error.code) return res.status(400).json({ error: error.message });
      next(error);
    } finally {
      if (connection) connection.release();
    }
  });

  app.get("/api/quotations/:id/invoice", async (req, res, next) => {
    try {
      const invoice = await requestInvoice(req.params.id);
      res.setHeader("Content-Type", invoice.type);
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${req.params.id}.pdf"`);
      res.send(invoice.buffer);
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });

  mountAdmin(app, { pool, text });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "The shop API could not complete that request." });
  });

  return app;
}

let appPromise;

function createApp() {
  if (!appPromise) appPromise = buildApp();
  return appPromise;
}

if (require.main === module) {
  createApp()
    .then((app) => {
      const port = Number(process.env.PORT || process.env.API_PORT || 3001);
      const host = process.env.HOST || "0.0.0.0";
      app.listen(port, host, () => {
        console.log(`Shop API listening on http://${host}:${port}`);
      });
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { createApp };
