import { InlineKeyboard } from "grammy";

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("💸 Add Expense", "expense:add")
    .text("💰 Add Income", "income:add")
    .row()
    .text("📊 Dashboard", "dashboard:view")
    .text("📋 Transactions", "transactions:list")
    .row()
    .text("🤝 Debts", "debts:menu")
    .text("💳 Budget", "budget:menu")
    .row()
    .text("⚙️ Settings", "settings:menu");
}
