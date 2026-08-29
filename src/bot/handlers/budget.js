import { InlineKeyboard } from "grammy";
import { listCategories } from "../../services/categoryService.js";
import { listCurrentBudgets, upsertCurrentBudget } from "../../services/budgetService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { categoryKeyboard } from "../keyboards/categoryKeyboard.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { clearState, getState, setState } from "../session/state.js";
import { showSection } from "../utils/section.js";
import { parseAmount } from "./expense.js";

function budgetMenuKeyboard() {
  return new InlineKeyboard()
    .text("SET BUDGET", "budget:set")
    .text("VIEW BUDGETS", "budget:view")
    .row()
    .text("⬅ BACK", "menu:main");
}

export function registerBudgetHandlers(bot) {
  bot.callbackQuery("budget:menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSection(ctx, "BUDGET\n\nChoose an option:", budgetMenuKeyboard());
  });

  bot.callbackQuery("budget:view", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const budgets = await listCurrentBudgets(user.id);

    const text = budgets.length
      ? budgets
          .map((budget) => {
            const spent = Number(budget.spent);
            const limit = Number(budget.monthly_limit);
            const marker = spent > limit ? "Over" : "Used";
            return `${budget.category_icon || ""} ${budget.category_name}: ${marker} ${formatCurrency(spent, user.currency)} / ${formatCurrency(limit, user.currency)}`;
          })
          .join("\n")
      : "No budgets set for this month.";

    await ctx.answerCallbackQuery();
    await showSection(ctx, `CURRENT BUDGETS\n\n${text}`, budgetMenuKeyboard());
  });

  bot.callbackQuery("budget:set", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const categories = await listCategories(user.id, "expense");

    setState(ctx.from.id, {
      flow: "budget",
      step: "category",
      userId: user.id,
      currency: user.currency,
    });

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      "SET BUDGET\n\nChoose a category:",
      categoryKeyboard(categories, "budget:category"),
    );
  });

  bot.callbackQuery(/^budget:category:(\d+)$/, async (ctx) => {
    const state = getState(ctx.from.id);

    if (!state || state.flow !== "budget" || state.step !== "category") {
      await ctx.answerCallbackQuery("Start budget setup first.");
      return;
    }

    setState(ctx.from.id, {
      ...state,
      step: "amount",
      categoryId: Number(ctx.match[1]),
    });

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      "SET BUDGET\n\nEnter the monthly budget limit:",
      new InlineKeyboard().text("CANCEL", "flow:cancel"),
    );
  });
}

export async function handleBudgetText(ctx, state) {
  if (state.step === "amount") {
    const amount = parseAmount(ctx.message.text);

    if (!amount) {
      await ctx.reply("Please enter a valid amount greater than 0.");
      return true;
    }

    await upsertCurrentBudget({
      userId: state.userId,
      categoryId: state.categoryId,
      monthlyLimit: amount,
    });

    clearState(ctx.from.id);
    await ctx.reply(`Budget saved: ${formatCurrency(amount, state.currency)}`, {
      reply_markup: mainMenuKeyboard(),
    });
    return true;
  }

  return false;
}
