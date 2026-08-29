export function registerMenuHandlers(bot) {
  bot.callbackQuery(/.*/, async (ctx) => {
    await ctx.answerCallbackQuery("That option is not available yet.");
  });
}
