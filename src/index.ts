import { Bot } from "grammy"
import { loadConfig } from "./config.js"
import { TicketStore } from "./store/ticket-store.js"
import { setupCommandHandler } from "./handlers/command-handler.js"
import { setupUserHandler } from "./handlers/user-handler.js"
import { setupAdminHandler } from "./handlers/admin-handler.js"

async function main() {
  console.log("🚀 Initializing Support Telegram Bot...")

  // Load configuration & ticket store
  const config = loadConfig()
  const ticketStore = new TicketStore()

  // Create Bot instance
  const bot = new Bot(config.BOT_TOKEN)

  // Error handling
  bot.catch((err) => {
    console.error("❌ Telegram Bot Error Encountered:", err.error)
  })

  // Register Handlers
  bot.use(setupCommandHandler(config, ticketStore))
  bot.use(setupUserHandler(config, ticketStore))
  bot.use(setupAdminHandler(config, ticketStore))

  // Test bot authentication
  try {
    const me = await bot.api.getMe()
    console.log(`✅ Telegram Bot Authenticated successfully!`)
    console.log(`🤖 Bot Name: @${me.username} (${me.first_name})`)
    console.log(`👑 Admin Chat ID: ${config.ADMIN_CHAT_ID}`)
    console.log(`📡 Bot listening for user support messages...`)
  } catch (err: any) {
    console.error("❌ Failed to connect to Telegram API. Please verify BOT_TOKEN in .env.")
    console.error("Details:", err.message)
    process.exit(1)
  }

  // Start polling
  await bot.start({
    onStart: () => {
      console.log("🟢 Telegram Support Bot Service active and running!")
    },
  })
}

main().catch((err) => {
  console.error("💥 Fatal initialization error:", err)
  process.exit(1)
})
