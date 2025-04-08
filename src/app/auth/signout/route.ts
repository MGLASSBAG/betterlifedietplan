import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    // Optionally handle error state, maybe redirect to an error page
    return redirect('/?error=Could not sign out');
  }

  // Revalidate relevant paths or the whole site
  revalidatePath('/', 'layout'); 

  return redirect('/login'); // Redirect to login page after sign out
} 