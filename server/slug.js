function slugify(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

function assignSlugs(items, nameOf) {
  const used = new Map();
  return items.map((item) => {
    const base = slugify(nameOf(item));
    const seen = used.get(base) || 0;
    used.set(base, seen + 1);
    return { ...item, slug: seen === 0 ? base : `${base}-${seen + 1}` };
  });
}

module.exports = { slugify, assignSlugs };
