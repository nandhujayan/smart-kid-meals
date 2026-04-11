// For Vite projects, 'server' utilities are typically used in Edge Functions or Backend scripts.
// This matches the pattern you requested but is adapted for a non-Next.js environment.
import { createServerClient } from "@supabase/ssr";

export const createClient = (token: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return []; // Standard cookies aren't directly available in plain Vite/SPA server contexts
        },
        setAll(cookiesToSet) {
          // No-op for SPA server contexts
        },
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
};
