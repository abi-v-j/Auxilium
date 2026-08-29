import { InlineKeyboard } from "grammy";

export function confirmationKeyboard(confirmCallback) {
  return new InlineKeyboard()
    .text("CONFIRM", confirmCallback)
    .text("CANCEL", "flow:cancel");
}
