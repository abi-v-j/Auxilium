export async function showSection(ctx, text, replyMarkup) {
  const options = {
    reply_markup: replyMarkup,
  };

  if (ctx.callbackQuery?.message) {
    try {
      await ctx.editMessageText(text, options);
      return;
    } catch {
      // If Telegram cannot edit the old message, send a fresh section instead.
    }
  }

  await ctx.reply(text, options);
}
