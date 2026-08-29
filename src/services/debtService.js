import { pool, query } from "../database/db.js";

export async function createDebt({ userId, personName, type, amount }) {
  const result = await query(
    `
      insert into debts (user_id, person_name, type, original_amount, remaining_amount)
      values ($1, $2, $3, $4, $4)
      returning *
    `,
    [userId, personName, type, amount],
  );

  return result.rows[0];
}

export async function listActiveDebts(userId) {
  const result = await query(
    `
      select *
      from debts
      where user_id = $1 and status = 'active'
      order by created_at desc
      limit 10
    `,
    [userId],
  );

  return result.rows;
}

export async function recordDebtPayment({ userId, debtId, amount, note = null }) {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const debtResult = await client.query(
      `
        select *
        from debts
        where id = $1 and user_id = $2 and status = 'active'
        for update
      `,
      [debtId, userId],
    );

    const debt = debtResult.rows[0];

    if (!debt) {
      await client.query("rollback");
      return null;
    }

    const paymentAmount = Math.min(Number(amount), Number(debt.remaining_amount));
    const remainingAmount = Number(debt.remaining_amount) - paymentAmount;
    const status = remainingAmount <= 0 ? "paid" : "active";

    await client.query(
      `
        insert into debt_payments (debt_id, amount, note)
        values ($1, $2, $3)
      `,
      [debtId, paymentAmount, note],
    );

    const updated = await client.query(
      `
        update debts
        set remaining_amount = $3, status = $4, updated_at = now()
        where id = $1 and user_id = $2
        returning *
      `,
      [debtId, userId, remainingAmount, status],
    );

    await client.query("commit");
    return updated.rows[0];
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
