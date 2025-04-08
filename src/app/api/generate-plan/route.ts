import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log('Form data received in API route:', JSON.stringify(formData, null, 2));
    
    // Construct the prompt based on form data
    const prompt = `Create a personalized keto diet plan based on the following information:
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

    Please provide a detailed 7-day meal plan with recipes, shopping list, and general guidelines. Format your response using markdown for better readability.`;

    console.log('Sending prompt to OpenAI (API route):', prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
    });

    return NextResponse.json({
      success: true,
      plan: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error generating plan in API route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate plan'
    }, { status: 500 });
  }
} 