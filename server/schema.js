const statements = [
  `CREATE TABLE IF NOT EXISTS shop (
    id INT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    legal_name VARCHAR(160) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    hero_title VARCHAR(160) NOT NULL,
    hero_body TEXT NOT NULL,
    hero_cta VARCHAR(80) NOT NULL,
    logo VARCHAR(500) NOT NULL,
    cover VARCHAR(500) NOT NULL,
    email VARCHAR(160) NOT NULL DEFAULT '',
    whatsapp VARCHAR(40) NOT NULL DEFAULT '',
    address VARCHAR(255) NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    footer_blurb TEXT NOT NULL,
    credit_label VARCHAR(160) NOT NULL DEFAULT '',
    credit_href VARCHAR(255) NOT NULL DEFAULT '',
    facebook VARCHAR(255) NOT NULL DEFAULT '',
    instagram VARCHAR(255) NOT NULL DEFAULT '',
    website VARCHAR(255) NOT NULL DEFAULT '',
    seo_title VARCHAR(255) NOT NULL,
    seo_description TEXT NOT NULL,
    seo_keywords TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS phones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_name VARCHAR(16) NOT NULL,
    day_key CHAR(3) NOT NULL,
    open_time CHAR(5) NOT NULL,
    close_time CHAR(5) NOT NULL,
    sort_order INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS popular_hours (
    day_key CHAR(3) NOT NULL,
    hour TINYINT NOT NULL,
    visits TINYINT NOT NULL,
    PRIMARY KEY (day_key, hour)
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INT NULL,
    image VARCHAR(500) NOT NULL DEFAULT '',
    thumb VARCHAR(500) NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rating TINYINT NOT NULL,
    body TEXT NOT NULL,
    reviewer VARCHAR(120) NOT NULL,
    reviewed_on DATE NOT NULL,
    verified TINYINT NOT NULL DEFAULT 0,
    reply TEXT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    paused TINYINT NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    slug VARCHAR(160) PRIMARY KEY,
    kicker VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    cover_alt VARCHAR(255) NOT NULL,
    blocks JSON NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(160) NOT NULL,
    notes TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    name VARCHAR(160) NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
  )`,
];

async function ensureSchema(pool) {
  for (const statement of statements) {
    await pool.query(statement);
  }
  const alterations = [
    "ALTER TABLE orders ADD COLUMN quotation_id VARCHAR(64) NULL",
    "ALTER TABLE orders ADD COLUMN quotation_number VARCHAR(40) NULL",
    "ALTER TABLE order_items MODIFY product_id VARCHAR(64) NOT NULL",
  ];
  for (const statement of alterations) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }
}

module.exports = { ensureSchema };
