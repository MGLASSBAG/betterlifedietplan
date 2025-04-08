'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Define the type for the profile data subset we might receive from steps
// This should align with the columns in your 'profiles' table
type ProfileData = {
  gender?: 'male' | 'female' | null;
  familiarity?: 'beginner' | 'somewhat_familiar' | 'expert' | null;
  prep_time?: '15_mins' | '30_mins' | '60_plus_mins' | null;
  disliked_meats?: string[]; 
  disliked_ingredients?: string[];
  activity_level?: 'not_active' | 'moderately_active' | 'very_active' | null; 
  health_conditions?: string[];
  age?: number | null;
  units?: 'metric' | 'imperial';
  height_cm?: number | null;
  current_weight_kg?: number | null;
  target_weight_kg?: number | null;
  height_ft?: number | null;
  height_in?: number | null;
  current_weight_lbs?: number | null;
  target_weight_lbs?: number | null;
  // goals?: string | null; 
};


export async function upsertProfileData(userId: string, data: ProfileData): Promise<{ success: boolean; error?: any }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!userId) {
    console.error('User ID is required to upsert profile data.');
    return { success: false, error: 'User ID missing' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId); // Ensure upsert targets the correct user

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    // Optionally revalidate paths if this data affects displayed content immediately
    // e.g., revalidatePath('/dashboard');

    console.log('Profile data upserted successfully for user:', userId, 'Data:', data);
    return { success: true };

  } catch (error) {
    console.error('Error in upsertProfileData action:', error);
    return { success: false, error: error };
  }
} 