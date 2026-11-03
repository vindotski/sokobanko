import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

let client: SupabaseClient<Database> | undefined;

/**
 * The completions database, with the secret key. Only this server reads and
 * writes completions, after requireUser has checked the player's session, so
 * the key never reaches the browser.
 */
export function supabase() {
  if (!client) {
    const { supabaseUrl, supabaseSecretKey } = useRuntimeConfig();
    client = createClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
