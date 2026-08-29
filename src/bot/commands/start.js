import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { getOrRegisterUser } from "../../services/userService.js";

export function registerStartCommand(bot) {
  bot.command("start", async (ctx) => {
    const { isNew } = await getOrRegisterUser(ctx.from);

    const intro = isNew
      ? "Welcome to Auxilium Finance Tracker. Your account is ready."
      : "Welcome back to Auxilium Finance Tracker.";

    await ctx.reply(`${intro}\n\nAUXILIUM\n\nChoose an option:`, {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
