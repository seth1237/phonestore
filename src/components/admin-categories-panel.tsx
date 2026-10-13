"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, CategoryCover, Product } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";

export function AdminCategoriesPanel({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CategoryCover[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function coversOf(category: Category) {
    return drafts[category.id] ?? category.covers ?? [];
  }

  function choices(category: Category) {
    const photos: CategoryCover[] = [];
    const seen = new Set<string>();
    for (const product of products.filter((item) => item.categoryId === category.id)) {
      const images = [
        ...product.photos,
        ...(product.variants || []).flatMap((variant) => variant.images),
      ];
      for (const photo of images) {
        if (!photo.url || seen.has(photo.url)) continue;
        seen.add(photo.url);
        photos.push({ url: photo.url, publicId: photo.publicId || "" });
      }
    }
    return photos;
  }

  function toggle(category: Category, photo: CategoryCover) {
    const current = coversOf(category);
    const next = current.some((item) => item.url === photo.url)
      ? current.filter((item) => item.url !== photo.url)
      : [...current, photo];
    setDrafts((state) => ({ ...state, [category.id]: next }));
  }

  async function save(category: Category, images = coversOf(category)) {
    setBusyId(category.id);
    setMessage("");
    setDrafts((state) => ({ ...state, [category.id]: images }));
    const response = await apiFetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
    setBusyId(null);
    if (!response.ok) {
      setMessage("Could not save that category cover.");
      return;
    }
    setToast(images.length ? "Category cover saved." : "Using the first 3 product photos.");
    setOpenId(null);
    router.refresh();
  }

  async function upload(category: Category, files: FileList | null) {
    if (!files?.length) return;
    setBusyId(category.id);
    setMessage("");
    const body = new FormData();
    for (const file of Array.from(files)) body.append("file", file);
    const response = await apiFetch(`/api/admin/categories/${category.id}/upload`, { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { error?: string; covers?: CategoryCover[] } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage(payload?.error || "Upload failed");
      return;
    }
    if (payload?.covers) setDrafts((state) => ({ ...state, [category.id]: payload.covers || [] }));
    setToast("Cover image saved.");
    router.refresh();
  }

  return (
    <section className="admin-card">
      <div className="card-title">
        <div>
          <h3>Category covers</h3>
          <span>Choose the photos that cycle on Shop by Categories. Leave a category empty and the shop uses the first three products.</span>
        </div>
      </div>
      {message ? <p className="admin-message">{message}</p> : null}
      <div className="admin-product-list">
        {categories.map((category) => {
          const open = openId === category.id;
          const selected = coversOf(category);
          const pool = choices(category);
          const extras = selected.filter((item) => !pool.some((photo) => photo.url === item.url));
          return (
            <article key={category.id} className="admin-product-block">
              <button type="button" className="admin-product" onClick={() => setOpenId(open ? null : category.id)}>
                {category.image ? <img src={category.image} alt="" /> : <span className="admin-job-placeholder" />}
                <span>
                  <b>{category.name}</b>
                  <small>{selected.length ? `${selected.length} chosen covers` : "Using the first 3 products"}</small>
                </span>
                <small>{category.count} products</small>
              </button>
              {open ? (
                <div className="admin-editor">
                  <div className="cover-grid">
                    {[...extras, ...pool].map((photo) => {
                      const on = selected.some((item) => item.url === photo.url);
                      return (
                        <button
                          key={photo.url}
                          type="button"
                          className={on ? "cover-pick is-on" : "cover-pick"}
                          aria-pressed={on}
                          onClick={() => toggle(category, photo)}
                        >
                          <img src={photo.url} alt="" />
                        </button>
                      );
                    })}
                  </div>
                  {!pool.length && !extras.length ? <span className="spec-hint">This category has no product photos yet. Drop a cover image below.</span> : null}
                  <label
                    className="admin-dropzone"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      upload(category, event.dataTransfer.files);
                    }}
                  >
                    <strong>{busyId === category.id ? "Saving…" : "Drop a cover image"}</strong>
                    <span>Or click to upload. Chosen photos are outlined in orange.</span>
                    <input
                      className="admin-dropzone-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        upload(category, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <div className="admin-job-actions">
                    <button type="button" className="button" disabled={busyId === category.id} onClick={() => save(category)}>Save covers</button>
                    <button
                      type="button"
                      className="button button-quiet"
                      onClick={() => save(category, [])}
                    >
                      Use product photos
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {toast ? <p className="admin-toast" role="status">{toast}</p> : null}
    </section>
  );
}
