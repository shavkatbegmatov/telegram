"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommandHandler = setupCommandHandler;
const grammy_1 = require("grammy");
const menus_js_1 = require("../keyboards/menus.js");
function setupCommandHandler(config, ticketStore) {
    const composer = new grammy_1.Composer();
    // /start command
    composer.command("start", async (ctx) => {
        const isAdmin = ctx.chat.id === config.adminChatIdNumber;
        if (isAdmin) {
            await ctx.reply(`🛠️ *Admin Support Dashboard*\n\n` +
                `Welcome, Admin! This chat (${ctx.chat.id}) is configured as the Support Admin Hub.\n\n` +
                `• Reply directly to any forwarded user message to send an answer to that user.\n` +
                `• Click **Direct Reply to ID** or tap the prefilled \`/reply <id> \` command.\n` +
                `• Use \`/stats\` to view support statistics.`, { parse_mode: "Markdown" });
            return;
        }
        await ctx.reply(config.WELCOME_MESSAGE, {
            reply_markup: (0, menus_js_1.getMainMenuKeyboard)(),
        });
    });
    // /help command
    composer.command("help", async (ctx) => {
        const isAdmin = ctx.chat.id === config.adminChatIdNumber;
        if (isAdmin) {
            await ctx.reply(`📌 *Admin Instructions*\n\n` +
                `1️⃣ When users send messages, they will appear in this chat with their name and User ID.\n` +
                `2️⃣ Simply **reply** directly to the message in Telegram.\n` +
                `3️⃣ Or tap the prefilled \`/reply <user_id>\` command block to send a message.\n` +
                `4️⃣ Use \`/stats\` to view ticket counts.`, { parse_mode: "Markdown" });
            return;
        }
        await ctx.reply(`💬 <b>Need Support?</b>\n\n` +
            `Type and send your question right here in chat! Our support team will get back to you shortly.\n\n` +
            `Use the menu buttons below to view your <b>Profile</b> or explore <b>Premium</b> features!`, { parse_mode: "HTML", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
    });
    // /id or /myid command
    composer.command(["id", "myid"], async (ctx) => {
        const isAdmin = ctx.chat.id === config.adminChatIdNumber;
        await ctx.reply(`🆔 *Chat Information*\n\n` +
            `• *Your Chat ID:* \`${ctx.chat.id}\`\n` +
            `• *Role:* ${isAdmin ? "👑 Admin Hub" : "👤 User"}\n\n` +
            (isAdmin
                ? `✅ This chat is configured as ADMIN_CHAT_ID.`
                : `💡 Share your Chat ID with support if requested.`), { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
    });
    // /stats command - Admin only
    composer.command("stats", async (ctx) => {
        if (ctx.chat.id !== config.adminChatIdNumber) {
            await ctx.reply("❌ This command is restricted to administrators.");
            return;
        }
        const totalTickets = ticketStore.getTotalTicketsCount();
        const totalUsers = ticketStore.getUniqueUsersCount();
        await ctx.reply(`📊 *Support Statistics*\n\n` +
            `• *Total Messages Processed:* ${totalTickets}\n` +
            `• *Unique Users Contacted:* ${totalUsers}\n` +
            `• *Admin Chat ID:* \`${config.ADMIN_CHAT_ID}\``, { parse_mode: "Markdown" });
    });
    // /reply <user_id> <message> command - Admin only
    composer.command("reply", async (ctx) => {
        if (ctx.chat.id !== config.adminChatIdNumber) {
            await ctx.reply("❌ This command is restricted to administrators.");
            return;
        }
        const text = ctx.match.trim();
        if (!text) {
            await ctx.reply("⚠️ *Usage:* `/reply <user_id> <your reply text>`\n" +
                "Example: `/reply 123456789 Hello, your issue has been resolved!`", { parse_mode: "Markdown" });
            return;
        }
        const spaceIndex = text.indexOf(" ");
        if (spaceIndex === -1) {
            await ctx.reply("⚠️ Please provide text after the user ID. Example: `/reply 123456789 Hello`", {
                parse_mode: "Markdown",
            });
            return;
        }
        const targetUserIdStr = text.substring(0, spaceIndex).trim();
        const replyText = text.substring(spaceIndex + 1).trim();
        const targetUserId = Number(targetUserIdStr);
        if (isNaN(targetUserId) || targetUserId <= 0) {
            await ctx.reply("❌ Invalid User ID. Must be a numeric ID.");
            return;
        }
        try {
            await ctx.api.sendMessage(targetUserId, `💬 *Message from Support:*\n\n${replyText}`, { parse_mode: "Markdown" });
            await ctx.reply(`✅ Reply sent successfully to user \`${targetUserId}\`.`, {
                parse_mode: "Markdown",
            });
        }
        catch (err) {
            await ctx.reply(`❌ Failed to send message to user \`${targetUserId}\`: ${err.message}`);
        }
    });
    // 👤 Profile Keyboard Button (Demo User view)
    composer.hears("👤 Profile", async (ctx) => {
        await ctx.reply(`👤 <b>Demo User Profile</b>\n` +
            `----------------------------------------\n` +
            `• <b>Name:</b> Demo User (@demouser)\n` +
            `• <b>User ID:</b> <code>123456789</code>\n` +
            `• <b>Account Tier:</b> Free (Demo Mode)\n` +
            `• <b>Streak:</b> 7 Days 🔥\n` +
            `• <b>Level:</b> Level 5 (1,250 XP) 🏆\n` +
            `• <b>Kaizen Score:</b> 850 📈\n` +
            `• <b>League:</b> Silver 🏅\n` +
            `----------------------------------------\n` +
            `<i>💡 Demo Version - Sample User Information</i>`, { parse_mode: "HTML", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
    });
    // ⭐ Premium Keyboard Button (Demo Preview)
    composer.hears("⭐ Premium", async (ctx) => {
        await ctx.reply(`🌟 <b>Kaizen Premium (Demo Preview)</b> 🌟\n` +
            `----------------------------------------\n` +
            `Unlock the ultimate productivity suite:\n\n` +
            `🤖 <b>AI Productivity Coach</b>: Automated daily routines\n` +
            `🔔 <b>Priority Alerts</b>: Instant SMS & Telegram notifications\n` +
            `🎨 <b>Exclusive Badges</b>: Show off your legend status\n` +
            `📊 <b>Advanced Analytics</b>: Comprehensive growth insights\n` +
            `----------------------------------------\n` +
            `🚀 <b>Status:</b> Premium Subscription Coming Soon!`, { parse_mode: "HTML", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
    });
    // 💬 Support Keyboard Button
    composer.hears("💬 Support", async (ctx) => {
        await ctx.reply(`💬 <b>Support Mode Active</b>\n\n` +
            `Simply send your question, message, or feedback right here in chat!\n` +
            `Our support team will receive your message and reply as soon as possible.`, { parse_mode: "HTML", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
    });
    // Admin inline callback handler for "Direct Reply to ID" button
    composer.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;
        if (data.startsWith("admin_prompt_reply:")) {
            const userChatId = data.replace("admin_prompt_reply:", "");
            await ctx.answerCallbackQuery({ text: `Tap command to copy reply format` });
            await ctx.reply(`✍️ <b>Reply to User ID <code>${userChatId}</code></b>:\n\n` +
                `Copy and complete this command:\n` +
                `<code>/reply ${userChatId} your reply message here</code>`, { parse_mode: "HTML" });
            return;
        }
    });
    return composer;
}
