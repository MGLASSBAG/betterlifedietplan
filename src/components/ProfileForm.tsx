'use client';

import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/lib/supabase'; // Removed old import
import { createClient } from '@/utils/supabase/client'; // Import new client utility
import { type User } from '@supabase/supabase-js';

// Define a type for the profile data
type Profile = {
  name: string | null;
  gender: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  dietary_restrictions: string[] | null;
  goals: string | null;
};

export default function ProfileForm({ user }: { user: User }) {
  const supabase = createClient(); // Create client instance
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    name: null,
    gender: null,
    age: null,
    weight: null,
    height: null,
    activity_level: null,
    dietary_restrictions: null,
    goals: null
  });

  // Fetch profile data
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`name, gender, age, weight, height, activity_level, dietary_restrictions, goals`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        console.error('Error loading user data:', error);
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      alert('Error loading user data!');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    getProfile();
  }, [user, getProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updates = {
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
        
      if (error) throw error;
      alert('Profile updated!');
    } catch (error) {
      alert('Error updating the data!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       {loading && <p>Loading profile...</p>}
      {/* Form fields remain largely the same, ensure values handle null properly */}
       <div>
         <label className="block text-sm font-medium text-gray-700">Name</label>
         <input
           type="text"
           name="name"
           value={profile.name || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         />
       </div>
       
       <div>
         <label className="block text-sm font-medium text-gray-700">Gender</label>
         <select
           name="gender"
           value={profile.gender || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         >
           <option value="">Select</option>
           <option value="male">Male</option>
           <option value="female">Female</option>
           <option value="other">Other</option>
         </select>
       </div>
       
       <div>
         <label className="block text-sm font-medium text-gray-700">Age</label>
         <input
           type="number"
           name="age"
           value={profile.age || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         />
       </div>
       
       <div>
         <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
         <input
           type="number"
           name="weight"
           value={profile.weight || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         />
       </div>
       
       <div>
         <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
         <input
           type="number"
           name="height"
           value={profile.height || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         />
       </div>
       
       <div>
         <label className="block text-sm font-medium text-gray-700">Activity Level</label>
         <select
           name="activity_level"
           value={profile.activity_level || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         >
           <option value="">Select</option>
           <option value="sedentary">Sedentary</option>
           <option value="light">Light Exercise</option>
           <option value="moderate">Moderate Exercise</option>
           <option value="active">Active</option>
           <option value="very_active">Very Active</option>
         </select>
       </div>
       
       {/* TODO: Add handling for dietary_restrictions array if needed */}

       <div>
         <label className="block text-sm font-medium text-gray-700">Goals</label>
         <textarea
           name="goals"
           value={profile.goals || ''} // Handle null
           onChange={handleChange}
           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
         />
       </div>
       
       <button
         type="submit"
         disabled={loading}
         className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
       >
         {loading ? 'Saving...' : 'Save Profile'}
       </button>
    </form>
  );
} 