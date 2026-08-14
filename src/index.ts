import { Bot } from "grammy"
import { loadConfig } from "./config.js"
import { getSupabaseClient } from "./db/supabase.js"
import { KaizenService } from "./db/kaizen-services.js"
import { TicketStore } from "./store/ticket-store.js"
import { setupCommandHandler } from "./handlers/command-handler.js"
import { setupUserHandler } from "./handlers/user-handler.js"
import { setupAdminHandler } from "./handlers/admin-handler.js"
import { startDeadlineScheduler } from "./scheduler/deadline-cron.js"

async function main() {
  console.log("🚀 Initializing Kaizen Telegram Bot & Support Engine...")

  // 1. Load configuration
  const config = loadConfig()
  const ticketStore = new TicketStore()

  // 2. Initialize Supabase Client & Kaizen Service
  const supabase = getSupabaseClient(config)
  const kaizenService = new KaizenService(supabase)

  // 3. Create Bot instance
  const bot = new Bot(config.BOT_TOKEN)

  // Error handling
  bot.catch((err) => {
    console.error("❌ Telegram Bot Error Encountered:", err.error)
  })

  // 4. Register Handlers
  bot.use(setupCommandHandler(config, ticketStore, kaizenService))
  bot.use(setupUserHandler(config, ticketStore))
  bot.use(setupAdminHandler(config, ticketStore))

  // 5. Start Duolingo-style Task Deadline Scheduler
  startDeadlineScheduler(bot, kaizenService)

  // 6. Test bot authentication
  try {
    const me = await bot.api.getMe()
    console.log(`✅ Telegram Bot Authenticated successfully!`)
    console.log(`🤖 Bot Name: @${me.username} (${me.first_name})`)
    console.log(`👑 Admin Chat ID: ${config.ADMIN_CHAT_ID}`)
    console.log(`📡 Bot listening for tasks, habits, and support requests...`)
  } catch (err: any) {
    console.error("❌ Failed to connect to Telegram API. Please verify BOT_TOKEN in .env.")
    console.error("Details:", err.message)
    process.exit(1)
  }

  // 7. Start polling
  await bot.start({
    onStart: () => {
      console.log("🟢 Kaizen Telegram Bot Service active and running!")
    },
  })
}

main().catch((err) => {
  console.error("💥 Fatal initialization error:", err)
  process.exit(1)
})
