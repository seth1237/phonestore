/* eslint @typescript-eslint/no-require-imports: off */
const test = require("node:test");
const assert = require("node:assert/strict");
const { matchesReviewScope, reviewFilter, reviewStats } = require("./review-model");

test("product review scope excludes shop-wide and other products' reviews", () => {
  const rows = [
    { productId: "phone-a", rating: 5 },
    { productId: "phone-b", rating: 1 },
    { rating: 4 },
  ];
  assert.deepEqual(rows.filter((row) => matchesReviewScope(row, "phone-a")), [rows[0]]);
  assert.deepEqual(rows.filter((row) => matchesReviewScope(row, null)), [rows[2]]);
  assert.deepEqual(reviewFilter("phone-a"), { productId: "phone-a" });
});

test("review statistics count actual records without inventing a rating", () => {
  assert.deepEqual(reviewStats([]), {
    average_rating: 0,
    rating_total: 0,
    review_total: 0,
    five_star_reviews: 0,
    four_star_reviews: 0,
    three_star_reviews: 0,
    two_star_reviews: 0,
    one_star_reviews: 0,
  });
  assert.deepEqual(reviewStats([{ rating: 5 }, { rating: 3 }, { rating: 6 }]), {
    average_rating: 4,
    rating_total: 2,
    review_total: 3,
    five_star_reviews: 1,
    four_star_reviews: 0,
    three_star_reviews: 1,
    two_star_reviews: 0,
    one_star_reviews: 0,
  });
});
