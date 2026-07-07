<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PHP Website — Chatbot Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
    .navbar { background: #2563EB; color: white; padding: 16px 32px; }
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
    <h1>PHP Website</h1>
  </div>

  <div class="container">
    <div class="card">
      <h2>Server Info</h2>
      <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
      <p><strong>Server Time:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
      <p><strong>Server:</strong> <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'N/A'; ?></p>
    </div>

    <div class="card">
      <h2>About This Demo</h2>
      <p>This is a PHP website with the AI chatbot widget embedded. The chatbot works on any PHP page — just add the script tag before the closing body tag.</p>
      <p>No PHP backend is needed for the chatbot itself — it communicates directly with the chatbot server via JavaScript.</p>
    </div>

    <div class="card">
      <h2>How to Integrate</h2>
      <p>Add this line before <code>&lt;/body&gt;</code> in your PHP template:</p>
      <pre style="background:#1e1e2e;color:#a6e3a1;padding:12px;border-radius:8px;margin-top:8px;overflow-x:auto;">
&lt;script src="http://localhost:4000/widget/chatbot.js"
        data-server="http://localhost:4000"&gt;&lt;/script&gt;</pre>
    </div>
  </div>

  <!-- CHATBOT WIDGET — Just this one line! -->
  <script src="http://localhost:4000/widget/chatbot.js" data-server="http://localhost:4000"></script>

</body>
</html>
