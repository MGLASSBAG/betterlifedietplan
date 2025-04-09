'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
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
  const [redirecting, setRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reference to the current step's submit function
  const stepSubmitRef = useRef<(() => Promise<boolean>) | null>(null);
  
  // Use the simplified store
  const currentStep = useFormStore((state) => state.currentStep);
  const totalSteps = useFormStore((state) => state.totalSteps);
  const formData = useFormStore((state) => state.formData);
  const nextStep = useFormStore((state) => state.nextStep);
  const prevStep = useFormStore((state) => state.prevStep);
  const resetForm = useFormStore((state) => state.resetForm);
  const setSubmitHandler = useFormStore((state) => state.setSubmitHandler);
  const isLoading = useFormStore((state) => state.isLoading);
  const setIsLoading = useFormStore((state) => state.setIsLoading);
  
  const user = useAuth();

  // Set step submit handler
  const setStepSubmitHandler = (handler: () => Promise<boolean>) => {
    stepSubmitRef.current = handler;
  };
  
  // Continue to the next step or submit on final step
  const handleContinue = async () => {
    if (stepSubmitRef.current) {
      setIsSubmitting(true);
      try {
        const validationSuccess = await stepSubmitRef.current();
        if (!validationSuccess) {
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("Error during step submission:", error);
        toast.error("An unexpected error occurred.");
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    setRedirecting(false);
    setIsLoading(true);

    try {
      if (user && user.id) {
        const savingToast = toast.loading('Saving your preferences...');
        try {
          const result = await upsertProfileData(user.id, formData);
          toast.dismiss(savingToast);
          if (result.success) {
            toast.success('Preferences saved!');
          } else {
            console.warn('Could not save preferences:', result.error);
          }
        } catch (profileError) {
          toast.dismiss(savingToast);
          console.error('Error saving profile:', profileError);
        }
      }

      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        let errorMsg = 'Failed to generate plan.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || `API Error (${response.status})`;
        } catch (e) { 
          errorMsg = `API Error (${response.status})`;
        }
        throw new Error(errorMsg);
      }
      
      const planResult = await response.json();

      if (planResult.success && planResult.plan) {
        const planData = { 
          plan: planResult.plan,
          timestamp: new Date().toISOString() 
        };
        
        localStorage.setItem('generatedPlan', JSON.stringify(planData));
        sessionStorage.setItem('generatedPlan', JSON.stringify(planData));
        
        toast.success('Plan generated successfully! Redirecting...');
        setRedirecting(true);
        
        setTimeout(() => {
          router.push('/results');
        }, 800);
      } else {
        throw new Error(planResult.error || 'API returned success=false or missing plan data.');
      }

    } catch (error: any) {
      console.error('Error during submission or plan generation:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSubmitHandler(handleSubmit);
    
    return () => setSubmitHandler(null);
  }, [setSubmitHandler, formData, user]);

  // Reset submission state when changing steps
  useEffect(() => {
    setIsSubmitting(false);
  }, [currentStep]);

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 bg-white rounded-lg shadow-xl">
      <Toaster position="top-center" />
      <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-4 sm:mb-6">BetterLifeDietPlan</div>

      {currentStep <= totalSteps && !isLoading && (
        <div className="mb-4 sm:mb-6">
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
        {currentStep === 1 && <Step1Gender setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 2 && <Step2Familiarity setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 3 && <Step3PrepTime setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 4 && <Step4Meats setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 5 && <Step5Ingredients setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 6 && <Step6Activity setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 7 && <Step7Health setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 8 && <Step8Measurements setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
        {currentStep === 9 && <StepSummary setSubmitHandler={setStepSubmitHandler} isSubmitting={isSubmitting} />}
      </div>

      {!isLoading && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between sm:space-x-4 space-y-3 sm:space-y-0">
          {/* Previous Button - Show on steps 2-9 */}
          <div className="w-full sm:w-auto">
            {currentStep > 1 && currentStep <= totalSteps && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="w-full sm:w-auto"
                disabled={isPending || isLoading || isSubmitting}
              >
                Previous
              </Button>
            )}
            {currentStep <= 1 && <div className="flex-grow sm:hidden" />}
          </div>
          
          {/* Continue/Generate Button */}
          <div className="w-full sm:w-auto">
             <Button 
                type="button" 
                onClick={handleContinue} 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center"
                disabled={isPending || isLoading || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting 
                    ? (currentStep === 9 ? 'Generating...' : 'Processing...') 
                    : (currentStep === 9 ? 'Generate My Plan' : 'Continue')
                }
              </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepFormLayout; 