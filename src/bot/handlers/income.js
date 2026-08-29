import { InlineKeyboard } from "grammy";
import { categoryKeyboard } from "../keyboards/categoryKeyboard.js";
import { confirmationKeyboard } from "../keyboards/confirmationKeyboard.js";
import { clearState, getState, setState } from "../session/state.js";
import { listCategories } from "../../services/categoryService.js";
import { createTransaction } from "../../services/transactionService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { parseAmount } from "./expense.js";

async function showConfirmation(ctx, userId, description = null) {
  const state = getState(userId);

  setState(userId, {
    ...state,
    step: "confirm",
    description,
  });

  await ctx.reply(
    [
      "Save this income?",
      `Amount: ${formatCurrency(state.amount, state.currency)}`,
      `Description: ${description || "None"}`,
    ].join("\n"),
    {
      reply_markup: confirmationKeyboard("income:confirm"),
    },
  );
}

export function registerIncomeHandlers(bot) {
  bot.callbackQuery("income:add", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    setState(ctx.from.id, {
      flow: "income",
      step: "amount",
      userId: user.id,
      currency: user.currency,
    });

    await ctx.answerCallbackQuery();
    await ctx.reply("Enter the income amount:", {
      reply_markup: new InlineKeyboard().text("Cancel", "flow:cancel"),
    });
  });

  bot.callbackQuery(/^income:category:(\d+)$/, async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "income" || state.step !== "category") {
      await ctx.answerCallbackQuery("Start an income first.");
      return;
    }

    setState(ctx.from.id, {
      ...state,
      step: "description",
      categoryId: Number(ctx.match[1]),
    });

    await ctx.answerCallbackQuery();
    await ctx.reply("Add a description, or skip it.", {
      reply_markup: new InlineKeyboard()
        .text("Skip", "income:description:skip")
        .text("Cancel", "flow:cancel"),
    });
  });

  bot.callbackQuery("income:description:skip", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "income" || state.step !== "description") {
      await ctx.answerCallbackQuery("Nothing to skip.");
      return;
    }

    await ctx.answerCallbackQuery();
    await showConfirmation(ctx, ctx.from.id);
  });

  bot.callbackQuery("income:confirm", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "income" || state.step !== "confirm") {
      await ctx.answerCallbackQuery("Nothing to confirm.");
      return;
    }

    const transaction = await createTransaction({
      userId: state.userId,
      categoryId: state.categoryId,
      type: "income",
      amount: state.amount,
      description: state.description,
    });

    clearState(ctx.from.id);
    await ctx.answerCallbackQuery("Income saved.");
    await ctx.reply(`Saved income: ${formatCurrency(transaction.amount, state.currency)}`);
  });
}

export async function handleIncomeText(ctx, state) {
  if (state.step === "amount") {
    const amount = parseAmount(ctx.message.text);

    if (!amount) {
      await ctx.reply("Please enter a valid amount greater than 0.");
      return true;
    }

    setState(ctx.from.id, {
      ...state,
      step: "category",
      amount,
    });

    const categories = await listCategories(state.userId, "income");
    await ctx.reply("Choose a category:", {
      reply_markup: categoryKeyboard(categories, "income:category"),
    });
    return true;
  }

  if (state.step === "description") {
    await showConfirmation(ctx, ctx.from.id, ctx.message.text.trim());
    return true;
  }

  return false;
}
