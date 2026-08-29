import "dotenv/config";
import { Bot } from "grammy";
import http from "http";

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

// HTTP server required by Render Web Service
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Telegram bot is running");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start Telegram bot
bot.start();

console.log("Bot is running...");