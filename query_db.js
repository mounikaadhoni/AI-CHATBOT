const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'server', 'chatbot.db'));
const bots = db.prepare('SELECT * FROM bots').all();
console.log("Bots in DB:");
bots.forEach(bot => {
  console.log(`Bot ID: ${bot.bot_id}, Name: ${bot.name}`);
  console.log("Config:", JSON.parse(bot.config || '{}'));
  console.log("-----------------------------------------");
});
