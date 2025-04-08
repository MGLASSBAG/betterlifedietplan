import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import FormattedPlan from '@/components/FormattedPlan'; // We'll create this next
import Link from 'next/link';

// Define the expected structure of plan_data (adjust if needed)
type PlanData = {
    raw?: string;
    // Add other structured fields here if you parse/store them later
};

type PageProps = {
    params: {
        planId: string;
    };
};

export default async function PlanDisplayPage({ params }: PageProps) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { planId } = params;

    // 1. Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Authentication error:', userError);
        redirect('/login?message=Please log in to view your plan.');
    }

    // 2. Fetch the specific diet plan
    const { data: plan, error: planError } = await supabase
        .from('diet_plans')
        .select('id, user_id, created_at, plan_data') // Select necessary fields
        .eq('id', planId)
        .single();

    // 3. Handle errors or plan not found
    if (planError) {
        console.error(`Error fetching plan ${planId}:`, planError);
        if (planError.code === 'PGRST116') { // Code for 'No rows returned'
            notFound(); // Use Next.js notFound for 404
        }
        // For other errors, maybe show a generic error message or redirect
        return <div className="p-8 text-center text-red-600">Error loading plan data. Please try again later.</div>;
    }

    if (!plan) {
        notFound(); // Plan doesn't exist
    }

    // 4. Authorization Check: Ensure the logged-in user owns this plan
    if (plan.user_id !== user.id) {
        console.warn(`Unauthorized access attempt: User ${user.id} tried to access plan ${planId} owned by ${plan.user_id}`);
        // Redirect to dashboard or show an access denied message
        redirect('/dashboard?error=Access Denied'); 
    }

    // 5. Extract raw plan content
    const planData = plan.plan_data as PlanData;
    const rawPlanContent = planData?.raw;

    if (!rawPlanContent) {
        return <div className="p-8 text-center text-gray-600">Plan content is missing or empty.</div>;
    }

    // 6. Render the formatted plan
    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-12 bg-gray-100">
            <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Personalized Keto Plan</h1>
                    <Link href="/dashboard">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition duration-200">
                            &larr; Back to Dashboard
                        </button>
                    </Link>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Generated on: {new Date(plan.created_at).toLocaleDateString()} at {new Date(plan.created_at).toLocaleTimeString()}
                </p>
                
                {/* Pass the raw content to the formatting component */}
                <FormattedPlan content={rawPlanContent} />

                 <div className="mt-8 pt-4 border-t text-center">
                    <Link href="/start-plan">
                         <button className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition duration-200">
                            Generate Another Plan
                         </button>
                    </Link>
                </div>
            </div>
        </main>
    );
} 