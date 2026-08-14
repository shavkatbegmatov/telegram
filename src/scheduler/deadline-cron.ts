import type { Bot } from "grammy"
import type { KaizenService } from "../db/kaizen-services.js"
import { getTaskInlineKeyboard } from "../keyboards/menus.js"

export function startDeadlineScheduler(bot: Bot, kaizenService: KaizenService, checkIntervalMs = 2 * 60 * 1000) {
  console.log("⏰ Duolingo-style Priority Deadline Scheduler active...")

  async function checkDeadlines() {
    try {
      const expiringList = await kaizenService.getExpiringTasksForNotification()

      for (const item of expiringList) {
        const { task, profile, leadTimeMins } = item
        if (!profile.telegram_chat_id) continue

        const priority = (task.priority || "medium").toUpperCase()
        const priorityBadge = priority === "HIGH" ? "🔴 HIGH" : priority === "MEDIUM" ? "⚡ MEDIUM" : "🟢 LOW"

        let leadTimeFormatted = `${leadTimeMins} minutes`
        if (leadTimeMins >= 60) {
          const hours = Math.floor(leadTimeMins / 60)
          const mins = leadTimeMins % 60
          leadTimeFormatted = mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`
        }

        const duolingoMessage =
          `🦉 *DUO KAIZEN STREAK ALERT!* 🦉\n\n` +
          `Hey ${profile.full_name || profile.username}! Your ${priorityBadge} priority task is expiring in *${leadTimeFormatted}*!\n\n` +
          `⏳ *Task:* "${task.title}"\n` +
          `🔥 *Current Streak:* ${profile.streak} days\n` +
          `⭐ *Reward:* +${task.xp_reward} XP\n\n` +
          ` don't break your momentum! Complete your task now before time runs out! ⏰`

        try {
          await bot.api.sendMessage(profile.telegram_chat_id, duolingoMessage, {
            parse_mode: "Markdown",
            reply_markup: getTaskInlineKeyboard(task.id),
          })

          await kaizenService.markTaskNotified(task.id)
          console.log(
            `🔔 Sent Duolingo deadline alert (${priority} - ${leadTimeFormatted}) to ${profile.username} for task: "${task.title}"`
          )
        } catch (sendErr: any) {
          console.error(`❌ Failed to send deadline alert to chat ${profile.telegram_chat_id}:`, sendErr.message)
        }
      }
    } catch (err: any) {
      console.error("❌ Error in deadline check scheduler loop:", err)
    }
  }

  setTimeout(checkDeadlines, 5000)
  setInterval(checkDeadlines, checkIntervalMs)
}
