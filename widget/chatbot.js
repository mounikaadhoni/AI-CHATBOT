// ============================================================
//  AI CHATBOT WIDGET v3.0 — 16 Features Embeddable Widget
//  Voice, Reactions, Sound, Dark Mode, File Upload,
//  Quick Replies, PDF Export, Rating, Typing Animation,
//  Multi-language, Time Greeting, Draggable, Markdown,
//  Fullscreen, Chat Search, Keyboard Shortcuts
//
//  Usage:
//    <script src="http://localhost:4000/widget/chatbot.js"
//            data-server="http://localhost:4000"></script>
// ============================================================

(function () {
  'use strict';

  const WIDGET_VERSION = '3.6.1';
  const scriptTag  = document.currentScript || document.querySelector('script[src*="chatbot.js"]');
  const SERVER_URL = scriptTag?.getAttribute('data-server') || window.location.origin;
  const BOT_ID     = scriptTag?.getAttribute('data-bot-id') || 'default';
  const API_KEY    = scriptTag?.getAttribute('data-api-key') || '';
  let SESSION_ID = '';

  let CONFIG = {
    botName: 'AI Assistant',
    companyName: 'My Company',
    welcomeMessage: 'Hi there! How can I help you today?',
    themeColor: '#4F46E5',
    position: 'bottom-right',
    placeholder: 'Type your message...',
    suggestedQuestions: [],
    showBranding: true
  };

  let isDarkMode = localStorage.getItem('chatbot_dark') === 'true';
  let currentLang = localStorage.getItem('chatbot_lang') || 'en';
  let isRecording = false;
  let messageCount = 0;
  let ratingGiven = false;
  let isFullscreen = false;
  let isSearchOpen = false;
  let chatIsOpen = false;
  let userEmail = '';
  let emailVerified = false;
  let userInteractions = parseInt(localStorage.getItem('chatbot_interactions') || '0');
  let leadCaptured = localStorage.getItem('chatbot_lead_captured') === 'true';
  let pageUrl = window.location.href;
  let isOffline = false;

  let flowComponents = [];
  let flowIsActive = false;
  let flowCurrentStepIndex = 0;
  let flowAnswers = {};

  // ---- Translations -----------------------------------------
  const LANGS = {
    en: { placeholder: 'Type your message...', welcome: 'Hi! How can I help?', send: 'Send', voice: 'Voice input', dark: 'Dark mode', light: 'Light mode', export: 'Export chat', rate: 'Rate this conversation', thankRate: 'Thanks for your feedback!', upload: 'Attach file', langLabel: 'Language', search: 'Search messages...', fullscreen: 'Fullscreen', noResults: 'No messages found' },
    es: { placeholder: 'Escribe tu mensaje...', welcome: 'Hola! Como puedo ayudarte?', send: 'Enviar', voice: 'Entrada de voz', dark: 'Modo oscuro', light: 'Modo claro', export: 'Exportar chat', rate: 'Califica esta conversacion', thankRate: 'Gracias por tus comentarios!', upload: 'Adjuntar archivo', langLabel: 'Idioma', search: 'Buscar mensajes...', fullscreen: 'Pantalla completa', noResults: 'No se encontraron mensajes' },
    fr: { placeholder: 'Tapez votre message...', welcome: 'Bonjour! Comment puis-je aider?', send: 'Envoyer', voice: 'Saisie vocale', dark: 'Mode sombre', light: 'Mode clair', export: 'Exporter le chat', rate: 'Evaluez cette conversation', thankRate: 'Merci pour votre avis!', upload: 'Joindre un fichier', langLabel: 'Langue', search: 'Rechercher des messages...', fullscreen: 'Plein ecran', noResults: 'Aucun message trouve' },
    hi: { placeholder: 'अपना संदेश लिखें...', welcome: 'नमस्ते! मैं कैसे मदद कर सकता हूं?', send: 'भेजें', voice: 'आवाज इनपुट', dark: 'डार्क मोड', light: 'लाइट मोड', export: 'चैट निर्यात', rate: 'इस बातचीत को रेट करें', thankRate: 'आपकी प्रतिक्रिया के लिए धन्यवाद!', upload: 'फ़ाइल संलग्न करें', langLabel: 'भाषा', search: 'संदेश खोजें...', fullscreen: 'पूर्ण स्क्रीन', noResults: 'कोई संदेश नहीं मिला' },
    te: { placeholder: 'మీ సందేశాన్ని టైప్ చేయండి...', welcome: 'హాయ్! నేను ఎలా సహాయపడగలను?', send: 'పంపండి', voice: 'వాయిస్ ఇన్‌పుట్', dark: 'డార్క్ మోడ్', light: 'లైట్ మోడ్', export: 'చాట్ ఎగుమతి', rate: 'ఈ సంభాషణకు రేట్ ఇవ్వండి', thankRate: 'మీ అభిప్రాయానికి ధన్యవాదాలు!', upload: 'ఫైల్ జతచేయండి', langLabel: 'భాష', search: 'సందేశాలను వెతకండి...', fullscreen: 'పూర్తి స్క్రీన్', noResults: 'సందేశాలు కనుగొనబడలేదు' },
    ar: { placeholder: 'اكتب رسالتك...', welcome: 'مرحبا! كيف يمكنني المساعدة؟', send: 'إرسال', voice: 'إدخال صوتي', dark: 'الوضع الداكن', light: 'الوضع الفاتح', export: 'تصدير الدردشة', rate: 'قيم هذه المحادثة', thankRate: 'شكرا لملاحظاتك!', upload: 'إرفاق ملف', langLabel: 'اللغة', search: 'البحث في الرسائل...', fullscreen: 'ملء الشاشة', noResults: 'لم يتم العثور على رسائل' }
  };

  function t(key) { return (LANGS[currentLang] || LANGS.en)[key] || LANGS.en[key]; }

  // ---- Session Management -----------------------------------
  function getSessionId() {
    let id = localStorage.getItem('chatbot_session_id');
    if (!id) {
      id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbot_session_id', id);
    }
    return id;
  }

  // ---- Load Config ------------------------------------------
  async function loadConfig() {
    try {
      const url = `${SERVER_URL}/api/config?botId=${encodeURIComponent(BOT_ID)}&apiKey=${encodeURIComponent(API_KEY)}&hostname=${encodeURIComponent(window.location.hostname)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        CONFIG = { ...CONFIG, ...data };
        return { success: true };
      } else if (res.status === 403) {
        try {
          const errData = await res.json();
          return { success: false, message: errData.message || 'Unauthorized Access' };
        } catch (_) {
          return { success: false, message: 'Unauthorized Domain. This bot is not configured for this website.' };
        }
      }
    } catch (e) {
      console.warn('Chatbot: Could not load config, using defaults');
    }
    return { success: true };
  }

  // ---- FEATURE: Time-Based Greeting (IST) -------------------
  function getTimeGreeting() {
    // Convert current time to IST (UTC+5:30)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (5.5 * 3600000));
    const hour = ist.getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  // ---- FEATURE: Markdown Support ----------------------------
  function renderMarkdown(text) {
    let html = escapeHtml(text);
    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(128,128,128,0.15);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>');
    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:inherit;text-decoration:underline;">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Bullet lists: lines starting with - or *
    html = html.replace(/^[-*]\s+(.+)/gm, '<span style="display:block;padding-left:12px;">&#8226; $1</span>');
    return html;
  }

  // ---- Sound Effects ----------------------------------------
  function playSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.08;

      if (type === 'send') {
        osc.frequency.value = 880;
        osc.type = 'sine';
      } else if (type === 'receive') {
        osc.frequency.value = 660;
        osc.type = 'sine';
      } else if (type === 'click') {
        osc.frequency.value = 1200;
        osc.type = 'sine';
      }

      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // ---- Inject Styles ----------------------------------------
  function injectStyles() {
    const theme = CONFIG.themeColor;
    const old = document.getElementById('chatbot-widget-styles');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'chatbot-widget-styles';
    style.textContent = `
      #chatbot-widget-container * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* ---- Toggle Button ---- */
      #chatbot-toggle {
        position: fixed; bottom: 24px; right: 24px;
        width: 62px; height: 62px; border-radius: 50%;
        background: ${theme}; border: none; cursor: pointer;
        box-shadow: 0 4px 24px rgba(0,0,0,0.28);
        z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s, box-shadow 0.3s;
      }
      #chatbot-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(0,0,0,0.35); }
      #chatbot-toggle svg { width: 28px; height: 28px; fill: white; }
      #chatbot-toggle .pulse-ring {
        position: absolute; width: 100%; height: 100%; border-radius: 50%;
        border: 3px solid ${theme}; animation: chatbot-pulse 2s infinite;
      }
      @keyframes chatbot-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      /* ---- Chat Window ---- */
      #chatbot-window {
        position: fixed; bottom: 100px; right: 24px;
        width: 400px; height: 560px;
        border-radius: 20px;
        box-shadow: 0 10px 50px rgba(0,0,0,0.2);
        z-index: 99998;
        display: none; flex-direction: column;
        overflow: hidden;
        animation: chatbot-slideUp 0.35s ease;
        transition: all 0.3s ease;
      }
      #chatbot-window.open { display: flex; }
      #chatbot-window.light { background: #fff; color: #333; }
      #chatbot-window.dark { background: #1a1a2e; color: #e0e0e0; }

      /* Fullscreen mode */
      #chatbot-window.fullscreen {
        width: 100vw !important; height: 100vh !important;
        bottom: 0 !important; right: 0 !important;
        left: 0 !important; top: 0 !important;
        border-radius: 0 !important;
        max-width: 100vw !important; max-height: 100vh !important;
      }

      @keyframes chatbot-slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Drag cursor on header */
      #chatbot-header.draggable { cursor: move; }

      /* ---- Header ---- */
      #chatbot-header {
        background: ${theme}; color: white;
        padding: 14px 18px;
        display: flex; align-items: center; justify-content: space-between;
        flex-shrink: 0; user-select: none;
      }
      #chatbot-header-info { display: flex; align-items: center; gap: 10px; }
      #chatbot-avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; position: relative;
      }
      #chatbot-avatar .status-dot {
        position: absolute; bottom: 1px; right: 1px;
        width: 10px; height: 10px; border-radius: 50%;
        background: #4ade80; border: 2px solid ${theme};
      }
      #chatbot-header-text h4 { font-size: 15px; font-weight: 600; color: white; }
      #chatbot-header-text span { font-size: 11px; opacity: 0.85; color: white; }
      .header-actions { display: flex; align-items: center; gap: 4px; }
      .header-btn {
        background: rgba(255,255,255,0.15); border: none; color: white;
        width: 32px; height: 32px; border-radius: 50%;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 15px; transition: background 0.2s;
      }
      .header-btn:hover { background: rgba(255,255,255,0.3); }

      /* ---- Search Bar ---- */
      #chatbot-search-bar {
        display: none; padding: 8px 14px; gap: 8px;
        align-items: center; flex-shrink: 0;
        border-bottom: 1px solid rgba(128,128,128,0.15);
      }
      #chatbot-search-bar.open { display: flex; }
      .light #chatbot-search-bar { background: #fff; }
      .dark #chatbot-search-bar { background: #16213e; }
      #chatbot-search-input {
        flex: 1; border: 1px solid rgba(128,128,128,0.3);
        border-radius: 8px; padding: 7px 12px;
        font-size: 13px; outline: none;
      }
      .light #chatbot-search-input { background: #f7f8fc; color: #333; }
      .dark #chatbot-search-input { background: #0f0f23; color: #e0e0e0; }
      #chatbot-search-input:focus { border-color: ${theme}; }
      #chatbot-search-close {
        background: none; border: none; font-size: 18px;
        cursor: pointer; color: inherit; opacity: 0.6;
      }
      #chatbot-search-close:hover { opacity: 1; }
      #chatbot-search-count { font-size: 11px; opacity: 0.6; white-space: nowrap; }
      .search-highlight { background: #fde047 !important; color: #333 !important; border-radius: 2px; padding: 0 2px; }

      /* ---- Toolbar ---- */
      #chatbot-toolbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 6px 14px; flex-shrink: 0;
        border-bottom: 1px solid rgba(128,128,128,0.15);
        font-size: 12px;
      }
      .light #chatbot-toolbar { background: #f0f0f5; }
      .dark #chatbot-toolbar { background: #16213e; }
      #chatbot-toolbar select {
        background: transparent; border: 1px solid rgba(128,128,128,0.3);
        border-radius: 6px; padding: 3px 6px; font-size: 11px;
        color: inherit; cursor: pointer; outline: none;
      }
      .dark #chatbot-toolbar select { color: #ccc; }
      .dark #chatbot-toolbar select option { background: #1a1a2e; color: #ccc; }

      /* ---- Messages ---- */
      #chatbot-messages {
        flex: 1; overflow-y: auto;
        padding: 16px; display: flex;
        flex-direction: column; gap: 8px;
      }
      .light #chatbot-messages { background: #f7f8fc; }
      .dark #chatbot-messages { background: #0f0f23; }
      #chatbot-messages::-webkit-scrollbar { width: 5px; }
      #chatbot-messages::-webkit-scrollbar-thumb { background: #bbb; border-radius: 10px; }
      .dark #chatbot-messages::-webkit-scrollbar-thumb { background: #444; }

      .chatbot-msg-wrapper { display: flex; flex-direction: column; margin-bottom: 2px; }
      .chatbot-msg-wrapper.user { align-items: flex-end; }
      .chatbot-msg-wrapper.bot { align-items: flex-start; }

      .chatbot-msg {
        max-width: 82%; padding: 10px 14px;
        border-radius: 8px; font-size: 13.5px;
        line-height: 1.6;
        word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;
        width: fit-content;
      }
      .chatbot-msg .msg-text {
        display: inline;
      }
      .light .chatbot-msg.bot { background: white; color: #333; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-bottom-left-radius: 2px; }
      .dark .chatbot-msg.bot { background: #16213e; color: #e0e0e0; border-bottom-left-radius: 2px; }
      .chatbot-msg.user {
        background: ${theme}; color: white;
        border-bottom-right-radius: 2px;
      }

      .msg-time {
        font-size: 10px; opacity: 0.5;
        margin-top: 4px; display: block;
        text-align: right;
      }
      .chatbot-msg.bot .msg-time { text-align: left; }

      /* Markdown styles inside messages */
      .chatbot-msg strong { font-weight: 700; }
      .chatbot-msg em { font-style: italic; }
      .chatbot-msg a { text-decoration: underline; }

      /* Reactions */
      .msg-reactions { display: flex; gap: 4px; margin-top: 4px; }
      .msg-reactions button {
        background: none; border: 1px solid rgba(128,128,128,0.25);
        border-radius: 12px; padding: 2px 8px; font-size: 14px;
        cursor: pointer; transition: all 0.2s; opacity: 0.6;
      }
      .msg-reactions button:hover { opacity: 1; transform: scale(1.15); }
      .msg-reactions button.reacted {
        opacity: 1; border-color: ${theme};
        background: rgba(79,70,229,0.1);
      }

      /* Quick Reply Buttons */
      .quick-replies { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .quick-reply-btn {
        background: transparent; border: 1.5px solid ${theme};
        color: ${theme}; border-radius: 20px;
        padding: 6px 14px; font-size: 12px; font-weight: 500;
        cursor: pointer; transition: all 0.2s;
      }
      .quick-reply-btn:hover { background: ${theme}; color: white; }
      .dark .quick-reply-btn { border-color: #7c7cf5; color: #a5a5ff; }
      .dark .quick-reply-btn:hover { background: #7c7cf5; color: white; }

      /* File Attachment Preview */
      .file-preview {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.15);
        border-radius: 10px; padding: 8px 12px;
        margin-bottom: 6px; font-size: 12px;
      }
      .chatbot-msg.bot .file-preview { background: rgba(128,128,128,0.08); }
      .file-preview .file-icon { font-size: 20px; flex-shrink: 0; }
      .file-preview .file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .file-preview img { max-width: 200px; max-height: 150px; border-radius: 8px; display: block; }

      /* Typing Indicator */
      .chatbot-typing {
        display: flex; gap: 5px; padding: 12px 16px;
        align-self: flex-start; border-radius: 16px;
        border-bottom-left-radius: 4px;
      }
      .light .chatbot-typing { background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .dark .chatbot-typing { background: #16213e; }
      .chatbot-typing span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #aaa; animation: chatbot-bounce 1.4s infinite ease-in-out;
      }
      .chatbot-typing span:nth-child(2) { animation-delay: 0.16s; }
      .chatbot-typing span:nth-child(3) { animation-delay: 0.32s; }
      @keyframes chatbot-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* ---- Suggestions ---- */
      #chatbot-suggestions {
        display: flex; flex-wrap: wrap; gap: 6px;
        padding: 8px 14px; flex-shrink: 0;
      }
      .light #chatbot-suggestions { background: #f7f8fc; }
      .dark #chatbot-suggestions { background: #0f0f23; }
      .chatbot-suggestion {
        border: 1px solid #ddd; border-radius: 20px;
        padding: 6px 14px; font-size: 12px; cursor: pointer;
        transition: all 0.2s;
      }
      .light .chatbot-suggestion { background: white; color: #555; }
      .dark .chatbot-suggestion { background: #16213e; color: #bbb; border-color: #333; }
      .chatbot-suggestion:hover { background: ${theme}; color: white; border-color: ${theme}; }

      /* ---- Rating Bar ---- */
      #chatbot-rating {
        display: none; flex-direction: column; align-items: center;
        padding: 12px; gap: 8px; flex-shrink: 0;
        border-top: 1px solid rgba(128,128,128,0.15);
      }
      #chatbot-rating .rating-label { font-size: 12px; font-weight: 500; opacity: 0.8; }
      #chatbot-rating .stars { display: flex; gap: 6px; }
      #chatbot-rating .star {
        font-size: 26px; cursor: pointer; transition: transform 0.2s;
        filter: grayscale(1); opacity: 0.4;
      }
      #chatbot-rating .star:hover { transform: scale(1.3); filter: grayscale(0); opacity: 1; }
      #chatbot-rating .star.active { filter: grayscale(0); opacity: 1; }

      /* ---- Input Area ---- */
      #chatbot-input-area {
        display: flex; align-items: center;
        padding: 10px 12px; gap: 6px;
        border-top: 1px solid rgba(128,128,128,0.15);
        flex-shrink: 0;
      }
      .light #chatbot-input-area { background: white; }
      .dark #chatbot-input-area { background: #1a1a2e; }

      .input-btn {
        width: 36px; height: 36px; border-radius: 50%;
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; transition: all 0.2s; flex-shrink: 0;
      }
      .light .input-btn { background: #f0f0f5; color: #666; }
      .dark .input-btn { background: #16213e; color: #aaa; }
      .input-btn:hover { filter: brightness(0.9); }
      .input-btn.recording { background: #EF4444 !important; color: white !important; animation: chatbot-pulseRec 1s infinite; }
      @keyframes chatbot-pulseRec {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
      }

      #chatbot-input {
        flex: 1; border: 1px solid #ddd;
        border-radius: 24px; padding: 9px 16px;
        font-size: 13.5px; outline: none;
        transition: border-color 0.2s;
        min-width: 0;
      }
      .light #chatbot-input { background: #f7f8fc; color: #333; border-color: #ddd; }
      .dark #chatbot-input { background: #0f0f23; color: #e0e0e0; border-color: #333; }
      #chatbot-input:focus { border-color: ${theme}; }

      #chatbot-send {
        width: 38px; height: 38px; border-radius: 50%;
        background: ${theme}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; flex-shrink: 0;
      }
      #chatbot-send:hover { filter: brightness(1.15); transform: scale(1.05); }
      #chatbot-send svg { width: 17px; height: 17px; fill: white; }

      /* File upload preview bar */
      #chatbot-file-bar {
        display: none; align-items: center; gap: 8px;
        padding: 6px 14px; font-size: 12px;
        border-top: 1px solid rgba(128,128,128,0.15);
        flex-shrink: 0;
      }
      .light #chatbot-file-bar { background: #fefce8; }
      .dark #chatbot-file-bar { background: #1a1a0e; color: #ccc; }
      #chatbot-file-bar .remove-file {
        background: none; border: none; cursor: pointer;
        font-size: 16px; color: #EF4444;
      }

      /* Keyboard shortcut hints */
      #chatbot-shortcuts-hint {
        text-align: center; padding: 3px;
        font-size: 9px; flex-shrink: 0; opacity: 0.4;
      }
      .light #chatbot-shortcuts-hint { color: #999; background: white; }
      .dark #chatbot-shortcuts-hint { color: #555; background: #1a1a2e; }

      /* Branding */
      #chatbot-branding {
        text-align: center; padding: 4px;
        font-size: 10px; flex-shrink: 0;
      }
      .light #chatbot-branding { color: #bbb; background: white; }
      .dark #chatbot-branding { color: #555; background: #1a1a2e; }

      /* ---- Email Capture Modal ---- */
      #chatbot-email-screen {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        flex: 1; padding: 30px 24px; text-align: center;
      }
      .light #chatbot-email-screen { background: #f7f8fc; }
      .dark #chatbot-email-screen { background: #0f0f23; }
      #chatbot-email-screen .email-icon { font-size: 48px; margin-bottom: 16px; }
      #chatbot-email-screen h3 {
        font-size: 18px; font-weight: 700; margin-bottom: 6px;
      }
      #chatbot-email-screen .email-subtitle {
        font-size: 13px; opacity: 0.65; margin-bottom: 24px; line-height: 1.5;
      }
      #chatbot-email-screen .email-form {
        width: 100%; display: flex; flex-direction: column; gap: 10px;
      }
      #chatbot-email-input {
        width: 100%; padding: 12px 16px;
        border: 2px solid #ddd; border-radius: 12px;
        font-size: 14px; outline: none; transition: border-color 0.2s;
        text-align: center;
      }
      .light #chatbot-email-input { background: white; color: #333; }
      .dark #chatbot-email-input { background: #16213e; color: #e0e0e0; border-color: #333; }
      #chatbot-email-input:focus { border-color: ${theme}; }
      #chatbot-email-input.error { border-color: #EF4444; animation: chatbot-shake 0.4s; }
      @keyframes chatbot-shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-6px); }
        40%, 80% { transform: translateX(6px); }
      }
      #chatbot-email-error {
        font-size: 12px; color: #EF4444; min-height: 18px;
      }
      #chatbot-email-submit {
        width: 100%; padding: 12px;
        background: ${theme}; color: white;
        border: none; border-radius: 12px;
        font-size: 15px; font-weight: 600;
        cursor: pointer; transition: all 0.2s;
      }
      #chatbot-email-submit:hover { filter: brightness(1.1); transform: scale(1.02); }

      /* Intro Screen */
      #chatbot-intro-screen {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        flex: 1; padding: 30px 24px; text-align: center;
      }
      .light #chatbot-intro-screen { background: #f7f8fc; }
      .dark #chatbot-intro-screen { background: #0f0f23; }
      #chatbot-intro-screen .intro-icon { font-size: 48px; margin-bottom: 16px; }
      #chatbot-intro-screen .intro-company {
        font-size: 20px; font-weight: 700; margin-bottom: 12px; color: ${theme};
      }
      #chatbot-intro-screen .intro-text {
        font-size: 13.5px; line-height: 1.7; opacity: 0.75; margin-bottom: 24px;
      }
      #chatbot-intro-continue {
        padding: 12px 40px;
        background: ${theme}; color: white;
        border: none; border-radius: 12px;
        font-size: 15px; font-weight: 600;
        cursor: pointer; transition: all 0.2s;
      }
      #chatbot-intro-continue:hover { filter: brightness(1.1); transform: scale(1.02); }
      .intro-email-tag {
        font-size: 11px; opacity: 0.5; margin-top: 12px;
      }

      /* ---- Lead Capture Form (Inline card in chat) ---- */
      .chatbot-lead-form {
        margin: 10px 0; padding: 16px;
        border-radius: 12px; align-self: stretch;
        border: 1px solid rgba(79,70,229,0.2);
      }
      .light .chatbot-lead-form { background: #EEF2FF; }
      .dark .chatbot-lead-form { background: #1e2a4a; }
      .chatbot-lead-form h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
      .chatbot-lead-form p { font-size: 12px; opacity: 0.7; margin-bottom: 10px; }
      .chatbot-lead-form input {
        width: 100%; padding: 9px 12px; margin-bottom: 8px;
        border: 1px solid #ddd; border-radius: 8px;
        font-size: 13px; outline: none;
      }
      .light .chatbot-lead-form input { background: white; color: #333; }
      .dark .chatbot-lead-form input { background: #0f0f23; color: #e0e0e0; border-color: #333; }
      .chatbot-lead-form input:focus { border-color: ${theme}; }
      .chatbot-lead-form .lead-actions { display: flex; gap: 8px; }
      .chatbot-lead-form button {
        flex: 1; padding: 9px; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: all 0.2s;
      }
      .chatbot-lead-form .lead-submit { background: ${theme}; color: white; }
      .chatbot-lead-form .lead-submit:hover { filter: brightness(1.1); }
      .chatbot-lead-form .lead-skip {
        background: transparent; color: inherit;
        border: 1px solid rgba(128,128,128,0.25);
      }
      .chatbot-lead-form .lead-skip:hover { background: rgba(128,128,128,0.1); }

      /* Handoff menu */
      #chatbot-handoff-menu {
        display: none; position: absolute;
        top: 62px; right: 14px;
        background: white; border-radius: 12px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        padding: 6px; z-index: 100;
        min-width: 180px;
      }
      .dark #chatbot-handoff-menu { background: #16213e; box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
      #chatbot-handoff-menu.open { display: block; }
      .handoff-option {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 12px; border-radius: 8px;
        font-size: 13px; cursor: pointer;
        color: inherit; text-decoration: none;
        transition: background 0.15s;
      }
      .light .handoff-option:hover { background: #f0f0f5; }
      .dark .handoff-option:hover { background: #1e2a4a; }
      .handoff-option .handoff-icon {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
      }
      .handoff-option.whatsapp .handoff-icon { background: #25D366; color: white; }
      .handoff-option.call .handoff-icon { background: #3B82F6; color: white; }
      .handoff-option.email .handoff-icon { background: #EF4444; color: white; }

      /* Offline banner */
      #chatbot-offline-banner {
        display: none; padding: 8px 14px;
        background: #FEF3C7; color: #92400E;
        font-size: 12px; text-align: center;
        flex-shrink: 0; border-bottom: 1px solid #FBD38D;
      }
      #chatbot-offline-banner.show { display: block; }

      /* Talk to Agent button */
      .header-btn.handoff-btn {
        background: rgba(255,255,255,0.25); font-size: 11px;
        width: auto; padding: 0 10px; font-weight: 600;
        white-space: nowrap;
      }

      /* ==================================================
         Complaint Form — Customer Complaint Form (clean, light)
         restored from widget/_complaint-form-css-backup.txt
         ================================================== */
      .chatbot-complaint-card {
        align-self: flex-start;
        width: 94%; max-width: 320px;
        margin: 6px 0 8px;
        border-radius: 14px;
        background: #ffffff;
        border: 2px solid #3b82f6;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.08);
        overflow: hidden;
        animation: complaintSlide 0.3s ease;
      }
      .dark .chatbot-complaint-card {
        background: #ffffff;
        border-color: #3b82f6;
      }
      #chatbot-window.fullscreen .chatbot-complaint-card {
        max-width: 380px;
      }

      @keyframes complaintSlide {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Header band — light blue background, bold dark title */
      .complaint-header {
        background: #e6efff;
        padding: 10px 14px;
      }
      .complaint-header h4 {
        font-size: 14px; font-weight: 700;
        color: #1e293b; line-height: 1.2;
      }
      .complaint-header p { display: none; }

      /* Body */
      .complaint-body { padding: 10px 14px 12px; background: #ffffff; }
      .complaint-field { margin-bottom: 8px; }
      .complaint-field label {
        display: block; font-size: 12px; font-weight: 500;
        margin-bottom: 4px; color: #334155;
      }

      .complaint-input-wrap { position: relative; }
      .complaint-input-wrap .field-icon { display: none; }

      .complaint-body input,
      .complaint-body textarea {
        width: 100%; padding: 8px 10px;
        border: none;
        border-radius: 7px; font-size: 13px; outline: none;
        font-family: inherit;
        background: #dde4ec; color: #1e293b;
        transition: box-shadow 0.15s ease, background 0.15s ease;
      }
      .complaint-body input::placeholder,
      .complaint-body textarea::placeholder { color: #94a3b8; }
      .complaint-body input:focus,
      .complaint-body textarea:focus {
        background: #eef2f7;
        box-shadow: 0 0 0 2px #93c5fd;
      }
      .complaint-body textarea {
        resize: none; min-height: 50px; max-height: 90px;
      }
      .complaint-body input:disabled,
      .complaint-body textarea:disabled {
        opacity: 0.85; cursor: default;
      }

      /* Action buttons — Cancel (left) + Submit (right), share width */
      .complaint-actions {
        display: flex; gap: 8px; margin-top: 4px;
      }
      .complaint-submit,
      .complaint-cancel {
        flex: 1;
        padding: 9px 14px;
        border-radius: 8px;
        font-size: 13.5px; font-weight: 600; cursor: pointer;
        font-family: inherit;
        transition: background 0.15s ease;
      }
      .complaint-submit {
        border: none;
        background: #bcd5f8; color: #1e3a8a;
      }
      .complaint-submit:hover { background: #a5c4f5; }
      .complaint-submit:disabled {
        background: #c8e0d2; color: #15803d; cursor: default;
      }
      .complaint-cancel {
        border: 1px solid #cbd5e1;
        background: #ffffff; color: #475569;
      }
      .complaint-cancel:hover { background: #f1f5f9; }

      /* Confirmation row inside card after submit */
      .complaint-confirm {
        margin-top: 10px;
        text-align: center;
        font-size: 12.5px;
        color: #15803d;
        font-weight: 500;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .complaint-confirm .dot {
        width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;
        animation: confirmDot 1s ease-in-out infinite;
      }
      @keyframes confirmDot {
        0%,100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* (legacy) success state — no longer used; confirmation now appears as a chat message */
      .complaint-success { display: none; }
      .complaint-success .check-circle {
        width: 60px; height: 60px; border-radius: 50%;
        background: #10B981; margin: 0 auto 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 32px; color: white;
        animation: checkPulse 1.2s ease infinite;
      }
      @keyframes checkPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
        50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
      }
      .complaint-success h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: #10B981; }
      .complaint-success p { font-size: 12px; opacity: 0.7; margin-bottom: 8px; line-height: 1.5; }
      .complaint-success .ticket-id {
        display: inline-block; padding: 6px 14px;
        background: rgba(16,185,129,0.1); color: #059669;
        border-radius: 20px; font-family: monospace;
        font-size: 12px; font-weight: 600; margin-top: 6px;
      }

      /* Handoff menu — complaint option */
      .handoff-option.complaint .handoff-icon { background: #EF4444; color: white; }

      /* ---- Mobile ---- */
      @media (max-width: 480px) {
        #chatbot-window { width: calc(100vw - 16px); height: calc(100vh - 120px); bottom: 84px; right: 8px; border-radius: 14px; }
        #chatbot-toggle { bottom: 16px; right: 16px; width: 56px; height: 56px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---- Build Widget -----------------------------------------
  function buildWidget() {
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';

    const langOptions = Object.keys(LANGS).map(l =>
      `<option value="${l}" ${l === currentLang ? 'selected' : ''}>${l.toUpperCase()}</option>`
    ).join('');

    container.innerHTML = `
      <button id="chatbot-toggle" aria-label="Open chat">
        <div class="pulse-ring"></div>
        ${CONFIG.logo
          ? `<img src="${CONFIG.logo}" id="chatbot-icon-chat" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
          : `<svg viewBox="0 0 24 24" id="chatbot-icon-chat"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>`
        }
        <svg viewBox="0 0 24 24" id="chatbot-icon-close" style="display:none">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <div id="chatbot-window" class="${isDarkMode ? 'dark' : 'light'}">
        <div id="chatbot-header" class="draggable">
          <div id="chatbot-header-info">
            <div id="chatbot-avatar">${CONFIG.logo ? `<img src="${CONFIG.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '🤖'}<span class="status-dot"></span></div>
            <div id="chatbot-header-text">
              <h4>${CONFIG.botName}</h4>
              <span>Online</span>
            </div>
          </div>
          <div class="header-actions">
            ${CONFIG.handoff && CONFIG.handoff.enabled ? `<button class="header-btn handoff-btn" id="btn-handoff" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="${CONFIG.handoff.buttonText || 'Talk to Agent'}">👤 Agent</button>` : ''}
            <button class="header-btn" id="btn-clear" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="Clear chat">🗑️</button>
            <button class="header-btn" id="btn-search" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="Search (Ctrl+F)">🔍</button>
            <button class="header-btn" id="btn-fullscreen" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="${t('fullscreen')}">⛶</button>
            <button class="header-btn" id="btn-complaint" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="Raise a Complaint">📝</button>
            <button class="header-btn" id="btn-darkmode" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="${isDarkMode ? t('light') : t('dark')}">
              ${isDarkMode ? '☀️' : '🌙'}
            </button>
            <button class="header-btn" id="btn-export" style="${emailVerified || !CONFIG.emailCapture ? 'display: flex;' : 'display: none;'}" title="${t('export')}">📥</button>
            <button class="header-btn" id="chatbot-close">&times;</button>
          </div>

          <!-- Handoff dropdown menu -->
          <div id="chatbot-handoff-menu">
            ${CONFIG.handoff && CONFIG.handoff.whatsapp ? `<a class="handoff-option whatsapp" href="https://wa.me/${(CONFIG.handoff.whatsapp || '').replace(/\D/g,'')}" target="_blank"><div class="handoff-icon">💬</div><div><div style="font-weight:600;">WhatsApp</div><div style="font-size:11px;opacity:0.6;">Chat on WhatsApp</div></div></a>` : ''}
            ${CONFIG.handoff && CONFIG.handoff.phone ? `<a class="handoff-option call" href="tel:${CONFIG.handoff.phone}"><div class="handoff-icon">📞</div><div><div style="font-weight:600;">Call Us</div><div style="font-size:11px;opacity:0.6;">${CONFIG.handoff.phone}</div></div></a>` : ''}
            ${CONFIG.handoff && CONFIG.handoff.email ? `<a class="handoff-option email" href="mailto:${CONFIG.handoff.email}"><div class="handoff-icon">✉️</div><div><div style="font-weight:600;">Email</div><div style="font-size:11px;opacity:0.6;">${CONFIG.handoff.email}</div></div></a>` : ''}
          </div>
        </div>

        <!-- Offline Banner -->
        <div id="chatbot-offline-banner">⚠️ ${CONFIG.offlineMessage || 'Connection lost. Please check your internet.'}</div>

        <!-- Search Bar -->
        <div id="chatbot-search-bar">
          <input type="text" id="chatbot-search-input" placeholder="${t('search')}" autocomplete="off">
          <span id="chatbot-search-count"></span>
          <button id="chatbot-search-close">&times;</button>
        </div>

        <div id="chatbot-toolbar" style="${!emailVerified && CONFIG.emailCapture ? 'display: none;' : ''}">
          <div>
            <label style="font-size:11px;opacity:0.7;">${t('langLabel')}: </label>
            <select id="chatbot-lang">${langOptions}</select>
          </div>
          <div style="font-size:11px;opacity:0.6;" id="chatbot-status-text">Ready to chat</div>
        </div>

        <!-- Email Capture Screen -->
        <div id="chatbot-email-screen" style="${emailVerified || !CONFIG.emailCapture ? 'display:none' : ''}">
          <div class="email-icon">💬</div>
          <h3>${CONFIG.emailCaptureTitle || 'Start a Conversation'}</h3>
          <p class="email-subtitle">${CONFIG.emailCaptureSubtitle || 'Enter your email to begin chatting with us'}</p>
          <div class="email-form">
            <input type="email" id="chatbot-email-input" placeholder="your@email.com" autocomplete="email">
            <div id="chatbot-email-error"></div>
            <button id="chatbot-email-submit">Start Chat</button>
          </div>
        </div>

        <!-- Intro Screen -->
        <div id="chatbot-intro-screen" style="display:none">
          <div class="intro-icon">🏢</div>
          <div class="intro-company">${CONFIG.companyName}</div>
          <p class="intro-text">${CONFIG.introMessage || ''}</p>
          <button id="chatbot-intro-continue">Continue to Chat</button>
          <div class="intro-email-tag">Signed in as <span id="intro-email-display"></span></div>
        </div>

        <div id="chatbot-messages" style="${!emailVerified && CONFIG.emailCapture ? 'display:none' : ''}"></div>

        <div id="chatbot-suggestions" style="${!emailVerified && CONFIG.emailCapture ? 'display:none' : ''}"></div>

        <div id="chatbot-rating" style="display:none !important;"></div>

        <div id="chatbot-file-bar">
          📎 <span id="chatbot-file-name"></span>
          <button class="remove-file" id="btn-remove-file">&times;</button>
        </div>

        <div id="chatbot-input-area" style="${!emailVerified && CONFIG.emailCapture ? 'display:none' : ''}">
          <input type="file" id="chatbot-file-input" style="display:none" accept="image/*,.pdf,.doc,.docx,.txt">
          <button class="input-btn" id="btn-upload" title="${t('upload')}">📎</button>
          <button class="input-btn" id="btn-voice" title="${t('voice')}">🎤</button>
          <input type="text" id="chatbot-input" placeholder="${t('placeholder')}" autocomplete="off">
          <button id="chatbot-send" aria-label="${t('send')}">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div id="chatbot-shortcuts-hint" style="${!emailVerified && CONFIG.emailCapture ? 'display:none' : ''}">ESC close &bull; Ctrl+F search &bull; Ctrl+Enter send</div>

        ${CONFIG.showBranding ? '<div id="chatbot-branding">Powered by AI Chatbot Widget</div>' : ''}
      </div>
    `;
    document.body.appendChild(container);
  }

  // ---- Suggestions ------------------------------------------
  function renderSuggestions() {
    const box = document.getElementById('chatbot-suggestions');
    if (!CONFIG.suggestedQuestions.length) { box.style.display = 'none'; return; }
    box.innerHTML = CONFIG.suggestedQuestions.map(q =>
      `<button class="chatbot-suggestion">${q}</button>`
    ).join('');
    box.querySelectorAll('.chatbot-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        sendMessage(btn.textContent);
        box.style.display = 'none';
      });
    });
  }

  // ---- Typing Animation (ChatGPT-style) --------------------
  function typeText(element, text, callback) {
    let i = 0;
    element.innerHTML = '';
    const speed = 18;
    function typeChar() {
      if (i < text.length) {
        element.innerHTML = renderMarkdown(text.substring(0, i + 1));
        i++;
        const messages = document.getElementById('chatbot-messages');
        messages.scrollTop = messages.scrollHeight;
        setTimeout(typeChar, speed);
      } else {
        if (callback) callback();
      }
    }
    typeChar();
  }

  // ---- Emoji Reactions --------------------------------------
  function createReactions(msgId) {
    const div = document.createElement('div');
    div.className = 'msg-reactions';
    div.innerHTML = `
      <button data-reaction="👍" data-msgid="${msgId}" title="Helpful">👍</button>
      <button data-reaction="👎" data-msgid="${msgId}" title="Not helpful">👎</button>
    `;
    div.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        div.querySelectorAll('button').forEach(b => b.classList.remove('reacted'));
        btn.classList.add('reacted');
      });
    });
    return div;
  }

  // ---- Quick Reply Buttons ----------------------------------
  function createQuickReplies(options) {
    const div = document.createElement('div');
    div.className = 'quick-replies';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        playSound('click');
        sendMessage(opt);
        div.remove();
      });
      div.appendChild(btn);
    });
    return div;
  }

  // ---- Message Rendering ------------------------------------
  function addMessage(text, sender, options = {}) {
    const messages = document.getElementById('chatbot-messages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageCount++;
    const msgId = 'msg_' + messageCount;

    const wrapper = document.createElement('div');
    wrapper.className = `chatbot-msg-wrapper ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg ${sender}`;
    bubble.id = msgId;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = time;

    // File attachment
    if (options.file) {
      const preview = document.createElement('div');
      preview.className = 'file-preview';
      if (options.file.type && options.file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = options.file.dataUrl;
        preview.appendChild(img);
      } else {
        preview.innerHTML = `<span class="file-icon">📄</span><span class="file-name">${options.file.name}</span>`;
      }
      bubble.appendChild(preview);
    }

    wrapper.appendChild(bubble);

    if (sender === 'bot' && !options.noAnimate) {
      const textNode = document.createElement('span');
      textNode.className = 'msg-text';
      bubble.appendChild(textNode);
      bubble.appendChild(timeSpan);
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;

      typeText(textNode, text, () => {
        playSound('receive');
        wrapper.appendChild(createReactions(msgId));
        if (options.quickReplies) {
          wrapper.appendChild(createQuickReplies(options.quickReplies));
        }
        if (options.extraHtml) {
          renderExtraHtml(bubble, options);
        }
      });
    } else {
      if (text) {
        const textNode = document.createElement('span');
        textNode.className = 'msg-text';
        if (sender === 'bot') {
          textNode.innerHTML = renderMarkdown(text);
        } else {
          textNode.textContent = text;
        }
        bubble.appendChild(textNode);
      }
      if (options.extraHtml) {
        renderExtraHtml(bubble, options);
      }
      bubble.appendChild(timeSpan);
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      if (sender === 'user') playSound('send');
    }

    saveToLocal(sender, text);

    if (flowIsActive) {
      logMessageToServer(sender === 'user' ? 'user' : 'assistant', text, options.file);
    }
  }

  function renderExtraHtml(bubble, options) {
    const extraNode = document.createElement('div');
    extraNode.innerHTML = options.extraHtml;
    bubble.appendChild(extraNode);
    
    // Attach listeners for interactive elements in extraHtml!
    if (options.isMultipleChoice) {
      const btn = extraNode.querySelector('.flow-submit-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const checkedBoxes = extraNode.querySelectorAll('input[type="checkbox"]:checked');
          const selected = Array.from(checkedBoxes).map(cb => cb.value);
          if (selected.length === 0) return;
          handleFlowAnswer(options.flowCompId, selected.join(', '), selected);
        });
      }
    }
    else if (options.isWebsiteLink) {
      const btn = extraNode.querySelector('.flow-website-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          handleFlowAnswer(options.flowCompId, `Clicked: ${btn.textContent}`);
        });
      }
    }
    else if (options.isRating) {
      const stars = extraNode.querySelectorAll('.flow-star');
      stars.forEach(star => {
        star.addEventListener('mouseover', () => {
          const val = parseInt(star.getAttribute('data-val'));
          stars.forEach((s, idx) => {
            s.style.color = idx < val ? '#f59e0b' : '#cbd5e1';
          });
        });
        star.addEventListener('mouseout', () => {
          stars.forEach(s => s.style.color = '#cbd5e1');
        });
        star.addEventListener('click', () => {
          const val = star.getAttribute('data-val');
          handleFlowAnswer(options.flowCompId, val);
        });
      });
    }
    else if (options.isDatePicker) {
      const btn = extraNode.querySelector('.flow-date-submit');
      const input = extraNode.querySelector('input');
      if (btn && input) {
        btn.addEventListener('click', () => {
          if (input.value) {
            handleFlowAnswer(options.flowCompId, input.value);
          }
        });
      }
    }
  }

  function showTyping() {
    const messages = document.getElementById('chatbot-messages');
    const div = document.createElement('div');
    div.className = 'chatbot-typing';
    div.id = 'chatbot-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    document.getElementById('chatbot-status-text').textContent = `${CONFIG.botName} is typing...`;
  }

  function hideTyping() {
    const el = document.getElementById('chatbot-typing-indicator');
    if (el) el.remove();
    document.getElementById('chatbot-status-text').textContent = 'Ready to chat';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Local Storage ----------------------------------------
  function saveToLocal(role, content) {
    try {
      let history = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
      history.push({ role, content, time: Date.now() });
      if (history.length > 100) history = history.slice(-100);
      localStorage.setItem('chatbot_history', JSON.stringify(history));
    } catch (e) {}
  }

  function loadFromLocal() {
    try {
      const history = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
      const messages = document.getElementById('chatbot-messages');
      history.forEach(h => {
        const time = new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const wrapper = document.createElement('div');
        wrapper.className = `chatbot-msg-wrapper ${h.role === 'user' ? 'user' : 'bot'}`;
        const div = document.createElement('div');
        div.className = `chatbot-msg ${h.role === 'user' ? 'user' : 'bot'}`;
        const textSpan = document.createElement('span');
        textSpan.className = 'msg-text';
        if (h.role !== 'user') {
          textSpan.innerHTML = renderMarkdown(h.content);
        } else {
          textSpan.textContent = h.content;
        }
        div.appendChild(textSpan);
        const timeEl = document.createElement('span');
        timeEl.className = 'msg-time';
        timeEl.textContent = time;
        div.appendChild(timeEl);
        wrapper.appendChild(div);
        messages.appendChild(wrapper);
        messageCount++;
      });
      if (history.length > 0) {
        messages.scrollTop = messages.scrollHeight;
        document.getElementById('chatbot-suggestions').style.display = 'none';
      }
    } catch (e) {}
  }

  async function logMessageToServer(role, content, file = null) {
    if (!SESSION_ID) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-Bot-Key'] = API_KEY;

      let fileToSend = null;
      if (file) {
        // file dataUrl, name, type format matches fileToSend
        fileToSend = {
          dataUrl: file.dataUrl || '',
          name: file.name || '',
          type: file.type || ''
        };
      }

      await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          sessionId: SESSION_ID,
          role: role,
          saveOnly: true,
          botId: BOT_ID,
          widgetVersion: WIDGET_VERSION,
          file: fileToSend
        })
      });
    } catch (e) {
      console.warn('Chatbot: Failed to log message to server:', e);
    }
  }

  // ---- Send Message -----------------------------------------
  let pendingFile = null;

  async function sendMessage(text) {
    if (CONFIG.emailCapture && !emailVerified) return;
    if (!text.trim() && !pendingFile) return;

    const fileOpts = {};
    let fileToSend = null;
    if (pendingFile) {
      fileOpts.file = pendingFile;
      fileToSend = pendingFile;
      text = text.trim();
      clearFile();
    }

    addMessage(text || '', 'user', fileOpts);
    document.getElementById('chatbot-input').value = '';

    if (flowIsActive) {
      const comp = flowComponents[flowCurrentStepIndex];
      if (comp) {
        disableLastFlowButtons();
        handleFlowAnswer(comp.id, text, null, true);
        return;
      }
    }

    // Direct complaint request → open form, skip bot fallback
    if (text && isDirectComplaintRequest(text)) {
      setTimeout(() => {
        addMessage("Sure! Please fill this form and our team will get back to you shortly. 👇", 'bot', { noAnimate: true });
        setTimeout(showComplaintForm, 400);
      }, 300);
      return;
    }

    showTyping();

    // Send a placeholder for backend if text is empty but file exists
    const sendText = text || (fileToSend ? `[File: ${fileToSend.name}]` : text);

    // Track interactions (only real user text messages)
    if (text.trim()) {
      userInteractions++;
      localStorage.setItem('chatbot_interactions', userInteractions);
    }

    // Offline mode
    if (!navigator.onLine) {
      hideTyping();
      addMessage(CONFIG.offlineMessage || "We're currently offline. Please leave your email and we'll get back to you soon.", 'bot', {});
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-Bot-Key'] = API_KEY;

      const res = await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: sendText,
          sessionId: SESSION_ID,
          lang: currentLang,
          email: userEmail,
          file: fileToSend,
          pageUrl,
          botId: BOT_ID,
          widgetVersion: WIDGET_VERSION
        })
      });

      hideTyping();

      if (res.ok) {
        const data = await res.json();
        const qr = detectQuickReplies(data.reply);
        addMessage(data.reply, 'bot', { quickReplies: qr });
        // Show lead form after N interactions
        setTimeout(maybeShowLeadForm, 1500);
        // Auto-suggest complaint form if user mentioned a complaint
        if (detectComplaintIntent(text) && !document.querySelector('.chatbot-complaint-card')) {
          setTimeout(() => {
            addMessage("It sounds like you're having an issue. Would you like to raise a formal complaint? I'll open a form for you.", 'bot', { noAnimate: false });
            setTimeout(showComplaintForm, 1800);
          }, 1200);
        }
      } else if (res.status === 429) {
        addMessage("You're sending messages too quickly. Please wait a moment.", 'bot', {});
      } else {
        addMessage("Sorry, I'm having trouble right now. Please try again.", 'bot', {});
      }
    } catch (err) {
      hideTyping();
      addMessage(CONFIG.offlineMessage || "Unable to connect. Please check your connection.", 'bot', {});
    }
  }

  function detectQuickReplies(reply) {
    const lower = reply.toLowerCase();
    if (lower.includes('help') || lower.includes('can help')) {
      return ['Tell me more', 'Contact support', 'Pricing info'];
    }
    if (lower.includes('anything else') || lower.includes('something else')) {
      return ['Yes, I have a question', 'No, thanks!'];
    }
    return null;
  }

  // ---- FEATURE: Voice Input ---------------------------------
  function setupVoice() {
    const btn = document.getElementById('btn-voice');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) { btn.style.display = 'none'; return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'es' ? 'es-ES' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'te' ? 'te-IN' : currentLang === 'ar' ? 'ar-SA' : 'en-US';

    btn.addEventListener('click', () => {
      if (isRecording) { recognition.stop(); return; }
      playSound('click');
      recognition.start();
      isRecording = true;
      btn.classList.add('recording');
      document.getElementById('chatbot-status-text').textContent = 'Listening...';
    });

    recognition.onresult = (e) => {
      document.getElementById('chatbot-input').value = e.results[0][0].transcript;
    };
    recognition.onend = () => {
      isRecording = false;
      btn.classList.remove('recording');
      document.getElementById('chatbot-status-text').textContent = 'Ready to chat';
      const input = document.getElementById('chatbot-input');
      if (input.value.trim()) sendMessage(input.value);
    };
    recognition.onerror = () => {
      isRecording = false;
      btn.classList.remove('recording');
      document.getElementById('chatbot-status-text').textContent = 'Ready to chat';
    };
  }

  // ---- FEATURE: Dark/Light Mode -----------------------------
  function setupDarkMode() {
    document.getElementById('btn-darkmode').addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      localStorage.setItem('chatbot_dark', isDarkMode);
      const win = document.getElementById('chatbot-window');
      win.classList.toggle('dark', isDarkMode);
      win.classList.toggle('light', !isDarkMode);
      const btn = document.getElementById('btn-darkmode');
      btn.innerHTML = isDarkMode ? '☀️' : '🌙';
      btn.title = isDarkMode ? t('light') : t('dark');
      playSound('click');
    });
  }

  // ---- FEATURE: File Upload ---------------------------------
  function setupFileUpload() {
    const fileInput = document.getElementById('chatbot-file-input');
    const btn = document.getElementById('btn-upload');

    btn.addEventListener('click', () => { playSound('click'); fileInput.click(); });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // Max 15 MB file size
      if (file.size > 15 * 1024 * 1024) {
        alert('File too large. Please upload files under 15 MB.');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pendingFile = { name: file.name, type: file.type, dataUrl: reader.result };
        document.getElementById('chatbot-file-name').textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
        document.getElementById('chatbot-file-bar').style.display = 'flex';
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('btn-remove-file').addEventListener('click', clearFile);
  }

  function clearFile() {
    pendingFile = null;
    document.getElementById('chatbot-file-bar').style.display = 'none';
    document.getElementById('chatbot-file-input').value = '';
  }

  // ---- FEATURE: Export Chat ---------------------------------
  function setupExport() {
    document.getElementById('btn-export').addEventListener('click', () => {
      playSound('click');
      const history = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
      if (history.length === 0) return;

      let html = `<html><head><title>Chat Export - ${CONFIG.botName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
          h1 { color: ${CONFIG.themeColor}; font-size: 20px; border-bottom: 2px solid ${CONFIG.themeColor}; padding-bottom: 10px; }
          .msg { margin: 10px 0; padding: 10px 14px; border-radius: 12px; max-width: 80%; }
          .user { background: ${CONFIG.themeColor}; color: white; margin-left: auto; text-align: right; }
          .bot { background: #f0f0f0; color: #333; }
          .time { font-size: 10px; opacity: 0.6; margin-top: 4px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style></head><body>
        <h1>Chat with ${CONFIG.botName}</h1>
        <p style="color:#888;font-size:13px;">Exported on ${new Date().toLocaleString()}</p>`;

      history.forEach(h => {
        const time = new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const cls = h.role === 'user' ? 'user' : 'bot';
        const label = h.role === 'user' ? 'You' : CONFIG.botName;
        html += `<div class="msg ${cls}"><strong>${label}</strong><br>${h.content}<div class="time">${time}</div></div>`;
      });

      html += `<div class="footer">Exported from ${CONFIG.companyName} AI Chatbot</div></body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ---- FEATURE: Satisfaction Rating -------------------------
  function setupRating() {
    document.querySelectorAll('#chatbot-rating .star').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        document.querySelectorAll('#chatbot-rating .star').forEach((s, i) => {
          s.classList.toggle('active', i < val);
        });
        playSound('click');
        ratingGiven = true;

        fetch(`${SERVER_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[RATING: ${val}/5 stars]`, sessionId: SESSION_ID })
        }).catch(() => {});

        setTimeout(() => {
          document.getElementById('chatbot-rating').style.display = 'none';
          addMessage(t('thankRate'), 'bot', { noAnimate: false });
        }, 800);
      });
    });
  }

  // ---- FEATURE: Multi-language Selector ---------------------
  function setupLanguage() {
    document.getElementById('chatbot-lang').addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('chatbot_lang', currentLang);
      document.getElementById('chatbot-input').placeholder = t('placeholder');
      document.getElementById('btn-voice').title = t('voice');
      document.getElementById('btn-upload').title = t('upload');
      document.getElementById('btn-export').title = t('export');
      document.querySelector('#chatbot-rating .rating-label').textContent = t('rate');
      document.getElementById('chatbot-search-input').placeholder = t('search');
      playSound('click');
    });
  }

  // ---- NEW FEATURE: Fullscreen Mode -------------------------
  function setupFullscreen() {
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      const win = document.getElementById('chatbot-window');
      isFullscreen = !isFullscreen;
      win.classList.toggle('fullscreen', isFullscreen);
      const btn = document.getElementById('btn-fullscreen');
      btn.innerHTML = isFullscreen ? '⊡' : '⛶';
      btn.title = isFullscreen ? 'Exit fullscreen' : t('fullscreen');
      // Reset drag position when toggling fullscreen
      if (isFullscreen) {
        win.style.left = ''; win.style.top = '';
        win.style.right = ''; win.style.bottom = '';
      } else {
        win.style.left = ''; win.style.top = '';
        win.style.right = '24px'; win.style.bottom = '100px';
      }
      playSound('click');
    });
  }

  // ---- NEW FEATURE: Chat Search -----------------------------
  function setupSearch() {
    const searchBtn = document.getElementById('btn-search');
    const searchBar = document.getElementById('chatbot-search-bar');
    const searchInput = document.getElementById('chatbot-search-input');
    const searchClose = document.getElementById('chatbot-search-close');
    const searchCount = document.getElementById('chatbot-search-count');

    searchBtn.addEventListener('click', () => {
      isSearchOpen = !isSearchOpen;
      searchBar.classList.toggle('open', isSearchOpen);
      if (isSearchOpen) {
        searchInput.focus();
      } else {
        clearSearchHighlights();
        searchInput.value = '';
        searchCount.textContent = '';
      }
      playSound('click');
    });

    searchClose.addEventListener('click', () => {
      isSearchOpen = false;
      searchBar.classList.remove('open');
      clearSearchHighlights();
      searchInput.value = '';
      searchCount.textContent = '';
    });

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      clearSearchHighlights();

      if (!query) { searchCount.textContent = ''; return; }

      const msgElements = document.querySelectorAll('#chatbot-messages .msg-text');
      let count = 0;
      let firstMatch = null;

      msgElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(query)) {
          count++;
          // Highlight matching text
          const original = el.innerHTML;
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          el.innerHTML = original.replace(regex, '<mark class="search-highlight">$1</mark>');
          if (!firstMatch) firstMatch = el;
        }
      });

      searchCount.textContent = count > 0 ? `${count} found` : t('noResults');
      if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function clearSearchHighlights() {
    document.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  }

  // ---- NEW FEATURE: Draggable Window ------------------------
  function setupDraggable() {
    const header = document.getElementById('chatbot-header');
    const win = document.getElementById('chatbot-window');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons
      if (e.target.closest('.header-btn') || e.target.closest('.header-actions')) return;
      if (isFullscreen) return;

      isDragging = true;
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      // Switch from right/bottom positioning to left/top
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Keep within viewport
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - win.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - win.offsetHeight));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // ---- NEW FEATURE: Keyboard Shortcuts ----------------------
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC to close chat
      if (e.key === 'Escape' && chatIsOpen) {
        closeChatWindow();
        e.preventDefault();
      }

      // Ctrl+F to open search (when chat is open)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && chatIsOpen) {
        e.preventDefault();
        const searchBar = document.getElementById('chatbot-search-bar');
        if (!isSearchOpen) {
          isSearchOpen = true;
          searchBar.classList.add('open');
          document.getElementById('chatbot-search-input').focus();
        } else {
          document.getElementById('chatbot-search-input').focus();
        }
      }

      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && chatIsOpen) {
        const input = document.getElementById('chatbot-input');
        if (document.activeElement === input || document.activeElement.closest('#chatbot-widget-container')) {
          e.preventDefault();
          sendMessage(input.value);
        }
      }
    });
  }

  function closeChatWindow() {
    chatIsOpen = false;
    const win = document.getElementById('chatbot-window');
    win.classList.remove('open');
    document.getElementById('chatbot-icon-chat').style.display = 'block';
    document.getElementById('chatbot-icon-close').style.display = 'none';
    document.querySelector('#chatbot-toggle .pulse-ring').style.display = 'block';

    // Reset fullscreen on close
    if (isFullscreen) {
      isFullscreen = false;
      win.classList.remove('fullscreen');
      win.style.left = ''; win.style.top = '';
      win.style.right = '24px'; win.style.bottom = '100px';
      document.getElementById('btn-fullscreen').innerHTML = '⛶';
    }
  }

  // ---- Email Capture & Intro ---------------------------------
  async function handleEmailSubmit() {
    const emailInput = document.getElementById('chatbot-email-input');
    const errorEl = document.getElementById('chatbot-email-error');
    const email = emailInput.value.trim();

    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errorEl.textContent = 'Please enter your email address';
      emailInput.classList.add('error');
      setTimeout(() => emailInput.classList.remove('error'), 500);
      return;
    }
    if (!emailRegex.test(email)) {
      errorEl.textContent = 'Please enter a valid email address';
      emailInput.classList.add('error');
      setTimeout(() => emailInput.classList.remove('error'), 500);
      return;
    }

    errorEl.textContent = '';
    userEmail = email;
    emailVerified = true;
    sessionStorage.setItem('chatbot_user_email', email);
    localStorage.removeItem('chatbot_user_email'); // Clean up legacy cached email

    // Generate a fresh session ID for this new chat session
    SESSION_ID = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatbot_session_id', SESSION_ID);

    // Clear messages UI for a fresh session
    const msgsContainer = document.getElementById('chatbot-messages');
    if (msgsContainer) msgsContainer.innerHTML = '';
    messageCount = 0;
    ratingGiven = false;

    // Register email on server
    try {
      await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionId: SESSION_ID })
      });
    } catch (e) { /* offline fallback */ }

    playSound('click');

    // Hide email screen, show intro
    document.getElementById('chatbot-email-screen').style.display = 'none';

    if (CONFIG.introMessage) {
      document.getElementById('intro-email-display').textContent = email;
      document.getElementById('chatbot-intro-screen').style.display = 'flex';
    } else {
      showChatInterface();
    }
  }

  function handleIntroContinue() {
    playSound('click');
    document.getElementById('chatbot-intro-screen').style.display = 'none';
    showChatInterface();
  }

  function showChatInterface() {
    document.getElementById('chatbot-messages').style.display = 'flex';
    document.getElementById('chatbot-suggestions').style.display = '';
    document.getElementById('chatbot-input-area').style.display = 'flex';
    document.getElementById('chatbot-shortcuts-hint').style.display = '';

    const toolbar = document.getElementById('chatbot-toolbar');
    if (toolbar) toolbar.style.display = 'flex';

    // Show the header action buttons
    const buttons = ['btn-handoff', 'btn-clear', 'btn-search', 'btn-fullscreen', 'btn-complaint', 'btn-darkmode', 'btn-export'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = 'flex';
    });

    // Load messages from local storage history if available and not already rendered
    const messagesContainer = document.getElementById('chatbot-messages');
    if (messagesContainer && messagesContainer.children.length === 0) {
      loadFromLocal();
    }

    // Show welcome message
    const history = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
    if (history.length === 0) {
      if (flowIsActive) {
        startFlow();
      } else {
        const greeting = getTimeGreeting();
        addMessage(`${greeting}! ${CONFIG.welcomeMessage}`, 'bot', {
          quickReplies: CONFIG.suggestedQuestions.length ? CONFIG.suggestedQuestions.slice(0, 3) : null
        });
      }
    }
    document.getElementById('chatbot-input').focus();
  }

  // ---- NEW FEATURE: Human Handoff Menu ----------------------
  function setupHandoff() {
    const btn = document.getElementById('btn-handoff');
    const menu = document.getElementById('chatbot-handoff-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      playSound('click');
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.classList.remove('open');
      }
    });

  }

  // ---- NEW FEATURE: Lead Capture Form Card ------------------
  function maybeShowLeadForm() {
    if (leadCaptured) return;
    const cfg = CONFIG.leadCapture;
    if (!cfg || !cfg.enabled) return;
    if (userInteractions < (cfg.triggerAfter || 3)) return;

    // Already a lead form visible?
    if (document.querySelector('.chatbot-lead-form')) return;

    const messages = document.getElementById('chatbot-messages');
    const form = document.createElement('div');
    form.className = 'chatbot-lead-form';
    const showName  = (cfg.fields || []).includes('name');
    const showPhone = (cfg.fields || []).includes('phone');

    form.innerHTML = `
      <h4>${cfg.title || 'Would you like us to contact you?'}</h4>
      <p>${cfg.subtitle || 'Share your details and we will reach out.'}</p>
      ${showName ? '<input type="text" id="lead-name" placeholder="Your name">' : ''}
      ${showPhone ? '<input type="tel" id="lead-phone" placeholder="Phone number">' : ''}
      <div class="lead-actions">
        <button class="lead-skip">Not now</button>
        <button class="lead-submit">Submit</button>
      </div>
    `;
    messages.appendChild(form);
    messages.scrollTop = messages.scrollHeight;

    form.querySelector('.lead-skip').addEventListener('click', () => {
      leadCaptured = true;
      localStorage.setItem('chatbot_lead_captured', 'true');
      form.remove();
    });

    form.querySelector('.lead-submit').addEventListener('click', async () => {
      const name  = document.getElementById('lead-name')?.value?.trim() || '';
      const phone = document.getElementById('lead-phone')?.value?.trim() || '';
      if (showPhone && !phone) { alert('Please enter your phone number'); return; }
      if (showName && !name)   { alert('Please enter your name'); return; }

      try {
        await fetch(`${SERVER_URL}/api/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_ID, name, phone, email: userEmail, pageUrl
          })
        });
        leadCaptured = true;
        localStorage.setItem('chatbot_lead_captured', 'true');
        form.remove();
        addMessage('Thanks! Our team will contact you soon. 🙌', 'bot', { noAnimate: false });
      } catch (e) {
        alert('Could not save — please try again.');
      }
    });
  }

  // ---- NEW FEATURE: Complaint Form --------------------------
  function showComplaintForm() {
    // Close handoff menu if open
    const hmenu = document.getElementById('chatbot-handoff-menu');
    if (hmenu) hmenu.classList.remove('open');

    // If a form is already showing in chat, just scroll to it
    const existing = document.querySelector('.chatbot-complaint-card');
    if (existing) {
      existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const messages = document.getElementById('chatbot-messages');
    if (!messages) return;

    const card = document.createElement('div');
    card.className = 'chatbot-complaint-card';
    card.innerHTML = `
      <div class="complaint-header">
        <h4>Customer Complaint Form</h4>
      </div>
      <div class="complaint-body">
        <div class="complaint-field">
          <label>Name:</label>
          <div class="complaint-input-wrap">
            <input type="text" data-cmp="name" maxlength="80">
          </div>
        </div>
        <div class="complaint-field">
          <label>Number:</label>
          <div class="complaint-input-wrap">
            <input type="tel" data-cmp="phone" maxlength="20" placeholder="+91 9876543210">
          </div>
        </div>
        <div class="complaint-field">
          <label>Issue:</label>
          <div class="complaint-input-wrap">
            <textarea data-cmp="message" maxlength="1000" placeholder="Describe your issue..."></textarea>
          </div>
        </div>
        <div class="complaint-actions">
          <button type="button" class="complaint-cancel" data-cmp-action="cancel">Cancel</button>
          <button type="button" class="complaint-submit" data-cmp-action="submit">Submit</button>
        </div>
      </div>
    `;

    messages.appendChild(card);
    // Scroll the chat to the very bottom so the whole form is in view
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
    setTimeout(() => {
      messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
      const nameEl = card.querySelector('[data-cmp="name"]');
      if (nameEl) nameEl.focus({ preventScroll: true });
    }, 350);

    // Clear invalid highlight on typing
    card.querySelectorAll('[data-cmp]').forEach(el => {
      el.addEventListener('input', () => { el.style.boxShadow = ''; });
    });

    // Cancel — slide out and remove the form from chat
    card.querySelector('[data-cmp-action="cancel"]').addEventListener('click', () => {
      card.style.animation = 'complaintSlide 0.2s ease reverse';
      setTimeout(() => card.remove(), 200);
      playSound('click');
    });

    // Submit
    card.querySelector('[data-cmp-action="submit"]').addEventListener('click', async () => {
      const nameEl    = card.querySelector('[data-cmp="name"]');
      const phoneEl   = card.querySelector('[data-cmp="phone"]');
      const messageEl = card.querySelector('[data-cmp="message"]');
      const name    = nameEl.value.trim();
      const phone   = phoneEl.value.trim();
      const message = messageEl.value.trim();

      const invalidRing = '0 0 0 2px #EF4444';
      const phoneValid = phone.replace(/\D/g, '').length >= 7;
      if (!name)       { nameEl.style.boxShadow    = invalidRing; nameEl.focus();    return; }
      if (!phoneValid) { phoneEl.style.boxShadow   = invalidRing; phoneEl.focus();   return; }
      if (!message)    { messageEl.style.boxShadow = invalidRing; messageEl.focus(); return; }

      const submitBtn = card.querySelector('[data-cmp-action="submit"]');
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${SERVER_URL}/api/complaint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_ID,
            email: userEmail,
            name,
            phone,
            category: 'general',
            subject: '',
            message,
            pageUrl
          })
        });
        const data = await res.json();

        if (res.ok) {
          // KEEP the form visible. Disable inputs, lock button, append confirmation row.
          card.querySelectorAll('[data-cmp]').forEach(el => { el.disabled = true; });
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitted ✓';

          if (!card.querySelector('.complaint-confirm')) {
            const confirm = document.createElement('div');
            confirm.className = 'complaint-confirm';
            confirm.innerHTML = `<span class="dot"></span> Your complaint has been submitted successfully (Ticket <b>#${data.ticketId}</b>)`;
            card.querySelector('.complaint-body').appendChild(confirm);
          }
          card.scrollIntoView({ behavior: 'smooth', block: 'end' });
          playSound('receive');
        } else {
          submitBtn.textContent = 'Try Again';
          submitBtn.disabled = false;
          alert(data.error || 'Failed to submit');
        }
      } catch (err) {
        submitBtn.textContent = 'Try Again';
        submitBtn.disabled = false;
        alert('Could not submit: ' + err.message);
      }
    });

    playSound('click');
  }

  // Direct complaint request — open form immediately, skip bot reply
  function isDirectComplaintRequest(text) {
    const direct = /\b(raise|file|submit|make|register|lodge)\s+(a\s+)?complain(t)?\b|^complaint$|\bi\s+(want|would like|need)\s+to\s+(raise|file|submit|make|register|lodge)\s+(a\s+)?complain(t)?\b|\btalk\s+to\s+(agent|human|support)\b/i;
    return direct.test(text);
  }

  // Indirect complaint — after bot replies, suggest form
  function detectComplaintIntent(text) {
    if (isDirectComplaintRequest(text)) return false; // handled separately
    const keywords = /\b(issue|problem|refund|not working|broken|bad service|terrible|worst|frustrat|disappointed|fraud|cheat)\b/i;
    return keywords.test(text);
  }

  // ---- NEW FEATURE: Offline Mode Detection ------------------
  function setupOffline() {
    const banner = document.getElementById('chatbot-offline-banner');
    function updateStatus() {
      isOffline = !navigator.onLine;
      if (banner) banner.classList.toggle('show', isOffline);
    }
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  // ---- Event Handlers ---------------------------------------
  function attachEvents() {
    const toggle  = document.getElementById('chatbot-toggle');
    const window_ = document.getElementById('chatbot-window');
    const close   = document.getElementById('chatbot-close');
    const input   = document.getElementById('chatbot-input');
    const send    = document.getElementById('chatbot-send');
    const iconChat  = document.getElementById('chatbot-icon-chat');
    const iconClose = document.getElementById('chatbot-icon-close');

    toggle.addEventListener('click', () => {
      chatIsOpen = !chatIsOpen;
      window_.classList.toggle('open', chatIsOpen);
      iconChat.style.display  = chatIsOpen ? 'none' : 'block';
      iconClose.style.display = chatIsOpen ? 'block' : 'none';
      toggle.querySelector('.pulse-ring').style.display = chatIsOpen ? 'none' : 'block';
      if (chatIsOpen) { playSound('click'); input.focus(); }
    });

    close.addEventListener('click', closeChatWindow);

    send.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });

    // Email capture form
    const emailSubmitBtn = document.getElementById('chatbot-email-submit');
    const emailInput = document.getElementById('chatbot-email-input');
    if (emailSubmitBtn) {
      emailSubmitBtn.addEventListener('click', handleEmailSubmit);
      emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleEmailSubmit(); }
      });
    }

    // Intro continue button
    const introContinue = document.getElementById('chatbot-intro-continue');
    if (introContinue) {
      introContinue.addEventListener('click', handleIntroContinue);
    }

    // Raise-complaint header button
    document.getElementById('btn-complaint').addEventListener('click', showComplaintForm);

    // Clear chat button
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm('Clear all chat history?')) {
        localStorage.removeItem('chatbot_history');
        localStorage.removeItem('chatbot_session_id');
        localStorage.removeItem('chatbot_user_email');
        sessionStorage.removeItem('chatbot_user_email');
        localStorage.removeItem('chatbot_interactions');
        localStorage.removeItem('chatbot_lead_captured');
        document.getElementById('chatbot-messages').innerHTML = '';
        messageCount = 0;
        ratingGiven = false;
        userEmail = '';
        emailVerified = false;
        SESSION_ID = '';
        userInteractions = 0;
        leadCaptured = false;
        playSound('click');

        // If email capture enabled, show email screen again
        if (CONFIG.emailCapture) {
          document.getElementById('chatbot-email-screen').style.display = 'flex';
          document.getElementById('chatbot-messages').style.display = 'none';
          document.getElementById('chatbot-suggestions').style.display = 'none';
          document.getElementById('chatbot-input-area').style.display = 'none';
          document.getElementById('chatbot-shortcuts-hint').style.display = 'none';

          const toolbar = document.getElementById('chatbot-toolbar');
          if (toolbar) toolbar.style.display = 'none';

          // Hide header action buttons
          const buttons = ['btn-handoff', 'btn-clear', 'btn-search', 'btn-fullscreen', 'btn-complaint', 'btn-darkmode', 'btn-export'];
          buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
          });
        } else {
          if (flowIsActive) {
            startFlow();
          } else {
            const greeting = getTimeGreeting();
            addMessage(`${greeting}! ${CONFIG.welcomeMessage}`, 'bot', {
              quickReplies: CONFIG.suggestedQuestions.length ? CONFIG.suggestedQuestions.slice(0, 3) : null
            });
          }
        }
      }
    });

    // Setup all features
    setupVoice();
    setupDarkMode();
    setupFileUpload();
    setupExport();
    setupRating();
    setupLanguage();
    setupFullscreen();
    setupSearch();
    setupDraggable();
    setupKeyboardShortcuts();
    setupHandoff();
    setupOffline();
  }

  // ---- Flow Builder Runtime Engine --------------------------
  function startFlow() {
    flowCurrentStepIndex = 0;
    flowAnswers = {};
    showNextFlowStep();
  }

  function showNextFlowStep() {
    if (!flowIsActive) return;
    if (flowCurrentStepIndex >= flowComponents.length) {
      addMessage("🎉 Flow completed!", 'bot', {});
      return;
    }
    
    const comp = flowComponents[flowCurrentStepIndex];
    
    if (comp.type === 'statement') {
      addMessage(comp.statement || 'Statement Message', 'bot', {});
      
      if (comp.nextStepId) {
        if (comp.nextStepId === 'end') {
          flowCurrentStepIndex = flowComponents.length;
        } else {
          const targetStep = flowComponents.find(c => String(c.id) === String(comp.nextStepId));
          if (targetStep) {
            flowCurrentStepIndex = flowComponents.indexOf(targetStep);
          } else {
            flowCurrentStepIndex++;
          }
        }
      } else {
        flowCurrentStepIndex++;
      }
      setTimeout(showNextFlowStep, 1000);
    } 
    else if (comp.type === 'conditional') {
      let conditionMet = false;
      const refField = (comp.condition || '').trim().toLowerCase();
      const refVal = (comp.conditionValue || '').trim().toLowerCase();
      
      let answer = undefined;
      for (const [key, val] of Object.entries(flowAnswers)) {
        if (key.toLowerCase() === refField) {
          answer = val;
          break;
        }
      }
      
      if (answer !== undefined) {
        const ansStr = String(answer).trim().toLowerCase();
        
        if (refVal.startsWith('>') || refVal.startsWith('<') || refVal.startsWith('=') || refVal.startsWith('!')) {
          try {
            const match = refVal.match(/^([><=!]+)\s*(.*)$/);
            if (match) {
              const op = match[1];
              const val = parseFloat(match[2]);
              const ansNum = parseFloat(ansStr);
              
              if (!isNaN(ansNum) && !isNaN(val)) {
                if (op === '>') conditionMet = ansNum > val;
                else if (op === '<') conditionMet = ansNum < val;
                else if (op === '>=') conditionMet = ansNum >= val;
                else if (op === '<=') conditionMet = ansNum <= val;
                else if (op === '==' || op === '=') conditionMet = ansNum === val;
                else if (op === '!=') conditionMet = ansNum !== val;
              }
            }
          } catch (e) {
            console.error('Error parsing operator condition:', e);
          }
        } else {
          conditionMet = ansStr === refVal || ansStr.includes(refVal);
        }
      }
      
      const nextAction = conditionMet ? (comp.thenAction || '').trim() : (comp.elseAction || '').trim();
      const targetStep = flowComponents.find(c => c.label.trim().toLowerCase() === nextAction.toLowerCase());
      if (targetStep) {
        flowCurrentStepIndex = flowComponents.indexOf(targetStep);
        setTimeout(showNextFlowStep, 500);
      } else {
        if (nextAction) {
          addMessage(nextAction, 'bot', {});
        }
        flowCurrentStepIndex++;
        setTimeout(showNextFlowStep, 1000);
      }
    }
    else {
      // Input/Question step
      const questionText = comp.question || `Please provide your ${comp.label}?`;
      
      if (comp.type === 'single') {
        const options = Array.isArray(comp.options) ? comp.options : (comp.options ? comp.options.split(',').map(o => o.trim()) : ['Option 1', 'Option 2', 'Option 3']);
        addMessage(questionText, 'bot', { quickReplies: options, flowCompId: comp.id });
      } 
      else if (comp.type === 'multiple') {
        const options = Array.isArray(comp.options) ? comp.options : (comp.options ? comp.options.split(',').map(o => o.trim()) : ['Option 1', 'Option 2', 'Option 3']);
        
        let optionsHtml = `<div class="flow-multiple-choice-container" id="flow-mc-${comp.id}" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px; width: 100%;">`;
        options.forEach((opt, idx) => {
          optionsHtml += `
            <div class="flow-multichoice-row" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="flow-chk-${comp.id}-${idx}" value="${escapeHtml(opt)}" style="cursor: pointer; width: 16px; height: 16px;">
              <label for="flow-chk-${comp.id}-${idx}" style="font-size: 13px; font-weight: 500; cursor: pointer; color: inherit; margin: 0; text-transform: none;">${escapeHtml(opt)}</label>
            </div>`;
        });
        optionsHtml += `
          <button class="flow-submit-btn" style="margin-top: 8px; width: 100%; border-radius: 8px; background: ${CONFIG.themeColor}; color: white; font-weight: 600; padding: 8px; border: none; cursor: pointer;">Submit Choices</button>
        </div>`;
        
        addMessage(questionText, 'bot', { extraHtml: optionsHtml, flowCompId: comp.id, isMultipleChoice: true });
      }
      else if (comp.type === 'website') {
        const btnLabel = comp.buttonLabel || 'Visit Page';
        const websiteHtml = `
          <div style="margin-top: 8px; width: 100%;">
            <a href="${comp.redirectUrl || '#'}" target="_blank" class="flow-website-btn" style="display: block; text-align: center; text-decoration: none; background: ${CONFIG.themeColor}; color: white; border: none; cursor: pointer; font-weight: 600; padding: 10px; border-radius: 8px; transition: all 0.2s;">🔗 ${btnLabel}</a>
          </div>`;
        addMessage(questionText, 'bot', { extraHtml: websiteHtml, flowCompId: comp.id, isWebsiteLink: true });
      }
      else if (comp.type === 'rating') {
        let starsHtml = `<div class="flow-rating-container" id="flow-rating-${comp.id}" style="display: flex; gap: 8px; justify-content: center; margin-top: 8px; font-size: 24px; cursor: pointer;">`;
        for (let i = 1; i <= 5; i++) {
          starsHtml += `<span class="flow-star" data-val="${i}" style="color: #cbd5e1; transition: color 0.2s;">★</span>`;
        }
        starsHtml += `</div>`;
        addMessage(questionText, 'bot', { extraHtml: starsHtml, flowCompId: comp.id, isRating: true });
      }
      else if (comp.type === 'date') {
        const dateHtml = `
          <div class="flow-date-container" style="margin-top: 8px; display: flex; gap: 8px; width: 100%;">
            <input type="date" id="flow-date-input-${comp.id}" style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: inherit; background: transparent;">
            <button class="flow-date-submit" style="padding: 8px 16px; border-radius: 8px; background: ${CONFIG.themeColor}; color: white; border: none; cursor: pointer; font-weight: 600;">OK</button>
          </div>`;
        addMessage(questionText, 'bot', { extraHtml: dateHtml, flowCompId: comp.id, isDatePicker: true });
      }
      else {
        addMessage(questionText, 'bot', {});
      }
    }
  }

  function handleFlowAnswer(compId, answerText, rawSelectedArray = null, alreadyRendered = false) {
    const comp = flowComponents.find(c => c.id === compId);
    if (!comp) return;
    
    flowAnswers[comp.label] = answerText;
    
    if (!alreadyRendered) {
      addMessage(answerText, 'user');
    }
    
    if (comp.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answerText.trim())) {
        addMessage("⚠️ Invalid email format. Please try again.", 'bot', {});
        return;
      }
    }
    else if (comp.type === 'mobile') {
      // Allow 'skip' to bypass optional phone steps
      if (answerText.trim().toLowerCase() === 'skip') {
        // fall through to proceed to next step
      } else {
        // Accept: 10-digit Indian, international with +, spaces, dashes
        const mobileRegex = /^\+?[0-9][0-9\s\-]{6,17}$/;
        if (!mobileRegex.test(answerText.trim())) {
          addMessage("⚠️ Please enter a valid phone number (e.g. 9876543210 or +91-98765-43210). Type 'skip' to skip.", 'bot', {});
          return;
        }
      }
    }
    else if (comp.type === 'number') {
      if (isNaN(Number(answerText.trim()))) {
        addMessage("⚠️ Please enter a valid number.", 'bot', {});
        return;
      }
    }
    else if (comp.type === 'age') {
      const ageNum = Number(answerText.trim());
      if (isNaN(ageNum)) {
        addMessage("⚠️ Please enter a valid age.", 'bot', {});
        return;
      }
      const minVal = comp.minValue !== undefined ? Number(comp.minValue) : 0;
      const maxVal = comp.maxValue !== undefined ? Number(comp.maxValue) : 100;
      if (ageNum < minVal || ageNum > maxVal) {
        addMessage(`⚠️ Age must be between ${minVal} and ${maxVal}.`, 'bot', {});
        return;
      }
    }
    
    disableLastFlowButtons();
    
    let branched = false;
    
    if (comp.options && comp.destinations) {
      const optionsArr = Array.isArray(comp.options) ? comp.options : comp.options.split(',').map(o => o.trim());
      const destsArr = Array.isArray(comp.destinations) ? comp.destinations : comp.destinations.split(',');
      
      if (comp.type === 'single') {
        const optIndex = optionsArr.indexOf(answerText.trim());
        if (optIndex !== -1 && destsArr[optIndex]) {
          const targetId = String(destsArr[optIndex]).trim();
          if (targetId === 'end') {
            flowCurrentStepIndex = flowComponents.length;
            branched = true;
          } else {
            const targetStep = flowComponents.find(c => String(c.id) === targetId || c.label.trim().toLowerCase() === targetId.toLowerCase());
            if (targetStep) {
              flowCurrentStepIndex = flowComponents.indexOf(targetStep);
              branched = true;
            }
          }
        }
      }
      else if (comp.type === 'multiple') {
        const choices = rawSelectedArray || answerText.split(',').map(s => s.trim());
        for (const choice of choices) {
          const optIndex = optionsArr.indexOf(choice);
          if (optIndex !== -1 && destsArr[optIndex]) {
            const targetId = String(destsArr[optIndex]).trim();
            if (targetId === 'end') {
              flowCurrentStepIndex = flowComponents.length;
              branched = true;
              break;
            } else {
              const targetStep = flowComponents.find(c => String(c.id) === targetId || c.label.trim().toLowerCase() === targetId.toLowerCase());
              if (targetStep) {
                flowCurrentStepIndex = flowComponents.indexOf(targetStep);
                branched = true;
                break;
              }
            }
          }
        }
      }
    }
    
    if (!branched) {
      if (comp.nextStepId) {
        if (comp.nextStepId === 'end') {
          flowCurrentStepIndex = flowComponents.length;
        } else {
          const targetStep = flowComponents.find(c => String(c.id) === String(comp.nextStepId));
          if (targetStep) {
            flowCurrentStepIndex = flowComponents.indexOf(targetStep);
          } else {
            flowCurrentStepIndex++;
          }
        }
      } else {
        flowCurrentStepIndex++;
      }
    }
    
    setTimeout(showNextFlowStep, 800);
  }
  
  function disableLastFlowButtons() {
    const quickReplies = document.querySelectorAll('#chatbot-messages .quick-replies');
    quickReplies.forEach(qr => qr.remove());
    
    const activeContainers = document.querySelectorAll('#chatbot-messages .flow-multiple-choice-container, #chatbot-messages .flow-rating-container, #chatbot-messages .flow-date-container');
    activeContainers.forEach(container => {
      const inputs = container.querySelectorAll('input, button');
      inputs.forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
      });
      container.style.pointerEvents = 'none';
    });
  }

  function showUnauthorizedWarning(msg) {
    const div = document.createElement('div');
    div.id = 'chatbot-unauthorized-warning';
    div.style.position = 'fixed';
    div.style.bottom = '24px';
    div.style.right = '24px';
    div.style.backgroundColor = '#fef2f2';
    div.style.color = '#991b1b';
    div.style.border = '1px solid #f87171';
    div.style.borderRadius = '8px';
    div.style.padding = '12px 16px';
    div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    div.style.zIndex = '999999';
    div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    div.style.fontSize = '13px';
    div.style.fontWeight = '500';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '8px';
    div.innerHTML = `
      <svg style="width: 18px; height: 18px; fill: currentColor; flex-shrink: 0;" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      <span>${escapeHtml(msg)}</span>
    `;
    document.body.appendChild(div);
  }

  // ---- Initialize -------------------------------------------
  async function init() {
    const configResult = await loadConfig();
    if (configResult && configResult.success === false) {
      showUnauthorizedWarning(configResult.message || 'Unauthorized Domain. This bot is not configured for this website.');
      return;
    }
    injectStyles();
    buildWidget();

    if (CONFIG.emailCapture) {
      // Force clean slate for onboarding flow
      localStorage.removeItem('chatbot_history');
      localStorage.removeItem('chatbot_session_id');
      localStorage.removeItem('chatbot_user_email');
      sessionStorage.removeItem('chatbot_user_email');
      userEmail = '';
      emailVerified = false;
      SESSION_ID = '';
    } else {
      SESSION_ID = getSessionId();
    }

    if (CONFIG.primaryMode === 'flow_builder') {
      try {
        const flowRes = await fetch(`${SERVER_URL}/api/flow?botId=${BOT_ID}`);
        if (flowRes.ok) {
          flowComponents = await flowRes.json();
          if (flowComponents && flowComponents.length > 0) {
            flowIsActive = true;
          }
        }
      } catch (err) {
        console.warn('Chatbot: Failed to load flow components:', err);
      }
    }

    renderSuggestions();
    attachEvents();

    // If email already verified or email capture disabled, show chat directly
    if (emailVerified || !CONFIG.emailCapture) {
      loadFromLocal();
      const history = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
      if (history.length === 0) {
        if (flowIsActive) {
          startFlow();
        } else {
          const greeting = getTimeGreeting();
          addMessage(`${greeting}! ${CONFIG.welcomeMessage}`, 'bot', {
            quickReplies: CONFIG.suggestedQuestions.length ? CONFIG.suggestedQuestions.slice(0, 3) : null
          });
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
