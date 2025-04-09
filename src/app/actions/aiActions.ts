'use server';

export const runtime = 'edge';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateKetoPlan(formData: any) {
  try {
    // Debug log to see what's coming in
    console.log('Form data received:', JSON.stringify(formData, null, 2));
    
    // Construct the prompt based on form data
    const prompt = `Create a personalized keto diet plan based on the following information:
    Gender: ${formData.gender || 'Not specified'}
    Keto Familiarity: ${formData.familiarity || 'Not specified'}
    Prep Time Preference: ${formData.prep_time || 'Not specified'}
    Disliked Meats: ${Array.isArray(formData.disliked_meats) 
      ? formData.disliked_meats.map((m: string) => m === 'other' && formData.other_meat_description ? `Other (${formData.other_meat_description})` : m).join(', ') 
      : 'None'}
    Disliked Ingredients: ${Array.isArray(formData.disliked_ingredients) 
      ? formData.disliked_ingredients.map((i: string) => i === 'other' && formData.other_ingredient_description ? `Other (${formData.other_ingredient_description})` : i).join(', ') 
      : 'None'}
    Activity Level: ${formData.activity_level || 'Not specified'}
    Health Conditions: ${Array.isArray(formData.health_conditions) 
      ? formData.health_conditions.map((h: string) => h === 'other' && formData.other_health_description ? `Other (${formData.other_health_description})` : h).join(', ') 
      : 'None'}
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

    Please provide a detailed 7-day meal plan with the following components:
    
    1. Introduction: Brief overview of the plan and its benefits
    2. For each day (Day 1 through Day 7), include:
       - Breakfast, Lunch, Dinner, and optional Snacks
       - For EACH meal, include:
         * A detailed recipe with complete ingredients list (with measurements)
         * Step-by-step cooking instructions
    3. Shopping List: Comprehensive list of all ingredients needed for the week
    4. Guidelines: General tips for following a keto diet

    Format the meal plan using clear markdown headers. For each recipe, use the following structure:
    
    ## Day X
    
    ### Breakfast
    [Brief description of the meal]
    
    #### Ingredients
    [List all ingredients with measurements]
    
    #### Instructions
    [Step-by-step cooking instructions]
    
    [Repeat similar format for Lunch and Dinner]
    
    Format your response using markdown for better readability.`;

    // Log the prompt being sent to OpenAI
    console.log('Sending prompt to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
    });

    return {
      success: true,
      plan: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('Error generating plan:', error);
    return {
      success: false,
      error: 'Failed to generate plan'
    };
  }
} 