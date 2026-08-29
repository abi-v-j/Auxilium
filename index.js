import "dotenv/config";
import { Bot } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply("Hello! Welcome to my bot.");
});

bot.command("help", async (ctx) => {
  await ctx.reply("Available commands:\n/start\n/help");
});

bot.on("message:text", async (ctx) => {
  const message = ctx.message.text;

  await ctx.reply(`You said: ${message}`);
});

bot.start();

console.log("Bot is running...");