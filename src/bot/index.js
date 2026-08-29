import { Bot } from "grammy";
import { env } from "../config/env.js";
import { registerHelpCommand } from "./commands/help.js";
import { registerStartCommand } from "./commands/start.js";
import { registerExpenseHandlers } from "./handlers/expense.js";
import { registerMenuHandlers } from "./handlers/menu.js";
import { registerTextHandlers } from "./handlers/text.js";

export function createBot() {
  const bot = new Bot(env.botToken);

  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerExpenseHandlers(bot);
  registerMenuHandlers(bot);
  registerTextHandlers(bot);

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}
