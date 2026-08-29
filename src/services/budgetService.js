import { query } from "../database/db.js";

export async function listCurrentBudgets(userId) {
  const result = await query(
    `
      select
        b.id,
        b.monthly_limit,
        b.month,
        b.year,
        c.name as category_name,
        c.icon as category_icon,
        coalesce(spent.total, 0) as spent
      from budgets b
      left join categories c on c.id = b.category_id
      left join lateral (
        select sum(t.amount) as total
        from transactions t
        where t.user_id = b.user_id
          and t.category_id = b.category_id
          and t.type = 'expense'
          and extract(month from t.transaction_date) = b.month
          and extract(year from t.transaction_date) = b.year
      ) spent on true
      where b.user_id = $1
        and b.month = extract(month from current_date)
        and b.year = extract(year from current_date)
      order by c.name asc
    `,
    [userId],
  );

  return result.rows;
}

export async function upsertCurrentBudget({ userId, categoryId, monthlyLimit }) {
  const result = await query(
    `
      insert into budgets (user_id, category_id, monthly_limit, month, year)
      values ($1, $2, $3, extract(month from current_date), extract(year from current_date))
      on conflict (user_id, category_id, month, year)
      do update set monthly_limit = excluded.monthly_limit
      returning *
    `,
    [userId, categoryId, monthlyLimit],
  );

  return result.rows[0];
}
