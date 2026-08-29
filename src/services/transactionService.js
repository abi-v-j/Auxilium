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

export async function listRecentTransactions(userId, limit = 10) {
  const result = await query(
    `
      select
        t.id,
        t.type,
        t.amount,
        t.description,
        t.transaction_date,
        c.name as category_name,
        c.icon as category_icon
      from transactions t
      left join categories c on c.id = t.category_id
      where t.user_id = $1
      order by t.transaction_date desc, t.created_at desc
      limit $2
    `,
    [userId, limit],
  );

  return result.rows;
}

export async function deleteTransaction(userId, transactionId) {
  const result = await query(
    `
      delete from transactions
      where user_id = $1 and id = $2
      returning *
    `,
    [userId, transactionId],
  );

  return result.rows[0] || null;
}
