<?php
/**
 * WordPress Integration — AI Chatbot Widget
 *
 * METHOD 1: Add this to your theme's functions.php file
 * METHOD 2: Use a "Custom Code Snippets" plugin and paste this code
 *
 * The chatbot will automatically appear on every page of your WordPress site.
 */

// Method 1: Add to functions.php
function add_ai_chatbot_widget() {
    // Change the URL below to your chatbot server URL
    $chatbot_server = 'http://localhost:4000';

    echo '<script src="' . $chatbot_server . '/widget/chatbot.js" data-server="' . $chatbot_server . '"></script>';
}
add_action('wp_footer', 'add_ai_chatbot_widget');


/**
 * METHOD 2 (Alternative): If you want to only show on specific pages
 */
/*
function add_ai_chatbot_conditional() {
    $chatbot_server = 'http://localhost:4000';

    // Only show on homepage and contact page
    if (is_front_page() || is_page('contact')) {
        echo '<script src="' . $chatbot_server . '/widget/chatbot.js" data-server="' . $chatbot_server . '"></script>';
    }
}
add_action('wp_footer', 'add_ai_chatbot_conditional');
*/


/**
 * METHOD 3 (Shortcode): Use [ai_chatbot] shortcode in any page/post
 */
/*
function ai_chatbot_shortcode() {
    $chatbot_server = 'http://localhost:4000';
    return '<script src="' . $chatbot_server . '/widget/chatbot.js" data-server="' . $chatbot_server . '"></script>';
}
add_shortcode('ai_chatbot', 'ai_chatbot_shortcode');
*/
?>
