"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainMenuKeyboard = getMainMenuKeyboard;
exports.getTaskInlineKeyboard = getTaskInlineKeyboard;
exports.getHabitInlineKeyboard = getHabitInlineKeyboard;
exports.getPremiumSkeletonKeyboard = getPremiumSkeletonKeyboard;
exports.getNotificationSettingsInlineKeyboard = getNotificationSettingsInlineKeyboard;
const grammy_1 = require("grammy");
function getMainMenuKeyboard() {
    return new grammy_1.Keyboard()
        .text("📋 Today's Tasks").text("➕ Quick Task").row()
        .text("🎯 Active Goals").text("🔥 Habits").row()
        .text("📊 Stats & Level").text("📅 Weekly Review").row()
        .text("💬 Support").text("⭐ Premium Membership").row()
        .text("⚙️ Notification Settings").row()
        .resized();
}
function getTaskInlineKeyboard(taskId) {
    return new grammy_1.InlineKeyboard().text("✅ Complete Task (+XP)", `complete_task:${taskId}`);
}
function getHabitInlineKeyboard(habitId) {
    return new grammy_1.InlineKeyboard().text("🔥 Log Habit (+XP)", `log_habit:${habitId}`);
}
function getPremiumSkeletonKeyboard() {
    return new grammy_1.InlineKeyboard().text("🌟 Upgrade to Kaizen Premium (Coming Soon)", "premium_click");
}
function getNotificationSettingsInlineKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text("🔴 High Priority: 30m", "set_high:30").text("🔴 High: 1h", "set_high:60").text("🔴 High: 2h", "set_high:120").row()
        .text("⚡ Medium Priority: 15m", "set_med:15").text("⚡ Med: 30m", "set_med:30").text("⚡ Med: 1h", "set_med:60").row()
        .text("🟢 Low Priority: 15m", "set_low:15").text("🟢 Low: 30m", "set_low:30").text("🟢 Low: 1h", "set_low:60");
}
