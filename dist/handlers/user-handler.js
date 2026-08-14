"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUserHandler = setupUserHandler;
const grammy_1 = require("grammy");
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function setupUserHandler(config, ticketStore) {
    const composer = new grammy_1.Composer();
    composer.on("message", async (ctx, next) => {
        if (ctx.chat.id === config.adminChatIdNumber) {
            return next();
        }
        const user = ctx.from;
        if (!user)
            return;
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
        const usernameTag = user.username ? `@${user.username}` : "No username";
        const userChatId = ctx.chat.id;
        const userMessageId = ctx.message.message_id;
        const header = `📩 <b>New Support Message</b>\n` +
            `👤 <b>From:</b> ${escapeHtml(fullName)} (${escapeHtml(usernameTag)})\n` +
            `🆔 <b>User ID:</b> <code>${userChatId}</code>\n` +
            `----------------------------------------`;
        try {
            const headerMsg = await ctx.api.sendMessage(config.adminChatIdNumber, header, {
                parse_mode: "HTML",
            });
            const forwardedMsg = await ctx.api.copyMessage(config.adminChatIdNumber, userChatId, userMessageId);
            ticketStore.saveTicket(forwardedMsg.message_id, {
                userChatId,
                userMessageId,
                userName: fullName,
                userHandle: user.username,
                timestamp: Date.now(),
                adminMessageId: forwardedMsg.message_id,
            });
            ticketStore.saveTicket(headerMsg.message_id, {
                userChatId,
                userMessageId,
                userName: fullName,
                userHandle: user.username,
                timestamp: Date.now(),
                adminMessageId: headerMsg.message_id,
            });
            await ctx.reply(config.AUTO_REPLY_MESSAGE);
        }
        catch (err) {
            console.error("❌ Failed to forward user message to admin chat:", err);
            await ctx.reply("⚠️ Sorry, there was an issue delivering your message to support. Please try again later.");
        }
    });
    return composer;
}
