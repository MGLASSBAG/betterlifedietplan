'use client';

import React from 'react';
import { useFormStore } from '@/stores/formStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper function to format array data for display
const formatArray = (arr: string[] | undefined | null): string => {
  if (!arr || arr.length === 0) return 'None specified';
  if (arr.includes('none')) return 'None specified / All included';
  if (arr.includes('vegetarian') && arr.length === 1) return 'Vegetarian'; // Specific case for meats
  // Filter out 'none' if other items are present
  const filteredArr = arr.filter(item => item !== 'none');
  // Capitalize first letter of each item (optional)
  return filteredArr.map(item => item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ')).join(', ');
};

// Helper mapping for display labels (similar to PHP)
const displayMappings = {
    gender: {
        male: 'Male',
        female: 'Female',
        '': 'N/A'
    },
    familiarity: {
        beginner: 'Beginner',
        somewhat_familiar: 'Somewhat Familiar',
        expert: 'Expert',
        '': 'N/A'
    },
    prep_time: {
        '15_mins': '15 Minutes',
        '30_mins': '30 Minutes',
        '60_plus_mins': '60+ Minutes',
        '': 'N/A'
    },
    activity_level: {
        not_active: 'Not Active (Sedentary)',
        moderately_active: 'Moderately Active (1-3 times/week)',
        very_active: 'Very Active (4+ times/week)',
        '': 'N/A'
    },
};

const StepSummary = () => {
  // Get the complete form data from the store
  const formData = useFormStore((state) => state.formData);

  const renderMeasurement = (label: string, value: number | string | null | undefined, unit: string = '') => {
    return (
       <div className="flex justify-between py-2 border-b">
         <dt className="text-sm font-medium text-gray-600">{label}</dt>
         <dd className="text-sm text-gray-900">{value ?? 'N/A'}{unit ? ` ${unit}` : ''}</dd>
       </div>
     );
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Review Your Selections</h2>
        
        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Your Profile</CardTitle>
          </CardHeader>
           <CardContent>
             <dl className="divide-y divide-gray-200">
               <div className="flex justify-between py-2">
                 <dt className="text-sm font-medium text-gray-600">Gender</dt>
                 <dd className="text-sm text-gray-900">{displayMappings.gender[formData.gender || ''] || 'N/A'}</dd>
               </div>
               <div className="flex justify-between py-2">
                 <dt className="text-sm font-medium text-gray-600">Keto Familiarity</dt>
                 <dd className="text-sm text-gray-900">{displayMappings.familiarity[formData.familiarity || ''] || 'N/A'}</dd>
               </div>
               <div className="flex justify-between py-2">
                 <dt className="text-sm font-medium text-gray-600">Meal Prep Time</dt>
                 <dd className="text-sm text-gray-900">{displayMappings.prep_time[formData.prep_time || ''] || 'N/A'}</dd>
               </div>
                <div className="flex justify-between py-2">
                 <dt className="text-sm font-medium text-gray-600">Activity Level</dt>
                 <dd className="text-sm text-gray-900">{displayMappings.activity_level[formData.activity_level || ''] || 'N/A'}</dd>
               </div>
             </dl>
           </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Preferences & Health</CardTitle>
          </CardHeader>
          <CardContent>
             <dl className="divide-y divide-gray-200">
                <div className="py-2">
                 <dt className="text-sm font-medium text-gray-600 mb-1">Meats Disliked</dt>
                 <dd className="text-sm text-gray-900">{formatArray(formData.disliked_meats)}</dd>
               </div>
                <div className="py-2">
                 <dt className="text-sm font-medium text-gray-600 mb-1">Ingredients Disliked</dt>
                 <dd className="text-sm text-gray-900">{formatArray(formData.disliked_ingredients)}</dd>
               </div>
                <div className="py-2">
                 <dt className="text-sm font-medium text-gray-600 mb-1">Health Conditions</dt>
                 <dd className="text-sm text-gray-900">{formatArray(formData.health_conditions)}</dd>
               </div>
             </dl>
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
             <CardTitle className="text-lg">Measurements ({formData.units === 'metric' ? 'Metric' : 'Imperial'})</CardTitle>
          </CardHeader>
           <CardContent>
             <dl className="divide-y divide-gray-200">
                {renderMeasurement('Age', formData.age)}
                {formData.units === 'metric' ? (
                  <>
                    {renderMeasurement('Height', formData.height_cm, 'cm')}
                    {renderMeasurement('Current Weight', formData.current_weight_kg, 'kg')}
                    {renderMeasurement('Target Weight', formData.target_weight_kg, 'kg')}
                  </>
                ) : (
                  <>
                     <div className="flex justify-between py-2 border-b">
                       <dt className="text-sm font-medium text-gray-600">Height</dt>
                       <dd className="text-sm text-gray-900">
                         {formData.height_ft ?? 'N/A'} ft {formData.height_in ?? 'N/A'} in
                       </dd>
                     </div>
                    {renderMeasurement('Current Weight', formData.current_weight_lbs, 'lbs')}
                    {renderMeasurement('Target Weight', formData.target_weight_lbs, 'lbs')}
                  </>
                )}
             </dl>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
            Please review your selections carefully. You can use the "Back" button to make changes.
        </p>
    </div>
  );
};

export default StepSummary; 