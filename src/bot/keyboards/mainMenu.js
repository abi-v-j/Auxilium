import { InlineKeyboard } from "grammy";

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("💸 ADD EXPENSE", "expense:add")
    .row()
    .text("💰 ADD INCOME", "income:add")
    .row()
    .text("📊 DASHBOARD", "dashboard:view")
    .row()
    .text("📋 HISTORY", "transactions:list")
    .row()
    .text("🤝 DEBTS", "debts:menu")
    .row()
    .text("💳 BUDGET", "budget:menu")
    .row()
    .text("⚙️ SETTINGS", "settings:menu");
}
