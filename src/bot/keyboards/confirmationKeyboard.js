import { InlineKeyboard } from "grammy";

export function confirmationKeyboard(confirmCallback) {
  return new InlineKeyboard()
    .text("Confirm", confirmCallback)
    .text("Cancel", "flow:cancel");
}
