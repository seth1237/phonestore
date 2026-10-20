function reviewStats(rows) {
  const counts = [0, 0, 0, 0, 0];
  const ratedRows = rows.filter((row) => {
    const rating = Number(row.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return false;
    counts[rating - 1] += 1;
    return true;
  });
  const sum = ratedRows.reduce((totalRating, row) => totalRating + Number(row.rating), 0);
  return {
    average_rating: ratedRows.length ? Math.round((sum / ratedRows.length) * 100) / 100 : 0,
    rating_total: ratedRows.length,
    review_total: rows.length,
    five_star_reviews: counts[4],
    four_star_reviews: counts[3],
    three_star_reviews: counts[2],
    two_star_reviews: counts[1],
    one_star_reviews: counts[0],
  };
}

function reviewFilter(productId) {
  return productId
    ? { productId: String(productId) }
    : { $or: [{ productId: { $exists: false } }, { productId: null }, { productId: "" }] };
}

function matchesReviewScope(review, productId) {
  return productId
    ? String(review.productId || "") === String(productId)
    : !review.productId;
}

module.exports = { reviewStats, reviewFilter, matchesReviewScope };
