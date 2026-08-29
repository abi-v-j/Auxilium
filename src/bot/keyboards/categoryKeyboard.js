import { InlineKeyboard } from "grammy";

export function categoryKeyboard(categories, prefix) {
  const keyboard = new InlineKeyboard();

  categories.forEach((category, index) => {
    keyboard.text(`${category.icon} ${category.name}`, `${prefix}:${category.id}`);

    if (index % 2 === 1) {
      keyboard.row();
    }
  });

  return keyboard.row().text("CANCEL", "flow:cancel");
}
