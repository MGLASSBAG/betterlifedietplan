import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // We need to cast to any because the type definitions expect a Promise,
          // but Next.js cookies() API returns synchronously
          return (cookieStore as any).get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          try {
            // We need to cast to any because the type definitions expect a Promise,
            // but Next.js cookies() API sets synchronously
            (cookieStore as any).set(name, value, options);
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options?: CookieOptions) {
          try {
            // We need to cast to any because the type definitions expect a Promise,
            // but Next.js cookies() API deletes synchronously
            (cookieStore as any).delete(name, options);
          } catch {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      },
    },
  );
}; 