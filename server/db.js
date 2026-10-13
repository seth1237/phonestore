const mysql = require("mysql2/promise");

function setting(name, fallback) {
  const value = process.env[name];
  if (value) return value;
  if (fallback) return fallback;
  throw new Error(`Missing ${name}. Copy .env.example to .env and set the database credentials.`);
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  database: setting("MYSQL_DATABASE", "elevat10_rai"),
  user: setting("MYSQL_USER", "elevat10_rai"),
  password: setting("MYSQL_PASSWORD", "Ned3agbzGfqM2JpPyQz7"),
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 5000,
  dateStrings: true,
});

module.exports = { pool };
