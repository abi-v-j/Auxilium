import { InlineKeyboard } from "grammy";
import {
  deleteTransaction,
  listRecentTransactions,
} from "../../services/transactionService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { showSection } from "../utils/section.js";

function transactionLine(transaction, currency, index) {
  const sign = transaction.type === "income" ? "+" : "-";
  const icon = transaction.category_icon || "";
  const description = transaction.description ? ` - ${transaction.description}` : "";
  const date = new Date(transaction.transaction_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

  return `${index + 1}. ${date} ${icon} ${transaction.category_name || "Uncategorized"} ${sign}${formatCurrency(transaction.amount, currency)}${description}`;
}

export function registerTransactionHandlers(bot) {
  bot.callbackQuery("transactions:list", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const transactions = await listRecentTransactions(user.id);

    if (!transactions.length) {
      await ctx.answerCallbackQuery();
      await showSection(ctx, "TRANSACTIONS\n\nNo transactions yet.", mainMenuKeyboard());
      return;
    }

    const keyboard = new InlineKeyboard();
    transactions.forEach((transaction, index) => {
      keyboard.text(`DELETE ${index + 1}`, `transactions:delete:${transaction.id}`).row();
    });
    keyboard.text("⬅ BACK", "menu:main");

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      [
        "TRANSACTIONS",
        "",
        ...transactions.map((item, index) =>
          transactionLine(item, user.currency, index),
        ),
      ].join("\n\n"),
      keyboard,
    );
  });

  bot.callbackQuery(/^transactions:delete:(\d+)$/, async (ctx) => {
    const transactionId = Number(ctx.match[1]);

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      "DELETE TRANSACTION\n\nAre you sure?",
      new InlineKeyboard()
        .text("CONFIRM DELETE", `transactions:delete:confirm:${transactionId}`)
        .text("CANCEL", "transactions:list"),
    );
  });

  bot.callbackQuery(/^transactions:delete:confirm:(\d+)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const deleted = await deleteTransaction(user.id, Number(ctx.match[1]));

    await ctx.answerCallbackQuery(deleted ? "Deleted." : "Not found.");
    await showSection(
      ctx,
      deleted ? "TRANSACTION DELETED" : "TRANSACTION NOT FOUND",
      mainMenuKeyboard(),
    );
  });
}
