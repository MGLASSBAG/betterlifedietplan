<?php
session_start();

// require_once('vendor/autoload.php'); // Required for Stripe PHP library if installed via Composer

// --- Configuration ---
// Replace with your actual keys in a real environment (consider environment variables)
define('STRIPE_SECRET_KEY', 'sk_test_YOUR_SECRET_KEY');
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_YOUR_PUBLISHABLE_KEY');
define('PLAN_PRICE_CENTS', 999); // e.g., 9.99 EUR/USD
define('PLAN_WEEKS', 8); // Duration of the plan

// Ensure this is defined early if needed globally
define('APP_URL', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF']);

// --- State Management ---
$current_step = $_SESSION['current_step'] ?? 1;
$user_data = $_SESSION['user_data'] ?? [];

// --- Routing & Logic ---
$action = $_REQUEST['action'] ?? null; // Use $_REQUEST to catch GET/POST actions

// --- Load Environment Variables ---
function loadEnv($path)
{
    if (!file_exists($path)) {
        error_log(".env file not found at: " . $path);
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
// Load .env from the parent directory relative to this script's directory
loadEnv(dirname(__DIR__) . '/.env');

// Define FROM_EMAIL constant (using .env variable if available, otherwise default)
define('FROM_EMAIL', $_ENV['FROM_EMAIL'] ?? 'noreply@ketocycle.ai');

// --- Remove Hardcoded API Key ---
// define('OPENAI_API_KEY', 'sk-YOUR_OPENAI_API_KEY'); // REMOVED - Now loaded from .env

if ($action === 'submit_step' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $step_data = $_POST['data'] ?? [];
    $submitted_step = (int)($_POST['current_step'] ?? $current_step);

    // Basic validation/sanitization should go here
    if (!empty($step_data)) {
         $user_data[$submitted_step] = $step_data;
         $_SESSION['user_data'] = $user_data;
    }

    $current_step = $submitted_step + 1;
    $_SESSION['current_step'] = $current_step;

    // Redirect to prevent form resubmission
    header('Location: ' . APP_URL . '?step=' . $current_step);
    exit;
} elseif ($action === 'initiate_checkout') {
    // --- Placeholder for Stripe Checkout Initiation ---
    // 1. Gather necessary data from $_SESSION['user_data']
    // 2. Create a Stripe Checkout Session (Server-side)
    //    - Define line items (Our 8-week plan)
    //    - Set success_url (e.g., APP_URL . '?action=payment_success&session_id={CHECKOUT_SESSION_ID}')
    //    - Set cancel_url (e.g., APP_URL . '?action=payment_cancel')
    // 3. Redirect the user to Stripe's checkout page

    // --- TEMPORARY: Simulate successful payment for testing flow ---
    $_SESSION['payment_status'] = 'success'; // Mark as successful in session
    header('Location: ' . APP_URL . '?status=success');
    exit;

    // --- Real Stripe Implementation (Example Snippet - Requires Stripe PHP library) ---
    /*
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    try {
        $checkout_session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[ # Describe the 8-week plan price
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => [
                        'name' => 'Personalized 8-Week Keto Plan',
                    ],
                    'unit_amount' => PLAN_PRICE_CENTS * PLAN_WEEKS, // Total price
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => APP_URL . '?action=payment_success&session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => APP_URL . '?action=payment_cancel',
            // 'customer_email' => $user_email, // Optional: Pre-fill email if collected
            'metadata' => [ // Store user session ID or data reference for webhook/success lookup
                'user_session_id' => session_id()
            ]
        ]);
        header("HTTP/1.1 303 See Other");
        header("Location: " . $checkout_session->url);
        exit;
    } catch (Exception $e) {
        // Handle error - maybe redirect to an error page
        error_log("Stripe Error: " . $e->getMessage());
        header('Location: ' . APP_URL . '?status=error&message=payment_failed');
        exit;
    }
    */

} elseif ($action === 'generate_plan' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Flag that plan generation should occur on the success page
    $_SESSION['plan_generation_triggered'] = true;
    // Redirect to the success/display page to show the plan
    header('Location: ' . APP_URL . '?status=success');
    exit;

} elseif ($action === 'payment_success') {
    // --- Placeholder for handling successful Stripe redirect ---
    // 1. Verify the Stripe Session ID ( $_GET['session_id'] ) - fetch session from Stripe API
    // 2. Check payment status is 'paid'
    // 3. Retrieve user data (perhaps via session_id stored in metadata)
    // 4. Trigger AI plan generation
    // 5. Trigger first email send
    // 6. Store subscription/user details in a database for weekly emails
    // 7. Mark payment as complete in session/database

    // --- Plan Display Page Logic (Triggered by generate_plan action or successful payment) ---
    $page_content .= "<h2>Your Personalized Keto Plan</h2>";

    // In a real app, you'd likely store the email address collected before/during checkout.
    $user_email = $_SESSION['user_data']['email'] ?? 'test@example.com'; // Placeholder email

    $plan_content_for_display = null;

    // Check if plan is already stored in session to prevent re-generation on refresh
    if (isset($_SESSION['generated_plan_content'])) {
        $plan_content_for_display = $_SESSION['generated_plan_content'];
        error_log("Retrieved plan from session."); // Debug log
    } else {
        // Generate plan (Raw Text) - Only if not in session
        error_log("Generating new plan via API."); // Debug log
        $raw_generated_plan = generate_keto_plan_via_openai($user_data);
        
        // Store the result (plan or error message) in session
        $_SESSION['generated_plan_content'] = $raw_generated_plan; 
        
        $plan_content_for_display = $raw_generated_plan;
    }

    // --- Now process $plan_content_for_display ---

    // Display the generated plan or error message
    if (strpos($plan_content_for_display, 'Error:') === 0) {
        // Display error 
        $page_content .= "<p style='color:red;'>We encountered an issue generating your plan:</p>";
        // Error message might contain HTML special chars, but keep formatting simple
        $page_content .= "<p style='color:red; font-family: monospace;'>" . nl2br(htmlspecialchars($plan_content_for_display)) . "</p>";
    } else {
        // Format the raw plan into beautiful HTML
        // First, clean up potential nl2br artifacts from the API function
        $cleaned_raw_plan = strip_tags(str_replace(['<br>', '<br />'], "\n", $plan_content_for_display));
        $formatted_plan_html = format_plan_html($cleaned_raw_plan); 

        // Display the formatted plan
        $page_content .= "<div class='plan-content'>"; // Keep this outer container
        $page_content .= $formatted_plan_html;
        $page_content .= "</div>";

        // Also attempt to send email, but only once
        $plain_text_plan = strip_tags(str_replace(['<br>', '<br />'], "\n", $plan_content_for_display));
        
        if (!isset($_SESSION['plan_emailed'])) {
            $page_content .= "<p style='margin-top: 20px;'>We are also sending this plan to your email address ({$user_email}).</p>";
            $email_sent = send_plan_via_email($user_email, $plain_text_plan, 1);
            
            if ($email_sent) {
                $page_content .= "<p style='color:green;'>Week 1 plan has been sent to {$user_email}. Please check your inbox (and spam folder).</p>";
                $_SESSION['plan_emailed'] = true; // Mark as emailed
            } else {
                $page_content .= "<p style='color:red;'>There was an issue sending your plan email. Please contact support.</p>";
            }
        } else {
            // If already emailed, show a greyed-out message
            $page_content .= "<p style='margin-top: 20px; color:grey;'>This plan has already been sent to {$user_email}.</p>";
        }
    }

    $page_content .= "<p style='margin-top: 30px;'><a href='" . htmlspecialchars(APP_URL) . "?action=reset' class='button start-over-button'>Start Over</a></p>";

    // Clear trigger flag if needed, but keep plan content and email status in session
    unset($_SESSION['plan_generation_triggered']); 

} elseif ($action === 'payment_cancel') {
    // --- Handle cancelled payment redirect ---
    $_SESSION['payment_status'] = 'cancelled';
    header('Location: ' . APP_URL . '?status=cancelled');
    exit;

} elseif ($action === 'reset') {
    // --- Clear Session and Restart ---
    session_unset();   // Remove all session variables
    session_destroy(); // Destroy the session data on the server
    session_start();   // Start a new, clean session
    header('Location: ' . APP_URL); // Redirect to base URL (Step 1)
    exit;

} elseif ($_SERVER['REQUEST_METHOD'] !== 'POST') { // Handle GET requests or initial load
    $current_step = isset($_GET['step']) ? (int)$_GET['step'] : ($_SESSION['current_step'] ?? 1);
    $_SESSION['current_step'] = $current_step;

    // Check for status messages (success, cancel, error)
    $status = $_GET['status'] ?? null;
    if ($status) {
        // We are on a status page, not a form step
        $current_step = 999; // Set step high to prevent form display
        $_SESSION['current_step'] = $current_step;
    } else {
        // Reset payment status if navigating back to steps
        unset($_SESSION['payment_status']);
    }
}

// --- Helper Functions ---
function generate_form_step(int $step_number, string $title, string $html_content): string {
    global $current_step;
    $display_style = ($step_number === $current_step) ? 'block' : 'none';
    $back_button_html = '';
    if ($step_number > 1) {
        $prev_step = $step_number - 1;
        $back_button_html = "<a href=\"?step={$prev_step}\" class=\"back-button\">&larr; Back</a>";
    }

    return <<<HTML
<div class="form-step" id="step-{$step_number}" style="display: {$display_style};">
    <form method="POST" action="{$_SERVER['PHP_SELF']}" data-step="{$step_number}">
        <input type="hidden" name="action" value="submit_step">
        <input type="hidden" name="current_step" value="{$step_number}">
        <h2>{$title}</h2>
        {$html_content}
        <div class="button-container">
            {$back_button_html}
            <button type="submit" class="next-button">Next &rarr;</button>
        </div>
    </form>
</div>
HTML;
}

// --- Placeholder for OpenAI Integration ---
function generate_keto_plan_via_openai($user_data) {
    // Retrieve API Key from Environment Variable
    $api_key = $_ENV['OPENAI_API_KEY'] ?? '';
    if (empty($api_key)) {
        error_log("OpenAI API Key not found in environment variables.");
        return "Error: API Key is not configured. Please contact support.";
    }
    $api_url = 'https://api.openai.com/v1/chat/completions';

    // Build the user-specific prompt
    $user_prompt = build_openai_prompt($user_data);
    if (strpos($user_prompt, 'Error:') === 0) {
        return $user_prompt; // Return error from prompt building
    }

    // Define the system message (copied from login/chatgpt_api.php)
    $system_message = "You are a helpful Keto Diet Nutritionist Assistant. Your goal is to provide a personalized 1-week keto meal plan based on the user's preferences and health information. Be friendly, encouraging, and provide clear, actionable meal suggestions including breakfast, lunch, and dinner for each day. Ensure the plan adheres strictly to keto principles (high fat, moderate protein, very low carb) and considers any disliked ingredients or health conditions mentioned.";

    // Prepare the payload
    $payload = json_encode([
        'model' => 'gpt-3.5-turbo', // Or use a newer model like gpt-4 if preferred
        'messages' => [
            ['role' => 'system', 'content' => $system_message],
            ['role' => 'user', 'content' => $user_prompt]
        ],
        'temperature' => 0.7, // Adjust for creativity vs determinism
        'max_tokens' => 1500 // Adjust based on expected plan length
    ]);

    // --- Use cURL for the API call ---
    if (function_exists('curl_init')) {
        $ch = curl_init($api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_key
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90); // Increase timeout for longer generations

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($curl_error) {
            error_log("cURL Error: " . $curl_error);
            return "Error: Could not connect to the plan generation service (cURL Error: " . htmlspecialchars($curl_error) . "). Please try again later.";
        }

        if ($http_code != 200) {
             error_log("OpenAI API Error: HTTP Code " . $http_code . " Response: " . $response);
            $error_details = json_decode($response, true);
            $error_message = $error_details['error']['message'] ?? 'Unknown API error';
             return "Error: Failed to generate plan (API Status: " . $http_code . " - " . htmlspecialchars($error_message) . "). Please check configuration or try again.";
        }

        $result = json_decode($response, true);

        if (isset($result['choices'][0]['message']['content'])) {
            // Return the generated plan content, maybe format slightly
            return nl2br(htmlspecialchars(trim($result['choices'][0]['message']['content'])));
        } else {
            error_log("OpenAI API Error: Unexpected response format: " . $response);
            return "Error: Received an unexpected response from the plan generation service. Please try again.";
        }

    } else {
        // Fallback or error if cURL is not available
         error_log("PHP cURL extension is not enabled.");
        return "Error: Server configuration issue (cURL is not enabled). Unable to generate plan.";
    }
}

function build_openai_prompt(array $user_data): string {
    // Flatten and format data for the prompt
    $details = [];
    $labels = [
        1 => 'Gender',
        2 => 'Keto Familiarity',
        3 => 'Meal Prep Time',
        4 => 'Disliked Meats',
        5 => 'Disliked Ingredients',
        6 => 'Activity Level',
        7 => 'Health Conditions',
        8 => 'Measurements'
    ];

    foreach ($user_data as $step => $data) {
         $label = $labels[$step] ?? "Step {$step}";
         if (is_array($data)) {
             $first_key = key($data);
             $first_value = reset($data);

             // Handle measurements structure
             if ($step == 8) {
                 $unit_type = $data['units'] ?? 'metric';
                 $details[] = "Measurements (Units: {$unit_type}):";
                 $details[] = "  Age: " . ($data['age'] ?? 'N/A');
                 if ($unit_type === 'metric') {
                      $details[] = "  Height: " . ($data['height_cm'] ?? 'N/A') . " cm";
                      $details[] = "  Current Weight: " . ($data['current_weight_kg'] ?? 'N/A') . " kg";
                      $details[] = "  Target Weight: " . ($data['target_weight_kg'] ?? 'N/A') . " kg";
                 } else {
                      $height_str = isset($data['height_ft']) ? ($data['height_ft'] . "ft ") : '';
                      $height_str .= isset($data['height_in']) ? ($data['height_in'] . "in") : '';
                      $details[] = "  Height: " . ($height_str ?: 'N/A');
                      $details[] = "  Current Weight: " . ($data['current_weight_lbs'] ?? 'N/A') . " lbs";
                      $details[] = "  Target Weight: " . ($data['target_weight_lbs'] ?? 'N/A') . " lbs";
                 }
             } elseif (in_array($step, [4, 5, 7]) && is_array($first_value)) {
                 // Handle checkbox arrays
                 $values = array_filter($first_value, fn($v) => $v !== null && $v !== '');
                 if (empty($values) || (count($values) === 1 && ($values[0] === 'none' || $values[0] === '')) ) {
                      $details[] = "{$label}: None specified";
                 } elseif (in_array('vegetarian', $values) && $step === 4) {
                      $details[] = "{$label}: Vegetarian";
                 } else {
                     if(count($values) > 1) {
                          $values = array_filter($values, fn($v) => $v !== 'none'); // Remove 'none' if others selected
                     }
                      $details[] = "{$label}: " . implode(', ', $values);
                 }
             } elseif (in_array($step, [1, 2, 3, 6]) && is_string($first_value)) {
                 // Handle radio button strings
                 $details[] = "{$label}: {$first_value}";
             }
         } else {
             // Should not happen if data is saved correctly, but good fallback
             $details[] = "{$label}: {$data}";
         }
    }

    $prompt = "Generate a 7-day personalized Keto meal plan based on the following user profile:\n\n";
    $prompt .= implode("\n", $details);
    $prompt .= "\n\nThe plan should include breakfast, lunch, dinner, and optional snacks for each day. "
             . "Include estimated prep time (use the user's available time as a guideline), approximate calorie counts per meal/day, and a shopping list for the week. "
             . "Ensure the plan avoids the user's disliked meats and ingredients and considers their activity level and health conditions. Focus on keto-friendly meals.";

    return $prompt;
}

// --- Placeholder for Email System ---
function send_plan_via_email(string $user_email, string $plan_content, int $week_number): bool {
    // 1. Choose email method: PHP mail(), PHPMailer, SendGrid, Mailgun, etc.
    // 2. Configure the chosen method (API keys, SMTP settings)
    // 3. Format the email content (HTML or plain text)
    //    - Include the $plan_content
    //    - Add branding, unsubscribe links, etc.
    // 4. Send the email
    // 5. Implement error handling and logging
    // 6. For weekly emails: This function needs to be called by a scheduler (cron job)
    //    that retrieves user details (email, subscription status) from a database.

    $subject = "Your Personalized Keto Plan - Week {$week_number}";
    $headers = "From: KetoCycle AI <" . FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: " . FROM_EMAIL . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n"; // Or text/html
    $message = "Hello,\n\nHere is your personalized Keto meal plan for Week {$week_number}:\n\n" . $plan_content;
    $message .= "\n\nEnjoy!\nThe KetoCycle AI Team";

    error_log("Attempting to send Week {$week_number} plan to: {$user_email}"); // Log for debugging

    // --- TEMPORARY: Simulate sending email --- 
    // In a real scenario, use a proper mail library.
    // return mail($user_email, $subject, $message, $headers);
    return true; // Assume success for now

    // --- Example using PHPMailer (requires installation & setup) ---
    /*
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    $mail = new PHPMailer(true);
    try {
        //Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.example.com'; // Set the SMTP server to send through
        $mail->SMTPAuth   = true;
        $mail->Username   = 'user@example.com'; // SMTP username
        $mail->Password   = 'secret'; // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        //Recipients
        $mail->setFrom(FROM_EMAIL, 'KetoCycle AI');
        $mail->addAddress($user_email);
        $mail->addReplyTo(FROM_EMAIL, 'KetoCycle AI');

        // Content
        $mail->isHTML(false); // Set email format to HTML true/false
        $mail->Subject = $subject;
        $mail->Body    = $message;
        // $mail->AltBody = strip_tags($message); // For HTML emails

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
    */
}

// --- Function to Format Raw Plan Text into HTML ---
function format_plan_html(string $raw_plan): string {
    // Basic formatting: Replace Markdown-like bold (**text**) with <strong>
    $html = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $raw_plan);

    // Split into lines for processing
    $lines = explode("\n", $html);
    $output_html = "<div class='keto-plan'>";
    $current_section = ''; // e.g., 'day', 'shopping'
    $is_in_list = false;

    foreach ($lines as $line) {
        $trimmed_line = trim($line);

        if (empty($trimmed_line)) {
            if ($is_in_list) {
                $output_html .= "</ul>";
                $is_in_list = false;
            }
            $output_html .= "<br>"; // Keep paragraph breaks
            continue;
        }

        // Detect Day headers (e.g., **Day 1**, Day 1)
        if (preg_match('/^(?:<strong>)?(Day\s+\d+)(?:<\/strong>)?/i', $trimmed_line, $matches)) {
            if ($is_in_list) {
                 $output_html .= "</ul>";
                 $is_in_list = false;
            }
            if ($current_section === 'day') {
                 $output_html .= "</div>"; // Close previous day div
            }
            $output_html .= "<div class='plan-day'><h2>" . $matches[1] . "</h2>";
            $current_section = 'day';
            continue; // Skip adding this line directly
        }

        // Detect Shopping List header
        if (preg_match('/^(?:<strong>)?(Shopping List)(?:<\/strong>)?/i', $trimmed_line, $matches)) {
             if ($is_in_list) {
                 $output_html .= "</ul>";
                 $is_in_list = false;
            }
             if ($current_section === 'day') {
                 $output_html .= "</div>"; // Close last day div
            }
            $output_html .= "<div class='shopping-list'><h3>" . $matches[1] . "</h3>";
            $current_section = 'shopping';
            $is_in_list = true;
            $output_html .= "<ul>";
            continue; // Skip adding this line directly
        }

        // Detect list items (starting with - or *)
        if (preg_match('/^[\-\*]\s+(.*)/i', $trimmed_line, $matches)) {
            if (!$is_in_list && ($current_section === 'day' || $current_section === 'shopping')) {
                $output_html .= "<ul>";
                $is_in_list = true;
            }
            if ($is_in_list) {
                // Try to bold meal types (Breakfast, Lunch, Dinner, Snack)
                $item_content = preg_replace('/^(Breakfast|Lunch|Dinner|Snack)s?:/i', '<strong>$1:</strong>', $matches[1]);
                $output_html .= "<li>" . $item_content . "</li>";
            }
             continue;
        }

        // Default: Treat as paragraph text within the current section
        if ($is_in_list) {
            $output_html .= "</ul>"; // Close list if we have regular text now
            $is_in_list = false;
        }
         // Basic paragraph formatting
         $output_html .= "<p>" . $trimmed_line . "</p>"; 

    }

    // Close any open tags
    if ($is_in_list) {
        $output_html .= "</ul>";
    }
     if ($current_section === 'day' || $current_section === 'shopping') {
         $output_html .= "</div>"; // Close last section div
    }
    
    $output_html .= "</div>"; // Close keto-plan div

    return $output_html;
}

// --- Define Form Steps ---
$steps = [];

// Step 1: Gender
$steps[1] = generate_form_step(1, 'Select Your Gender', <<<HTML
    <div class="options-container">
        <label class="option-card">
            <input type="radio" name="data[gender]" value="female" required>
            <span>Female</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[gender]" value="male" required>
            <span>Male</span>
        </label>
    </div>
HTML);

// Step 2: Keto Familiarity
$steps[2] = generate_form_step(2, 'How familiar are you with the Keto diet?', <<<HTML
    <div class="options-container">
        <label class="option-card">
            <input type="radio" name="data[familiarity]" value="beginner" required>
            <span>Beginner</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[familiarity]" value="somewhat_familiar" required>
            <span>Somewhat Familiar</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[familiarity]" value="expert" required>
            <span>Expert</span>
        </label>
    </div>
HTML);

// Step 3: Meal Prep Time
$steps[3] = generate_form_step(3, 'How much time do you have for meal preparation each day?', <<<HTML
    <div class="options-container">
        <label class="option-card">
            <input type="radio" name="data[prep_time]" value="15_mins" required>
            <span>15 mins</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[prep_time]" value="30_mins" required>
            <span>30 mins</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[prep_time]" value="60_plus_mins" required>
            <span>60+ mins</span>
        </label>
    </div>
HTML);

// Step 4: Meats Disliked (Checkboxes)
$steps[4] = generate_form_step(4, 'Which meats you DON\'T LIKE?', <<<HTML
    <div class="options-container">
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="none">
            <span>I eat all meats</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="poultry">
            <span>Poultry</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="pork">
            <span>Pork</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="beef">
            <span>Beef</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="fish">
            <span>Fish</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="lamb">
            <span>Lamb</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="veal">
            <span>Veal</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_meats][]" value="vegetarian">
            <span>I am vegetarian</span>
        </label>
        <!-- Add JS to handle "I eat all" / "Vegetarian" exclusivity -->
    </div>
HTML);

// Step 5: Ingredients Disliked (Checkboxes)
$steps[5] = generate_form_step(5, 'Which ingredients you DON\'T LIKE?', <<<HTML
    <div class="options-container">
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="none">
            <span>I eat them all</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="onions">
            <span>Onions</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="mushrooms">
            <span>Mushrooms</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="eggs">
            <span>Eggs</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="nuts">
            <span>Nuts</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="cheese">
            <span>Cheese</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="milk">
            <span>Milk</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="avocados">
            <span>Avocados</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="seafood">
            <span>Seafood</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="olives">
            <span>Olives</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="capers">
            <span>Capers</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="coconut">
            <span>Coconut</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[disliked_ingredients][]" value="goat_cheese">
            <span>Goat cheese</span>
        </label>
         <!-- Add JS to handle "I eat all" exclusivity -->
    </div>
HTML);

// Step 6: Physical Activity
$steps[6] = generate_form_step(6, 'How physically active are you?', <<<HTML
    <div class="options-container">
        <label class="option-card">
            <input type="radio" name="data[activity_level]" value="not_active" required>
            <span>Not Active (Sedentary lifestyle)</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[activity_level]" value="moderately_active" required>
            <span>Moderately Active (Exercise 1-3 times/week)</span>
        </label>
        <label class="option-card">
            <input type="radio" name="data[activity_level]" value="very_active" required>
            <span>Very Active (Exercise 4+ times/week)</span>
        </label>
    </div>
HTML);

// Step 7: Health Conditions (Checkboxes)
$steps[7] = generate_form_step(7, 'Does any of the following apply for you?', <<<HTML
    <div class="options-container">
        <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="none">
            <span>None of the above</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="diabetes">
            <span>Diabetes (any stage)</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="kidney_disease">
            <span>Kidney disease or issues</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="liver_disease">
            <span>Liver disease or issues</span>
        </label>
        <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="pancreas_disease">
            <span>Pancreas disease or issues</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="recovering_surgery">
            <span>I am recovering from surgery</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="mental_health">
            <span>Mental health issues</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="cancer">
            <span>Cancer</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="heart_disease_stroke">
            <span>Heart disease or stroke</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="high_blood_pressure">
            <span>High blood pressure</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="thyroid_issues">
            <span>Thyroid issues</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="high_cholesterol">
            <span>High cholesterol</span>
        </label>
         <label class="checkbox-card">
            <input type="checkbox" name="data[health_conditions][]" value="other">
            <span>Other health issues</span>
        </label>
        <!-- Add JS to handle "None" exclusivity -->
    </div>
HTML);

// Step 8: Measurements
$steps[8] = generate_form_step(8, 'Measurements', <<<HTML
    <div class="toggle-switch">
        <button type="button" class="active" data-unit="metric">Metric</button>
        <button type="button" data-unit="imperial">Imperial</button>
    </div>
    <input type="hidden" name="data[units]" value="metric"> <!-- Default value -->

    <div class="input-group">
        <label for="age">Age</label>
        <input type="number" id="age" name="data[age]" placeholder="Age" required min="16" max="100">
    </div>

    <div class="metric-field">
        <div class="input-group">
            <label for="height_cm">Height</label>
             <div class="input-unit">
                 <input type="number" id="height_cm" name="data[height_cm]" placeholder="Height" min="100" max="250" step="0.1">
                 <span>cm</span>
             </div>
        </div>
        <div class="input-group">
            <label for="current_weight_kg">Current weight</label>
             <div class="input-unit">
                 <input type="number" id="current_weight_kg" name="data[current_weight_kg]" placeholder="Current weight" min="30" max="300" step="0.1">
                 <span>kg</span>
             </div>
        </div>
        <div class="input-group">
            <label for="target_weight_kg">Target weight</label>
             <div class="input-unit">
                 <input type="number" id="target_weight_kg" name="data[target_weight_kg]" placeholder="Target weight" min="30" max="300" step="0.1">
                 <span>kg</span>
             </div>
        </div>
    </div>

    <div class="imperial-field" style="display: none;">
        <div class="input-group">
            <label>Height</label>
            <div style="display: flex; gap: 10px;">
                <div class="input-unit" style="flex: 1;">
                    <input type="number" name="data[height_ft]" placeholder="Feet" min="3" max="8">
                    <span>ft</span>
                </div>
                 <div class="input-unit" style="flex: 1;">
                    <input type="number" name="data[height_in]" placeholder="Inches" min="0" max="11">
                     <span>in</span>
                 </div>
            </div>
        </div>
        <div class="input-group">
            <label for="current_weight_lbs">Current weight</label>
             <div class="input-unit">
                 <input type="number" id="current_weight_lbs" name="data[current_weight_lbs]" placeholder="Current weight" min="60" max="660">
                 <span>lbs</span>
             </div>
        </div>
        <div class="input-group">
            <label for="target_weight_lbs">Target weight</label>
             <div class="input-unit">
                 <input type="number" id="target_weight_lbs" name="data[target_weight_lbs]" placeholder="Target weight" min="60" max="660">
                 <span>lbs</span>
             </div>
        </div>
    </div>
HTML);


// --- More steps will be added here ---
$total_steps = count($steps); // Dynamically count defined steps

// --- Process Final Step / Summary / Status Pages ---
$page_content = '';
$status = $_GET['status'] ?? ($_SESSION['payment_status'] ?? null);

if ($status === 'success') {
    // --- Plan Display Page Logic (Triggered by generate_plan action or successful payment) ---
    $page_content .= "<h2>Your Personalized Keto Plan</h2>";

    // In a real app, you'd likely store the email address collected before/during checkout.
    $user_email = $_SESSION['user_data']['email'] ?? 'test@example.com'; // Placeholder email

    $plan_content_for_display = null;

    // Check if plan is already stored in session to prevent re-generation on refresh
    if (isset($_SESSION['generated_plan_content'])) {
        $plan_content_for_display = $_SESSION['generated_plan_content'];
        error_log("Retrieved plan from session."); // Debug log
    } else {
        // Generate plan (Raw Text) - Only if not in session
        error_log("Generating new plan via API."); // Debug log
        $raw_generated_plan = generate_keto_plan_via_openai($user_data);
        
        // Store the result (plan or error message) in session
        $_SESSION['generated_plan_content'] = $raw_generated_plan; 
        
        $plan_content_for_display = $raw_generated_plan;
    }

    // --- Now process $plan_content_for_display ---

    // Display the generated plan or error message
    if (strpos($plan_content_for_display, 'Error:') === 0) {
        // Display error 
        $page_content .= "<p style='color:red;'>We encountered an issue generating your plan:</p>";
        // Error message might contain HTML special chars, but keep formatting simple
        $page_content .= "<p style='color:red; font-family: monospace;'>" . nl2br(htmlspecialchars($plan_content_for_display)) . "</p>";
    } else {
        // Format the raw plan into beautiful HTML
        // First, clean up potential nl2br artifacts from the API function
        $cleaned_raw_plan = strip_tags(str_replace(['<br>', '<br />'], "\n", $plan_content_for_display));
        $formatted_plan_html = format_plan_html($cleaned_raw_plan); 

        // Display the formatted plan
        $page_content .= "<div class='plan-content'>"; // Keep this outer container
        $page_content .= $formatted_plan_html;
        $page_content .= "</div>";

        // Also attempt to send email, but only once
        $plain_text_plan = strip_tags(str_replace(['<br>', '<br />'], "\n", $plan_content_for_display));
        
        if (!isset($_SESSION['plan_emailed'])) {
            $page_content .= "<p style='margin-top: 20px;'>We are also sending this plan to your email address ({$user_email}).</p>";
            $email_sent = send_plan_via_email($user_email, $plain_text_plan, 1);
            
            if ($email_sent) {
                $page_content .= "<p style='color:green;'>Week 1 plan has been sent to {$user_email}. Please check your inbox (and spam folder).</p>";
                $_SESSION['plan_emailed'] = true; // Mark as emailed
            } else {
                $page_content .= "<p style='color:red;'>There was an issue sending your plan email. Please contact support.</p>";
            }
        } else {
            // If already emailed, show a greyed-out message
            $page_content .= "<p style='margin-top: 20px; color:grey;'>This plan has already been sent to {$user_email}.</p>";
        }
    }

    $page_content .= "<p style='margin-top: 30px;'><a href='" . htmlspecialchars(APP_URL) . "?action=reset' class='button start-over-button'>Start Over</a></p>";

    // Clear trigger flag if needed, but keep plan content and email status in session
    unset($_SESSION['plan_generation_triggered']); 

} elseif ($status === 'cancelled') {
    // --- Cancellation Page Logic ---
    $page_content .= "<h2>Payment Cancelled</h2>";
    $page_content .= "<p>Your order was cancelled. You have not been charged.</p>";
    $page_content .= "<p><a href='" . APP_URL . "'>Click here to start over</a>.</p>";
    unset($_SESSION['payment_status']);
    unset($_SESSION['current_step']);
    unset($_SESSION['user_data']);

} elseif ($status === 'error') {
     // --- Error Page Logic ---
     $page_content .= "<h2>An Error Occurred</h2>";
     $page_content .= "<p>Sorry, something went wrong. Please try again later or contact support.</p>";
     $message = htmlspecialchars($_GET['message'] ?? 'Unknown error');
     $page_content .= "<p>Details: {$message}</p>";
     $page_content .= "<p><a href='" . APP_URL . "'>Click here to start over</a>.</p>";
     unset($_SESSION['payment_status']);
     unset($_SESSION['current_step']);
     unset($_SESSION['user_data']);

} elseif ($current_step > $total_steps) {
    // --- Summary Page Logic ---
    $summary_html = "<h2>Review Your Selections</h2><dl class='summary-list'>";
    
    // Define user-friendly display mappings
    $display_mappings = [
        // Step 1: Gender
        'gender' => [
            'male' => 'Male',
            'female' => 'Female'
        ],
        // Step 2: Keto Familiarity
        'familiarity' => [
            'beginner' => 'Beginner',
            'somewhat_familiar' => 'Somewhat Familiar',
            'expert' => 'Expert'
        ],
        // Step 3: Meal Prep Time
        'prep_time' => [
            '15_mins' => '15 Minutes',
            '30_mins' => '30 Minutes',
            '60_plus_mins' => '60+ Minutes'
        ],
        // Step 4: Disliked Meats
        'disliked_meats' => [
            'poultry' => 'Poultry',
            'pork' => 'Pork',
            'beef' => 'Beef',
            'fish' => 'Fish',
            'lamb' => 'Lamb',
            'veal' => 'Veal',
            'vegetarian' => 'Vegetarian',
            'none' => 'I eat all meats'
        ],
        // Step 5: Disliked Ingredients
        'disliked_ingredients' => [
            'onions' => 'Onions',
            'mushrooms' => 'Mushrooms',
            'eggs' => 'Eggs',
            'nuts' => 'Nuts',
            'cheese' => 'Cheese',
            'milk' => 'Milk',
            'avocados' => 'Avocados',
            'seafood' => 'Seafood',
            'olives' => 'Olives',
            'capers' => 'Capers',
            'coconut' => 'Coconut',
            'goat_cheese' => 'Goat Cheese',
            'none' => 'I eat them all'
        ],
        // Step 6: Activity Level
        'activity_level' => [
            'not_active' => 'Not Active',
            'moderately_active' => 'Moderately Active',
            'very_active' => 'Very Active'
        ],
        // Step 7: Health Conditions
        'health_conditions' => [
            'none' => 'None of the above',
            'diabetes' => 'Diabetes',
            'kidney_disease' => 'Kidney Disease',
            'liver_disease' => 'Liver Disease',
            'pancreas_disease' => 'Pancreas Disease',
            'recovering_surgery' => 'Recovering from Surgery',
            'mental_health' => 'Mental Health Issues',
            'cancer' => 'Cancer',
            'heart_disease_stroke' => 'Heart Disease or Stroke',
            'high_blood_pressure' => 'High Blood Pressure',
            'thyroid_issues' => 'Thyroid Issues',
            'high_cholesterol' => 'High Cholesterol',
            'other' => 'Other Health Issues'
        ]
    ];
    
    $labels = [
        1 => 'Gender',
        2 => 'Keto Familiarity',
        3 => 'Meal Prep Time',
        4 => 'Disliked Meats',
        5 => 'Disliked Ingredients',
        6 => 'Activity Level',
        7 => 'Health Conditions',
        8 => 'Measurements'
    ];
    
    // Map step numbers to data keys
    $data_keys = [
        1 => 'gender',
        2 => 'familiarity',
        3 => 'prep_time',
        4 => 'disliked_meats',
        5 => 'disliked_ingredients',
        6 => 'activity_level',
        7 => 'health_conditions'
    ];

    // --- Loop to Generate Summary Items ---
    foreach ($user_data as $step => $data) {
        $label = $labels[$step] ?? "Step {$step}";
        $summary_html .= "<div class='summary-item'>";
        $summary_html .= "<dt>{$label}</dt><dd>";

        if (is_array($data)) {
            // Data IS an array
            $first_key = key($data);
            $first_value = reset($data);

            if ($step == 8) {
                // --- Handle Measurements array (Uses multiple keys from $data) ---
                 $unit_type = $data['units'] ?? 'metric';
                 $value_str = "Age: " . ($data['age'] ?? 'N/A') . ", ";
                 if ($unit_type === 'metric') {
                     $value_str .= "Height: " . ($data['height_cm'] ?? 'N/A') . " cm, ";
                     $value_str .= "Weight: " . ($data['current_weight_kg'] ?? 'N/A') . " kg, ";
                     $value_str .= "Target: " . ($data['target_weight_kg'] ?? 'N/A') . " kg";
                 } else {
                     $height_str = isset($data['height_ft']) ? ($data['height_ft'] . "ft ") : '';
                     $height_str .= isset($data['height_in']) ? ($data['height_in'] . "in") : '';
                     $value_str .= "Height: " . ($height_str ?: 'N/A') . ", ";
                     $value_str .= "Weight: " . ($data['current_weight_lbs'] ?? 'N/A') . " lbs, ";
                     $value_str .= "Target: " . ($data['target_weight_lbs'] ?? 'N/A') . " lbs";
                 }
                 $summary_html .= htmlspecialchars($value_str);

            } elseif (in_array($step, [4, 5, 7]) && is_array($first_value)) {
                 // --- Handle Checkbox array (Value associated with the key is an array) ---
                $actual_values = $first_value; // Use the extracted inner array
                $values = array_filter($actual_values);
                
                if (empty($values) || (count($values) === 1 && ($values[0] === 'none' || $values[0] === ''))) {
                     $summary_html .= "None specified";
                } elseif (in_array('vegetarian', $values) && $step === 4) {
                     $summary_html .= "Vegetarian"; // Special case for vegetarian
                } else {
                    if(count($values) > 1) {
                         $values = array_filter($values, fn($v) => $v !== 'none'); // Remove 'none' if others selected
                    }
                     $data_key = $data_keys[$step] ?? '';
                     if (!empty($data_key) && isset($display_mappings[$data_key])) {
                         $friendly_values = [];
                         foreach ($values as $val) {
                             $friendly_values[] = $display_mappings[$data_key][$val] ?? $val;
                         }
                         $summary_html .= implode(', ', $friendly_values);
                     } else {
                         $summary_html .= implode(', ', $values); // Fallback if no mapping
                     }
                }

            } elseif (in_array($step, [1, 2, 3, 6]) && is_string($first_value)) {
                // --- Handle Radio button steps (Value associated with the key is a string) ---
                $data_key = $data_keys[$step] ?? '';
                if (!empty($data_key) && isset($display_mappings[$data_key][$first_value])) {
                    $summary_html .= htmlspecialchars($display_mappings[$data_key][$first_value]);
                } else {
                    $summary_html .= htmlspecialchars($first_value); // Fallback if no mapping
                }
            
            } else {
                // Fallback for unexpected array structure
                $summary_html .= '(Review data structure)';
            }
        } else {
            // Handle unexpected non-array data
            $summary_html .= '(Invalid data type)';
        }
        $summary_html .= "</dd></div>";
    }
    // --- End Loop ---

    $summary_html .= "</dl>";
    // Use a form for the checkout button to easily POST or GET
    $summary_html .= "<form action='" . htmlspecialchars(APP_URL) . "' method='POST' class='summary-actions'>";
    // Add hidden fields to maintain state if needed, or for specific actions
    $summary_html .= "<input type='hidden' name='action' value='generate_plan'>"; // <-- Changed action
    $summary_html .= "<input type='hidden' name='step' value='" . ($total_steps + 1) . "'>"; // Keep track
    
    // Buttons container
    $summary_html .= "<div class='button-container'>";
    // Start Over Button
    $summary_html .= "<a href='" . htmlspecialchars(APP_URL) . "?action=reset' class='button start-over-button'>Start Over</a>";
    // Generate Plan Button (Previously Checkout)
    $summary_html .= "<button type='submit' class='button checkout-button'>Generate My Plan</button>"; // <-- Changed text
    $summary_html .= "</div>"; // End button-container

    $summary_html .= "</form>";
    $page_content = $summary_html;
}

// --- HTML Output ---
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personalized Keto Diet Plan</title>
    <!-- Add Stripe.js script if using Stripe Elements or Checkout client-side -->
    <!-- <script src="https://js.stripe.com/v3/"></script> -->
    <style>
        body {
            font-family: sans-serif;
            background-color: #fdfaf5;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background-color: #fff;
            padding: 30px 40px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        .logo {
             font-weight: bold;
             font-size: 1.5em;
             color: #d9534f; /* Keto Cycle Red */
             margin-bottom: 20px;
        }
        .form-step {
            margin-top: 20px;
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        h2 {
            color: #5a3e36; /* Dark brown text */
            margin-bottom: 25px;
        }
        .options-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 25px;
        }
        .option-card,
        .checkbox-card {
            background-color: #fdfaf5;
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            cursor: pointer;
            transition: border-color 0.3s, box-shadow 0.3s;
            text-align: left;
        }
         .option-card:has(input[type="radio"]:checked),
         .checkbox-card:has(input[type="checkbox"]:checked) {
            border-color: #d9534f;
            box-shadow: 0 0 5px rgba(217, 83, 79, 0.3);
        }
        .option-card input[type="radio"],
        .checkbox-card input[type="checkbox"] {
            margin-right: 15px;
             transform: scale(1.2);
        }
        .option-card span,
        .checkbox-card span {
             flex-grow: 1;
        }

        .input-group {
             margin-bottom: 20px;
             text-align: left;
        }
         .input-group label {
             display: block;
             margin-bottom: 5px;
             font-weight: bold;
             color: #5a3e36;
         }
         .input-group input[type="text"],
         .input-group input[type="number"] {
             width: calc(100% - 22px); /* Adjust for padding */
             padding: 10px;
             border: 1px solid #ccc;
             border-radius: 4px;
             background-color: #fdfaf5;
         }
         .input-unit {
             display: flex;
             align-items: center;
         }
         .input-unit input {
             flex-grow: 1;
             margin-right: 10px;
             width: auto; /* Override width */
         }
         .input-unit span {
             font-weight: bold;
         }


        .toggle-switch {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            background-color: #fdfaf5;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #eee;
             max-width: 200px; /* Limit width */
             margin-left: auto; /* Center */
             margin-right: auto; /* Center */
        }
        .toggle-switch button {
            flex: 1;
            padding: 10px;
            border: none;
            background-color: transparent;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.3s, color 0.3s;
            color: #5a3e36;
        }
        .toggle-switch button.active {
            background-color: #5a3e36; /* Dark brown */
            color: #fff;
        }

        .next-button, #checkout-button {
            background-color: #d9534f; /* Keto Cycle Red */
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px; /* Pill shape */
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 150px; /* Ensure minimum width */
        }
        .next-button:hover, #checkout-button:hover {
            background-color: #c9302c; /* Darker Red */
        }
        .progress-bar {
             width: 100%;
             background-color: #eee;
             border-radius: 5px;
             overflow: hidden;
             height: 10px;
             margin-bottom: 30px;
         }
         .progress-bar-inner {
             height: 100%;
             width: 0%; /* Updated by JS */
             background-color: #d9534f;
             transition: width 0.4s ease-in-out;
         }
        .summary-list {
             text-align: left;
             margin-bottom: 30px;
             border-top: 1px solid #eee;
             padding-top: 20px;
        }
         .summary-item {
             display: flex;
             justify-content: space-between;
             padding: 8px 0;
             border-bottom: 1px solid #eee;
         }
          .summary-item dt {
              font-weight: bold;
              color: #5a3e36;
              padding-right: 15px;
          }
          .summary-item dd {
             margin-left: 0;
             text-align: right;
             color: #333;
             word-break: break-word; /* Prevent long strings overflowing */
             flex-basis: 60%; /* Allow more space for value */
         }
        #summary-step h2 {
             border-bottom: none;
             padding-bottom: 0;
             margin-bottom: 15px;
        }
        /* Styles for status pages */
         .status-message h2 {
             color: #d9534f; /* Red for error/cancel? Green for success? */
         }
          .status-message p {
              font-size: 1.1em;
              margin-bottom: 15px;
          }
           .status-message a {
               color: #d9534f;
               text-decoration: none;
               font-weight: bold;
           }
            .status-message a:hover {
                text-decoration: underline;
            }

        .button-container {
             display: flex;
             justify-content: space-between; /* Align back/next */
             align-items: center;
             margin-top: 30px;
        }

        .back-button {
             background-color: #f0f0f0;
             color: #555;
             border: 1px solid #ddd;
             padding: 10px 20px;
             border-radius: 25px;
             font-size: 0.9em;
             font-weight: bold;
             cursor: pointer;
             transition: background-color 0.3s, border-color 0.3s;
             text-decoration: none;
        }
        .back-button:hover {
            background-color: #e0e0e0;
            border-color: #ccc;
            color: #333;
        }

        .summary-buttons {
             margin-top: 30px;
             display: flex;
             justify-content: space-between; /* Space out buttons */
             align-items: center;
        }

        .reset-button {
            background-color: #f0f0f0;
            color: #555;
            border: 1px solid #ddd;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s, border-color 0.3s;
            text-decoration: none;
            line-height: 1.5; /* Match button padding */
        }
        .reset-button:hover {
            background-color: #e0e0e0;
            border-color: #ccc;
            color: #333;
        }

        /* Restore button styling for Generate Plan */
        .checkout-button {
            background-color: #d9534f; /* Keto Cycle Red */
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px; /* Pill shape */
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 150px; /* Ensure minimum width */
            text-decoration: none; /* In case it was wrapped in <a> accidentally */
        }
        .checkout-button:hover {
            background-color: #c9302c; /* Darker Red */
        }

        /* Styling for loading indicator */
        #loading-indicator {
            display: none; /* Hidden by default */
            padding: 50px 20px;
            text-align: center;
        }
        #loading-indicator p {
            font-size: 1.2em;
            color: #5a3e36;
            font-weight: bold;
            margin-bottom: 15px;
        }
        /* Basic spinner */
        .spinner {
            border: 4px solid #f3f3f3; /* Light grey */
            border-top: 4px solid #d9534f; /* Red */
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Styling for the generated Keto Plan */
        .keto-plan {
            text-align: left;
            margin-top: 20px;
            border: 1px solid #eee;
            padding: 20px;
            background-color: #fdfaf5;
            border-radius: 5px;
        }
        .plan-day {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #ddd;
        }
        .plan-day:last-child,
        .shopping-list:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .plan-day h2 {
            color: #d9534f; /* Keto Red */
            margin-top: 0;
            margin-bottom: 10px; /* Reduced from 15px */
            font-size: 1.4em;
            border-bottom: 2px solid #f0c9c8; /* Light red bottom border */
            padding-bottom: 5px;
        }
        .shopping-list h3 {
            color: #5a3e36; /* Dark Brown */
            margin-top: 10px;
            margin-bottom: 10px; /* Reduced from 15px */
            font-size: 1.3em;
            border-bottom: 2px solid #e0d8d7; /* Light brown bottom border */
            padding-bottom: 5px;
        }
        .keto-plan ul {
            list-style: none; /* Remove default bullets */
            padding-left: 0;
            margin-top: 5px; /* Reduced from 10px */
        }
        .keto-plan li {
            background-color: #fff;
            border: 1px solid #eee;
            border-radius: 4px;
            padding: 8px 12px; /* Slightly reduced padding */
            margin-bottom: 5px; /* Reduced from 8px */
            line-height: 1.5;
        }
        .keto-plan li strong { /* Style bolded parts, like meal types */
            color: #5a3e36;
            margin-right: 5px;
        }
        .keto-plan p {
            margin-bottom: 5px; /* Reduced from 10px */
            line-height: 1.6;
            color: #555;
        }

    </style>
</head>
<body>
    <div class="container">
        <div class="logo">KetoCycle AI</div>

        <!-- Loading Indicator -->
        <div id="loading-indicator">
            <p>Generating Your Custom Diet Plan...</p>
            <p id="loading-step-message" style="font-size: 0.9em; color: #777; min-height: 1.2em;"></p> <!-- Added this line -->
            <div class="spinner"></div>
        </div>

        <!-- Main Content Area -->
        <div id="main-content">
            <?php // Only show progress bar during form steps
                if ($current_step <= $total_steps && !isset($status)): ?>
                <div class="progress-bar">
                     <div class="progress-bar-inner" id="progressBar"></div>
                 </div>
            <?php endif; ?>

            <?php
                // Display the current step form OR the summary/status page content
                if (!empty($page_content)) {
                    // Status messages or Summary page are displayed here
                    echo $page_content; 
                } elseif ($current_step <= $total_steps && isset($steps[$current_step])) {
                    echo $steps[$current_step]; // Display form step
                } else {
                     // Fallback if something goes wrong (e.g., invalid step)
                     echo "<div class='status-message'><h2>Error</h2><p>An unexpected error occurred or the step was not found.</p><p><a href='" . APP_URL . "'>Start Over</a></p></div>";
                     session_destroy(); // Clear session on error
                }
            ?>
        </div> <!-- End #main-content -->

    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const totalSteps = <?php echo $total_steps; ?>;
            const currentStep = <?php echo $current_step; ?>;
            const isStatusPage = <?php echo isset($status) ? 'true' : 'false'; ?>;

            // Update progress bar only if not on a status page
             if (!isStatusPage) {
                 const progressBar = document.getElementById('progressBar');
                 if (progressBar) {
                     const progress = Math.min(100, ((currentStep -1) / totalSteps) * 100);
                     progressBar.style.width = progress + '%';
                 }
             }

            // --- Optional: Client-side validation ---
            const forms = document.querySelectorAll('.form-step form');
            forms.forEach(form => {
                form.addEventListener('submit', function(event) {
                    // Example: ensure a radio button is selected within the step
                    const radios = form.querySelectorAll('input[type="radio"]');
                    let oneChecked = false;
                    if (radios.length > 0) {
                        radios.forEach(radio => {
                             if (radio.checked) oneChecked = true;
                        });
                        if (!oneChecked && form.querySelector('input[required]')) { // Only block if required
                             // alert('Please make a selection.'); // Simple alert, better UI needed
                             // event.preventDefault(); // Prevent submission
                        }
                    }
                    // Add more complex validation if needed
                });
            });

             // --- Unit Toggle Logic (will be needed for Measurements step) ---
             const unitToggleButtons = document.querySelectorAll('.toggle-switch button');
             unitToggleButtons.forEach(button => {
                 button.addEventListener('click', function() {
                     const targetUnit = this.dataset.unit; // e.g., 'metric' or 'imperial'
                     const parentSwitch = this.closest('.toggle-switch');
                     const formStep = this.closest('.form-step');

                     // Update button styles
                     parentSwitch.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                     this.classList.add('active');

                     // Show/hide relevant input fields
                     formStep.querySelectorAll('.metric-field, .imperial-field').forEach(field => {
                         if (field.classList.contains(targetUnit + '-field')) {
                             field.style.display = '';
                              // Make inputs within the visible fields required (or not)
                              field.querySelectorAll('input').forEach(input => input.required = true);
                         } else {
                             field.style.display = 'none';
                             // Make inputs within hidden fields not required
                              field.querySelectorAll('input').forEach(input => input.required = false);
                         }
                     });

                     // Store preference (e.g., in a hidden input or JS variable)
                     const unitPrefInput = formStep.querySelector('input[name="data[units]"]');
                     if (unitPrefInput) unitPrefInput.value = targetUnit;
                 });
             });

             // --- Checkbox Exclusivity Logic ---
             function handleCheckboxExclusivity(containerSelector, exclusiveValue) {
                 const container = document.querySelector(containerSelector);
                 if (!container) return;

                 const allCheckboxes = container.querySelectorAll('input[type="checkbox"]');
                 const exclusiveCheckbox = container.querySelector(`input[type="checkbox"][value="${exclusiveValue}"]`);

                 if (!exclusiveCheckbox) return;

                 allCheckboxes.forEach(checkbox => {
                     checkbox.addEventListener('change', () => {
                         if (checkbox === exclusiveCheckbox && checkbox.checked) {
                             // If exclusive is checked, uncheck others
                             allCheckboxes.forEach(other => {
                                 if (other !== exclusiveCheckbox) other.checked = false;
                             });
                         } else if (checkbox !== exclusiveCheckbox && checkbox.checked) {
                             // If any other is checked, uncheck exclusive
                             exclusiveCheckbox.checked = false;
                         }
                     });
                 });
             }

             handleCheckboxExclusivity('#step-4 .options-container', 'none'); // "I eat all meats"
             handleCheckboxExclusivity('#step-4 .options-container', 'vegetarian'); // "I am vegetarian"
             handleCheckboxExclusivity('#step-5 .options-container', 'none'); // "I eat them all"
             handleCheckboxExclusivity('#step-7 .options-container', 'none'); // "None of the above"

             // Special handling for Vegetarian vs other meats in Step 4
             const step4Container = document.querySelector('#step-4 .options-container');
             if (step4Container) {
                const vegetarianCheckbox = step4Container.querySelector('input[value="vegetarian"]');
                const meatCheckboxes = step4Container.querySelectorAll('input[type="checkbox"]:not([value="vegetarian"]):not([value="none"])');

                if (vegetarianCheckbox) {
                     vegetarianCheckbox.addEventListener('change', () => {
                         if (vegetarianCheckbox.checked) {
                             meatCheckboxes.forEach(meat => meat.checked = false);
                             const noneCheckbox = step4Container.querySelector('input[value="none"]');
                             if(noneCheckbox) noneCheckbox.checked = false;
                         }
                     });
                }

                meatCheckboxes.forEach(meat => {
                     meat.addEventListener('change', () => {
                         if (meat.checked && vegetarianCheckbox) {
                             vegetarianCheckbox.checked = false;
                         }
                     });
                 });
             }

        });
