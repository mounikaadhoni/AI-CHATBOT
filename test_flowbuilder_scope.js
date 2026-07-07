const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('admin/flowbuilder.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.log("No script tag found!");
  process.exit(1);
}

const scriptCode = scriptMatch[1];

// Mock basic DOM globals
const mockWindow = { addEventListener: () => {} };
const mockDocument = {
  getElementById: () => ({ addEventListener: () => {} }),
  querySelector: () => ({ style: {} }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ style: {} }),
  body: { classList: { add: () => {}, toggle: () => {} } }
};
const mockSessionStorage = {
  getItem: (key) => {
    if (key === 'isLoggedIn') return 'true';
    if (key === 'userRole') return 'admin';
    return null;
  },
  clear: () => {}
};
const mockLocalStorage = {
  getItem: () => null,
  setItem: () => {}
};
const mockFetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  sessionStorage: mockSessionStorage,
  localStorage: mockLocalStorage,
  fetch: mockFetch,
  console: console,
  setTimeout: setTimeout,
  setInterval: setInterval,
  Math: Math,
  Date: Date,
  RegExp: RegExp
};

// Bind functions to sandbox global
vm.createContext(sandbox);

try {
  vm.runInContext(scriptCode, sandbox);
  console.log("Execution successful!");
  
  // Check if functions are defined in the sandbox context
  const expectedFunctions = [
    'moveUp', 'moveDown', 'duplicateCard', 'deleteCard', 'addComponent',
    'clearPreviewChat', 'togglePreviewSearch', 'handlePreviewSearch',
    'togglePreviewDarkMode', 'exportPreviewChat'
  ];
  
  expectedFunctions.forEach(fn => {
    if (typeof sandbox[fn] === 'function') {
      console.log(`✅ Function ${fn} is defined and accessible globally.`);
    } else {
      console.log(`❌ Function ${fn} is NOT defined or NOT a function! type: ${typeof sandbox[fn]}`);
    }
  });
} catch (err) {
  console.error("Execution error:", err);
}
