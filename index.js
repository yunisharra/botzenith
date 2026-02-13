const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8570438890:AAHlPfrwK8JH2YS1sa075C8JEwZEdrI7psg';
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(token, { polling: { interval: 300, autoStart: true, params: { timeout: 10 } } });
const app = express();

let DB = { employees: [], configs: [], aliases: [] };

app.use(cors());
app.use(express.json());

// Logika Respon Pesan
bot.on('message', async (msg) => {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const username = "@" + (msg.from.username || "");
  const text = msg.text.toLowerCase();

  const emp = DB.employees.find(e => e.username.toLowerCase() === username.toLowerCase());
  if (!emp) return;

  let categoryType = null;
  for (const alias of DB.aliases) {
    if (alias.keywords.some(k => text.includes(k.toLowerCase()))) {
      categoryType = alias.category;
      break;
    }
  }

  if (categoryType) {
    const config = DB.configs.find(c => c.type === categoryType);
    const template = config?.responseTemplate || "Izin {kategori} diterima.";
    const reply = template.replace('{durasi}', config?.maxMinutes || "15").replace('{kategori}', categoryType);
    bot.sendMessage(chatId, reply, { reply_to_message_id: msg.message_id }).catch(e => console.error("Error Send:", e.message));
  }
});

// Error Handling Polling
bot.on('polling_error', (error) => console.log("⚠️ Polling:", error.code));

// Endpoint Monitoring & Sync
app.get('/health', (req, res) => res.json({ status: 'online', version: '3.6' }));
app.get('/', (req, res) => res.send("Zenith Engine Online (V3.6)"));

app.post('/sync-config', (req, res) => {
  const { configs, employees, aliases } = req.body;
  DB.configs = configs || [];
  DB.employees = employees || [];
  DB.aliases = aliases || [];
  console.log("♻️ Data Synced: " + DB.employees.length + " Employees");
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server jalan di port " + PORT));
