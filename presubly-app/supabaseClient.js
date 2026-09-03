import { createClient } from "@supabase/supabase-js";

/* Browser Supabase client. Only the anon (public) key lives here — safe to ship. */
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("[Presubly] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil. .env dosyasını oluşturun (bkz. .env.example).");
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anon || "public-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
