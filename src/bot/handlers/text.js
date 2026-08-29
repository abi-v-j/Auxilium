import { clearState, getState } from "../session/state.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { handleExpenseText } from "./expense.js";

export function registerTextHandlers(bot) {
  bot.callbackQuery("flow:cancel", async (ctx) => {
    clearState(ctx.from.id);
    await ctx.answerCallbackQuery("Cancelled.");
    await ctx.reply("Cancelled. Choose another option:", {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.on("message:text", async (ctx) => {
    const state = getState(ctx.from.id);

    if (state?.flow === "expense" && (await handleExpenseText(ctx, state))) {
      return;
    }

    await ctx.reply("Use /start to open the Auxilium menu.");
  });
}
