export type ProductPhoto = { url: string; thumb: string };

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  photos: ProductPhoto[];
  thumb: string;
  image: string;
  categoryId: number | null;
  category: string;
};

export type Category = {
  id: number;
  name: string;
  count: number;
  image: string;
};

export type Review = {
  id: number;
  rating: number;
  text: string;
  name: string;
  date: string;
  verified: boolean;
  reply: string | null;
};

export type ReviewStats = {
  average_rating: number;
  rating_total: number;
  review_total: number;
  five_star_reviews: number;
  four_star_reviews: number;
  three_star_reviews: number;
  two_star_reviews: number;
  one_star_reviews: number;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  validFrom: string;
  validUntil: string;
  paused?: boolean;
};

export type BlogBlock =
  | { type: "paragraph"; text: string; strong?: string[] }
  | { type: "image"; src: string; alt: string };

export type BlogPost = {
  slug: string;
  kicker: string;
  title: string;
  coverAlt: string;
  blocks: BlogBlock[];
};

export type HourSlot = { day: string; open: string; close: string };

export type Site = {
  name: string;
  legalName: string;
  tagline: string;
  heroTitle: string;
  heroBody: string;
  heroCta: string;
  logo: string;
  cover: string;
  phones: string[];
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  coordinates: { lat: number; lng: number };
  currency: string;
  footerBlurb: string;
  credit: { label: string; href: string };
  social: { facebook: string; instagram: string; website: string };
  seo: { title: string; description: string; keywords: string[] };
  hours: HourSlot[];
  popularHours: Record<string, number[]>;
};
