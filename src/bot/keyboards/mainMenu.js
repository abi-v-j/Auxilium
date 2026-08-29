import { InlineKeyboard } from "grammy";

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("💸 ADD EXPENSE", "expense:add")
    .text("💰 ADD INCOME", "income:add")
    .row()
    .text("📊 DASHBOARD", "dashboard:view")
    .text("📋 HISTORY", "transactions:list")
    .row()
    .text("🤝 DEBTS", "debts:menu")
    .text("💳 BUDGET", "budget:menu")
    .row()
    .text("⚙️ SETTINGS", "settings:menu");
}
