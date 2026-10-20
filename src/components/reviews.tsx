"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { Review, ReviewStats } from "@/lib/types";
import { AccentButton } from "./accent-button";
import { apiFetch } from "@/lib/client-api";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return <span className="text-xs text-muted">Rating unavailable</span>;
  }
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
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

function RatingSummary({ stats, title }: { stats: ReviewStats; title: string }) {
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
  return (
    <div className="flex w-full flex-col items-start justify-start space-y-[1.25rem]">
      <h2 className="text-[1.25rem] font-medium text-[rgba(0,0,0,0.87)]">
        {title} ({stats.review_total})
      </h2>
      {stats.rating_total ? (
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
              <p className="text-[0.625rem] text-[rgba(0,0,0,0.6)]">{stats.review_total} reviews</p>
            </div>
            <div className="flex w-full flex-col items-start justify-start">
              <p className="text-[1.5rem] font-medium">{recommended}%</p>
              <p className="text-[0.625rem] text-[rgba(0,0,0,0.6)]">recommended</p>
            </div>
          </div>
        </div>
      ) : <p className="text-sm text-muted">No ratings yet.</p>}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="w-full break-inside-avoid rounded-md bg-white p-4 shadow-md sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.95rem] font-semibold text-ink">{review.name}</h3>
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

function ReviewForm({
  endpoint,
  onSaved,
}: {
  endpoint: string;
  onSaved: (review: Review, stats: ReviewStats) => void;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setError("");
        setSubmitting(true);
        try {
          const response = await apiFetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), text: text.trim(), rating }),
          });
          const data = (await response.json().catch(() => null)) as
            | { review?: Review; stats?: ReviewStats; error?: string }
            | null;
          if (!response.ok || !data?.review || !data.stats) {
            setError(data?.error || "Your review could not be submitted. Please try again.");
            return;
          }
          onSaved(data.review, data.stats);
          setDone(true);
        } catch {
          setError("Your review could not be submitted. Check your connection and try again.");
        } finally {
          setSubmitting(false);
        }
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
      <fieldset>
        <legend className="text-[0.8rem] font-semibold">Rating</legend>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1} stars`}
              aria-pressed={rating === index + 1}
              onClick={() => setRating(index + 1)}
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Star size={22} aria-hidden className={index < rating ? "fill-[#FFB400] text-[#FFB400]" : "text-[#E5E7EB]"} />
            </button>
          ))}
        </div>
      </fieldset>
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
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <AccentButton type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </AccentButton>
    </form>
  );
}

export function ReviewSection({
  reviews: initialReviews,
  stats: initialStats,
  available = true,
  showBrowse = false,
  title = "Shop Reviews",
  reviewEndpoint = "/api/reviews",
  emptyMessage = "No shop reviews yet.",
}: {
  reviews: Review[];
  stats: ReviewStats;
  available?: boolean;
  showBrowse?: boolean;
  title?: string;
  reviewEndpoint?: string;
  emptyMessage?: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const visible = reviews.filter((review) => (filter === "all" ? true : review.rating === Number(filter)));

  if (!available) {
    return (
      <section className="w-full space-y-3" aria-labelledby="review-unavailable-title">
        <h2 id="review-unavailable-title" className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-[#991b1b]" role="alert">Reviews could not be loaded right now. Please try again later.</p>
      </section>
    );
  }

  return (
    <div className={showBrowse ? "flex min-h-screen w-full flex-col items-start justify-start space-y-[1.5rem] px-4 pt-[2rem] lg:flex-row lg:space-x-2.5 lg:space-y-0" : "w-full"}>
      <div className={showBrowse ? "flex w-full flex-col items-start justify-start space-y-5 lg:w-[18vw]" : "w-full"}>
        <RatingSummary stats={stats} title={title} />
        <AccentButton onClick={() => setFormOpen((value) => !value)}>Leave a review</AccentButton>
        {formOpen ? (
          <ReviewForm
            endpoint={reviewEndpoint}
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
              <h2 className="w-full text-[1.5rem] font-bold">All shop reviews</h2>
            </div>
            <div className="flex w-full flex-row items-center justify-between pb-[1.3rem] pr-3">
              <p className="text-[0.875rem] text-[#334155]">
                Showing {visible.length} of {stats.review_total} shop reviews
              </p>
              <label className="sr-only" htmlFor="review-filter">
                Select Filter
              </label>
              <select
                id="review-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="flex h-10 items-center rounded-md border border-line bg-white px-3 text-sm"
              >
                <option value="all">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
            <div className="flex w-full flex-row flex-wrap items-start justify-start gap-[1.5rem]">
              {visible.length ? visible.map((review) => (
                <ReviewCard key={review.id} review={review} />
              )) : <p className="w-full rounded-md bg-white p-6 text-sm text-muted" role="status">
                {filter === "all" ? emptyMessage : `No ${title.toLowerCase()} match this rating yet.`}
              </p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex w-full flex-row flex-wrap items-start gap-[1.5rem]">
          {visible.length ? visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          )) : <p className="w-full rounded-md bg-white p-6 text-sm text-muted" role="status">{emptyMessage}</p>}
        </div>
      )}
    </div>
  );
}
