import { Keyboard, InlineKeyboard } from "grammy"

export function getMainMenuKeyboard() {
  return new Keyboard()
    .text("📋 Today's Tasks").text("➕ Quick Task").row()
    .text("🎯 Active Goals").text("🔥 Habits").row()
    .text("📊 Stats & Level").text("📅 Weekly Review").row()
    .text("💬 Support").text("⭐ Premium Membership").row()
    .text("⚙️ Notification Settings").row()
    .resized()
}

export function getTaskInlineKeyboard(taskId: string) {
  return new InlineKeyboard().text("✅ Complete Task (+XP)", `complete_task:${taskId}`)
}

export function getHabitInlineKeyboard(habitId: string) {
  return new InlineKeyboard().text("🔥 Log Habit (+XP)", `log_habit:${habitId}`)
}

export function getPremiumSkeletonKeyboard() {
  return new InlineKeyboard().text("🌟 Upgrade to Kaizen Premium (Coming Soon)", "premium_click")
}

export function getNotificationSettingsInlineKeyboard() {
  return new InlineKeyboard()
    .text("🔴 High Priority: 30m", "set_high:30").text("🔴 High: 1h", "set_high:60").text("🔴 High: 2h", "set_high:120").row()
    .text("⚡ Medium Priority: 15m", "set_med:15").text("⚡ Med: 30m", "set_med:30").text("⚡ Med: 1h", "set_med:60").row()
    .text("🟢 Low Priority: 15m", "set_low:15").text("🟢 Low: 30m", "set_low:30").text("🟢 Low: 1h", "set_low:60")
}
