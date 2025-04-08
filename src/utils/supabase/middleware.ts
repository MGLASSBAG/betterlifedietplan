import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Define the cookie shape
interface Cookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          request.cookies.delete(name);
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.delete(name);
        }
      },
    }
  );

  // IMPORTANT: Avoid writing Supabase options to cookies in middleware!
  // This prevents issues with zwischengeschaltete Network Requests.
  // Instead, we just refresh the session and let the Browser handle
  // cookie updates accordingly.
  await supabase.auth.getUser();

  return supabaseResponse;
}; 