require("./env");
const { pool } = require("./db");
const { ensureSchema } = require("./schema");

const weekday = [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 3, 2, 3, 4, 3, 2, 1, 0, 0, 0, 0, 0];
const quiet = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0];
const closed = Array(24).fill(0);

const catalog = {
  shop: {
    name: "Rai Merchants Limited",
    legalName: "Rai Merchants Limited",
    tagline: "PHONES, LAPTOPS AND ACCESSORIES",
    heroTitle: "Phones, Laptops and all Accessories",
    heroBody:
      "Explore our range of phones, laptops and accessories at Rai Merchants Limited. Visit us at Njoguini Building, at the intersection of Ronald Ngala Street and Mfangano Street, or call 0702119333 or 0717159863 to ask about product availability and details.",
    heroCta: "Shop now",
    logo: "/logo.png",
    cover: "/media/cover.jpg",
    email: "",
    whatsapp: "",
    address: "Njoguini Building, intersection of Ronald Ngala Street and Mfangano Street, Nairobi",
    lat: -1.2854,
    lng: 36.8286,
    currency: "KSH",
    footerBlurb:
      "Phones, accessories, and gadgets from Njoguini Building, where Ronald Ngala Street meets Mfangano Street.",
    creditLabel: "Made with ❤️ by tappi",
    creditHref: "https://tappi.app",
    facebook: "",
    instagram: "",
    website: "https://raimerchants.co.ke",
    seoTitle: "Phones, Accessories & Gadgets in Nairobi | Rai Merchants",
    seoDescription:
      "Buy phones, accessories and gadgets at Rai Merchants, Njoguini Building, Ronald Ngala and Mfangano Street, Nairobi. Call 0702119333 or 0717159863.",
    keywords: "phones Nairobi,phone shop Nairobi,Samsung Kenya,iPhone Kenya,Tecno Kenya,Infinix Kenya,Xiaomi Kenya,phone accessories Nairobi,chargers,earbuds,gadgets Nairobi,Rai Merchants",
  },
  phones: ["0702119333", "0717159863"],
  hours: [
    ["Monday", "MON", "09:00", "18:00"],
    ["Tuesday", "TUE", "09:00", "18:00"],
    ["Wednesday", "WED", "09:00", "18:00"],
    ["Thursday", "THU", "09:00", "18:00"],
    ["Friday", "FRI", "09:00", "18:00"],
    ["Saturday", "SAT", "00:00", "00:00"],
    ["Sunday", "SUN", "00:00", "00:00"],
  ],
  popular: { MON: weekday, TUE: weekday, WED: quiet, THU: weekday, FRI: weekday, SAT: closed, SUN: closed },
  categories: [
    [1, "Phones", 1],
    [2, "Accessories", 2],
    [3, "Gadgets", 3],
  ],
  products: [
    [1, "Samsung Galaxy A15", "6.5-inch display, 128GB storage, and a battery sized for a full day away from a charger.", 18999, 1, "/media/phone-a.jpg"],
    [2, "Tecno Spark 20", "A bright AMOLED screen and a 50MP camera for everyday photos.", 16499, 1, "/media/phone-b.jpg"],
    [3, "Infinix Hot 40", "Fast charging and a large display for calls, maps, and video.", 17999, 1, "/media/phone-a.jpg"],
    [4, "Xiaomi Redmi 13C", "A straightforward dual-SIM phone with room for photos and apps.", 15499, 1, "/media/phone-b.jpg"],
    [5, "Nokia G22", "A repairable Android phone with a clean interface and a long-life battery.", 14999, 1, "/media/phone-a.jpg"],
    [6, "Itel A70", "An affordable dual-SIM phone for calls, M-Pesa, and WhatsApp.", 12999, 1, "/media/phone-b.jpg"],
    [7, "25W USB-C charger", "Wall charger for current Android phones. Cable sold separately.", 1499, 2, "/media/charger.jpg"],
    [8, "Braided USB-C cable", "One-metre cable for charging and file transfer.", 499, 2, "/media/cable.jpg"],
    [9, "Wireless earbuds", "In-ear Bluetooth earbuds with a charging case.", 2499, 2, "/media/earbuds.jpg"],
    [10, "Clear phone case", "Slim cover that shows the phone colour. Ask in store for your model.", 699, 2, "/media/case.jpg"],
    [11, "Tempered glass", "Screen guard fitted in the shop while you wait.", 399, 2, "/media/glass.jpg"],
    [12, "10000mAh power bank", "Two outputs for a phone and earbuds on the same charge.", 2299, 2, "/media/powerbank.jpg"],
    [13, "Bluetooth speaker", "Portable speaker with a full charge for an afternoon outdoors.", 3499, 3, "/media/speaker.jpg"],
    [14, "Smartwatch", "Step count, notifications, and a strap you can swap.", 4599, 3, "/media/watch.jpg"],
    [15, "Wireless mouse", "Quiet click and a USB receiver for a laptop.", 1299, 3, "/media/mouse.jpg"],
    [16, "LED ring light", "Desk light for product photos and video calls.", 2899, 3, "/media/ringlight.jpg"],
    [17, "Mini tripod", "Tabletop stand for a phone or the ring light.", 1599, 3, "/media/tripod.jpg"],
    [18, "Neckband earphones", "Bluetooth neckband with a cable that stays put on a commute.", 1899, 3, "/media/neckband.jpg"],
  ],
  reviews: [
    [5, "Picked up a Spark 20 and they fitted the glass before I left. Clear price, no surprise add-ons.", "Amina W.", "2026-03-12", 1, null],
    [5, "The power bank has carried my phone through two long days in town. Staff pointed me to the right cable.", "Brian K.", "2026-04-02", 1, null],
    [4, "Good range of cases. They did not have my exact colour, and they called when it came in.", "Faith M.", "2026-05-18", 1, "We keep popular colours on the shelf and order the rest within a day."],
    [5, "Bought earbuds and a charger together. Both work with the phone I already had.", "Kevin O.", "2026-06-09", 1, null],
    [4, "The shop on Ronald Ngala is easy to find from the Mfangano junction. Service was quick at lunchtime.", "Lydia N.", "2026-07-21", 0, null],
    [5, "Asked for a phone that would last a school day. They walked through the battery sizes instead of pushing the dearest one.", "Peter S.", "2026-08-14", 1, null],
  ],
  offers: [
    [
      "screen-guard-with-phone",
      "Free tempered glass with any phone",
      "Buy a phone in the shop and we fit a screen guard before you leave.",
      "2026-01-01 00:00:00",
      "2026-12-31 23:59:59",
      0,
    ],
  ],
  post: {
    slug: "phones-accessories-and-gadgets",
    kicker: "From the shop",
    title: "Phones, accessories, and gadgets at Njoguini Building",
    coverAlt: "Phones on display",
    blocks: [
      {
        type: "paragraph",
        text: "The shop is at Njoguini Building, where Ronald Ngala Street meets Mfangano Street. We stock phones, the chargers and cases that go with them, and small gadgets you can carry out the same day.",
      },
      {
        type: "paragraph",
        text: "Current phones on the shelf include the Samsung Galaxy A15 and the Tecno Spark 20. Tell us how you use the phone — calls, photos, or a battery that lasts through the afternoon — and we will match a model to that, not to the highest price.",
        strong: ["Samsung Galaxy A15", "Tecno Spark 20"],
      },
      { type: "image", src: "/media/phone-a.jpg", alt: "Samsung Galaxy A15" },
      {
        type: "paragraph",
        text: "Accessories sit next to the phones: a 25W USB-C charger, braided cables, earbuds, and tempered glass we fit while you wait. A phone bought here leaves with a screen guard under the current offer.",
        strong: ["25W USB-C charger"],
      },
      { type: "image", src: "/media/earbuds.jpg", alt: "Wireless earbuds" },
      {
        type: "paragraph",
        text: "Gadgets on the same floor include a Bluetooth speaker, a smartwatch, and a ring light if you shoot product photos. We are open Monday to Friday, 9am to 6pm. Call 0702119333 or 0717159863 before you cross town if you want a specific model held.",
      },
    ],
  },
};

