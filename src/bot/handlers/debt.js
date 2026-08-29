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
import { showSection } from "../utils/section.js";
import { parseAmount } from "./expense.js";

function debtMenuKeyboard() {
  return new InlineKeyboard()
    .text("➕ I OWE", "debts:add:i_owe")
    .row()
    .text("➕ OWES ME", "debts:add:owes_me")
    .row()
    .text("📋 VIEW ACTIVE", "debts:list")
    .row()
    .text("⬅ BACK", "menu:main");
}

function debtConfirmKeyboard() {
  return new InlineKeyboard()
    .text("CONFIRM", "debts:confirm")
    .text("CANCEL", "flow:cancel");
}

function debtSummary(state, description) {
  return [
    "SAVE THIS DEBT?",
    "",
    `Person: ${state.personName}`,
    `Amount: ${formatCurrency(state.amount, state.currency)}`,
    `Description: ${description || "None"}`,
  ].join("\n");
}

export function registerDebtHandlers(bot) {
  bot.callbackQuery("debts:menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSection(ctx, "DEBTS\n\nChoose an option:", debtMenuKeyboard());
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
    await showSection(
      ctx,
      "ADD DEBT\n\nEnter the person's name:",
      new InlineKeyboard().text("CANCEL", "flow:cancel"),
    );
  });

  bot.callbackQuery("debts:list", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const debts = await listActiveDebts(user.id);

    const text = debts.length
      ? debts
          .map((debt) => {
            const label = debt.type === "i_owe" ? "You owe" : "Owes you";
            const note = debt.description ? `\n   Note: ${debt.description}` : "";
            return `${label} ${debt.person_name}: ${formatCurrency(debt.remaining_amount, user.currency)}${note}`;
          })
          .join("\n\n")
      : "No active debts.";

    const keyboard = new InlineKeyboard();
    debts.forEach((debt) => {
      keyboard.text(`💸 PAY #${debt.id}`, `debts:pay:${debt.id}`).row();
    });
    keyboard.text("⬅ BACK", "debts:menu");

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      `ACTIVE DEBTS\n\n${text}`,
      debts.length ? keyboard : debtMenuKeyboard(),
    );
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
    await showSection(
      ctx,
      "RECORD PAYMENT\n\nEnter repayment amount:",
      new InlineKeyboard().text("CANCEL", "flow:cancel"),
    );
  });

  bot.callbackQuery("debts:description:skip", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "debt" || state.step !== "description") {
      await ctx.answerCallbackQuery("Nothing to skip.");
      return;
    }

    setState(ctx.from.id, {
      ...state,
      step: "confirm",
      description: null,
    });

    await ctx.answerCallbackQuery();
    await showSection(ctx, debtSummary(state, null), debtConfirmKeyboard());
  });

  bot.callbackQuery("debts:confirm", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "debt" || state.step !== "confirm") {
      await ctx.answerCallbackQuery("Nothing to confirm.");
      return;
    }

    const debt = await createDebt({
      userId: state.userId,
      personName: state.personName,
      type: state.debtType,
      amount: state.amount,
      description: state.description,
    });

    clearState(ctx.from.id);
    await ctx.answerCallbackQuery("Debt saved.");
    await showSection(
      ctx,
      `DEBT SAVED\n\n${debt.person_name}: ${formatCurrency(debt.remaining_amount, state.currency)}`,
      mainMenuKeyboard(),
    );
  });
}

export async function handleDebtText(ctx, state) {
  if (state.step === "person") {
    setState(ctx.from.id, {
      ...state,
      step: "amount",
      personName: ctx.message.text.trim(),
    });

    await ctx.reply("ADD DEBT\n\nEnter the debt amount:", {
      reply_markup: new InlineKeyboard().text("CANCEL", "flow:cancel"),
    });
    return true;
  }

  if (state.step === "amount") {
    const amount = parseAmount(ctx.message.text);

    if (!amount) {
      await ctx.reply("Please enter a valid amount greater than 0.");
      return true;
    }

    setState(ctx.from.id, {
      ...state,
      step: "description",
      amount,
    });

    await ctx.reply("ADD DEBT\n\nAdd a description, or skip it.", {
      reply_markup: new InlineKeyboard()
        .text("SKIP", "debts:description:skip")
        .text("CANCEL", "flow:cancel"),
    });
    return true;
  }

  if (state.step === "description") {
    const description = ctx.message.text.trim();

    setState(ctx.from.id, {
      ...state,
      step: "confirm",
      description,
    });

    await ctx.reply(debtSummary(state, description), {
      reply_markup: debtConfirmKeyboard(),
    });
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
      `PAYMENT RECORDED\n\nRemaining: ${formatCurrency(debt.remaining_amount, state.currency)}`,
      {
        reply_markup: mainMenuKeyboard(),
      },
    );
    return true;
  }

  return false;
}
