import { InlineKeyboard } from "grammy";
import {
  deleteTransaction,
  listRecentTransactions,
} from "../../services/transactionService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";

function transactionLine(transaction, currency) {
  const sign = transaction.type === "income" ? "+" : "-";
  const icon = transaction.category_icon || "";
  const description = transaction.description ? ` - ${transaction.description}` : "";
  const date = new Date(transaction.transaction_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

  return `${date} ${icon} ${transaction.category_name || "Uncategorized"} ${sign}${formatCurrency(transaction.amount, currency)}${description}`;
}

export function registerTransactionHandlers(bot) {
  bot.callbackQuery("transactions:list", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const transactions = await listRecentTransactions(user.id);

    if (!transactions.length) {
      await ctx.answerCallbackQuery();
      await ctx.reply("No transactions yet.", {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    const keyboard = new InlineKeyboard();
    transactions.forEach((transaction) => {
      keyboard.text(`Delete #${transaction.id}`, `transactions:delete:${transaction.id}`).row();
    });
    keyboard.text("Back", "menu:main");

    await ctx.answerCallbackQuery();
    await ctx.reply(
      ["Last transactions:", "", ...transactions.map((item) => transactionLine(item, user.currency))].join("\n"),
      {
        reply_markup: keyboard,
      },
    );
  });

  bot.callbackQuery(/^transactions:delete:(\d+)$/, async (ctx) => {
    const transactionId = Number(ctx.match[1]);

    await ctx.answerCallbackQuery();
    await ctx.reply(`Delete transaction #${transactionId}?`, {
      reply_markup: new InlineKeyboard()
        .text("Confirm Delete", `transactions:delete:confirm:${transactionId}`)
        .text("Cancel", "transactions:list"),
    });
  });

  bot.callbackQuery(/^transactions:delete:confirm:(\d+)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const deleted = await deleteTransaction(user.id, Number(ctx.match[1]));

    await ctx.answerCallbackQuery(deleted ? "Deleted." : "Not found.");
    await ctx.reply(deleted ? "Transaction deleted." : "Transaction not found.", {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
