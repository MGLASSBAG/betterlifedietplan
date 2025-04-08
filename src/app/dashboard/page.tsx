'use server'; // Make this a server component initially to fetch user

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import Link from 'next/link';

export default async function Dashboard() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if no user
  if (!user) {
    redirect('/login');
  }

  // We fetched the user server-side. The ProfileForm is a client component
  // and will handle fetching its own data based on the passed user prop.

  return (
    <main className="flex min-h-screen flex-col p-8 md:p-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <form action="/auth/signout" method="post">
          <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        </form>
      </div>
      <p className="mb-6">Welcome, {user.email}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          {/* ProfileForm is a Client Component, pass the user object to it */}
          <ProfileForm user={user} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Diet Plans</h2>
          {/* TODO: Fetch and display diet plans */} 
          <p className="mb-4">No diet plans yet. Complete your profile and get started!</p>
          <Link href="/create-plan">
             <button
               className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
             >
               Create New Diet Plan
             </button>
          </Link>
        </div>
      </div>
    </main>
  );
} 