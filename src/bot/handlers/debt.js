import { InlineKeyboard } from "grammy";
import {
  createDebt,
  listActiveDebts,
  recordDebtPayment,
} from "../../services/debtService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { clearState, getState, setState } from "../session/state.js";
import { parseAmount } from "./expense.js";

function debtMenuKeyboard() {
  return new InlineKeyboard()
    .text("I Owe", "debts:add:i_owe")
    .text("Owes Me", "debts:add:owes_me")
    .row()
    .text("View Active", "debts:list")
    .row()
    .text("Back", "menu:main");
}

export function registerDebtHandlers(bot) {
  bot.callbackQuery("debts:menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Debts:", {
      reply_markup: debtMenuKeyboard(),
    });
  });

  bot.callbackQuery(/^debts:add:(i_owe|owes_me)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);

    setState(ctx.from.id, {
      flow: "debt",
      step: "person",
      userId: user.id,
      currency: user.currency,
      debtType: ctx.match[1],
    });

    await ctx.answerCallbackQuery();
    await ctx.reply("Enter the person's name:", {
      reply_markup: new InlineKeyboard().text("Cancel", "flow:cancel"),
    });
  });

  bot.callbackQuery("debts:list", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const debts = await listActiveDebts(user.id);

    const text = debts.length
      ? debts
          .map((debt) => {
            const label = debt.type === "i_owe" ? "You owe" : "Owes you";
            return `${label} ${debt.person_name}: ${formatCurrency(debt.remaining_amount, user.currency)}`;
          })
          .join("\n")
      : "No active debts.";

    const keyboard = new InlineKeyboard();
    debts.forEach((debt) => {
      keyboard.text(`Pay #${debt.id}`, `debts:pay:${debt.id}`).row();
    });
    keyboard.text("Back", "debts:menu");

    await ctx.answerCallbackQuery();
    await ctx.reply(text, {
      reply_markup: debts.length ? keyboard : debtMenuKeyboard(),
    });
  });

  bot.callbackQuery(/^debts:pay:(\d+)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);

    setState(ctx.from.id, {
      flow: "debt_payment",
      step: "amount",
      userId: user.id,
      currency: user.currency,
      debtId: Number(ctx.match[1]),
    });

    await ctx.answerCallbackQuery();
    await ctx.reply("Enter repayment amount:", {
      reply_markup: new InlineKeyboard().text("Cancel", "flow:cancel"),
    });
  });
}

export async function handleDebtText(ctx, state) {
  if (state.step === "person") {
    setState(ctx.from.id, {
      ...state,
      step: "amount",
      personName: ctx.message.text.trim(),
    });

    await ctx.reply("Enter the debt amount:", {
      reply_markup: new InlineKeyboard().text("Cancel", "flow:cancel"),
    });
    return true;
  }

  if (state.step === "amount") {
    const amount = parseAmount(ctx.message.text);

    if (!amount) {
      await ctx.reply("Please enter a valid amount greater than 0.");
      return true;
    }

    const debt = await createDebt({
      userId: state.userId,
      personName: state.personName,
      type: state.debtType,
      amount,
    });

    clearState(ctx.from.id);
    await ctx.reply(
      `Debt saved: ${debt.person_name} - ${formatCurrency(debt.remaining_amount, state.currency)}`,
      {
        reply_markup: mainMenuKeyboard(),
      },
    );
    return true;
  }

  return false;
}

export async function handleDebtPaymentText(ctx, state) {
  if (state.step === "amount") {
    const amount = parseAmount(ctx.message.text);

    if (!amount) {
      await ctx.reply("Please enter a valid amount greater than 0.");
      return true;
    }

    const debt = await recordDebtPayment({
      userId: state.userId,
      debtId: state.debtId,
      amount,
    });

    clearState(ctx.from.id);

    if (!debt) {
      await ctx.reply("Debt not found or already closed.", {
        reply_markup: mainMenuKeyboard(),
      });
      return true;
    }

    await ctx.reply(
      `Payment recorded. Remaining: ${formatCurrency(debt.remaining_amount, state.currency)}`,
      {
        reply_markup: mainMenuKeyboard(),
      },
    );
    return true;
  }

  return false;
}
