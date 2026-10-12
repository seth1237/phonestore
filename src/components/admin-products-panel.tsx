"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product } from "@/lib/types";

export function AdminProductsPanel({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [related, setRelated] = useState<Record<string, string[]>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryOk = categoryId === "all" || product.categoryId === categoryId;
      const text = `${product.name} ${product.category}`.toLowerCase();
      return categoryOk && (!needle || text.includes(needle));
    });
  }, [products, query, categoryId]);

  function relatedIds(product: Product) {
    return related[product.id] ?? (product.related || []).map((item) => item.id);
  }

  async function save(product: Product) {
    setBusyId(product.id);
    setMessage("");
    const response = await fetch(`/backend/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: names[product.id] ?? product.name,
        description: details[product.id] ?? product.description ?? "",
        hidden: product.hidden,
        relatedIds: relatedIds(product),
      }),
    });
    setBusyId(null);
    if (!response.ok) {
      setMessage("Could not save that product.");
      return;
    }
    setMessage("Product details saved in MongoDB.");
    router.refresh();
  }

  async function toggleHidden(product: Product) {
    setBusyId(product.id);
    await fetch(`/backend/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: names[product.id] ?? product.name,
        description: details[product.id] ?? product.description ?? "",
        hidden: !product.hidden,
        relatedIds: relatedIds(product),
      }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function upload(productId: string, files: FileList | null) {
    if (!files?.length) return;
    setBusyId(productId);
    setMessage("");
    const body = new FormData();
    body.set("erpId", productId);
    for (const file of Array.from(files)) body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage(payload?.error || "Upload failed");
      return;
    }
    setMessage("Photos saved to Cloudinary.");
    router.refresh();
  }

  async function removeImage(productId: string, publicId: string) {
    setBusyId(productId);
    await fetch(`/backend/api/admin/products/${productId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="admin-card">
      <div className="card-title">
        <div>
          <h3>Products</h3>
          <span>Drop several photos onto one product. Attach other products that belong with it.</span>
        </div>
      </div>
      {message ? <p className="admin-message">{message}</p> : null}
      <div className="admin-job-actions" style={{ marginBottom: 16 }}>
        <input className="filter-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
        <select className="filter-input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div className="admin-product-list">
        {filtered.map((product) => {
          const open = openId === product.id;
          return (
            <article key={product.id} className={product.hidden ? "admin-product-block is-hidden" : "admin-product-block"}>
              <button type="button" className="admin-product" onClick={() => setOpenId(open ? null : product.id)}>
                {product.thumb ? <img src={product.thumb} alt="" /> : <span className="admin-job-placeholder" />}
                <span>
                  <b>{product.name}</b>
                  <small>{product.category} · {product.slug}{product.hidden ? " · hidden" : ""}</small>
                </span>
                <small>{product.photos.length} photos</small>
              </button>
              {open ? (
                <div className="admin-editor">
                  <label>
                    Name
                    <input value={names[product.id] ?? product.name} onChange={(event) => setNames((current) => ({ ...current, [product.id]: event.target.value }))} />
                  </label>
                  <label>
                    Description
                    <textarea rows={3} value={details[product.id] ?? product.description ?? ""} onChange={(event) => setDetails((current) => ({ ...current, [product.id]: event.target.value }))} />
                  </label>
                  <div className="admin-thumbs">
                    {product.photos.map((photo) => (
                      <div className="admin-thumb" key={photo.url}>
                        <img src={photo.url} alt="" />
                        {photo.publicId ? (
                          <button type="button" aria-label="Remove photo" onClick={() => removeImage(product.id, photo.publicId || "")}>×</button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <label className="admin-dropzone">
                    <strong>{busyId === product.id ? "Saving…" : "Add photos"}</strong>
                    <span>JPG, PNG, or WebP. Several files can belong to this one product.</span>
                    <input className="admin-dropzone-input" type="file" accept="image/*" multiple onChange={(event) => upload(product.id, event.target.files)} />
                  </label>
                  <div className="related-list">
                    {products.filter((item) => item.id !== product.id).map((item) => {
                      const selected = relatedIds(product).includes(item.id);
                      return (
                        <label key={item.id}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const current = relatedIds(product);
                              const next = selected ? current.filter((id) => id !== item.id) : [...current, item.id];
                              setRelated((state) => ({ ...state, [product.id]: next }));
                            }}
                          />
                          {item.name}
                        </label>
                      );
                    })}
                  </div>
                  <div className="admin-job-actions">
                    <button type="button" className="button" disabled={busyId === product.id} onClick={() => save(product)}>Save</button>
                    <button type="button" className="button button-quiet" onClick={() => toggleHidden(product)}>{product.hidden ? "Show on site" : "Hide from site"}</button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
