"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const config_js_1 = require("./config.js");
const supabase_js_1 = require("./db/supabase.js");
const kaizen_services_js_1 = require("./db/kaizen-services.js");
const ticket_store_js_1 = require("./store/ticket-store.js");
const command_handler_js_1 = require("./handlers/command-handler.js");
const user_handler_js_1 = require("./handlers/user-handler.js");
const admin_handler_js_1 = require("./handlers/admin-handler.js");
const deadline_cron_js_1 = require("./scheduler/deadline-cron.js");
async function main() {
    console.log("🚀 Initializing Kaizen Telegram Bot & Support Engine...");
    // 1. Load configuration
    const config = (0, config_js_1.loadConfig)();
    const ticketStore = new ticket_store_js_1.TicketStore();
    // 2. Initialize Supabase Client & Kaizen Service
    const supabase = (0, supabase_js_1.getSupabaseClient)(config);
    const kaizenService = new kaizen_services_js_1.KaizenService(supabase);
    // 3. Create Bot instance
    const bot = new grammy_1.Bot(config.BOT_TOKEN);
    // Error handling
    bot.catch((err) => {
        console.error("❌ Telegram Bot Error Encountered:", err.error);
    });
    // 4. Register Handlers
    bot.use((0, command_handler_js_1.setupCommandHandler)(config, ticketStore, kaizenService));
    bot.use((0, user_handler_js_1.setupUserHandler)(config, ticketStore));
    bot.use((0, admin_handler_js_1.setupAdminHandler)(config, ticketStore));
    // 5. Start Duolingo-style Task Deadline Scheduler
    (0, deadline_cron_js_1.startDeadlineScheduler)(bot, kaizenService);
    // 6. Test bot authentication
    try {
        const me = await bot.api.getMe();
        console.log(`✅ Telegram Bot Authenticated successfully!`);
        console.log(`🤖 Bot Name: @${me.username} (${me.first_name})`);
        console.log(`👑 Admin Chat ID: ${config.ADMIN_CHAT_ID}`);
        console.log(`📡 Bot listening for tasks, habits, and support requests...`);
    }
    catch (err) {
        console.error("❌ Failed to connect to Telegram API. Please verify BOT_TOKEN in .env.");
        console.error("Details:", err.message);
        process.exit(1);
    }
    // 7. Start polling
    await bot.start({
        onStart: () => {
            console.log("🟢 Kaizen Telegram Bot Service active and running!");
        },
    });
}
main().catch((err) => {
    console.error("💥 Fatal initialization error:", err);
    process.exit(1);
});
