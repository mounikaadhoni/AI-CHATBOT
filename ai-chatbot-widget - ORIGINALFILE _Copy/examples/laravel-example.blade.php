{{--
  Laravel Integration — AI Chatbot Widget

  Add this to your main layout file:
  resources/views/layouts/app.blade.php

  Just add the script tag before </body>
--}}

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Laravel App — Chatbot Demo</title>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
        .navbar { background: #EF4444; color: white; padding: 16px 32px; }
        .navbar h1 { font-size: 20px; }
        .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .card h2 { margin-bottom: 12px; color: #333; }
        .card p { color: #666; line-height: 1.7; }
    </style>
</head>
<body>

    <div class="navbar">
        <h1>Laravel Application</h1>
    </div>

    <div class="container">
        <div class="card">
            <h2>Laravel + AI Chatbot</h2>
            <p>This is a Laravel Blade template with the chatbot embedded. It works just like any other script tag inclusion.</p>
        </div>

        <div class="card">
            <h2>Integration Steps</h2>
            <p>1. Open <code>resources/views/layouts/app.blade.php</code></p>
            <p>2. Add this line before <code>&lt;/body&gt;</code>:</p>
            <pre style="background:#1e1e2e;color:#a6e3a1;padding:12px;border-radius:8px;margin-top:8px;overflow-x:auto;">
&lt;script src="http://localhost:4000/widget/chatbot.js"
        data-server="http://localhost:4000"&gt;&lt;/script&gt;</pre>
            <p style="margin-top:12px;">3. That's it! The chatbot appears on all pages using this layout.</p>
        </div>

        <div class="card">
            <h2>Environment Config (Optional)</h2>
            <p>For production, use an env variable:</p>
            <pre style="background:#1e1e2e;color:#a6e3a1;padding:12px;border-radius:8px;margin-top:8px;overflow-x:auto;">
{{-- .env file --}}
CHATBOT_SERVER_URL=https://your-chatbot-server.com

{{-- In blade template --}}
&lt;script src="{{ config('app.chatbot_url', 'http://localhost:4000') }}/widget/chatbot.js"
        data-server="{{ config('app.chatbot_url', 'http://localhost:4000') }}"&gt;&lt;/script&gt;</pre>
        </div>

        @yield('content')
    </div>

    {{-- AI CHATBOT WIDGET — Just this one line! --}}
    <script src="http://localhost:4000/widget/chatbot.js" data-server="http://localhost:4000"></script>

</body>
</html>
