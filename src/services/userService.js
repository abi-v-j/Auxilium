import { env } from "../config/env.js";
import { query } from "../database/db.js";
import { ensureDefaultCategories } from "./categoryService.js";

export async function findUserByTelegramId(telegramId) {
  const result = await query(
    "select * from users where telegram_id = $1 limit 1",
    [telegramId],
  );

  return result.rows[0] || null;
}

export async function registerTelegramUser(from) {
  const result = await query(
    `
      insert into users (telegram_id, username, first_name, currency, timezone)
      values ($1, $2, $3, $4, $5)
      on conflict (telegram_id)
      do update set
        username = excluded.username,
        first_name = excluded.first_name,
        updated_at = now()
      returning *
    `,
    [
      from.id,
      from.username || null,
      from.first_name || null,
      env.defaultCurrency,
      env.defaultTimezone,
    ],
  );

  const user = result.rows[0];
  await ensureDefaultCategories(user.id);

  return user;
}

export async function getOrRegisterUser(from) {
  const user = await findUserByTelegramId(from.id);

  if (user) {
    await ensureDefaultCategories(user.id);
    return { user, isNew: false };
  }

  return {
    user: await registerTelegramUser(from),
    isNew: true,
  };
}