async function seed(db) {
  await ensureSchema(db);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM order_items");
    await connection.query("DELETE FROM orders");
    await connection.query("DELETE FROM messages");
    await connection.query("DELETE FROM posts");
    await connection.query("DELETE FROM offers");
    await connection.query("DELETE FROM reviews");
    await connection.query("DELETE FROM products");
    await connection.query("DELETE FROM categories");
    await connection.query("DELETE FROM popular_hours");
    await connection.query("DELETE FROM hours");
    await connection.query("DELETE FROM phones");
    await connection.query("DELETE FROM shop");

    const shop = catalog.shop;
    await connection.query(
      `INSERT INTO shop (
        id, name, legal_name, tagline, hero_title, hero_body, hero_cta, logo, cover,
        email, whatsapp, address, lat, lng, currency, footer_blurb, credit_label, credit_href,
        facebook, instagram, website, seo_title, seo_description, seo_keywords
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shop.name, shop.legalName, shop.tagline, shop.heroTitle, shop.heroBody, shop.heroCta,
        shop.logo, shop.cover, shop.email, shop.whatsapp, shop.address, shop.lat, shop.lng,
        shop.currency, shop.footerBlurb, shop.creditLabel, shop.creditHref, shop.facebook,
        shop.instagram, shop.website, shop.seoTitle, shop.seoDescription, shop.keywords,
      ],
    );

    for (let index = 0; index < catalog.phones.length; index += 1) {
      await connection.query("INSERT INTO phones (number, sort_order) VALUES (?, ?)", [catalog.phones[index], index]);
    }
    for (let index = 0; index < catalog.hours.length; index += 1) {
      const [day, key, open, close] = catalog.hours[index];
      await connection.query(
        "INSERT INTO hours (day_name, day_key, open_time, close_time, sort_order) VALUES (?, ?, ?, ?, ?)",
        [day, key, open, close, index],
      );
      const visits = catalog.popular[key];
      for (let hour = 0; hour < visits.length; hour += 1) {
        await connection.query("INSERT INTO popular_hours (day_key, hour, visits) VALUES (?, ?, ?)", [key, hour, visits[hour]]);
      }
    }
    for (const [id, name, sort] of catalog.categories) {
      await connection.query("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)", [id, name, sort]);
    }
    for (const [id, name, description, price, categoryId, image] of catalog.products) {
      await connection.query(
        "INSERT INTO products (id, name, description, price, category_id, image, thumb) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, name, description, price, categoryId, image, image],
      );
    }
    for (const [rating, body, reviewer, reviewedOn, verified, reply] of catalog.reviews) {
      await connection.query(
        "INSERT INTO reviews (rating, body, reviewer, reviewed_on, verified, reply) VALUES (?, ?, ?, ?, ?, ?)",
        [rating, body, reviewer, reviewedOn, verified, reply],
      );
    }
    for (const [id, title, description, validFrom, validUntil, paused] of catalog.offers) {
      await connection.query(
        "INSERT INTO offers (id, title, description, valid_from, valid_until, paused) VALUES (?, ?, ?, ?, ?, ?)",
        [id, title, description, validFrom, validUntil, paused],
      );
    }
    await connection.query(
      "INSERT INTO posts (slug, kicker, title, cover_alt, blocks) VALUES (?, ?, ?, ?, ?)",
      [catalog.post.slug, catalog.post.kicker, catalog.post.title, catalog.post.coverAlt, JSON.stringify(catalog.post.blocks)],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  await seed(pool);
  console.log("Seeded elevat10_rai with shop, catalog, reviews, and offers.");
  await pool.end();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

function fallbackContent() {
  const shop = catalog.shop;
  const popularHours = {};
  for (const key of ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
    popularHours[key] = catalog.popular[key] || Array(24).fill(0);
  }
  return {
    site: {
      name: shop.name,
      legalName: shop.legalName,
      tagline: shop.tagline,
      heroTitle: shop.heroTitle,
      heroBody: shop.heroBody,
      heroCta: shop.heroCta,
      logo: shop.logo,
      cover: shop.cover,
      phones: catalog.phones,
      phone: catalog.phones.join(" / "),
      email: shop.email || "",
      whatsapp: shop.whatsapp || "",
      address: shop.address,
      coordinates: { lat: Number(shop.lat), lng: Number(shop.lng) },
      currency: shop.currency,
      footerBlurb: shop.footerBlurb,
      credit: { label: shop.creditLabel, href: shop.creditHref },
      social: { facebook: shop.facebook || "", instagram: shop.instagram || "", website: shop.website || "" },
      seo: {
        title: shop.seoTitle,
        description: shop.seoDescription,
        keywords: String(shop.keywords || "").split(",").map((item) => item.trim()).filter(Boolean),
      },
      hours: catalog.hours.map(([day, , open, close]) => ({ day, open, close })),
      popularHours,
    },
    offers: catalog.offers.map(([id, title, description, validFrom, validUntil, paused]) => ({
      id,
      title,
      description,
      validFrom: String(validFrom).replace(" ", "T"),
      validUntil: String(validUntil).replace(" ", "T"),
      paused: Boolean(paused),
    })),
    posts: [{
      slug: catalog.post.slug,
      kicker: catalog.post.kicker,
      title: catalog.post.title,
      coverAlt: catalog.post.coverAlt,
      blocks: catalog.post.blocks,
    }],
  };
}

module.exports = { seed, fallbackContent };
