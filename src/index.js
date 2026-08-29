import { createBot } from "./bot/index.js";
import { startHealthServer } from "./server.js";

startHealthServer();

const bot = createBot();
await bot.start();

console.log("Auxilium bot is running.");
