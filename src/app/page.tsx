'use server'; // Mark this as a Server Component

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-12">Welcome to Better Life Diet Plan</h1>
      
      <div className="flex space-x-4 mb-8">
        {user ? (
          <Link href="/dashboard">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Go to Dashboard
            </button>
          </Link>
        ) : (
          <Link href="/login">
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Login / Sign Up
            </button>
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
