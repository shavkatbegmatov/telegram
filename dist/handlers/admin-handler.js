"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdminHandler = setupAdminHandler;
const grammy_1 = require("grammy");
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function setupAdminHandler(config, ticketStore) {
    const composer = new grammy_1.Composer();
    composer.on("message", async (ctx) => {
        // Only process messages inside the configured admin chat
        if (ctx.chat.id !== config.adminChatIdNumber) {
            return;
        }
        const replyTo = ctx.message.reply_to_message;
        if (replyTo) {
            const ticket = ticketStore.getTicketByAdminMessage(replyTo.message_id);
            if (ticket) {
                try {
                    // Send notification prefix to user
                    await ctx.api.sendMessage(ticket.userChatId, `💬 <b>Support Team Reply:</b>`, { parse_mode: "HTML" });
                    // Copy admin's exact content (supports text, images, files, audio, etc.)
                    await ctx.api.copyMessage(ticket.userChatId, ctx.chat.id, ctx.message.message_id);
                    // Confirm in admin chat using safe HTML
                    await ctx.reply(`✅ Reply delivered to <b>${escapeHtml(ticket.userName)}</b> (<code>${ticket.userChatId}</code>)`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
                    return;
                }
                catch (err) {
                    console.error("❌ Failed to deliver admin reply to user:", err);
                    await ctx.reply(`❌ Could not send reply to user <code>${ticket.userChatId}</code>: ${escapeHtml(err.message)}`, { parse_mode: "HTML" });
                    return;
                }
            }
            else {
                await ctx.reply(`⚠️ Could not find a linked support ticket for this message. If you want to send a manual message, use <code>/reply &lt;user_id&gt; &lt;text&gt;</code>.`, { parse_mode: "HTML" });
                return;
            }
        }
        // If admin posts a non-command message without replying to anything
        if (ctx.message.text && !ctx.message.text.startsWith("/")) {
            await ctx.reply(`💡 <b>Tip:</b> Reply directly to a forwarded user message to send them an answer, or use <code>/reply &lt;user_id&gt; &lt;text&gt;</code>.`, { parse_mode: "HTML" });
        }
    });
    return composer;
}
