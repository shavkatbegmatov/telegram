"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    BOT_TOKEN: zod_1.z.string().min(1, "BOT_TOKEN is required"),
    ADMIN_CHAT_ID: zod_1.z.string().min(1, "ADMIN_CHAT_ID is required"),
    WELCOME_MESSAGE: zod_1.z
        .string()
        .default("👋 Welcome to Support! Send us any question, feedback, or request and our team will get back to you shortly."),
    AUTO_REPLY_MESSAGE: zod_1.z
        .string()
        .default("✅ Your message has been received by our support team! We will reply to you as soon as possible."),
});
function loadConfig() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Configuration Error:");
        result.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        });
        console.error("\n💡 Please check your .env file in the telegram/ directory.");
        process.exit(1);
    }
    return {
        ...result.data,
        adminChatIdNumber: Number(result.data.ADMIN_CHAT_ID),
    };
}
