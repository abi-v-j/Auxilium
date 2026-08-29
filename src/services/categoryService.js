import { query } from "../database/db.js";

const defaultExpenseCategories = [
  ["Food", "expense", "🍔"],
  ["Transport", "expense", "🚗"],
  ["Shopping", "expense", "🛍"],
  ["Entertainment", "expense", "🎬"],
  ["Health", "expense", "💊"],
  ["Other", "expense", "📦"],
];

const defaultIncomeCategories = [
  ["Salary", "income", "💼"],
  ["Freelance", "income", "🧑‍💻"],
  ["Business", "income", "🏢"],
  ["Investment", "income", "📈"],
  ["Other", "income", "💰"],
];

export async function ensureDefaultCategories(userId) {
  const categories = [...defaultExpenseCategories, ...defaultIncomeCategories];

  for (const [name, type, icon] of categories) {
    await query(
      `
        insert into categories (user_id, name, type, icon, is_default)
        values ($1, $2, $3, $4, true)
        on conflict (user_id, name, type) do nothing
      `,
      [userId, name, type, icon],
    );
  }
}

export async function listCategories(userId, type) {
  const result = await query(
    `
      select id, name, type, icon
      from categories
      where user_id = $1 and type = $2
      order by is_default desc, name asc
    `,
    [userId, type],
  );

  return result.rows;
}
