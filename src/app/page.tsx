'use server'; // Mark this as a Server Component

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center">Welcome to Better Life Diet Plan</h1>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8 items-center">
        {user ? (
          <Link href="/dashboard">
            <Button size="lg">
              Go to Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
              Login / Sign Up
            </Button>
          </Link>
        )}
      </div>

      {user && (
        <div className="text-center">
          <p>Logged in as: {user.email}</p>
          {/* You could fetch and display profile data here */}
        </div>
      )}
    </main>
  );
}
