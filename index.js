
/**
 * ZENITH CLOUD ENGINE - V4.0 (STABLE)
 * Fitur: Group Reading & Debug Logging
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

// LOGGING UNTUK CEK APAKAH PESAN MASUK
bot.on('message', async (msg) => {
  console.log("📩 Pesan Masuk dari:", msg.from.username, "| Isi:", msg.text);
  
  if (!msg.text) return;
  const username = "@" + (msg.from.username || "");
  const text = msg.text.toLowerCase();
  
  // Cari karyawan
  const emp = DB.employees.find(e => e.username.toLowerCase() === username.toLowerCase());
  if (!emp) {
    console.log("❌ User", username, "tidak terdaftar di database Admin Panel.");
    return;
  }

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
    console.log("✅ Respon terkirim untuk", categoryType);
  }
});

app.get('/health', (req, res) => res.json({ status: 'online', db_ready: DB.employees.length > 0 }));
app.post('/sync-config', (req, res) => {
  const { configs, employees, aliases } = req.body;
  DB.configs = configs; DB.employees = employees; DB.aliases = aliases;
  console.log("♻️ Database Sinkron! Total Karyawan:", employees.length);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log("🚀 Zenith V4.0 Online & Listening..."));
