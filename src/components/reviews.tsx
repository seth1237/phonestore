"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { Review, ReviewStats } from "@/lib/types";
import { AccentButton } from "./accent-button";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          className={index < rating ? "fill-[#FFB400] text-[#FFB400]" : "text-[#E5E7EB]"}
          aria-hidden
        />
      ))}
    </span>
  );
}

function RatingSummary({ stats, compact = false }: { stats: ReviewStats; compact?: boolean }) {
  const bars = [
    stats.five_star_reviews,
    stats.four_star_reviews,
    stats.three_star_reviews,
    stats.two_star_reviews,
    stats.one_star_reviews,
  ];
  const recommended = Math.round(
    ((stats.five_star_reviews + stats.four_star_reviews) / Math.max(stats.rating_total, 1)) * 100,
  );
  const headingCount = stats.rating_total + stats.review_total;

  return (
    <div className={`flex w-full flex-col items-start justify-start space-y-[1.25rem] ${compact ? "" : "md:mt-0"}`}>
      <h2 className="text-[1.25rem] font-medium text-[rgba(0,0,0,0.87)]">
        Ratings & Reviews ({headingCount})
      </h2>
      <div className="flex w-full flex-row items-center justify-start space-x-[0.75rem]">
        <div className="flex w-[90%] flex-col items-start justify-start md:w-[65%]">
          {bars.map((count, index) => {
            const score = 5 - index;
            const width = Math.round((count / Math.max(stats.rating_total, 1)) * 100);
            return (
              <div key={score} className="flex w-full flex-row items-center justify-start space-x-[0.5rem]">
                <p className="text-[0.875rem]">{score}</p>
                <div className="h-[0.5rem] w-full border border-[#F0F0F0] bg-white" title={String(count)}>
                  <div className="h-full bg-[#FFB400]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-center justify-center space-y-[0.5rem] md:w-[35%]">
          <div className="flex w-full flex-col items-start justify-start">
            <div className="flex w-full flex-row items-center justify-start space-x-[0.5rem]">
              <p className="text-[1.5rem] font-medium">{stats.average_rating.toFixed(1)}</p>
              <Stars rating={Math.round(stats.average_rating)} />
            </div>
            <p className="text-[0.625rem] text-[rgba(0,0,0,0.38)]">{stats.review_total} reviews</p>
          </div>
          <div className="flex w-full flex-col items-start justify-start">
            <p className="text-[1.5rem] font-medium">{recommended}%</p>
            <p className="text-[0.625rem] text-[rgba(0,0,0,0.38)]">recommended</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="w-full break-inside-avoid rounded-md bg-white p-4 shadow-md sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.95rem] font-semibold capitalize text-ink">{review.name.toLowerCase()}</h3>
          <Stars rating={review.rating} />
        </div>
        <time className="shrink-0 text-[0.7rem] text-muted" dateTime={review.date}>
          {review.date}
        </time>
      </div>
      <p className="mt-3 text-[0.875rem] leading-6 text-[#1f2937]">{review.text}</p>
      {review.verified ? (
        <p className="mt-3 text-[0.7rem] font-semibold text-[#166534]">Verified purchase</p>
      ) : null}
      {review.reply ? (
        <p className="mt-3 border-t border-line pt-3 text-[0.8rem] text-muted">
          <span className="font-semibold text-ink">Reply: </span>
          {review.reply}
        </p>
      ) : null}
    </article>
  );
}

function ReviewForm({ onSaved }: { onSaved: (review: Review, stats: ReviewStats) => void }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="rounded-md bg-white p-4 text-sm shadow-md" role="status">
        Thank you, {name.trim() || "there"}. Your review is saved.
      </p>
    );
  }

  return (
    <form
      className="w-full space-y-3 rounded-md bg-white p-4 shadow-md"
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await fetch("/backend/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), text: text.trim(), rating }),
              });
              if (!response.ok) return;
              const data = (await response.json()) as { review: Review; stats: ReviewStats };
              onSaved(data.review, data.stats);
              setDone(true);
            }}
    >
      <h3 className="text-[1.1rem] font-bold">Leave a review</h3>
      <label className="block text-[0.8rem] font-semibold" htmlFor="review-name">
        Name
      </label>
      <input
        id="review-name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-md border border-line px-3 py-2 text-sm"
      />
      <p className="text-[0.8rem] font-semibold">Rating</p>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1} stars`}
            onClick={() => setRating(index + 1)}
          >
            <Star size={22} className={index < rating ? "fill-[#FFB400] text-[#FFB400]" : "text-[#E5E7EB]"} />
          </button>
        ))}
      </div>
      <label className="block text-[0.8rem] font-semibold" htmlFor="review-text">
        Review
      </label>
      <textarea
        id="review-text"
        required
        minLength={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-28 w-full rounded-md border border-line px-3 py-2 text-sm"
      />
      <AccentButton type="submit">Submit review</AccentButton>
    </form>
  );
}

export function ReviewSection({
  reviews: initialReviews,
  stats: initialStats,
  showBrowse = false,
}: {
  reviews: Review[];
  stats: ReviewStats;
  showBrowse?: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const visible = reviews.filter((review) => (filter === "all" ? true : review.rating === Number(filter)));

  return (
    <div className={showBrowse ? "flex min-h-screen w-full flex-col items-start justify-start space-y-[1.5rem] px-4 pt-[2rem] lg:flex-row lg:space-x-2.5 lg:space-y-0" : "w-full"}>
      <div className={showBrowse ? "flex w-full flex-col items-start justify-start space-y-5 lg:w-[18vw]" : "w-full"}>
        <RatingSummary stats={stats} />
        <AccentButton onClick={() => setFormOpen((value) => !value)}>Leave a review</AccentButton>
        {formOpen ? (
          <ReviewForm
            onSaved={(review, nextStats) => {
              setReviews((current) => [review, ...current.filter((item) => item.id !== review.id)]);
              setStats(nextStats);
            }}
          />
        ) : null}
        {showBrowse ? (
          <div className="flex w-full flex-col items-start justify-start space-y-[0.88rem]">
            <h2 className="text-[1.25rem] font-medium text-[rgba(0,0,0,0.87)]">Browse by</h2>
            <div className="flex w-full flex-row items-start justify-start space-x-[1rem] overflow-x-auto py-4 md:flex-col md:space-x-0 md:space-y-[1rem]">
              <button type="button" className="shrink-0 text-[1rem] font-semibold text-secondary">
                All
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {showBrowse ? (
        <div className="flex h-full w-full flex-col items-center justify-start pb-10 lg:w-[78%]">
          <div className="flex w-full flex-col items-start justify-start space-y-[1.5rem]">
            <div className="flex w-full items-center justify-between">
              <h1 className="w-full text-[1.75rem] font-bold max-lg:sr-only">Reviews</h1>
            </div>
            <div className="flex w-full flex-row items-center justify-between pb-[1.3rem] pr-3">
              <p className="text-[0.875rem] text-[#445D6A]">{stats.review_total} reviews</p>
              <label className="sr-only" htmlFor="review-filter">
                Select Filter
              </label>
              <select
                id="review-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="flex h-10 items-center rounded-md border border-line bg-white px-3 text-sm"
              >
                <option value="all">Select Filter</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
            <div className="flex w-full flex-row flex-wrap items-start justify-start gap-[1.5rem]">
              {visible.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex w-full flex-row flex-wrap items-start gap-[1.5rem]">
          {visible.slice(0, 4).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
