import { query } from "../database/db.js";

export async function createTransaction({
  userId,
  categoryId,
  type,
  amount,
  description,
}) {
  const result = await query(
    `
      insert into transactions (user_id, category_id, type, amount, description)
      values ($1, $2, $3, $4, $5)
      returning *
    `,
    [userId, categoryId, type, amount, description || null],
  );

  return result.rows[0];
}
