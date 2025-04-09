import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define nutrition schema
const nutritionSchema = {
  type: "object",
  properties: {
    calories: { type: "string", description: "Estimated calories, e.g., '450 kcal'" },
    protein: { type: "string", description: "Estimated protein, e.g., '30g'" },
    fat: { type: "string", description: "Estimated fat, e.g., '25g'" },
    carbs: { type: "string", description: "Estimated net carbohydrates, e.g., '5g'" }
  }
};

// Define recipe schema
const recipeSchema = {
  type: "object",
  properties: {
    ingredients: { type: "string", description: "List of ingredients with measurements, markdown formatted." },
    instructions: { type: "string", description: "Step-by-step cooking instructions, markdown formatted." }
  },
  required: ["ingredients", "instructions"]
};

// Define the meal plan schema
const mealPlanSchema = {
  type: "object",
  properties: {
    introduction: { type: "string", description: "Brief overview of the plan and keto principles, markdown formatted." },
    guidelines: { type: "string", description: "General tips for following the keto diet, markdown formatted." },
    days: {
      type: "array",
      description: "Array containing meal plans for each day (e.g., 7 days).",
      items: {
        type: "object",
        properties: {
          day: { type: "string", description: "Identifier for the day, e.g., 'Day 1'" },
          breakfast: { type: "string", description: "Name/description of the breakfast meal." },
          breakfastNutrition: { ...nutritionSchema, description: "Nutritional info for breakfast." },
          breakfastRecipe: { ...recipeSchema, description: "Recipe for breakfast." },
          lunch: { type: "string", description: "Name/description of the lunch meal." },
          lunchNutrition: { ...nutritionSchema, description: "Nutritional info for lunch." },
          lunchRecipe: { ...recipeSchema, description: "Recipe for lunch." },
          dinner: { type: "string", description: "Name/description of the dinner meal." },
          dinnerNutrition: { ...nutritionSchema, description: "Nutritional info for dinner." },
          dinnerRecipe: { ...recipeSchema, description: "Recipe for dinner." },
          snacks: { type: "string", description: "Optional snacks for the day, markdown formatted." },
          snacksNutrition: { ...nutritionSchema, description: "Optional nutritional info for snacks." }, // Added snacks nutrition
          dailyTotals: { ...nutritionSchema, description: "Calculated total nutrition for the day." } // Added daily totals
        },
        required: ["day", "breakfast", "lunch", "dinner"]
      }
    },
    shoppingList: { type: "string", description: "Comprehensive shopping list for the week, markdown formatted." },
    weeklySummary: {
      type: "object",
      description: "Summary of nutritional information for the entire week.",
      properties: {
        totalCalories: { type: "string" },
        averageDailyCalories: { type: "string" },
        totalProtein: { type: "string" },
        averageDailyProtein: { type: "string" },
        totalFat: { type: "string" },
        averageDailyFat: { type: "string" },
        totalCarbs: { type: "string" },
        averageDailyCarbs: { type: "string" }
      }
    }
  },
  required: ["introduction", "guidelines", "days", "shoppingList", "weeklySummary"]
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log('Form data received in API route:', JSON.stringify(formData, null, 2));
    
    // Construct the prompt based on form data
    const userPrompt = `Create a highly personalized and detailed 7-day keto diet plan based STRICTLY on the user's information and the requirements below. Adhere precisely to the requested JSON schema output format using the 'generate_meal_plan' function.

    User Information:
    - Gender: ${formData.gender || 'Not specified'}
    - Keto Familiarity: ${formData.familiarity || 'Not specified'}
    - Prep Time Preference: ${formData.prep_time || 'Not specified'}
    - Disliked Meats: ${Array.isArray(formData.disliked_meats) 
        ? formData.disliked_meats.map((m: string) => m === 'other' && formData.other_meat_description ? `Other (${formData.other_meat_description})` : m).join(', ') 
        : 'None'}
    - Disliked Ingredients: ${Array.isArray(formData.disliked_ingredients) 
        ? formData.disliked_ingredients.map((i: string) => i === 'other' && formData.other_ingredient_description ? `Other (${formData.other_ingredient_description})` : i).join(', ') 
        : 'None'}
    - Activity Level: ${formData.activity_level || 'Not specified'}
    - Health Conditions: ${Array.isArray(formData.health_conditions) 
        ? formData.health_conditions.map((h: string) => h === 'other' && formData.other_health_description ? `Other (${formData.other_health_description})` : h).join(', ') 
        : 'None'}
    - Age: ${formData.age || 'Not specified'}
    - Units: ${formData.units || 'Not specified'}
    - ${formData.units === 'metric' ? 
        `Height: ${formData.height_cm || 'Not specified'} cm, Current Weight: ${formData.current_weight_kg || 'Not specified'} kg, Target Weight: ${formData.target_weight_kg || 'Not specified'} kg` 
        : 
        `Height: ${formData.height_ft || 'Not specified'} ft ${formData.height_in || '0'} in, Current Weight: ${formData.current_weight_lbs || 'Not specified'} lbs, Target Weight: ${formData.target_weight_lbs || 'Not specified'} lbs`
      }

    Plan Requirements:
    1.  **Introduction:** Provide a brief, encouraging overview of the plan and core keto principles.
    2.  **Guidelines:** Offer practical tips for success on the keto diet, tailored to the user if possible (e.g., based on familiarity).
    3.  **Daily Plans (7 days):** For each day ('Day 1' to 'Day 7'):
        *   Include Breakfast, Lunch, and Dinner meals.
        *   Include optional Snacks suggestions suitable for keto.
        *   For **each** meal (Breakfast, Lunch, Dinner) and optionally for snacks:
            *   Provide a descriptive name (e.g., "Avocado and Egg Salad").
            *   Provide **estimated nutritional information** (Calories, Protein, Fat, Net Carbs). Format as strings (e.g., "450 kcal", "30g", "5g").
            *   Provide a detailed **Recipe** with:
                *   'ingredients': A markdown list of ingredients with precise measurements.
                *   'instructions': Step-by-step, easy-to-follow cooking instructions in markdown.
        *   Calculate and provide **daily total** nutritional information (Calories, Protein, Fat, Net Carbs) for each day.
    4.  **Shopping List:** Generate a comprehensive list of all ingredients needed for the week, organized by category (e.g., Produce, Meats, Dairy, Pantry). Use markdown formatting.
    5.  **Weekly Summary:** Calculate and provide a summary of the week's nutrition:
        *   Total and average daily values for Calories, Protein, Fat, and Net Carbs.

    **Output Format:** Generate the response strictly following the JSON schema provided in the 'generate_meal_plan' function call. Ensure all required fields are present and data types match the schema. Use markdown formatting within string fields where appropriate (recipes, lists, guidelines).`;

    console.log('Sending detailed prompt to OpenAI with updated function calling schema');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Consider using a more powerful model like gpt-4o for complex instructions
      messages: [{ role: "user", content: userPrompt }],
      functions: [
        {
          name: "generate_meal_plan",
          description: "Generate a structured 7-day keto meal plan with recipes, nutritional info, and summaries based on user preferences.",
          parameters: mealPlanSchema
        }
      ],
      function_call: { name: "generate_meal_plan" }
      // temperature: 0.5 // Adjust temperature for creativity vs. consistency if needed
    });

    try {
      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        console.error("Function call response missing arguments:", completion.choices[0].message);
        throw new Error("Function call response not received or incomplete");
      }

      // Log the raw arguments string before parsing
      // console.log("Raw function call arguments:", functionCall.arguments);

      const mealPlanData = JSON.parse(functionCall.arguments);
      
      // Add basic validation if needed (e.g., check if 'days' array exists)
      if (!mealPlanData || !Array.isArray(mealPlanData.days) || mealPlanData.days.length === 0) {
          console.error("Parsed meal plan data is invalid or missing days:", mealPlanData);
          throw new Error("Generated meal plan data structure is invalid.");
      }

      console.log("Successfully parsed structured meal plan data.");
      return NextResponse.json({
        success: true,
        plan: mealPlanData 
      });
      
    } catch (parsingError: any) {
      console.error("Function call parsing failed:", parsingError);
      console.error("Raw arguments string that failed parsing:", completion.choices[0]?.message?.function_call?.arguments);
      
      // Fallback - maybe log the error and return a specific error message
      // We remove the direct content fallback as it won't match the complex structure expected by FormattedPlan
      return NextResponse.json({
        success: false,
        error: `Failed to generate or parse the structured meal plan. Error: ${parsingError.message}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in API route POST handler:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to generate plan: ${error.message}`
    }, { status: 500 });
  }
} 