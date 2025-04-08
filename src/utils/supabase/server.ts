import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieList = await cookieStore;
          return cookieList.get(name)?.value;
        },
        async set(name: string, value: string, options?: CookieOptions) {
          try {
            const cookieList = await cookieStore;
            cookieList.set(name, value, options);
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options?: CookieOptions) {
          try {
            const cookieList = await cookieStore;
            // Next.js 15 cookies().delete() only accepts a single parameter
            // Either just the name or an object with a name property
            cookieList.delete({
              name: name,
              ...options
            });
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