"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
let client = null;
function getSupabaseClient(config) {
    if (client)
        return client;
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
        console.warn("⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Database integration disabled.");
    }
    client = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return client;
}
