import { closePool, query } from "./db.js";

try {
  const result = await query("select now() as now");
  console.log(`Database connected at ${result.rows[0].now.toISOString()}`);
} finally {
  await closePool();
}
