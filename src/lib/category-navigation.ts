import type { Category } from "@/lib/types";

const DEPARTMENT_BRANDS: Record<string, Set<string>> = {
  phones: new Set([
    "apple", "asus zenfone", "blackview", "google pixel", "honor", "huawei", "infinix", "itel",
    "motorola", "nokia", "nothing", "oneplus", "oppo", "pixel", "realme", "redmi", "samsung",
    "sony xperia", "tecno", "vivo", "xiaomi", "zte",
  ]),
  laptops: new Set([
    "acer", "apple macbook", "asus", "chuwi", "dell", "hp", "huawei matebook", "lenovo", "macbook",
    "microsoft surface", "msi", "samsung galaxy book", "toshiba",
  ]),
  cameras: new Set(["canon", "dji", "fujifilm", "gopro", "nikon"]),
  accessories: new Set([
    "cables", "cases", "chargers", "earbuds", "earphones", "headphones", "phone cases",
    "phone chargers", "phone accessories", "power banks", "screen protectors",
  ]),
};

const DEPARTMENT_LABELS: Record<string, string> = {
  phones: "Phones",
  laptops: "Laptops",
  cameras: "Cameras",
  accessories: "Accessories",
};

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function categoryDepartment(name: string): string | null {
  const separator = name.indexOf(" - ");
  if (separator > 0) {
    const parent = normalizeCategoryName(name.slice(0, separator));
    return DEPARTMENT_LABELS[parent] || name.slice(0, separator).trim();
  }

  const normalized = normalizeCategoryName(name);
  if (DEPARTMENT_LABELS[normalized]) return null;
  for (const [department, brands] of Object.entries(DEPARTMENT_BRANDS)) {
    if (brands.has(normalized)) return DEPARTMENT_LABELS[department];
  }
  return null;
}

export type CategoryNavigationGroup = {
  label: string;
  href: string;
  categories: Array<Category & { linkLabel: string }>;
};

export function groupCategories(categories: Category[]): CategoryNavigationGroup[] {
  const groups = new Map<string, CategoryNavigationGroup>();

  for (const category of categories) {
    const separator = category.name.indexOf(" - ");
    const department = categoryDepartment(category.name);
    const label = department || category.name;
    const linkLabel = separator > 0 ? category.name.slice(separator + 3).trim() : category.name;
    const group = groups.get(label) || {
      label,
      href: department
        ? `/products?department=${encodeURIComponent(normalizeCategoryName(label).replaceAll(" ", "-"))}`
        : `/category/${category.slug}`,
      categories: [],
    };
    if (department && normalizeCategoryName(category.name) === normalizeCategoryName(label)) {
      group.href = `/category/${category.slug}`;
    }
    group.categories.push({ ...category, linkLabel });
    groups.set(label, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      categories: group.categories.sort((a, b) =>
        a.linkLabel.localeCompare(b.linkLabel, undefined, { sensitivity: "base" }),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}
