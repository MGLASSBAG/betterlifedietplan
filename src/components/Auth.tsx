import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
// import { supabase } from '@/lib/supabase'; // Removed old import
import { createClient } from '@/utils/supabase/client'; // Import new client utility

export default function AuthComponent() {
  const supabase = createClient(); // Create client instance inside component

  return (
    <div className="auth-container">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="light"
        providers={[]} // Empty array to hide all social providers
        redirectTo="/dashboard" // Ensure this redirect path exists
      />
    </div>
  );
} 