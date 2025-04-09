'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ChevronDown, ChevronUp, UtensilsCrossed, ShoppingCart, 
    Flame, Drumstick, Droplet, WheatOff, BarChart3, CalendarDays
} from "lucide-react";

// Basic styling for markdown elements using Tailwind prose
// You can customize this further if needed.

interface FormattedPlanProps {
    content: string | object; // Can be string (fallback) or parsed object
}

interface Nutrition {
    calories?: string;
    protein?: string;
    fat?: string;
    carbs?: string;
}

interface Recipe {
    ingredients: string;
    instructions: string;
}

interface DayPlan {
    day: string;
    breakfast: string;
    breakfastNutrition?: Nutrition;
    breakfastRecipe?: Recipe;
    lunch: string;
    lunchNutrition?: Nutrition;
    lunchRecipe?: Recipe;
    dinner: string;
    dinnerNutrition?: Nutrition;
    dinnerRecipe?: Recipe;
    snacks?: string;
    snacksNutrition?: Nutrition;
    dailyTotals?: Nutrition;
}

interface WeeklySummary {
    totalCalories?: string;
    averageDailyCalories?: string;
    totalProtein?: string;
    averageDailyProtein?: string;
    totalFat?: string;
    averageDailyFat?: string;
    totalCarbs?: string;
    averageDailyCarbs?: string;
}

interface MealPlan {
    introduction?: string;
    guidelines?: string;
    days: DayPlan[];
    shoppingList?: string;
    weeklySummary?: WeeklySummary;
}

