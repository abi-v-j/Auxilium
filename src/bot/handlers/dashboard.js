import { getMonthlyDashboard } from "../../services/reportService.js";
import { getOrRegisterUser } from "../../services/userService.js";
import { formatCurrency } from "../../utils/currency.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";
import { showSection } from "../utils/section.js";

export function registerDashboardHandlers(bot) {
  bot.callbackQuery("dashboard:view", async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const report = await getMonthlyDashboard(user.id);
    const balance = report.income - report.expenses;

    const month = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: user.timezone,
    }).format(new Date());

    const topExpenses = report.topExpenses.length
      ? report.topExpenses
          .map(
            (item) =>
              `${item.category_icon || ""} ${item.category_name}: ${formatCurrency(item.total, user.currency)}`,
          )
          .join("\n")
      : "No expenses yet.";

    await ctx.answerCallbackQuery();
    await showSection(
      ctx,
      [
        `📊 DASHBOARD`,
        `${month.toUpperCase()}`,
        "",
        `Income: ${formatCurrency(report.income, user.currency)}`,
        `Expenses: ${formatCurrency(report.expenses, user.currency)}`,
        `Balance: ${formatCurrency(balance, user.currency)}`,
        "",
        "Top Expenses:",
        topExpenses,
      ].join("\n"),
      mainMenuKeyboard(),
    );
  });
}
