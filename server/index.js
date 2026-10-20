require("./env");
const express = require("express");
const { pool } = require("./db");
const { ensureSchema } = require("./schema");
const { seed } = require("./seed");
const { createQuotation, requestInvoice } = require("./erp");
const { loadProducts, loadCategories } = require("./catalog");
const { listReviews, listProductReviews, createReview } = require("./reviews");
const { mountAdmin } = require("./admin-routes");
const { fallbackContent } = require("./seed");
const customers = require("./customers");
const mpesa = require("./mpesa");
const { syncWebsiteOrder } = require("./elevate-orders");

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

  app.get("/api/products/:id/reviews", async (req, res, next) => {
    try {
      const products = await loadProducts();
      const product = products.find((item) => item.slug === req.params.id || item.id === req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found." });
      res.json(await listProductReviews(pool, product.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products/:id/reviews", async (req, res, next) => {
    try {
      const products = await loadProducts();
      const product = products.find((item) => item.slug === req.params.id || item.id === req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found." });
      const name = text(req.body?.name);
      const body = text(req.body?.text);
      const rating = Number(req.body?.rating);
      if (!name || body.length < 3 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Name, a rating from 1 to 5, and a review of at least 3 characters are required." });
      }
      res.status(201).json(await createReview({ name, text: body, rating, productId: product.id }));
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

  function publicCustomer(row) {
    return { id: row.id, name: row.name, email: row.email, phone: row.phone || "" };
  }

  async function orderRecord(connection, orderId) {
    const [orders] = await connection.query(
      "SELECT id, customer_id, customer_name, phone, email, location, notes, total, status, payment_status, mpesa_receipt, checkout_request_id, quotation_number, created_at FROM orders WHERE id = ?",
      [orderId],
    );
    const order = orders[0];
    if (!order) return null;
    const [items] = await connection.query(
      "SELECT name, qty, price FROM order_items WHERE order_id = ? ORDER BY id",
      [orderId],
    );
    return { ...order, total: Number(order.total), items };
  }

  async function markPayment(connection, checkoutRequestId, result) {
    const paid = result.success && !result.pending;
    const failed = !result.success && !result.pending;
    const status = paid ? "paid" : failed ? "failed" : "pending";
    const receipt = result.receipt || "";
    await connection.query(
      "UPDATE payments SET status = ?, result_desc = ?, receipt = IF(? = '', receipt, ?), confirmed_at = IF(? = 'paid', NOW(), confirmed_at) WHERE checkout_request_id = ?",
      [status, result.resultDesc || "", receipt, receipt, status, checkoutRequestId],
    );
    if (paid) {
      await connection.query(
        "UPDATE orders SET payment_status = 'paid', status = IF(status = 'awaiting_payment', 'paid', status), mpesa_receipt = IF(? = '', mpesa_receipt, ?) WHERE checkout_request_id = ?",
        [receipt, receipt, checkoutRequestId],
      );
    } else if (failed) {
      await connection.query(
        "UPDATE orders SET payment_status = 'failed' WHERE checkout_request_id = ? AND payment_status = 'pending'",
        [checkoutRequestId],
      );
    }
    const [rows] = await connection.query("SELECT id FROM orders WHERE checkout_request_id = ?", [checkoutRequestId]);
    return rows[0] ? orderRecord(connection, rows[0].id) : null;
  }

  app.post("/api/account/register", async (req, res) => {
    const name = text(req.body?.name);
    const email = text(req.body?.email).toLowerCase();
    const phone = text(req.body?.phone);
    const password = String(req.body?.password || "");
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ error: "Name, email, and a password of at least 8 characters are required." });
    }
    try {
      const [result] = await pool.query(
        "INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
        [name, email, phone, customers.hashPassword(password)],
      );
      await pool.query("UPDATE orders SET customer_id = ? WHERE customer_id IS NULL AND email = ?", [result.insertId, email]);
      const token = customers.createSession({ id: result.insertId, email });
      res.setHeader("Set-Cookie", customers.cookieHeader(token, customers.SESSION_DAYS * 24 * 60 * 60));
      res.status(201).json({ token, customer: { id: result.insertId, name, email, phone } });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An account with that email already exists." });
      console.error("Customer registration failed:", error.message);
      res.status(503).json({ error: "Accounts are unavailable right now." });
    }
  });

  app.post("/api/account/login", async (req, res) => {
    const email = text(req.body?.email).toLowerCase();
    const password = String(req.body?.password || "");
    try {
      const [rows] = await pool.query("SELECT id, name, email, phone, password_hash FROM customers WHERE email = ?", [email]);
      const customer = rows[0];
      if (!customer || !customers.passwordMatches(password, customer.password_hash)) {
        return res.status(401).json({ error: "The email or password is not correct." });
      }
      const token = customers.createSession(customer);
      res.setHeader("Set-Cookie", customers.cookieHeader(token, customers.SESSION_DAYS * 24 * 60 * 60));
      res.json({ token, customer: publicCustomer(customer) });
    } catch (error) {
      console.error("Customer login failed:", error.message);
      res.status(503).json({ error: "Accounts are unavailable right now." });
    }
  });

  app.post("/api/account/logout", (_req, res) => {
    res.setHeader("Set-Cookie", customers.cookieHeader("", 0));
    res.json({ ok: true });
  });

  app.get("/api/account/me", async (req, res) => {
    const session = customers.sessionFromRequest(req);
    if (!session) return res.status(401).json({ error: "Sign in to see your account." });
    try {
      const [rows] = await pool.query("SELECT id, name, email, phone FROM customers WHERE id = ?", [session.id]);
      if (!rows[0]) return res.status(401).json({ error: "Sign in to see your account." });
      res.json({ customer: publicCustomer(rows[0]) });
    } catch (error) {
      console.error("Customer profile failed:", error.message);
      res.status(503).json({ error: "Accounts are unavailable right now." });
    }
  });

  app.get("/api/account/orders", async (req, res) => {
    const session = customers.sessionFromRequest(req);
    if (!session) return res.status(401).json({ error: "Sign in to see your orders." });
    try {
      const [orders] = await pool.query(
        "SELECT id, customer_name, phone, email, location, notes, total, status, payment_status, mpesa_receipt, quotation_number, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC",
        [session.id],
      );
      const ids = orders.map((order) => order.id);
      const itemsByOrder = new Map();
      if (ids.length) {
        const [items] = await pool.query(
          `SELECT order_id, name, qty, price FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
          ids,
        );
        for (const item of items) {
          const list = itemsByOrder.get(item.order_id) || [];
          list.push({ name: item.name, qty: item.qty, price: Number(item.price) });
          itemsByOrder.set(item.order_id, list);
        }
      }
      res.json(orders.map((order) => ({ ...order, total: Number(order.total), items: itemsByOrder.get(order.id) || [] })));
    } catch (error) {
      console.error("Customer orders failed:", error.message);
      res.status(503).json({ error: "Orders are unavailable right now." });
    }
  });

  app.get("/api/payments/:checkoutRequestId", async (req, res) => {
    try {
      const checkoutRequestId = text(req.params.checkoutRequestId);
      const [existing] = await pool.query(
        "SELECT status, receipt, result_desc FROM payments WHERE checkout_request_id = ?",
        [checkoutRequestId],
      );
      const payment = existing[0];
      if (!payment) return res.status(404).json({ error: "That payment was not found." });
      if (payment.status === "pending") {
        const result = await mpesa.queryStkPush(checkoutRequestId);
        const connection = await pool.getConnection();
        try {
          const order = await markPayment(connection, checkoutRequestId, { ...result, receipt: payment.receipt });
          if (order && (result.success || (!result.success && !result.pending))) {
            void syncWebsiteOrder({
              shopOrderId: order.id,
              checkoutRequestId,
              status: order.status,
              paymentStatus: order.payment_status,
              mpesaReceipt: order.mpesa_receipt,
              resultDesc: result.resultDesc || "",
            });
          }
        } finally {
          connection.release();
        }
      }
      const [rows] = await pool.query(
        "SELECT o.id, o.status, o.payment_status, o.mpesa_receipt, o.total, p.status AS payment_row, p.result_desc FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.checkout_request_id = ?",
        [checkoutRequestId],
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ error: "That payment was not found." });
      res.json({
        orderId: row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        receipt: row.mpesa_receipt || "",
        total: Number(row.total),
        message: row.result_desc || "",
      });
    } catch (error) {
      console.error("Payment status failed:", error.message);
      res.status(503).json({ error: "The payment status could not be checked." });
    }
  });

  app.post("/api/mpesa/callback", async (req, res) => {
    if (!mpesa.callbackTokenOk(req)) return res.status(403).json({ ResultCode: 1, ResultDesc: "Invalid callback token" });
    const parsed = mpesa.parseStkCallback(req.body);
    if (!parsed.checkoutRequestId) return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    try {
      const connection = await pool.getConnection();
      try {
        const order = await markPayment(connection, parsed.checkoutRequestId, {
          success: parsed.resultCode === 0,
          pending: false,
          resultDesc: parsed.resultDesc,
          receipt: parsed.receipt,
        });
        if (order) {
          void syncWebsiteOrder({
            shopOrderId: order.id,
            checkoutRequestId: parsed.checkoutRequestId,
            status: order.status,
            paymentStatus: order.payment_status,
            mpesaReceipt: order.mpesa_receipt,
            resultDesc: parsed.resultDesc,
          });
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("M-Pesa callback was not saved:", error.message);
    }
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  app.post("/api/integrations/order-status", async (req, res) => {
    if (!mpesa.callbackTokenOk(req)) return res.status(403).json({ error: "Invalid callback token." });
    const checkoutRequestId = text(req.body?.checkoutRequestId);
    const status = text(req.body?.status);
    const allowed = new Set(["paid", "dispatched", "delivered"]);
    if (!checkoutRequestId || !allowed.has(status)) return res.status(400).json({ error: "A payment id and status are required." });
    try {
      if (status === "paid") {
        await pool.query(
          "UPDATE orders SET payment_status = 'paid', status = IF(status = 'awaiting_payment', 'paid', status), mpesa_receipt = IF(? = '', mpesa_receipt, ?) WHERE checkout_request_id = ?",
          [text(req.body?.mpesaReceipt), text(req.body?.mpesaReceipt), checkoutRequestId],
        );
        await pool.query(
          "UPDATE payments SET status = 'paid', receipt = IF(? = '', receipt, ?), result_desc = ?, confirmed_at = COALESCE(confirmed_at, NOW()) WHERE checkout_request_id = ?",
          [text(req.body?.mpesaReceipt), text(req.body?.mpesaReceipt), text(req.body?.resultDesc), checkoutRequestId],
        );
      } else {
        await pool.query(
          "UPDATE orders SET status = ? WHERE checkout_request_id = ? AND payment_status = 'paid'",
          [status, checkoutRequestId],
        );
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Order status sync failed:", error.message);
      res.status(503).json({ error: "The order status could not be saved." });
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
        const variantId = text(item.variantId);
        const variant = variantId ? (product.variants || []).find((entry) => entry.id === variantId) : null;
        if (variantId && !variant) return res.status(400).json({ error: `Choose a color for ${product.name}.` });
        if ((product.variants || []).length && !variant) {
          return res.status(400).json({ error: `Choose a color for ${product.name}.` });
        }
        const stock = variant ? variant.stock : product.stock;
        const price = variant && variant.price > 0 ? variant.price : product.price;
        if (stock < qty) return res.status(400).json({ error: `${product.name} does not have enough stock.` });
        const label = variant ? [variant.color, variant.storage].filter(Boolean).join(", ") : "";
        lines.push({ productId, name: label ? `${product.name} — ${label}` : product.name, qty, price });
      }
      let quotation = {};
      try {
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
        quotation = quote?.quotation || {};
      } catch (error) {
        console.error("Quotation was not created:", error.message);
      }
      const total = Number(quotation.subTotal) || lines.reduce((sum, line) => sum + line.price * line.qty, 0);
      const session = customers.sessionFromRequest(req);
      const payerPhone = text(req.body?.mpesaPhone) || phone;
      const prompt = await mpesa.initiateStkPush({
        phone: payerPhone,
        amount: total,
        accountReference: `Rai${Date.now().toString().slice(-8)}`,
        transactionDesc: "Rai order",
      });
      if (!prompt.success || !prompt.checkoutRequestId) {
        return res.status(502).json({ error: prompt.responseMessage || "The M-Pesa prompt could not be sent." });
      }
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [order] = await connection.query(
        "INSERT INTO orders (customer_id, customer_name, phone, email, location, notes, total, status, payment_status, checkout_request_id, quotation_id, quotation_number) VALUES (?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'pending', ?, ?, ?)",
        [session?.id || null, name, phone, email, location, notes, total, prompt.checkoutRequestId, quotation._id || null, quotation.quotationNumber || null],
      );
      for (const line of lines) {
        await connection.query(
          "INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)",
          [order.insertId, line.productId, line.name, line.qty, line.price],
        );
      }
      await connection.query(
        "INSERT INTO payments (order_id, phone, amount, checkout_request_id, merchant_request_id, status, result_desc) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
        [order.insertId, mpesa.normalizePhone(payerPhone), total, prompt.checkoutRequestId, prompt.merchantRequestId || "", prompt.responseMessage || ""],
      );
      await connection.commit();
      const record = await orderRecord(connection, order.insertId);
      void syncWebsiteOrder({
        shopOrderId: order.insertId,
        customerName: name,
        phone,
        email,
        location,
        items: lines.map((line) => ({ name: line.name, qty: line.qty, price: line.price })),
        total,
        status: "awaiting_payment",
        paymentStatus: "pending",
        checkoutRequestId: prompt.checkoutRequestId,
        merchantRequestId: prompt.merchantRequestId || "",
        quotationNumber: quotation.quotationNumber || "",
      });
      res.status(201).json({
        id: order.insertId,
        total,
        quotationId: quotation._id || null,
        quotationNumber: quotation.quotationNumber || null,
        payment: {
          checkoutRequestId: prompt.checkoutRequestId,
          message: prompt.responseMessage,
          status: record?.status || "awaiting_payment",
        },
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
