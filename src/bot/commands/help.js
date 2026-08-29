export function registerHelpCommand(bot) {
  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "Auxilium commands:",
        "/start - Open the main menu",
        "/help - Show this help message",
      ].join("\n"),
    );
  });
}
