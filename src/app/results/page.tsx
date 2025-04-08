'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import FormattedPlan from '@/components/FormattedPlan';

export default function ResultsPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      // Try localStorage first
      let storedPlan = localStorage.getItem('generatedPlan');
      
      // If not in localStorage, try sessionStorage
      if (!storedPlan) {
        storedPlan = sessionStorage.getItem('generatedPlan');
        if (storedPlan) {
          console.log("Plan retrieved from sessionStorage");
        }
      } else {
        console.log("Plan retrieved from localStorage");
      }
      
      if (storedPlan) {
        const parsedData = JSON.parse(storedPlan);
        setPlan(parsedData.plan);
        setTimestamp(parsedData.timestamp || new Date().toISOString());
        
        // Sync storage to ensure consistency
        localStorage.setItem('generatedPlan', storedPlan);
        sessionStorage.setItem('generatedPlan', storedPlan);
      } else {
        console.log("No stored plan found in either localStorage or sessionStorage");
      }
    } catch (error) {
      console.error("Error retrieving stored plan:", error);
    }
  }, []);

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Plan Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>It seems there's no plan available. Please generate a new plan.</p>
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
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-800">Your Personalized Diet Plan</CardTitle>
          {timestamp && (
            <p className="text-sm text-gray-600">
              Generated on: {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <FormattedPlan content={plan} />
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => router.push('/start-plan')}
              className="bg-red-600 hover:bg-red-700"
            >
              Generate New Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 