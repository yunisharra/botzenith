
/**
 * ZENITH CLOUD ENGINE - V3.9 (STABLE)
 * Last Update: 2/14/2026
 */
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8570438890:AAHlPfrwK8JH2YS1sa075C8JEwZEdrI7psg';
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(token, { polling: true });
const app = express();

let DB = { employees: [], configs: [], aliases: [] };

app.use(cors());
app.use(express.json());

bot.on('message', async (msg) => {
  if (!msg.text) return;
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
    const reply = (config?.responseTemplate || "Izin {kategori} diterima.")
      .replace('{durasi}', config?.maxMinutes || "15")
      .replace('{kategori}', categoryType);
    bot.sendMessage(msg.chat.id, reply, { reply_to_message_id: msg.message_id });
  }
});

app.get('/health', (req, res) => res.json({ status: 'online' }));
app.post('/sync-config', (req, res) => {
  const { configs, employees, aliases } = req.body;
  DB.configs = configs; DB.employees = employees; DB.aliases = aliases;
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log("🚀 Zenith Engine V3.9 Online!"));
