"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommandHandler = setupCommandHandler;
const grammy_1 = require("grammy");
const menus_js_1 = require("../keyboards/menus.js");
function setupCommandHandler(config, ticketStore, kaizenService) {
    const composer = new grammy_1.Composer();
    const supportModeUsers = new Set();
    async function requireLinkedProfile(ctx) {
        const profile = await kaizenService.getProfileByChatId(ctx.chat.id);
        if (!profile) {
            await ctx.reply(`⚠️ *Kaizen Account Not Linked*\n\n` +
                `Please connect your Kaizen account first!\n` +
                `1. Open Kaizen App Settings on the website.\n` +
                `2. Click "Connect Telegram Account" to get your single-use code.\n` +
                `3. Send \`/start <TOKEN>\` or \`/link <TOKEN>\` right here.`, { parse_mode: "Markdown" });
            return null;
        }
        return profile;
    }
    composer.command("start", async (ctx) => {
        const token = ctx.match.trim();
        if (token) {
            const result = await kaizenService.linkAccountByToken(ctx.chat.id, ctx.from?.username, token);
            if (result.success && result.profile) {
                await ctx.reply(`🎉 *Account Connected Successfully!*\n\n` +
                    `Welcome back, *${result.profile.full_name || result.profile.username}*!\n` +
                    `• Level: ${result.profile.level} | XP: ${result.profile.xp}\n` +
                    `• Streak: ${result.profile.streak} days 🔥\n\n` +
                    `Use the menu below to manage your tasks, habits, goals, or request live support.`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
                return;
            }
            else {
                await ctx.reply(`❌ ${result.error}`, { reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
                return;
            }
        }
        const isAdmin = ctx.chat.id === config.adminChatIdNumber;
        if (isAdmin) {
            await ctx.reply(`🛠️ *Kaizen Support Admin Hub*\n\n` +
                `Welcome, Admin! Reply directly to any forwarded user message to send an answer to that user.\n` +
                `Commands: \`/reply <user_id> <text>\`, \`/stats\``, { parse_mode: "Markdown" });
            return;
        }
        const profile = await kaizenService.getProfileByChatId(ctx.chat.id);
        if (profile) {
            await ctx.reply(`👋 Welcome to *Kaizen Companion*, ${profile.full_name || profile.username}!\n` +
                `Select an option from the menu below:`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
        }
        else {
            await ctx.reply(`👋 *Welcome to Kaizen Companion & Support!*\n\n` +
                `To unlock task tracking, habit reminders, and XP rewards, link your account:\n` +
                `1️⃣ Open Kaizen App Settings on the website.\n` +
                `2️⃣ Click **Connect Telegram Account**.\n` +
                `3️⃣ Send \`/link <CODE>\` or click the link from the website.\n\n` +
                `*Need assistance right away?* Click **💬 Support** below to chat with our team!`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
        }
    });
    composer.command("link", async (ctx) => {
        const token = ctx.match.trim();
        if (!token) {
            await ctx.reply("⚠️ Usage: `/link <YOUR_6_CHAR_CODE>`\nExample: `/link A1B2C3`", {
                parse_mode: "Markdown",
            });
            return;
        }
        const result = await kaizenService.linkAccountByToken(ctx.chat.id, ctx.from?.username, token);
        if (result.success && result.profile) {
            await ctx.reply(`🎉 *Account Connected Successfully!*\n\n` +
                `Connected as *${result.profile.full_name || result.profile.username}*!`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getMainMenuKeyboard)() });
        }
        else {
            await ctx.reply(`❌ ${result.error}`);
        }
    });
    composer.command("add", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const title = ctx.match.trim();
        if (!title) {
            await ctx.reply("⚠️ Usage: `/add <task title>`\nExample: `/add Complete Math Assignment`", {
                parse_mode: "Markdown",
            });
            return;
        }
        try {
            const newTask = await kaizenService.createQuickTask(profile.id, title);
            await ctx.reply(`✨ *Task Created!*\n\n` +
                `📋 *Title:* ${newTask.title}\n` +
                `⭐ *Reward:* +${newTask.xp_reward} XP\n` +
                `🎯 *Status:* Pending`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getTaskInlineKeyboard)(newTask.id) });
        }
        catch (err) {
            await ctx.reply(`❌ Failed to create task: ${err.message}`);
        }
    });
    // Settings handler
    const sendSettingsMenu = async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const highMins = profile.notify_high_priority_mins ?? 120;
        const medMins = profile.notify_medium_priority_mins ?? 60;
        const lowMins = profile.notify_low_priority_mins ?? 30;
        await ctx.reply(`⚙️ *Duolingo Task Notification Settings*\n\n` +
            `Customize how long before task deadlines you receive reminder nudges:\n\n` +
            `• 🔴 *High Priority:* ${highMins} mins before deadline\n` +
            `• ⚡ *Medium Priority:* ${medMins} mins before deadline\n` +
            `• 🟢 *Low Priority:* ${lowMins} mins before deadline\n\n` +
            `Tap a quick button below to change your lead time preference:`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getNotificationSettingsInlineKeyboard)() });
    };
    composer.command("settings", sendSettingsMenu);
    composer.hears("⚙️ Notification Settings", sendSettingsMenu);
    // Listen for Menu Buttons
    composer.hears("📋 Today's Tasks", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const tasks = await kaizenService.getTodayTasks(profile.id);
        if (tasks.length === 0) {
            await ctx.reply("🎉 *No pending tasks for today!* Great job maintaining momentum!", {
                parse_mode: "Markdown",
            });
            return;
        }
        await ctx.reply(`📋 *Your Pending Tasks (${tasks.length}):*`, { parse_mode: "Markdown" });
        for (const t of tasks) {
            const deadlineStr = t.deadline
                ? `\n⏰ *Deadline:* ${new Date(t.deadline).toLocaleString()}`
                : "";
            await ctx.reply(`• *${t.title}* (+${t.xp_reward} XP)${deadlineStr}\nPriority: ${t.priority.toUpperCase()}`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getTaskInlineKeyboard)(t.id) });
        }
    });
    composer.hears("➕ Quick Task", async (ctx) => {
        await ctx.reply("✍️ Send \`/add <task title>\` to add a new task quickly!\nExample: \`/add Read Chapter 3\``", {
            parse_mode: "Markdown",
        });
    });
    composer.hears("🎯 Active Goals", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const goals = await kaizenService.getActiveGoals(profile.id);
        if (goals.length === 0) {
            await ctx.reply("🎯 *No active goals found.* Create goals on the Kaizen web app!", {
                parse_mode: "Markdown",
            });
            return;
        }
        let text = `🎯 *Your Active Goals (${goals.length}):*\n\n`;
        for (const g of goals) {
            const progressBars = "▓".repeat(Math.round(g.progress / 10)) + "░".repeat(10 - Math.round(g.progress / 10));
            text += `• *${g.title}*\n  Progress: [${progressBars}] ${g.progress}%\n\n`;
        }
        await ctx.reply(text, { parse_mode: "Markdown" });
    });
    composer.hears("🔥 Habits", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const habits = await kaizenService.getHabitsWithTodayStatus(profile.id);
        if (habits.length === 0) {
            await ctx.reply("🔥 *No active habits found.* Add habits on the Kaizen web app!", {
                parse_mode: "Markdown",
            });
            return;
        }
        await ctx.reply(`🔥 *Your Habits (${habits.length}):*`, { parse_mode: "Markdown" });
        for (const h of habits) {
            if (h.is_completed_today) {
                await ctx.reply(`✅ *${h.title}* - Logged today! 🔥 Streak: ${h.streak} days`, {
                    parse_mode: "Markdown",
                });
            }
            else {
                await ctx.reply(`⚡ *${h.title}* (+${h.xp_reward} XP) — Streak: ${h.streak} days`, {
                    parse_mode: "Markdown",
                    reply_markup: (0, menus_js_1.getHabitInlineKeyboard)(h.id),
                });
            }
        }
    });
    composer.hears("📊 Stats & Level", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        await ctx.reply(`📊 *Kaizen Profile Stats*\n\n` +
            `👤 *Name:* ${profile.full_name || profile.username}\n` +
            `🏆 *Level:* ${profile.level}\n` +
            `⭐ *XP:* ${profile.xp}\n` +
            `🔥 *Current Streak:* ${profile.streak} days\n` +
            `📈 *Kaizen Score:* ${profile.kaizen_score}\n` +
            `🏅 *League:* ${profile.league || "Bronze"}`, { parse_mode: "Markdown" });
    });
    composer.hears("📅 Weekly Review", async (ctx) => {
        const profile = await requireLinkedProfile(ctx);
        if (!profile)
            return;
        const summary = await kaizenService.getWeeklySummary(profile.id);
        await ctx.reply(`📅 *Weekly Performance Summary*\n\n` +
            `✅ *Tasks Completed This Week:* ${summary.tasksCompletedCount}\n` +
            `⭐ *XP Earned This Week:* +${summary.xpEarnedThisWeek} XP\n` +
            `🔥 *Streak Status:* ${profile.streak} days active!`, { parse_mode: "Markdown" });
    });
    composer.hears("💬 Support", async (ctx) => {
        supportModeUsers.add(ctx.chat.id);
        await ctx.reply(`💬 *Support Mode Active*\n\n` +
            `Send your question, issue, or feedback right here in chat (text, photo, audio, or document).\n` +
            `Our support admins will receive your message and reply directly to you!`, { parse_mode: "Markdown" });
    });
    composer.hears("⭐ Premium Membership", async (ctx) => {
        await ctx.reply(`🌟 *Kaizen Premium Membership* 🌟\n\n` +
            `Unlock the ultimate productivity toolkit with Kaizen Premium:\n\n` +
            `🤖 *AI Productivity Coach*: Personalized daily action plans.\n` +
            `🔔 *Priority Duolingo-style Nudges*: Custom notification sounds & SMS fallback.\n` +
            `🎨 *Exclusive Themes & Badges*: Showcase your legend status on the leaderboard.\n` +
            `📊 *Advanced Analytics*: Detailed weekly/monthly growth charts.\n\n` +
            `*Status:* 🚀 Coming Soon!`, { parse_mode: "Markdown", reply_markup: (0, menus_js_1.getPremiumSkeletonKeyboard)() });
    });
    // Callback queries
    composer.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;
        const chatId = ctx.chat?.id || ctx.from.id;
        if (data.startsWith("set_high:")) {
            const mins = Number(data.replace("set_high:", ""));
            await kaizenService.updateNotificationSettings(chatId, { notify_high_priority_mins: mins });
            await ctx.answerCallbackQuery({ text: `Updated High Priority lead time to ${mins} mins!` });
            await ctx.reply(`✅ High Priority notifications updated to *${mins} mins* before deadline.`, {
                parse_mode: "Markdown",
            });
            return;
        }
        if (data.startsWith("set_med:")) {
            const mins = Number(data.replace("set_med:", ""));
            await kaizenService.updateNotificationSettings(chatId, { notify_medium_priority_mins: mins });
            await ctx.answerCallbackQuery({ text: `Updated Medium Priority lead time to ${mins} mins!` });
            await ctx.reply(`✅ Medium Priority notifications updated to *${mins} mins* before deadline.`, {
                parse_mode: "Markdown",
            });
            return;
        }
        if (data.startsWith("set_low:")) {
            const mins = Number(data.replace("set_low:", ""));
            await kaizenService.updateNotificationSettings(chatId, { notify_low_priority_mins: mins });
            await ctx.answerCallbackQuery({ text: `Updated Low Priority lead time to ${mins} mins!` });
            await ctx.reply(`✅ Low Priority notifications updated to *${mins} mins* before deadline.`, {
                parse_mode: "Markdown",
            });
            return;
        }
        if (data.startsWith("complete_task:")) {
            const taskId = data.replace("complete_task:", "");
            const profile = await kaizenService.getProfileByChatId(chatId);
            if (!profile) {
                await ctx.answerCallbackQuery({ text: "Please link your Kaizen account first!" });
                return;
            }
            try {
                const { task, xpAwarded } = await kaizenService.completeTask(profile.id, taskId);
                await ctx.answerCallbackQuery({ text: `🎉 Completed! +${xpAwarded} XP awarded!` });
                await ctx.editMessageText(`✅ *Task Completed!*\n"${task.title}" (+${xpAwarded} XP awarded)`, { parse_mode: "Markdown" });
            }
            catch (err) {
                await ctx.answerCallbackQuery({ text: "Error completing task: " + err.message });
            }
            return;
        }
        if (data.startsWith("log_habit:")) {
            const habitId = data.replace("log_habit:", "");
            const profile = await kaizenService.getProfileByChatId(chatId);
            if (!profile) {
                await ctx.answerCallbackQuery({ text: "Please link your Kaizen account first!" });
                return;
            }
            try {
                const { xpAwarded } = await kaizenService.logHabitCompletion(profile.id, habitId);
                await ctx.answerCallbackQuery({ text: `🔥 Habit logged! +${xpAwarded} XP awarded!` });
                await ctx.editMessageText(`✅ *Habit Logged for Today!* 🔥 (+${xpAwarded} XP)`, {
                    parse_mode: "Markdown",
                });
            }
            catch (err) {
                await ctx.answerCallbackQuery({ text: "Error logging habit: " + err.message });
            }
            return;
        }
        if (data === "premium_click") {
            await ctx.answerCallbackQuery({
                text: "🌟 Kaizen Premium is coming soon! Stay tuned!",
                show_alert: true,
            });
            return;
        }
    });
    return composer;
}
