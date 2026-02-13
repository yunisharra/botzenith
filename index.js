
/**
 * ZENITH CLOUD ENGINE - V4.1 (STABLE)
 * Fitur: Polling Error Recovery & Version Checker
 */
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8527396689:AAF0ocFCnnusyC3XiWAandHaM6Y2Hul3aGM';
const PORT = process.env.PORT || 3000;

// Inisialisasi Bot dengan penanganan error polling
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
    console.log("⚠️ KONFLIK: Bot sedang jalan di tempat lain. Matikan bot lain atau restart Render.");
  } else {
    console.log("❌ Polling Error:", error.code);
  }
});

const app = express();
let DB = { employees: [], configs: [], aliases: [] };

app.use(cors());
app.use(express.json());

// TAMPILAN DASHBOARD WEB (CEK VERSI DISINI)
app.get('/', (req, res) => {
  res.send(`
    <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#f8f9fd;">
      <h1 style="color:#6366f1;">🚀 Zenith Engine V4.1 Online</h1>
      <p style="color:#64748b;">Status: ${DB.employees.length > 0 ? '✅ Database Ready' : '⚠️ Menunggu Sync Data'}</p>
      <div style="font-size:12px; color:#94a3b8;">Running on Render Cloud</div>
    </body>
  `);
});

bot.on('message', async (msg) => {
  console.log("📩 Pesan Masuk:", msg.text, "dari", msg.from.username);
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

app.get('/health', (req, res) => res.json({ status: 'online', version: '4.1' }));
app.post('/sync-config', (req, res) => {
  const { configs, employees, aliases } = req.body;
  DB.configs = configs; DB.employees = employees; DB.aliases = aliases;
  console.log("♻️ Sync Selesai! Data Karyawan diperbarui.");
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log("🚀 Zenith V4.1 listening on port", PORT));
