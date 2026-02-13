
/**
 * ZENITH CLOUD ENGINE - V4.2 (DEBUG MODE)
 * Gunakan ini untuk melacak kenapa bot tidak balas di grup.
 */
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8527396689:AAF0ocFCnnusyC3XiWAandHaM6Y2Hul3aGM';
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(token, { polling: true });
const app = express();
let DB = { employees: [], configs: [], aliases: [] };

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#f0f2f5;">
      <h1 style="color:#4f46e5;">🤖 Zenith Engine V4.2 Active</h1>
      <div style="background:white; display:inline-block; padding:20px; border-radius:15px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <p>Database Karyawan: <b>${DB.employees.length}</b></p>
        <p>Database Kata Kunci: <b>${DB.aliases.length}</b></p>
        <p style="color:#10b981; font-weight:bold;">SISTEM SIAP MENERIMA PESAN</p>
      </div>
    </body>
  `);
});

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const rawUsername = msg.from.username || "";
  const usernameWithAt = "@" + rawUsername;
  const text = msg.text.toLowerCase();
  
  console.log("-----------------------------------------");
  console.log("📩 PESAN BARU: [" + text + "]");
  console.log("👤 PENGIRIM: " + usernameWithAt + " (ID: " + msg.from.id + ")");

  // 1. Cek Karyawan
  const emp = DB.employees.find(e => 
    e.username.toLowerCase() === usernameWithAt.toLowerCase() || 
    e.username.toLowerCase() === rawUsername.toLowerCase()
  );

  if (!emp) {
    console.log("❌ GAGAL: User " + usernameWithAt + " TIDAK ADA di Data Karyawan Admin Panel.");
    console.log("💡 SOLUSI: Pastikan di menu 'Data Karyawan', username diisi: " + usernameWithAt);
    return;
  }
  console.log("✅ USER DITEMUKAN: " + emp.name);

  // 2. Cek Kata Kunci
  let categoryType = null;
  console.log("🔍 Mencari kata kunci dalam teks...");
  
  for (const alias of DB.aliases) {
    const match = alias.keywords.find(k => text.includes(k.toLowerCase()));
    if (match) {
      console.log("🎯 MATCH KATA KUNCI: [" + match + "] -> Kategori: " + alias.category);
      categoryType = alias.category;
      break;
    }
  }

  if (!categoryType) {
    console.log("❌ GAGAL: Tidak ada kata kunci yang cocok dalam pesan.");
    console.log("💡 SOLUSI: Tambahkan kata kunci di menu 'Kamus Bahasa Bot'.");
    return;
  }

  // 3. Kirim Respon
  const config = DB.configs.find(c => c.type === categoryType);
  const reply = (config?.responseTemplate || "Izin {kategori} diterima.")
    .replace('{durasi}', config?.maxMinutes || "15")
    .replace('{kategori}', categoryType);
  
  bot.sendMessage(msg.chat.id, reply, { reply_to_message_id: msg.message_id })
    .then(() => console.log("🚀 BERHASIL: Balasan terkirim ke grup!"))
    .catch(err => console.log("❌ ERROR KIRIM: " + err.message));
});

app.post('/sync-config', (req, res) => {
  const { configs, employees, aliases } = req.body;
  DB.configs = configs; DB.employees = employees; DB.aliases = aliases;
  console.log("♻️ DATABASE DISINKRONKAN!");
  console.log("- Total Karyawan: " + employees.length);
  console.log("- Total Alias: " + aliases.length);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server V4.2 Online di Port", PORT));
