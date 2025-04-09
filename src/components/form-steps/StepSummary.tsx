'use client';

import React, { useState, useEffect } from 'react';
import { useFormStore } from '@/stores/formStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingStatus from '../LoadingStatus';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "react-hot-toast";

// Helper function to format array data, including 'other' description
const formatArrayWithOther = (
    arr: string[] | undefined | null, 
    otherDesc: string | undefined | null,
    otherId: string = 'other' // ID used for the 'other' option
): string => {
  if (!arr || arr.length === 0) return 'None specified';
  
  let displayItems = arr
    .filter(item => item !== 'none') // Filter out 'none' if other items are present
    .map(item => {
        if (item === otherId && otherDesc && otherDesc.trim()) {
            return `Other (${otherDesc.trim()})`; // Include description
        }
        // Simple capitalization, adjust as needed
        return item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' '); 
    });

  if (displayItems.length === 0) {
      // If only 'none' was selected originally, or filtering left nothing
      return 'None specified / All included';
  }
  
  if (arr.includes('vegetarian') && arr.length === 1) return 'Vegetarian'; // Specific case for meats remains

  return displayItems.join(', ');
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

type StepSummaryProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

const StepSummary = ({ setSubmitHandler, isSubmitting }: StepSummaryProps) => {
  const formData = useFormStore((state) => state.formData);
  const triggerSubmit = useFormStore((state) => state.triggerSubmit);
  const isLoading = useFormStore((state) => state.isLoading);
  const [error, setError] = useState<string | null>(null);

  const renderMeasurement = (label: string, value: number | string | null | undefined, unit: string = '') => {
    return (
       <div className="flex justify-between py-2 border-b">
         <dt className="text-sm font-medium text-gray-600">{label}</dt>
         <dd className="text-sm text-gray-900">{value ?? 'N/A'}{unit ? ` ${unit}` : ''}</dd>
       </div>
     );
  };

  const handleGenerateClick = () => {
    setError(null);
    triggerSubmit(); 
  };

  useEffect(() => {
    setSubmitHandler(async () => {
      handleGenerateClick();
      return true;
    });
  }, [setSubmitHandler, handleGenerateClick]);

  if (isLoading) {
    return <LoadingStatus />;
  }

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
                 <dd className="text-sm text-gray-900">
                   {formatArrayWithOther(formData.disliked_meats, formData.other_meat_description)}
                 </dd>
               </div>
                <div className="py-2">
                 <dt className="text-sm font-medium text-gray-600 mb-1">Ingredients Disliked</dt>
                 <dd className="text-sm text-gray-900">
                    {formatArrayWithOther(formData.disliked_ingredients, formData.other_ingredient_description)}
                 </dd>
               </div>
                <div className="py-2">
                 <dt className="text-sm font-medium text-gray-600 mb-1">Health Conditions</dt>
                 <dd className="text-sm text-gray-900">
                   {formatArrayWithOther(formData.health_conditions, formData.other_health_description)}
                 </dd>
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