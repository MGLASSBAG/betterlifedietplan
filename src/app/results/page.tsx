'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import FormattedPlan from '@/components/FormattedPlan';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ResultsPage() {
  // State can hold string (from storage) or object (direct from API response if not stored yet)
  const [plan, setPlan] = useState<string | object | null>(null); 
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      let planData: string | object | null = null;
      let loadedFromStorage = false;

      // 1. Check sessionStorage first (likely place after generation)
      let storedPlanSession = sessionStorage.getItem('generatedPlan');
      if (storedPlanSession) {
        console.log("Plan retrieved from sessionStorage");
        planData = storedPlanSession;
        loadedFromStorage = true;
      } else {
        // 2. Check localStorage if not in session
        let storedPlanLocal = localStorage.getItem('generatedPlan');
        if (storedPlanLocal) {
          console.log("Plan retrieved from localStorage");
          planData = storedPlanLocal;
          loadedFromStorage = true;
        } else {
            console.log("No stored plan found in either sessionStorage or localStorage.");
        }
      }
      
      if (planData) {
          try {
              // Always parse if loaded from storage, as it's stored as string
              const parsedData = JSON.parse(planData as string); 
              setPlan(parsedData.plan); // Store the actual plan object/string
              setTimestamp(parsedData.timestamp || new Date().toISOString());
              
              // Optional: Re-sync storage if needed, though parsing first is key
              if (loadedFromStorage) {
                  sessionStorage.setItem('generatedPlan', JSON.stringify(parsedData));
                  // Optionally sync to localStorage too, depending on desired persistence
                  // localStorage.setItem('generatedPlan', JSON.stringify(parsedData)); 
              }
          } catch (parseError) {
              console.error("Error parsing stored plan JSON:", parseError);
              setError("Failed to load the stored plan. It might be corrupted.");
              // Keep the raw string in plan state for potential fallback display or debugging
              setPlan(planData); 
              setTimestamp(new Date().toISOString()); // Set a default timestamp
          }
      } else {
          // If no plan in storage, maybe it was passed directly? (Less likely in this flow but possible)
          // Or simply set state to indicate no plan found
          setPlan(null);
          console.log("Final check confirms no plan available.");
      }

    } catch (error: any) {
      console.error("Error retrieving or processing stored plan:", error);
      setError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800">Loading Your Personalized Diet Plan...</CardTitle>
            <Skeleton className="h-4 w-1/3 mt-2" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Plan</AlertTitle>
          <AlertDescription>
            {error} Please try generating a new plan.
          </AlertDescription>
          <Button 
            onClick={() => router.push('/start-plan')}
            variant="destructive"
            className="mt-4"
          >
            Generate New Plan
          </Button>
        </Alert>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Plan Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>It seems there's no plan available in your session or storage. Please generate a new plan.</p>
            <Button 
              onClick={() => router.push('/start-plan')}
              className="mt-4"
            >
              Generate New Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-100 to-orange-100 p-4">
          <CardTitle className="text-xl font-bold text-red-800">Your Personalized Keto Plan</CardTitle>
          {timestamp && (
            <p className="text-xs text-gray-600 pt-1">
              Generated: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-4 md:p-6">
           {/* Pass the plan state (which could be object or string) */} 
          <FormattedPlan content={plan} />
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 border-t pt-6">
            <Button 
              onClick={() => window.print()} 
              variant="outline"
              className="bg-white"
            >
              Print Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 