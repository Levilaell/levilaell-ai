import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && (anonKey || serviceKey));
}

let browserClient: SupabaseClient<Database> | null = null;
let serviceClient: SupabaseClient<Database> | null = null;

export function getSupabaseAnon(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

export function getSupabaseService(): SupabaseClient<Database> | null {
  if (!url || !serviceKey) return null;
  if (!serviceClient) {
    serviceClient = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
