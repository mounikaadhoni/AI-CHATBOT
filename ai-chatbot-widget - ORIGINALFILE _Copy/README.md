# AI Chatbot Widget - Production Ready

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Server:** http://localhost:4000

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
```

### Access Application
```
http://localhost:4000
```

---

## 📁 Project Structure

```
ai-chatbot-widget/
├── admin/
│   ├── index.html          # Admin dashboard
│   └── knowledge.html      # Knowledge management (standalone)
├── server/
│   ├── server.js           # Main backend server
│   ├── config.json         # Configuration
│   └── chatbot.db          # SQLite database
├── widget/
│   └── chatbot.js          # Chatbot widget script
├── public/
│   └── index.html          # Demo page
├── node_modules/           # Dependencies
├── .env                    # Environment variables
├── package.json            # Project config
└── package-lock.json       # Dependency lock
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port
PORT=4000
```

**Get Gemini API Key:** https://makersuite.google.com/app/apikey

---

## 🎯 Features

### ✅ Core Features
- **Knowledge Base** - URL scraping, PDF upload
- **Gemini AI** - Intelligent responses (Priority 2)
- **Admin Dashboard** - Full management interface
- **Multilingual** - Automatic language detection
- **Lead Capture** - User information collection
- **Analytics** - Usage statistics

### ✅ Response Flow
```
1. Knowledge Base (URLs, PDFs)
   ↓ no match
2. Gemini AI (Main Engine)
   ↓ fails
3. Error Message
```

---

## 🌐 API Endpoints

### Chat
- `POST /api/chat` - Main chat endpoint

### Knowledge Base
- `POST /api/scrape-url` - Scrape website
- `POST /api/upload-pdf` - Upload PDF
- `POST /api/add-faq` - Add FAQ (not used in chat)

### Admin
- `GET /api/sessions` - Get all sessions
- `GET /api/stats` - Get statistics
- `PUT /api/config` - Update config

---

## 🧪 Testing

### Test Chat
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is AI?","sessionId":"test"}'
```

### Expected Response
```json
{
  "reply": "Artificial Intelligence is...",
  "source": "gemini"
}
```

---

## 📊 Response Sources

| Source | Description |
|--------|-------------|
| `knowledge_base` | URLs, PDFs |
| `gemini` | Gemini AI |
| `error` | Technical error |

**Note:** FAQ is removed from chat logic

---

## 🔧 Maintenance

### Update Dependencies
```bash
npm update
```

### Check for Issues
```bash
npm audit
```

### Fix Issues
```bash
npm audit fix
```

---

## 📝 Notes

- **Storage:** In-memory (SQLite not available on Windows)
- **FAQ:** Exists in config.json but not used in chat
- **Gemini:** Main AI engine (Priority 2)
- **Knowledge Base:** Priority 1

---

## 🚨 Manual Cleanup Required

Please manually delete this file if not needed:
- `admin/knowledge.html` (redundant - functionality in admin/index.html)

---

## ✅ Production Checklist

- [x] All documentation files removed
- [x] Examples folder removed
- [x] Backup files removed
- [x] Server runs without errors
- [x] Chatbot widget works
- [x] Gemini AI integrated
- [x] FAQ priority removed
- [x] Clean project structure

---

**Your AI Chatbot is ready for production! 🚀**
