import { Bot } from "grammy";
import { env } from "../config/env.js";
import { registerHelpCommand } from "./commands/help.js";
import { registerStartCommand } from "./commands/start.js";
import { registerBudgetHandlers } from "./handlers/budget.js";
import { registerDashboardHandlers } from "./handlers/dashboard.js";
import { registerDebtHandlers } from "./handlers/debt.js";
import { registerExpenseHandlers } from "./handlers/expense.js";
import { registerIncomeHandlers } from "./handlers/income.js";
import { registerMenuHandlers } from "./handlers/menu.js";
import { registerSettingsHandlers } from "./handlers/settings.js";
import { registerTextHandlers } from "./handlers/text.js";
import { registerTransactionHandlers } from "./handlers/transactions.js";
import { autoCleanup } from "./utils/messageCleanup.js";

export function createBot() {
  const bot = new Bot(env.botToken);

  bot.use(autoCleanup());

  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerExpenseHandlers(bot);
  registerIncomeHandlers(bot);
  registerDashboardHandlers(bot);
  registerTransactionHandlers(bot);
  registerDebtHandlers(bot);
  registerBudgetHandlers(bot);
  registerSettingsHandlers(bot);
  registerMenuHandlers(bot);
  registerTextHandlers(bot);

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}
