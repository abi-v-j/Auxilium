import { query } from "../database/db.js";

export async function getMonthlyDashboard(userId) {
  const totals = await query(
    `
      select
        coalesce(sum(amount) filter (where type = 'income'), 0) as income,
        coalesce(sum(amount) filter (where type = 'expense'), 0) as expenses
      from transactions
      where user_id = $1
        and transaction_date >= date_trunc('month', current_date)
        and transaction_date < date_trunc('month', current_date) + interval '1 month'
    `,
    [userId],
  );

  const topExpenses = await query(
    `
      select
        coalesce(c.name, 'Uncategorized') as category_name,
        coalesce(c.icon, '') as category_icon,
        sum(t.amount) as total
      from transactions t
      left join categories c on c.id = t.category_id
      where t.user_id = $1
        and t.type = 'expense'
        and t.transaction_date >= date_trunc('month', current_date)
        and t.transaction_date < date_trunc('month', current_date) + interval '1 month'
      group by c.name, c.icon
      order by total desc
      limit 5
    `,
    [userId],
  );

  return {
    income: Number(totals.rows[0].income),
    expenses: Number(totals.rows[0].expenses),
    topExpenses: topExpenses.rows,
  };
}
