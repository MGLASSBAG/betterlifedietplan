'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useFormStore } from '@/stores/formStore';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { upsertProfileData } from '@/app/actions/profileActions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Import all step components
import Step1Gender from './form-steps/Step1Gender';
import Step2Familiarity from './form-steps/Step2Familiarity';
import Step3PrepTime from './form-steps/Step3PrepTime';
import Step4Meats from './form-steps/Step4Meats';
import Step5Ingredients from './form-steps/Step5Ingredients';
import Step6Activity from './form-steps/Step6Activity';
import Step7Health from './form-steps/Step7Health';
import Step8Measurements from './form-steps/Step8Measurements';
import StepSummary from './form-steps/StepSummary';

const MultiStepFormLayout = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  
  // Loading messages to display during plan generation
  const loadingMessages = [
    "Analyzing gender information...",
    "Considering Keto familiarity level...",
    "Factoring in meal prep time...",
    "Noting meat preferences...",
    "Avoiding disliked ingredients...",
    "Adjusting for activity level...",
    "Reviewing health conditions...",
    "Calculating based on measurements...",
    "Preparing your personalized plan...",
    "Finalizing details..."
  ];
  
  // Set up loading message rotation
  useEffect(() => {
    if (!isLoadingPlan) return;
    
    let currentMessageIndex = 0;
    const interval = setInterval(() => {
      setLoadingMessage(loadingMessages[currentMessageIndex]);
      currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
    }, 2000); // Change message every 2 seconds
    
    return () => clearInterval(interval);
  }, [isLoadingPlan]);

  // Use the simplified store
  const currentStep = useFormStore((state) => state.currentStep);
  const totalSteps = useFormStore((state) => state.totalSteps);
  const formData = useFormStore((state) => state.formData);
  const nextStep = useFormStore((state) => state.nextStep);
  const prevStep = useFormStore((state) => state.prevStep);
  const resetForm = useFormStore((state) => state.resetForm);
  const setSubmitHandler = useFormStore((state) => state.setSubmitHandler);
  
  const user = useAuth();

  const handleSubmit = async () => {
    setIsLoadingPlan(true);

    try {
      if (user && user.id) {
        toast.loading('Saving your preferences...');
        const result = await upsertProfileData(user.id, formData);
        toast.dismiss();
        if (result.success) {
          toast.success('Preferences saved!');
        } else {
          toast.error('Could not save preferences. Please try again later.');
        }
      }

      toast.loading('Generating your plan...');
      
      // Using the Edge API route instead of server action
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const planResult = await response.json();
      toast.dismiss();

      if (planResult.success && planResult.plan) {
        // Store the plan in both localStorage and sessionStorage for persistence
        // Note: We're storing the raw JSON string for structured data
        const planData = { 
          plan: planResult.raw || JSON.stringify(planResult.plan), 
          timestamp: new Date().toISOString() 
        };
        localStorage.setItem('generatedPlan', JSON.stringify(planData));
        sessionStorage.setItem('generatedPlan', JSON.stringify(planData));
        
        toast.success('Plan generated successfully!');
        setRedirecting(true);
        
        // Small timeout to allow toast to show before redirecting
        setTimeout(() => {
          router.push('/results');
        }, 800);
      } else {
         throw new Error(planResult.error || 'Failed to generate plan content.');
      }

    } catch (error: any) {
      toast.dismiss();
      console.error('Error during submission or plan generation:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Register the submit handler with the form store
  useEffect(() => {
    setSubmitHandler(handleSubmit);
    
    // Clean up on unmount
    return () => setSubmitHandler(null);
  }, [setSubmitHandler]); // Only when setSubmitHandler changes

  return (
    <div className="container mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-xl">
      <Toaster position="top-center" />
      <div className="text-center text-2xl font-bold text-red-600 mb-6">BetterLifeDietPlan</div>

      {currentStep <= totalSteps && !isLoadingPlan && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-gray-700">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {currentStep === 1 && <Step1Gender />}
        {currentStep === 2 && <Step2Familiarity />}
        {currentStep === 3 && <Step3PrepTime />}
        {currentStep === 4 && <Step4Meats />}
        {currentStep === 5 && <Step5Ingredients />}
        {currentStep === 6 && <Step6Activity />}
        {currentStep === 7 && <Step7Health />}
        {currentStep === 8 && <Step8Measurements />}
        {currentStep === 9 && <StepSummary />}
      </div>

      {isLoadingPlan ? (
        <div className="mt-6 flex flex-col items-center">
          <Button disabled className="mb-2">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {redirecting ? 'Redirecting to your results...' : 'Generating your personalized plan...'}
          </Button>
          <p className="text-sm text-gray-600 animate-pulse">{redirecting ? 'Almost there!' : loadingMessage}</p>
        </div>
      ) : (
        <div className="mt-6 flex justify-between">
          {currentStep > 1 && currentStep <= totalSteps && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="mr-2"
              disabled={isPending || isLoadingPlan}
            >
              Previous
            </Button>
          )}
          {currentStep === 1 && <div className="mr-2" />}
          {/* Only show Generate My Plan button in bottom nav if we're NOT on the summary page */}
          {currentStep === totalSteps && currentStep !== 9 && (
            <Button
              onClick={handleSubmit}
              className="ml-auto bg-red-600 hover:bg-red-700"
              disabled={isPending || isLoadingPlan}
            >
              Generate My Plan
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiStepFormLayout; 