'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Bot, Utensils, ClipboardList, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stages = [
    { text: 'Analyzing your preferences...', icon: UserCheck, duration: 1500 }, // Short initial step
    { text: 'Consulting with the AI chef...', icon: Bot, duration: 4000 }, // Longer step
    { text: 'Generating recipes & nutrition...', icon: Utensils, duration: 5000 }, // Longer step
    { text: 'Compiling your personalized plan...', icon: ClipboardList, duration: Infinity }, // Runs until loading finishes
];

const LoadingStatus: React.FC = () => {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    useEffect(() => {
        setCurrentStageIndex(0); // Reset on mount (when loading starts)
        let timeoutId: NodeJS.Timeout | null = null;

        const advanceStage = (index: number) => {
            if (index < stages.length - 1) {
                timeoutId = setTimeout(() => {
                    setCurrentStageIndex(index + 1);
                    advanceStage(index + 1);
                }, stages[index].duration);
            }
        };

        advanceStage(0); // Start the sequence

        // Cleanup function to clear timeout if the component unmounts
        // (e.g., if loading finishes or user navigates away)
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []); // Empty dependency array ensures this runs only once when the component mounts

    return (
        <Card className="w-full max-w-md mx-auto my-8 shadow-lg animate-pulse-slow">
            <CardHeader>
                <CardTitle className="text-center text-lg font-semibold text-red-700">
                    Generating Your Keto Plan...
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {stages.map((stage, index) => {
                        const isActive = index === currentStageIndex;
                        const isDone = index < currentStageIndex;
                        const Icon = stage.icon;

                        return (
                            <li key={index} className={`flex items-center space-x-3 transition-opacity duration-500 ${isDone ? 'opacity-60' : 'opacity-100'}`}>
                                {isDone ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                ) : isActive ? (
                                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                                ) : (
                                    <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" /> // Future stages icon
                                )}
                                <span className={`text-sm ${isDone ? 'text-gray-500 line-through' : isActive ? 'font-semibold text-blue-700' : 'text-gray-400'}`}>
                                    {stage.text}
                                </span>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-xs text-center text-gray-500 mt-6">
                    This may take a moment, especially for detailed plans. Please wait.
                </p>
            </CardContent>
        </Card>
    );
};

// Optional: Add slow pulse animation to your global CSS (e.g., globals.css):
/*
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}
.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
*/

export default LoadingStatus;
