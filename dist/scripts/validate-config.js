"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("../config.js");
const grammy_1 = require("grammy");
async function validate() {
    console.log("🔍 Validating Support Telegram Bot Configuration...\n");
    const config = (0, config_js_1.loadConfig)();
    console.log("✅ Environment Variables Parsed Successfully:");
    console.log(`   - BOT_TOKEN: ${config.BOT_TOKEN.substring(0, 8)}...`);
    console.log(`   - ADMIN_CHAT_ID: ${config.ADMIN_CHAT_ID}`);
    const bot = new grammy_1.Bot(config.BOT_TOKEN);
    try {
        const me = await bot.api.getMe();
        console.log(`\n✅ Telegram API Connection Verified!`);
        console.log(`   - Bot Username: @${me.username}`);
        console.log(`   - Bot ID: ${me.id}`);
        console.log("\n🎉 Configuration is valid and ready for launch!");
    }
    catch (err) {
        console.error(`\n❌ Failed to connect to Telegram API: ${err.message}`);
        console.error("Please ensure your BOT_TOKEN is correct.");
        process.exit(1);
    }
}
validate();
