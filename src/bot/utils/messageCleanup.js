const CLEANUP_DELAY_MS = 60_000;
const trackedMessages = new Map();
const cleanupTimers = new Map();

function keyFor(chatId) {
  return String(chatId);
}

function track(chatId, messageId) {
  if (!chatId || !messageId) {
    return;
  }

  const key = keyFor(chatId);
  const existing = trackedMessages.get(key) || new Set();
  existing.add(messageId);
  trackedMessages.set(key, existing);
}

async function cleanupChat(api, chatId) {
  const key = keyFor(chatId);
  const messageIds = [...(trackedMessages.get(key) || [])];
  trackedMessages.delete(key);
  cleanupTimers.delete(key);

  for (const messageId of messageIds) {
    try {
      await api.deleteMessage(chatId, messageId);
    } catch {
      // Telegram rejects some deletes; cleanup should never break a bot flow.
    }
  }
}

function schedule(api, chatId) {
  const key = keyFor(chatId);
  const oldTimer = cleanupTimers.get(key);

  if (oldTimer) {
    clearTimeout(oldTimer);
  }

  cleanupTimers.set(
    key,
    setTimeout(() => cleanupChat(api, chatId), CLEANUP_DELAY_MS),
  );
}

export function autoCleanup() {
  return async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;

    if (ctx.message?.message_id && chatId) {
      track(chatId, ctx.message.message_id);
    }

    if (ctx.callbackQuery?.message?.message_id && chatId) {
      track(chatId, ctx.callbackQuery.message.message_id);
    }

    const originalReply = ctx.reply.bind(ctx);
    ctx.reply = async (...args) => {
      const message = await originalReply(...args);
      track(message.chat.id, message.message_id);
      schedule(ctx.api, message.chat.id);
      return message;
    };

    await next();

    if (chatId) {
      schedule(ctx.api, chatId);
    }
  };
}
