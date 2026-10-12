require("./env");
const { MongoClient } = require("mongodb");

const globalState = globalThis;

function uri() {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error("MONGODB_URI is missing. It is read from server/atlas-credentials.env.");
  return value;
}

function databaseName() {
  return process.env.MONGODB_DB_NAME || "phonestore";
}

async function client() {
  if (!globalState.__raiMongo) {
    const connection = new MongoClient(uri());
    await connection.connect();
    globalState.__raiMongo = connection;
  }
  return globalState.__raiMongo;
}

async function db() {
  const connection = await client();
  return connection.db(databaseName());
}

async function collection(name) {
  return (await db()).collection(name);
}

module.exports = { db, collection };
