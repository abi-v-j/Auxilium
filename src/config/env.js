import "dotenv/config";

const required = ["BOT_TOKEN", "DATABASE_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  botToken: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT || 3000),
  defaultCurrency: process.env.DEFAULT_CURRENCY || "INR",
  defaultTimezone: process.env.DEFAULT_TIMEZONE || "Asia/Kolkata",
};
