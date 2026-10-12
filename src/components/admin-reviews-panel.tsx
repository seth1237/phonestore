"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/types";

export function AdminReviewsPanel({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function save(review: Review) {
    const response = await fetch(`/backend/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: replies[review.id] ?? review.reply ?? "",
        verified: true,
      }),
    });
    setMessage(response.ok ? "Review saved in MongoDB." : "Could not save that review.");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/backend/api/admin/reviews/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="admin-card">
      {message ? <p className="admin-message">{message}</p> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Review</th>
            <th>Reply</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>
                <b>{review.name}</b> · {review.rating}/5 · {review.date}
                <div>{review.text}</div>
              </td>
              <td>
                <textarea
                  rows={3}
                  value={replies[review.id] ?? review.reply ?? ""}
                  onChange={(event) => setReplies((current) => ({ ...current, [review.id]: event.target.value }))}
                />
              </td>
              <td>
                <div className="admin-job-actions">
                  <button type="button" className="button" onClick={() => save(review)}>Save</button>
                  <button type="button" className="button button-danger" onClick={() => remove(review.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
