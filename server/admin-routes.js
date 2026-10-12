const { loadAdminCatalog, saveProductMeta, addProductImages, removeProductImage } = require("./catalog");
const { listReviews, updateReview, deleteReview } = require("./reviews");
const { deleteImage } = require("./cloudinary");
const { authenticate, createSession, sessionFromRequest, cookieHeader, SESSION_DAYS } = require("./admin-auth");

function requireAdmin(req, res) {
  const session = sessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Sign in required." });
    return null;
  }
  return session;
}

function mountAdmin(app, { pool, text }) {
  app.post("/api/admin/login", (req, res) => {
    const username = text(req.body?.email || req.body?.username);
    const password = String(req.body?.password || "");
    const admin = authenticate(username, password);
    if (!admin) return res.status(401).json({ error: "Those sign-in details were not recognised." });
    const token = createSession(admin.email);
    res.setHeader("Set-Cookie", cookieHeader(token, SESSION_DAYS * 24 * 60 * 60));
    res.json({ email: admin.email });
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.setHeader("Set-Cookie", cookieHeader("", 0));
    res.json({ ok: true });
  });

  app.get("/api/admin/session", (req, res) => {
    const session = sessionFromRequest(req);
    if (!session) return res.status(401).json({ error: "Sign in required." });
    res.json(session);
  });

  app.get("/api/admin/overview", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const [{ products, categories }, reviewData, [messages], [orders], [offers]] = await Promise.all([
        loadAdminCatalog(),
        listReviews(pool),
        pool.query("SELECT COUNT(*) AS total FROM messages"),
        pool.query("SELECT COUNT(*) AS total FROM orders"),
        pool.query("SELECT COUNT(*) AS total FROM offers"),
      ]);
      res.json({
        products: products.length,
        hidden: products.filter((product) => product.hidden).length,
        categories: categories.length,
        reviews: reviewData.reviews.length,
        messages: Number(messages[0].total),
        orders: Number(orders[0].total),
        offers: Number(offers[0].total),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/products", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const catalog = await loadAdminCatalog();
      res.json(catalog);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/products/:id", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      await saveProductMeta(req.params.id, {
        name: req.body?.name,
        description: req.body?.description,
        hidden: req.body?.hidden,
        relatedIds: req.body?.relatedIds,
      });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/products/:id/images", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const images = Array.isArray(req.body?.images) ? req.body.images : [];
      const clean = images
        .filter((image) => image?.url)
        .map((image) => ({ url: String(image.url), publicId: String(image.publicId || "") }));
      if (!clean.length) return res.status(400).json({ error: "No images were provided." });
      await addProductImages(req.params.id, clean);
      res.status(201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/products/:id/images", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const publicId = text(req.body?.publicId);
      if (!publicId) return res.status(400).json({ error: "Image id is required." });
      await removeProductImage(req.params.id, publicId);
      await deleteImage(publicId);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/reviews", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      res.json(await listReviews(pool));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/reviews/:id", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      await updateReview(req.params.id, { reply: req.body?.reply, verified: req.body?.verified });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/reviews/:id", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      await deleteReview(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/offers", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
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

  app.patch("/api/admin/offers/:id", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      await pool.query("UPDATE offers SET paused = ? WHERE id = ?", [req.body?.paused ? 1 : 0, req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/messages", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const [rows] = await pool.query("SELECT id, name, phone, email, message, created_at FROM messages ORDER BY id DESC");
      res.json(rows);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/orders", async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) return;
      const [rows] = await pool.query(
        "SELECT id, customer_name, phone, email, notes, total, quotation_id, quotation_number, created_at FROM orders ORDER BY id DESC",
      );
      res.json(rows);
    } catch (error) {
      next(error);
    }
  });
}

module.exports = { mountAdmin };
