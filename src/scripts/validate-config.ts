import { loadConfig } from "../config.js"
import { Bot } from "grammy"

async function validate() {
  console.log("🔍 Validating Support Telegram Bot Configuration...\n")

  const config = loadConfig()
  console.log("✅ Environment Variables Parsed Successfully:")
  console.log(`   - BOT_TOKEN: ${config.BOT_TOKEN.substring(0, 8)}...`)
  console.log(`   - ADMIN_CHAT_ID: ${config.ADMIN_CHAT_ID}`)

  const bot = new Bot(config.BOT_TOKEN)
  try {
    const me = await bot.api.getMe()
    console.log(`\n✅ Telegram API Connection Verified!`)
    console.log(`   - Bot Username: @${me.username}`)
    console.log(`   - Bot ID: ${me.id}`)
    console.log("\n🎉 Configuration is valid and ready for launch!")
  } catch (err: any) {
    console.error(`\n❌ Failed to connect to Telegram API: ${err.message}`)
    console.error("Please ensure your BOT_TOKEN is correct.")
    process.exit(1)
  }
}

validate()