+    
+        // --- Loading Indicator Logic ---
+        const summaryForm = document.querySelector('form.summary-actions');
+        const loadingIndicator = document.getElementById('loading-indicator');
+        const mainContent = document.getElementById('main-content');
+        const loadingStepMessage = document.getElementById('loading-step-message');
+
+        if (summaryForm && loadingIndicator && mainContent && loadingStepMessage) {
+
+            const loadingMessages = [
+                "Analyzing gender information...",
+                "Considering Keto familiarity level...",
+                "Factoring in meal prep time...",
+                "Noting meat preferences...",
+                "Avoiding disliked ingredients...",
+                "Adjusting for activity level...",
+                "Reviewing health conditions...",
+                "Calculating based on measurements...",
+                "Preparing your personalized plan...",
+                "Finalizing details..."
+            ];
+            let messageIndex = 0;
+            let intervalId = null;
+
+            summaryForm.addEventListener('submit', function() {
+                // Hide main content and show loader immediately
+                mainContent.style.display = 'none';
+                loadingIndicator.style.display = 'block';
+                loadingStepMessage.textContent = loadingMessages[0]; // Show first message immediately
+                messageIndex = 1;
+
+                // Cycle through remaining messages
+                intervalId = setInterval(() => {
+                    if (messageIndex < loadingMessages.length) {
+                        loadingStepMessage.textContent = loadingMessages[messageIndex];
+                        messageIndex++;
+                    } else {
+                        // Optional: Stop cycling or repeat last message
+                        // clearInterval(intervalId); 
+                        // Keep showing the last message until page redirects
+                        loadingStepMessage.textContent = loadingMessages[loadingMessages.length - 1]; 
+                    }
+                }, 750); // Adjust delay (milliseconds)
+
+                // Note: The actual form submission happens in parallel with this message cycling.
+                // The page will redirect when the server responds to the POST request.
+            });
+        } else {
+            // Log an error if elements are missing (shouldn't happen)
+            if (!summaryForm) console.error('Summary form not found');
+            if (!loadingIndicator) console.error('Loading indicator not found');
+            if (!mainContent) console.error('Main content wrapper not found');
+            if (!loadingStepMessage) console.error('Loading step message element not found');
+        }
+        
     </script>
 </body>
 </html> 