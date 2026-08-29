import { mainMenuKeyboard } from "../keyboards/mainMenu.js";

const placeholders = {
  "income:add": "Income creation is next. It will reuse the transaction flow.",
  "dashboard:view": "Dashboard is coming after expenses and income are saved.",
  "transactions:list": "Transaction history is coming after the first transaction flow.",
  "debts:menu": "Debt tracking will be added after the transaction MVP.",
  "budget:menu": "Budgets are planned for the next version after core tracking.",
  "settings:menu": "Settings will handle currency and timezone.",
};

export function registerMenuHandlers(bot) {
  for (const [callbackData, message] of Object.entries(placeholders)) {
    bot.callbackQuery(callbackData, async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(message, {
        reply_markup: mainMenuKeyboard(),
      });
    });
  }
}
