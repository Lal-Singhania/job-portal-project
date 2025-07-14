import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const db = new pg.Client({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,   // e.g. localhost
  database: process.env.DB_NAME,   // <-- fixed here
  password: process.env.DB_PASS,
  port:     5432,
});

db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Connection failed:", err));

export default db;
