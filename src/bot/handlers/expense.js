import { InlineKeyboard } from "grammy";
import { categoryKeyboard } from "../keyboards/categoryKeyboard.js";
import { confirmationKeyboard } from "../keyboards/confirmationKeyboard.js";
import { clearState, getState, setState } from "../session/state.js";
import { listCategories } from "../../services/categoryService.js";
import { createTransaction } from "../../services/transactionService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";

function parseAmount(text) {
  const normalized = text.replace(/,/g, "").trim();
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

async function askForDescription(ctx, userId, categoryId) {
  const state = getState(userId);
  setState(userId, {
    ...state,
    step: "description",
    categoryId,
  });

  await ctx.reply("Add a description, or skip it.", {
    reply_markup: new InlineKeyboard()
      .text("Skip", "expense:description:skip")
      .text("Cancel", "flow:cancel"),
  });
}

async function showConfirmation(ctx, userId, description = null) {
  const state = getState(userId);

  setState(userId, {
    ...state,
    step: "confirm",
    description,
  });

  await ctx.reply(
    [
      "Save this expense?",
      `Amount: ${formatCurrency(state.amount)}`,
      `Description: ${description || "None"}`,
    ].join("\n"),
    {
      reply_markup: confirmationKeyboard("expense:confirm"),
    },
  );
}

export function registerExpenseHandlers(bot) {
  bot.callbackQuery("expense:add", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    setState(ctx.from.id, {
      flow: "expense",
      step: "amount",
      userId: user.id,
      currency: user.currency,
    });

    await ctx.answerCallbackQuery();
    await ctx.reply("Enter the expense amount:", {
      reply_markup: new InlineKeyboard().text("Cancel", "flow:cancel"),
    });
  });

  bot.callbackQuery(/^expense:category:(\d+)$/, async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "expense" || state.step !== "category") {
      await ctx.answerCallbackQuery("Start an expense first.");
      return;
    }

    await ctx.answerCallbackQuery();
    await askForDescription(ctx, ctx.from.id, Number(ctx.match[1]));
  });

  bot.callbackQuery("expense:description:skip", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "expense" || state.step !== "description") {
      await ctx.answerCallbackQuery("Nothing to skip.");
      return;
    }

    await ctx.answerCallbackQuery();
    await showConfirmation(ctx, ctx.from.id);
  });

  bot.callbackQuery("expense:confirm", async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "expense" || state.step !== "confirm") {
      await ctx.answerCallbackQuery("Nothing to confirm.");
      return;
    }

    const transaction = await createTransaction({
      userId: state.userId,
      categoryId: state.categoryId,
      type: "expense",
      amount: state.amount,
      description: state.description,
    });

    clearState(ctx.from.id);
    await ctx.answerCallbackQuery("Expense saved.");
    await ctx.reply(`Saved expense: ${formatCurrency(transaction.amount, state.currency)}`);
  });
}

export async function handleExpenseText(ctx, state) {
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

    const categories = await listCategories(state.userId, "expense");
    await ctx.reply("Choose a category:", {
      reply_markup: categoryKeyboard(categories, "expense:category"),
    });
    return true;
  }

  if (state.step === "description") {
    await showConfirmation(ctx, ctx.from.id, ctx.message.text.trim());
    return true;
  }

  return false;
}
