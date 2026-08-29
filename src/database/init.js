import { closePool, query } from "./db.js";
import { schemaSql } from "./schema.js";

try {
  await query(schemaSql);
  console.log("Database schema is ready.");
} finally {
  await closePool();
}