const FormattedPlan: React.FC<FormattedPlanProps> = ({ content }) => {
    const [parsedPlan, setParsedPlan] = useState<MealPlan | null>(null);
    const [otherContent, setOtherContent] = useState<string>('');
    const [expandedDays, setExpandedDays] = useState<{[key: number]: boolean}>({});
    const [expandedRecipes, setExpandedRecipes] = useState<{[key: string]: boolean}>({});
    const [isParsing, setIsParsing] = useState(true);

    // Toggle expanded state for a day
    const toggleDay = (dayIndex: number) => {
        setExpandedDays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
    };

    // Toggle recipe visibility
    const toggleRecipe = (recipeId: string) => {
        setExpandedRecipes(prev => ({ ...prev, [recipeId]: !prev[recipeId] }));
    };

    useEffect(() => {
        setIsParsing(true);
        const parseContent = () => {
            try {
                console.log("Content type received:", typeof content);

                let planData: MealPlan | null = null;

                if (typeof content === 'object' && content !== null && 'days' in content) {
                    // Assume it's already the parsed MealPlan object from API
                    console.log("Received pre-parsed MealPlan object");
                    planData = content as MealPlan;
                } else if (typeof content === 'string') {
                    // Try parsing as JSON string first (e.g., from localStorage)
                    try {
                        const parsedJson = JSON.parse(content);
                        if (parsedJson && typeof parsedJson === 'object' && 'days' in parsedJson) {
                            console.log("Successfully parsed JSON string into MealPlan object");
                            planData = parsedJson as MealPlan;
                        } else {
                            console.log("Parsed JSON, but not a valid MealPlan structure. Falling back to markdown.");
                            setOtherContent(content);
                        }
                    } catch (jsonError) {
                        console.log("Not valid JSON, treating as raw markdown (fallback)");
                        // Handle raw markdown as a fallback (basic display)
                        // NOTE: The complex regex parsing is removed as the primary path is structured JSON.
                        // We can add back simplified regex parsing if needed for pure markdown input.
                        setOtherContent(content);
                    }
                } else {
                    console.error("Invalid content type received:", content);
                    setOtherContent("Error: Invalid plan format received.");
                }

                if (planData) {
                    setParsedPlan(planData);
                    // Initialize all days as collapsed
                    const initialExpandedState = planData.days.reduce((acc, _, idx) => {
                        acc[idx] = false; // Start collapsed
                        return acc;
                    }, {} as {[key: number]: boolean});
                    setExpandedDays(initialExpandedState);
                    setOtherContent(''); // Clear fallback content
                } 

            } catch (error) {
                console.error("Error processing plan content:", error);
                setOtherContent(typeof content === 'string' ? content : "Error displaying plan.");
                setParsedPlan(null);
            } finally {
                setIsParsing(false);
            }
        };

        parseContent();
    }, [content]);

    // Helper component to render Nutrition details
    const RenderNutrition: React.FC<{ nutrition?: Nutrition; prefix?: string }> = ({ nutrition, prefix = '' }) => {
        if (!nutrition || Object.values(nutrition).every(v => !v)) return null;
        return (
            <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {nutrition.calories && <span className="flex items-center"><Flame size={12} className="mr-1" /> {prefix}Cal: {nutrition.calories}</span>}
                {nutrition.protein && <span className="flex items-center"><Drumstick size={12} className="mr-1" /> {prefix}P: {nutrition.protein}</span>}
                {nutrition.fat && <span className="flex items-center"><Droplet size={12} className="mr-1" /> {prefix}F: {nutrition.fat}</span>}
                {nutrition.carbs && <span className="flex items-center"><WheatOff size={12} className="mr-1" /> {prefix}C: {nutrition.carbs}</span>}
            </div>
        );
    };

    // Helper component to render Recipe button and details
    const RenderRecipe: React.FC<{ dayIndex: number; mealType: string; recipe?: Recipe }> = ({ dayIndex, mealType, recipe }) => {
        if (!recipe || (!recipe.ingredients && !recipe.instructions)) return null;
        
        const recipeId = `${dayIndex}-${mealType}`;
        const isExpanded = expandedRecipes[recipeId] || false;
        
        return (
            <div className="mt-2">
                <Button 
                    variant="outline" 
                    size="sm"
                    className="text-sm flex items-center gap-1 mb-2" // Reduced margin
                    onClick={() => toggleRecipe(recipeId)}
                >
                    <UtensilsCrossed size={14} className="mr-1" /> {/* Slightly smaller icon */}
                    {isExpanded ? 'Hide Recipe' : 'View Recipe'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
                </Button>
                
                {isExpanded && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm"> {/* Use neutral background */}
                        {recipe.ingredients && (
                            <div className="mb-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                                    <ShoppingCart size={14} className="mr-1" />
                                    Ingredients
                                </h4>
                                <div className="prose prose-sm max-w-none mt-1 text-gray-800">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {recipe.ingredients}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                        
                        {recipe.instructions && (
                            <div>
                                <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                                    <UtensilsCrossed size={14} className="mr-1" />
                                    Instructions
                                </h4>
                                <div className="prose prose-sm max-w-none mt-1 text-gray-800">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {recipe.instructions}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (isParsing) {
        return <div>Loading and processing plan...</div>; // Or use Skeleton loaders
    }

    if (!parsedPlan && otherContent) {
        // Fallback display for raw markdown or error messages
        return (
            <div className="prose max-w-none p-4 border rounded bg-yellow-50 border-yellow-200">
                <p className="font-semibold">Note: Displaying fallback content.</p>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{otherContent}</ReactMarkdown>
            </div>
        );
    }
    
    if (!parsedPlan || !parsedPlan.days || parsedPlan.days.length === 0) {
         return <div className="text-center text-gray-600">No valid plan data available to display.</div>;
    }

    return (
        <div className="space-y-8">
            {/* Introduction Section */}
            {parsedPlan.introduction && (
                <Card className="bg-gradient-to-r from-red-50 to-orange-50">
                    <CardHeader>
                        <CardTitle className="text-red-800">Welcome to Your Plan!</CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none prose-sm text-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedPlan.introduction}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            
            {/* Daily Meal Plans */}
            <div className="space-y-4"> {/* Reduced space between day cards */} 
                <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                    <CalendarDays size={24} /> Your {parsedPlan.days.length}-Day Meal Plan
                </h2>
                {parsedPlan.days.map((day, index) => (
                    <Card key={index} className="transition-shadow hover:shadow-md overflow-hidden"> {/* Added overflow hidden */} 
                        <CardHeader 
                            className={`bg-red-100 p-4 cursor-pointer flex flex-row items-center justify-between`} // Reduced padding
                            onClick={() => toggleDay(index)}
                        >
                            <CardTitle className="text-lg font-semibold text-red-900">{day.day}</CardTitle>
                            <div className="flex items-center space-x-2">
                                {day.dailyTotals && <RenderNutrition nutrition={day.dailyTotals} prefix="Total " />}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    {expandedDays[index] ? <ChevronUp /> : <ChevronDown />}
                                </Button>
                            </div>
                        </CardHeader>
                        
                        {expandedDays[index] && (
                            <CardContent className="p-4 text-sm"> {/* Reduced padding */} 
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Breakfast */}
                                    <div className="space-y-1 p-3 border rounded bg-white"> {/* Added padding/border */} 
                                        <h3 className="font-bold text-red-700 border-b pb-1 mb-1">Breakfast</h3>
                                        <p className="font-medium text-gray-800">{day.breakfast || '-'}</p>
                                        <RenderNutrition nutrition={day.breakfastNutrition} />
                                        <RenderRecipe dayIndex={index} mealType="breakfast" recipe={day.breakfastRecipe} />
                                    </div>
                                    {/* Lunch */}
                                    <div className="space-y-1 p-3 border rounded bg-white">
                                        <h3 className="font-bold text-red-700 border-b pb-1 mb-1">Lunch</h3>
                                        <p className="font-medium text-gray-800">{day.lunch || '-'}</p>
                                        <RenderNutrition nutrition={day.lunchNutrition} />
                                        <RenderRecipe dayIndex={index} mealType="lunch" recipe={day.lunchRecipe} />
                                    </div>
                                    {/* Dinner */}
                                    <div className="space-y-1 p-3 border rounded bg-white">
                                        <h3 className="font-bold text-red-700 border-b pb-1 mb-1">Dinner</h3>
                                        <p className="font-medium text-gray-800">{day.dinner || '-'}</p>
                                        <RenderNutrition nutrition={day.dinnerNutrition} />
                                        <RenderRecipe dayIndex={index} mealType="dinner" recipe={day.dinnerRecipe} />
                                    </div>
                                </div>
                                
                                {/* Snacks */}
                                {day.snacks && (
                                    <div className="mt-4 pt-3 border-t">
                                        <h3 className="font-bold text-red-700 border-b pb-1 mb-1">Snacks</h3>
                                        <div className="prose prose-sm max-w-none text-gray-800">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {day.snacks}
                                            </ReactMarkdown>
                                        </div>
                                        <RenderNutrition nutrition={day.snacksNutrition} />
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
            
            {/* Shopping List Section */}
            {parsedPlan.shoppingList && (
                <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="bg-green-100">
                        <CardTitle className="text-green-900 flex items-center gap-2">
                            <ShoppingCart size={20}/> Shopping List
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none prose-sm p-4 text-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedPlan.shoppingList}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            
            {/* Guidelines Section */}
            {parsedPlan.guidelines && (
                <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="bg-blue-100">
                        <CardTitle className="text-blue-900">Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none prose-sm p-4 text-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedPlan.guidelines}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            )}

            {/* Weekly Summary Section */}
            {parsedPlan.weeklySummary && (
                <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="bg-purple-100">
                        <CardTitle className="text-purple-900 flex items-center gap-2">
                            <BarChart3 size={20}/> Weekly Nutrition Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-sm space-y-2 text-gray-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><span className="font-semibold">Avg Daily Calories:</span> {parsedPlan.weeklySummary.averageDailyCalories || 'N/A'}</div>
                            <div><span className="font-semibold">Avg Daily Protein:</span> {parsedPlan.weeklySummary.averageDailyProtein || 'N/A'}</div>
                            <div><span className="font-semibold">Avg Daily Fat:</span> {parsedPlan.weeklySummary.averageDailyFat || 'N/A'}</div>
                            <div><span className="font-semibold">Avg Daily Net Carbs:</span> {parsedPlan.weeklySummary.averageDailyCarbs || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                             <div><span className="font-semibold">Total Calories:</span> {parsedPlan.weeklySummary.totalCalories || 'N/A'}</div>
                            <div><span className="font-semibold">Total Protein:</span> {parsedPlan.weeklySummary.totalProtein || 'N/A'}</div>
                            <div><span className="font-semibold">Total Fat:</span> {parsedPlan.weeklySummary.totalFat || 'N/A'}</div>
                            <div><span className="font-semibold">Total Net Carbs:</span> {parsedPlan.weeklySummary.totalCarbs || 'N/A'}</div>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
};

export default FormattedPlan; 