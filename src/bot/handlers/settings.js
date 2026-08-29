import { InlineKeyboard } from "grammy";
import { getOrRegisterUser } from "../../services/userService.js";
import { updateUserCurrency, updateUserTimezone } from "../../services/settingsService.js";
import { mainMenuKeyboard } from "../keyboards/mainMenu.js";

const currencies = ["INR", "USD", "AED", "EUR", "GBP"];
const timezones = ["Asia/Kolkata", "UTC", "Asia/Dubai", "America/New_York", "Europe/London"];

function settingsKeyboard() {
  return new InlineKeyboard()
    .text("Change Currency", "settings:currency")
    .text("Change Timezone", "settings:timezone")
    .row()
    .text("Back", "menu:main");
}

function optionKeyboard(values, prefix) {
  const keyboard = new InlineKeyboard();

  values.forEach((value, index) => {
    keyboard.text(value, `${prefix}:${value}`);

    if (index % 2 === 1) {
      keyboard.row();
    }
  });

  return keyboard.row().text("Back", "settings:menu");
}

async function showSettings(ctx) {
  const { user } = await getOrRegisterUser(ctx.from);

  await ctx.reply(
    [
      "Settings",
      "",
      `Currency: ${user.currency}`,
      `Timezone: ${user.timezone}`,
    ].join("\n"),
    {
      reply_markup: settingsKeyboard(),
    },
  );
}

export function registerSettingsHandlers(bot) {
  bot.callbackQuery("settings:menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSettings(ctx);
  });

  bot.callbackQuery("settings:currency", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Choose currency:", {
      reply_markup: optionKeyboard(currencies, "settings:currency:set"),
    });
  });

  bot.callbackQuery("settings:timezone", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Choose timezone:", {
      reply_markup: optionKeyboard(timezones, "settings:timezone:set"),
    });
  });

  bot.callbackQuery(/^settings:currency:set:(.+)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const currency = ctx.match[1];

    if (!currencies.includes(currency)) {
      await ctx.answerCallbackQuery("Invalid currency.");
      return;
    }

    await updateUserCurrency(user.id, currency);
    await ctx.answerCallbackQuery("Currency updated.");
    await ctx.reply(`Currency updated to ${currency}.`, {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.callbackQuery(/^settings:timezone:set:(.+)$/, async (ctx) => {
    const { user } = await getOrRegisterUser(ctx.from);
    const timezone = ctx.match[1];

    if (!timezones.includes(timezone)) {
      await ctx.answerCallbackQuery("Invalid timezone.");
      return;
    }

    await updateUserTimezone(user.id, timezone);
    await ctx.answerCallbackQuery("Timezone updated.");
    await ctx.reply(`Timezone updated to ${timezone}.`, {
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.callbackQuery("menu:main", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Main menu:", {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
