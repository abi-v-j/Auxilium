import { closePool, query } from "./db.js";

const tables = [
  "users",
  "categories",
  "transactions",
  "debts",
  "debt_payments",
  "budgets",
];

try {
  for (const table of tables) {
    await query(`alter table public.${table} enable row level security`);
    await query(`revoke all on public.${table} from anon, authenticated`);
  }

  console.log("RLS enabled and public API grants revoked.");
} finally {
  await closePool();
}
