'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Basic styling for markdown elements using Tailwind prose
// You can customize this further if needed.

interface FormattedPlanProps {
    content: string;
}

interface MealPlan {
    days: {
        day: string;
        breakfast: string;
        lunch: string;
        dinner: string;
        snacks?: string;
    }[];
    introduction?: string;
    guidelines?: string;
    shoppingList?: string;
}

const FormattedPlan: React.FC<FormattedPlanProps> = ({ content }) => {
    const [parsedPlan, setParsedPlan] = useState<MealPlan | null>(null);
    const [otherContent, setOtherContent] = useState<string>('');

    useEffect(() => {
        const parseContent = () => {
            try {
                console.log("Content to parse:", typeof content === 'string' ? content.substring(0, 100) + "..." : content);
                
                // First check if content is already a structured object (JSON string)
                try {
                    // If it's a string that represents a JSON object
                    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                        const parsedData = JSON.parse(content);
                        
                        // Check if it matches our MealPlan structure
                        if (parsedData && Array.isArray(parsedData.days)) {
                            console.log("Found pre-structured meal plan data");
                            setParsedPlan(parsedData);
                            return; // Exit early if we got structured data
                        }
                    }
                } catch (jsonError) {
                    console.log("Not valid JSON, continuing with regex parsing");
                }
                
                // If we get here, treat as markdown text and parse using regex
                
                // Try to extract day sections using regex
                const days = [];
                // Match day patterns in markdown format (### Day X: or ## Day X:)
                const dayRegex = /#{2,3}\s*Day\s*(\d+)[:\s-]+([\s\S]*?)(?=#{2,3}\s*Day\s*\d+[:\s-]+|#{2,3}\s*Shopping List|#{1,3}\s*Guidelines|#{1,3}\s*Shopping List|$)/gi;
                
                let match;
                const dayContents: string[] = [];
                
                // Extract days
                while ((match = dayRegex.exec(content)) !== null) {
                    const dayNumber = match[1];
                    const dayContent = match[2].trim();
                    dayContents.push(dayContent);
                    
                    // Extract breakfast, lunch and dinner sections
                    // Looking for both markdown headings and bold text markers
                    const breakfast = extractMeal(dayContent, "Breakfast");
                    const lunch = extractMeal(dayContent, "Lunch");
                    const dinner = extractMeal(dayContent, "Dinner");
                    const snacks = extractMeal(dayContent, "Snack");
                    
                    days.push({
                        day: `Day ${dayNumber}`,
                        breakfast,
                        lunch,
                        dinner,
                        snacks: snacks || ''
                    });
                }
                
                console.log("Parsed days:", days);
                
                // Extract introduction (content before first day)
                const introRegex = /([\s\S]*?)(?=#{2,3}\s*Day\s*\d+[:\s-]+)/;
                const introMatch = introRegex.exec(content);
                const introduction = introMatch ? introMatch[1].trim() : '';
                
                // Extract guidelines from either a dedicated section or from introduction
                let guidelines = '';
                const dedicatedGuidelinesRegex = /#{1,3}\s*Guidelines[:\s-]+([\s\S]*?)(?=#{1,3}\s*Shopping List|#{2,3}\s*Day|$)/i;
                const dedicatedGuidelinesMatch = dedicatedGuidelinesRegex.exec(content);
                
                if (dedicatedGuidelinesMatch) {
                    guidelines = dedicatedGuidelinesMatch[1].trim();
                } else if (introduction.includes("Guidelines")) {
                    // Try to extract guidelines from the introduction
                    const guidelinesInIntroRegex = /Guidelines[:\s-]+([\s\S]*?)(?=#{2,3}\s*Day|$)/i;
                    const guidelinesInIntroMatch = guidelinesInIntroRegex.exec(introduction);
                    if (guidelinesInIntroMatch) {
                        guidelines = guidelinesInIntroMatch[1].trim();
                    }
                }
                
                // Extract shopping list
                const shoppingListRegex = /#{1,3}\s*Shopping List[:\s-]+([\s\S]*?)(?=#{1,3}\s*Guidelines|#{1,3}\s*Adjustments|#{2,3}\s*Day|$)/i;
                const shoppingListMatch = shoppingListRegex.exec(content);
                const shoppingList = shoppingListMatch ? shoppingListMatch[1].trim() : '';
                
                console.log("Extracted sections:", {
                    introduction: introduction.substring(0, 100) + "...",
                    guidelines: guidelines.substring(0, 100) + "...",
                    shoppingList: shoppingList.substring(0, 100) + "..."
                });
                
                if (days.length > 0) {
                    setParsedPlan({
                        days,
                        introduction,
                        shoppingList,
                        guidelines
                    });
                    
                    // Instead of trying to construct a regex to exclude all matched content,
                    // which is error-prone, just check if there's any content we haven't accounted for
                    const mainContentLen = 
                        introduction.length + 
                        days.reduce((total, _) => total + dayContents.join('').length, 0) + 
                        shoppingList.length + 
                        guidelines.length;
                    
                    if (content.length - mainContentLen > 100) { // If there's significant unmatched content
                        setOtherContent(content);
                    }
                } else {
                    // If we couldn't parse into structured format, just set as other content
                    console.log("Couldn't parse days, setting full content as fallback");
                    setOtherContent(content);
                }
            } catch (error) {
                console.error("Error parsing plan content:", error);
                setOtherContent(content);
            }
        };
        
        parseContent();
    }, [content]);

    function extractMeal(dayContent: string, mealType: string) {
        // This handles both markdown headings (####) and bold markers (**) for meal types
        const headingMealRegex = new RegExp(`#{3,4}\\s*${mealType}[:\\s-]+([\\s\\S]*?)(?=#{3,4}\\s*(?:Breakfast|Lunch|Dinner|Snack)|$)`, 'i');
        const boldMealRegex = new RegExp(`\\*\\*\\s*${mealType}[:\\s-]*\\*\\*([\\s\\S]*?)(?=\\*\\*\\s*(?:Breakfast|Lunch|Dinner|Snack)|$)`, 'i');
        const simpleBoldMealRegex = new RegExp(`\\*\\*${mealType}:\\*\\*([\\s\\S]*?)(?=\\*\\*(?:Breakfast|Lunch|Dinner|Snack):|$)`, 'i');
        
        // Try each pattern in sequence
        let match = headingMealRegex.exec(dayContent);
        if (match) return match[1].trim();
        
        match = boldMealRegex.exec(dayContent);
        if (match) return match[1].trim();
        
        match = simpleBoldMealRegex.exec(dayContent);
        if (match) return match[1].trim();
        
        return ''; // Return empty string if no match found
    }
    
    function escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (!parsedPlan && !otherContent) {
        return <div>Loading plan...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Introduction Section */}
            {parsedPlan?.introduction && (
                <div className="prose max-w-none mb-8">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {parsedPlan.introduction}
                    </ReactMarkdown>
                </div>
            )}
            
            {/* Daily Meal Plans */}
            {parsedPlan?.days && parsedPlan.days.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-red-600">Your {parsedPlan.days.length}-Day Meal Plan</h2>
                    {parsedPlan.days.map((day, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="bg-red-50">
                                <CardTitle className="text-red-800">{day.day}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-red-600 border-b pb-1">Breakfast</h3>
                                        <div className="prose">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {day.breakfast || 'No breakfast specified'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-red-600 border-b pb-1">Lunch</h3>
                                        <div className="prose">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {day.lunch || 'No lunch specified'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-red-600 border-b pb-1">Dinner</h3>
                                        <div className="prose">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {day.dinner || 'No dinner specified'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                                
                                {day.snacks && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h3 className="font-bold text-red-600 border-b pb-1">Snacks</h3>
                                        <div className="prose">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {day.snacks}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Shopping List Section */}
            {parsedPlan?.shoppingList && (
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-green-50">
                        <CardTitle className="text-green-800">Shopping List</CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none p-6">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedPlan.shoppingList}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            
            {/* Guidelines Section */}
            {parsedPlan?.guidelines && (
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-blue-50">
                        <CardTitle className="text-blue-800">Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none p-6">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedPlan.guidelines}
                        </ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            
            {/* Fallback for unparsed or additional content */}
            {otherContent && !parsedPlan?.days?.length && (
                <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {otherContent}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default FormattedPlan; 