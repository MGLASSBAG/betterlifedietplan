import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the meal plan schema to match the interface in FormattedPlan.tsx
const mealPlanSchema = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          breakfast: { type: "string" },
          lunch: { type: "string" },
          dinner: { type: "string" },
          snacks: { type: "string" }
        },
        required: ["day", "breakfast", "lunch", "dinner"]
      }
    },
    introduction: { type: "string" },
    guidelines: { type: "string" },
    shoppingList: { type: "string" }
  },
  required: ["days"]
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log('Form data received in API route:', JSON.stringify(formData, null, 2));
    
    // Construct the prompt based on form data
    const userPrompt = `Create a personalized keto diet plan based on the following information:
    Gender: ${formData.gender || 'Not specified'}
    Keto Familiarity: ${formData.familiarity || 'Not specified'}
    Prep Time Preference: ${formData.prep_time || 'Not specified'}
    Disliked Meats: ${Array.isArray(formData.disliked_meats) ? formData.disliked_meats.join(', ') : 'None'}
    Disliked Ingredients: ${Array.isArray(formData.disliked_ingredients) ? formData.disliked_ingredients.join(', ') : 'None'}
    Activity Level: ${formData.activity_level || 'Not specified'}
    Health Conditions: ${Array.isArray(formData.health_conditions) ? formData.health_conditions.join(', ') : 'None'}
    Age: ${formData.age || 'Not specified'}
    Units: ${formData.units || 'Not specified'}
    ${formData.units === 'metric' ? 
      `Height: ${formData.height_cm || 'Not specified'} cm
      Current Weight: ${formData.current_weight_kg || 'Not specified'} kg
      Target Weight: ${formData.target_weight_kg || 'Not specified'} kg` 
      : 
      `Height: ${formData.height_ft || 'Not specified'} ft ${formData.height_in || '0'} in
      Current Weight: ${formData.current_weight_lbs || 'Not specified'} lbs
      Target Weight: ${formData.target_weight_lbs || 'Not specified'} lbs`
    }

    Please provide a detailed 7-day meal plan with recipes, shopping list, and general guidelines. Use markdown formatting within each text field for better readability.`;

    console.log('Sending prompt to OpenAI with function calling');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userPrompt }],
      functions: [
        {
          name: "generate_meal_plan",
          description: "Generate a structured keto meal plan based on user preferences",
          parameters: mealPlanSchema
        }
      ],
      function_call: { name: "generate_meal_plan" }
    });

    try {
      // Extract the JSON response
      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error("Function call response not received");
      }

      // Parse the function arguments as JSON
      const mealPlanData = JSON.parse(functionCall.arguments);

      // Return the structured meal plan
      return NextResponse.json({
        success: true,
        plan: mealPlanData, // This now contains the structured meal plan
        raw: JSON.stringify(mealPlanData) // Also include raw JSON for backward compatibility
      });
    } catch (parsingError) {
      // Fallback to direct content if function call parsing fails
      console.warn("Function call parsing failed, falling back to direct content:", parsingError);
      
      // Try to use the direct message content if available
      const content = completion.choices[0].message.content;
      if (content) {
        console.log("Using fallback content response");
        return NextResponse.json({
          success: true,
          plan: content,
          raw: content,
          fallback: true // Flag to indicate we're using fallback mode
        });
      } else {
        throw new Error("No usable response from OpenAI");
      }
    }
  } catch (error) {
    console.error('Error generating plan in API route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate plan'
    }, { status: 500 });
  }
} 