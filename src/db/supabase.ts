import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { Config } from "../config.js"

let client: SupabaseClient | null = null

export function getSupabaseClient(config: Config): SupabaseClient {
  if (client) return client

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.warn("⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Database integration disabled.")
  }

  client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return client
}
