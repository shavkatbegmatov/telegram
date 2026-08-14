import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  ADMIN_CHAT_ID: z.string().min(1, "ADMIN_CHAT_ID is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  WELCOME_MESSAGE: z
    .string()
    .default(
      "👋 Welcome to Kaizen Support & Task Companion! Connect your account to manage tasks, log habits, and receive deadline reminders."
    ),
  AUTO_REPLY_MESSAGE: z
    .string()
    .default(
      "✅ Your message has been received by our support team! We will reply to you as soon as possible."
    ),
})

export function loadConfig() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error("❌ Configuration Error:")
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
    })
    console.error(
      "\n💡 Please check your .env file in the telegram/ directory."
    )
    process.exit(1)
  }

  return {
    ...result.data,
    adminChatIdNumber: Number(result.data.ADMIN_CHAT_ID),
    supabaseUrl: result.data.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseServiceKey: result.data.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }
}

export type Config = ReturnType<typeof loadConfig>
