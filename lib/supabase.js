import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if keys are custom and valid
const isConfigured = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes("sua-url-do-supabase") && 
  !supabaseAnonKey.includes("sua-chave-anon-do-supabase");

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn("Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file to enable Google Login and Cloud Sync.");
}
