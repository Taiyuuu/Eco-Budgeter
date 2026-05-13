import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Extract tid from current URL to ensure the client matches the middleware cookie
  const tid = typeof window !== "undefined" 
    ? new URLSearchParams(window.location.search).get("tid") 
    : null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
        persistSession: true,
      },
      cookieOptions: {
        name: tid ? `sb-${tid}-auth-token` : undefined,
      },
    }
  );
}
