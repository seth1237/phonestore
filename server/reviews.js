const { ObjectId } = require("mongodb");
const { collection } = require("./mongo");
const { matchesReviewScope, reviewFilter, reviewStats } = require("./review-model");

function mapReview(row) {
  return {
    id: String(row._id),
    productId: row.productId ? String(row.productId) : null,
    rating: Number(row.rating),
    text: row.text,
    name: row.name,
    date: String(row.date).slice(0, 10),
    verified: Boolean(row.verified),
    reply: row.reply || null,
  };
}

async function reviewsCollection() {
  const reviews = await collection("reviews");
  await reviews.createIndex({ date: -1 });
  return reviews;
}

async function migrateFromMysql(pool) {
  const reviews = await reviewsCollection();
  const count = await reviews.countDocuments();
  if (count > 0) return;
  const [rows] = await pool.query("SELECT rating, body, reviewer, reviewed_on, verified, reply FROM reviews ORDER BY reviewed_on DESC, id DESC");
  if (!rows.length) return;
  await reviews.insertMany(
    rows.map((row) => ({
      rating: Number(row.rating),
      text: row.body,
      name: row.reviewer,
      date: String(row.reviewed_on).slice(0, 10),
      verified: Boolean(row.verified),
      reply: row.reply,
      source: "mysql",
      createdAt: new Date(),
    })),
  );
}

async function loadReviews(pool, filter, productId = null) {
  try {
    if (pool) {
      try {
        await migrateFromMysql(pool);
      } catch (error) {
        console.error("Review migration skipped:", error.message);
      }
    }
    const reviews = await reviewsCollection();
    const rows = await reviews.find(filter).sort({ date: -1, _id: -1 }).toArray();
    const mapped = rows.map(mapReview).filter((review) => matchesReviewScope(review, productId));
    return { stats: reviewStats(mapped), reviews: mapped, available: true };
  } catch (error) {
    console.error("Reviews are unavailable:", error.message);
    return { stats: reviewStats([]), reviews: [], available: false };
  }
}

async function listReviews(pool) {
  return loadReviews(pool, reviewFilter());
}

async function listProductReviews(pool, productId) {
  return loadReviews(pool, reviewFilter(productId), productId);
}

async function listAllReviews(pool) {
  return loadReviews(pool, {});
}

async function createReview({ name, text, rating, productId = null }) {
  const reviews = await reviewsCollection();
  const date = new Date().toISOString().slice(0, 10);
  const result = await reviews.insertOne({
    ...(productId ? { productId: String(productId) } : {}),
    rating,
    text,
    name,
    date,
    verified: false,
    reply: null,
    createdAt: new Date(),
  });
  const created = await reviews.findOne({ _id: result.insertedId });
  const scoped = await reviews.find(reviewFilter(productId)).toArray();
  return {
    review: mapReview(created),
    stats: reviewStats(scoped.map(mapReview).filter((review) => matchesReviewScope(review, productId))),
    available: true,
  };
}

async function updateReview(id, patch) {
  const reviews = await reviewsCollection();
  const update = {};
  if ("reply" in patch) update.reply = patch.reply ? String(patch.reply) : null;
  if ("verified" in patch) update.verified = Boolean(patch.verified);
  await reviews.updateOne({ _id: new ObjectId(id) }, { $set: update });
}

async function deleteReview(id) {
  const reviews = await reviewsCollection();
  await reviews.deleteOne({ _id: new ObjectId(id) });
}

module.exports = { listReviews, listProductReviews, listAllReviews, createReview, updateReview, deleteReview };
