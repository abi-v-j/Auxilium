import { clearState, getState } from "../session/state.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { showSection } from "../utils/section.js";
import { handleBudgetText } from "./budget.js";
import { handleDebtPaymentText, handleDebtText } from "./debt.js";
import { handleExpenseText } from "./expense.js";
import { handleIncomeText } from "./income.js";

export function registerTextHandlers(bot) {
  bot.callbackQuery("flow:cancel", async (ctx) => {
    clearState(ctx.from.id);
    await ctx.answerCallbackQuery("Cancelled.");
    await showSection(ctx, "CANCELLED\n\nChoose another option:", mainMenuKeyboard());
  });

  bot.on("message:text", async (ctx) => {
    const state = getState(ctx.from.id);

    if (state?.flow === "expense" && (await handleExpenseText(ctx, state))) {
      return;
    }

    if (state?.flow === "income" && (await handleIncomeText(ctx, state))) {
      return;
    }

    if (state?.flow === "debt" && (await handleDebtText(ctx, state))) {
      return;
    }

    if (
      state?.flow === "debt_payment" &&
      (await handleDebtPaymentText(ctx, state))
    ) {
      return;
    }

    if (state?.flow === "budget" && (await handleBudgetText(ctx, state))) {
      return;
    }

    await ctx.reply("AUXILIUM\n\nChoose an option:", {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
