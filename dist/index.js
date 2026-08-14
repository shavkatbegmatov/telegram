"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const config_js_1 = require("./config.js");
const ticket_store_js_1 = require("./store/ticket-store.js");
const command_handler_js_1 = require("./handlers/command-handler.js");
const user_handler_js_1 = require("./handlers/user-handler.js");
const admin_handler_js_1 = require("./handlers/admin-handler.js");
async function main() {
    console.log("🚀 Initializing Support Telegram Bot...");
    // Load configuration & ticket store
    const config = (0, config_js_1.loadConfig)();
    const ticketStore = new ticket_store_js_1.TicketStore();
    // Create Bot instance
    const bot = new grammy_1.Bot(config.BOT_TOKEN);
    // Error handling
    bot.catch((err) => {
        console.error("❌ Telegram Bot Error Encountered:", err.error);
    });
    // Register Handlers
    bot.use((0, command_handler_js_1.setupCommandHandler)(config, ticketStore));
    bot.use((0, user_handler_js_1.setupUserHandler)(config, ticketStore));
    bot.use((0, admin_handler_js_1.setupAdminHandler)(config, ticketStore));
    // Test bot authentication
    try {
        const me = await bot.api.getMe();
        console.log(`✅ Telegram Bot Authenticated successfully!`);
        console.log(`🤖 Bot Name: @${me.username} (${me.first_name})`);
        console.log(`👑 Admin Chat ID: ${config.ADMIN_CHAT_ID}`);
        console.log(`📡 Bot listening for user support messages...`);
    }
    catch (err) {
        console.error("❌ Failed to connect to Telegram API. Please verify BOT_TOKEN in .env.");
        console.error("Details:", err.message);
        process.exit(1);
    }
    // Start polling
    await bot.start({
        onStart: () => {
            console.log("🟢 Telegram Support Bot Service active and running!");
        },
    });
}
main().catch((err) => {
    console.error("💥 Fatal initialization error:", err);
    process.exit(1);
});
