import { query } from "../database/db.js";

export async function updateUserCurrency(userId, currency) {
  const result = await query(
    `
      update users
      set currency = $2, updated_at = now()
      where id = $1
      returning *
    `,
    [userId, currency],
  );

  return result.rows[0];
}

export async function updateUserTimezone(userId, timezone) {
  const result = await query(
    `
      update users
      set timezone = $2, updated_at = now()
      where id = $1
      returning *
    `,
    [userId, timezone],
  );

  return result.rows[0];
}
