"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product, ProductSpec, ProductVariant } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";

function PhotoDrop({
  busy,
  title,
  hint,
  onFiles,
}: {
  busy: boolean;
  title: string;
  hint: string;
  onFiles: (files: FileList | null) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={over ? "admin-dropzone is-over" : "admin-dropzone"}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <strong>{busy ? "Saving…" : over ? "Drop to upload" : title}</strong>
      <span>{hint}</span>
      <input
        className="admin-dropzone-input"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function SpecSections({
  specs,
  onChange,
}: {
  specs: ProductSpec[];
  onChange: (next: ProductSpec[]) => void;
}) {
  return (
    <div className="spec-list">
      {specs.map((spec, index) => (
        <div className="spec-row" key={index}>
          <input
            list="known-spec-fields"
            aria-label={`Section ${index + 1}`}
            placeholder="RAM"
            value={spec.label}
            onChange={(event) => {
              const next = specs.slice();
              next[index] = { ...spec, label: event.target.value };
              onChange(next);
            }}
          />
          <input
            aria-label={`Value for ${spec.label || `section ${index + 1}`}`}
            placeholder="8 GB"
            value={spec.value}
            onChange={(event) => {
              const next = specs.slice();
              next[index] = { ...spec, value: event.target.value };
              onChange(next);
            }}
          />
          <button type="button" className="button button-quiet" onClick={() => onChange(specs.filter((_, item) => item !== index))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="button button-quiet" onClick={() => onChange([...specs, { label: "", value: "" }])}>
        Add section
      </button>
    </div>
  );
}

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
  const [drafts, setDrafts] = useState<Record<string, ProductVariant[]>>({});
  const [specDrafts, setSpecDrafts] = useState<Record<string, ProductSpec[]>>({});
  const [knownSpecs, setKnownSpecs] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch("/api/admin/spec-fields").then(async (response) => {
      if (!active || !response.ok) return;
      const payload = (await response.json()) as { fields?: string[] };
      setKnownSpecs(payload.fields || []);
    });
    return () => {
      active = false;
    };
  }, []);

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

  function variantsOf(product: Product) {
    return drafts[product.id] ?? product.variants ?? [];
  }

  function specsOf(product: Product) {
    return specDrafts[product.id] ?? product.specs ?? [];
  }

  function rememberFields(fields?: string[]) {
    if (fields?.length) setKnownSpecs(fields);
  }

  function editVariant(productId: string, variantId: string, patch: Partial<ProductVariant>, current: ProductVariant[]) {
    setDrafts((state) => ({
      ...state,
      [productId]: (state[productId] ?? current).map((item) => (item.id === variantId ? { ...item, ...patch } : item)),
    }));
  }

  async function save(product: Product) {
    setBusyId(product.id);
    setMessage("");
    const response = await apiFetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: names[product.id] ?? product.name,
        description: details[product.id] ?? product.description ?? "",
        hidden: product.hidden,
        relatedIds: relatedIds(product),
        specs: specsOf(product),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { specs?: ProductSpec[]; fields?: string[] } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage("Could not save that product.");
      return;
    }
    if (payload?.specs) setSpecDrafts((state) => ({ ...state, [product.id]: payload.specs || [] }));
    rememberFields(payload?.fields);
    setMessage("Product details saved in MongoDB.");
    router.refresh();
  }

  async function toggleHidden(product: Product) {
    setBusyId(product.id);
    await apiFetch(`/api/admin/products/${product.id}`, {
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
    for (const file of Array.from(files)) body.append("file", file);
    const response = await apiFetch(`/api/admin/products/${productId}/upload`, { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage(payload?.error || "Upload failed");
      return;
    }
    setMessage("Photos saved to Cloudinary.");
    router.refresh();
  }

  async function saveVariants(product: Product) {
    setBusyId(product.id);
    setMessage("");
    const response = await apiFetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variants: variantsOf(product) }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; variants?: ProductVariant[]; fields?: string[] } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage(payload?.error || "Could not save the colors.");
      return;
    }
    if (payload?.variants) setDrafts((state) => ({ ...state, [product.id]: payload.variants || [] }));
    rememberFields(payload?.fields);
    setMessage("Colors saved. Upload a photo for each color.");
    router.refresh();
  }

  async function uploadVariant(productId: string, variantId: string, files: FileList | null) {
    if (!files?.length) return;
    setBusyId(productId);
    setMessage("");
    const body = new FormData();
    body.set("variantId", variantId);
    for (const file of Array.from(files)) body.append("file", file);
    const response = await apiFetch(`/api/admin/products/${productId}/upload`, { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusyId(null);
    if (!response.ok) {
      setMessage(payload?.error || "Upload failed");
      return;
    }
    setDrafts((state) => {
      const next = { ...state };
      delete next[productId];
      return next;
    });
    setMessage("Color photos saved to Cloudinary.");
    router.refresh();
  }

  async function removeVariantImage(productId: string, variantId: string, publicId: string) {
    setBusyId(productId);
    await apiFetch(`/api/admin/products/${productId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, variantId }),
    });
    setDrafts((state) => {
      const next = { ...state };
      delete next[productId];
      return next;
    });
    setBusyId(null);
    router.refresh();
  }

  async function removeImage(productId: string, publicId: string) {
    setBusyId(productId);
    await apiFetch(`/api/admin/products/${productId}/images`, {
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
          <span>Keep every color on one product. Each color has its own photos, price, and stock.</span>
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
            <article
              key={product.id}
              className={[
                "admin-product-block",
                product.hidden ? "is-hidden" : "",
                dropTarget === product.id ? "is-drop" : "",
              ].filter(Boolean).join(" ")}
              onDragEnter={(event) => {
                if (![...event.dataTransfer.types].includes("Files")) return;
                event.preventDefault();
                setDropTarget(product.id);
              }}
              onDragOver={(event) => {
                if (![...event.dataTransfer.types].includes("Files")) return;
                event.preventDefault();
                setDropTarget(product.id);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setDropTarget((current) => (current === product.id ? null : current));
              }}
              onDrop={(event) => {
                if (!event.dataTransfer.files?.length) return;
                event.preventDefault();
                setDropTarget(null);
                if ((event.target as HTMLElement).closest(".admin-dropzone")) return;
                upload(product.id, event.dataTransfer.files);
              }}
            >
              <button type="button" className="admin-product" onClick={() => setOpenId(open ? null : product.id)}>
                {product.thumb ? <img src={product.thumb} alt="" /> : <span className="admin-job-placeholder" />}
                <span>
                  <b>{product.name}</b>
                  <small>{product.category} · {product.slug}{product.hidden ? " · hidden" : ""}</small>
                </span>
                <small>{(product.variants || []).length ? `${product.variants?.length} colors` : `${product.photos.length} photos`}</small>
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
                  <PhotoDrop
                    busy={busyId === product.id}
                    title="Drop an image here"
                    hint="Or click to choose JPG, PNG, or WebP. Several photos can belong to this product."
                    onFiles={(files) => upload(product.id, files)}
                  />
                  <div>
                    <p className="text-sm font-semibold">Specifications</p>
                    <span className="spec-hint">Screen size, display, battery. Type a new section or pick one already used. The name stays slightly bolder on the product page.</span>
                    <SpecSections specs={specsOf(product)} onChange={(next) => setSpecDrafts((state) => ({ ...state, [product.id]: next }))} />
                  </div>
                  <div className="variant-list">
                    <p className="text-sm font-bold">Colors and storage</p>
                    {variantsOf(product).map((item, index) => (
                        <div className="variant-card" key={item.id}>
                        <p>Variant {index + 1}</p>
                        <div className="variant-grid">
                          <label>
                            Color
                            <input
                              className="color-dot"
                              type="color"
                              aria-label={`Color for variant ${index + 1}`}
                              value={item.hex || "#d1d5db"}
                              onChange={(event) => editVariant(product.id, item.id, { hex: event.target.value }, variantsOf(product))}
                            />
                          </label>
                          <label>
                            Color name
                            <input value={item.color} placeholder="Deep Blue" onChange={(event) => editVariant(product.id, item.id, { color: event.target.value }, variantsOf(product))} />
                          </label>
                          <label>
                            Storage
                            <input value={item.storage} placeholder="256 GB" onChange={(event) => editVariant(product.id, item.id, { storage: event.target.value }, variantsOf(product))} />
                          </label>
                          <label>
                            SKU
                            <input value={item.sku} placeholder="IP17P-BLU-256" onChange={(event) => editVariant(product.id, item.id, { sku: event.target.value }, variantsOf(product))} />
                          </label>
                          <label>
                            Price (KSh)
                            <input type="number" min="0" value={item.price || ""} onChange={(event) => editVariant(product.id, item.id, { price: Number(event.target.value) || 0 }, variantsOf(product))} />
                          </label>
                          <label>
                            Stock
                            <input type="number" min="0" value={item.stock || ""} onChange={(event) => editVariant(product.id, item.id, { stock: Number(event.target.value) || 0 }, variantsOf(product))} />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Sections for this color</p>
                          <SpecSections
                            specs={item.specs || []}
                            onChange={(next) => editVariant(product.id, item.id, { specs: next }, variantsOf(product))}
                          />
                        </div>
                        <div className="admin-thumbs">
                          {item.images.map((photo) => (
                            <div className="admin-thumb" key={photo.url}>
                              <img src={photo.url} alt="" />
                              {photo.publicId ? (
                                <button type="button" aria-label="Remove color photo" onClick={() => removeVariantImage(product.id, item.id, photo.publicId || "")}>×</button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <PhotoDrop
                          busy={busyId === product.id}
                          title={`Drop images for ${item.color || "this color"}`}
                          hint="Main photo first, then front, back, and detail views. Save the color before uploading."
                          onFiles={(files) => uploadVariant(product.id, item.id, files)}
                        />
                        <button
                          type="button"
                          className="button button-quiet"
                          onClick={() => setDrafts((state) => ({ ...state, [product.id]: variantsOf(product).filter((entry) => entry.id !== item.id) }))}
                        >
                          Remove variant
                        </button>
                      </div>
                    ))}
                    <div className="admin-job-actions">
                      <button
                        type="button"
                        className="button button-quiet"
                        onClick={() => setDrafts((state) => ({
                          ...state,
                          [product.id]: [
                            ...variantsOf(product),
                            { id: crypto.randomUUID(), color: "", hex: "#00275a", storage: "", sku: "", price: product.price, stock: 0, images: [], specs: [] },
                          ],
                        }))}
                      >
                        Add another variant
                      </button>
                      <button type="button" className="button" disabled={busyId === product.id} onClick={() => saveVariants(product)}>Save colors</button>
                    </div>
                  </div>
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
      <datalist id="known-spec-fields">
        {knownSpecs.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </section>
  );
}
