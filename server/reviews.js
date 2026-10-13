const { ObjectId } = require("mongodb");
const { collection } = require("./mongo");

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
    review_total: rows.filter((row) => String(row.text || "").trim()).length,
    five_star_reviews: counts[4],
    four_star_reviews: counts[3],
    three_star_reviews: counts[2],
    two_star_reviews: counts[1],
    one_star_reviews: counts[0],
  };
}

function mapReview(row) {
  return {
    id: String(row._id),
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

async function listReviews(pool) {
  try {
    if (pool) {
      try {
        await migrateFromMysql(pool);
      } catch (error) {
        console.error("Review migration skipped:", error.message);
      }
    }
    const reviews = await reviewsCollection();
    const rows = await reviews.find({}).sort({ date: -1, _id: -1 }).toArray();
    const mapped = rows.map(mapReview);
    return { stats: reviewStats(mapped), reviews: mapped };
  } catch (error) {
    console.error("Reviews are unavailable:", error.message);
    return { stats: reviewStats([]), reviews: [] };
  }
}

async function createReview({ name, text, rating }) {
  const reviews = await reviewsCollection();
  const date = new Date().toISOString().slice(0, 10);
  const result = await reviews.insertOne({
    rating,
    text,
    name,
    date,
    verified: false,
    reply: null,
    createdAt: new Date(),
  });
  const created = await reviews.findOne({ _id: result.insertedId });
  const all = await reviews.find({}).toArray();
  return { review: mapReview(created), stats: reviewStats(all.map(mapReview)) };
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

module.exports = { listReviews, createReview, updateReview, deleteReview };
