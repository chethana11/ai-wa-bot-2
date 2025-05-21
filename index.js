const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('baileys');
const Pino = require('pino');
const fs = require('fs');

// Load replies from a JSON file
const autoReplies = JSON.parse(fs.readFileSync('./autoReplies.json', 'utf8'));

// Load or create auth session
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Create WhatsApp connection
const sock = makeWASocket({
  auth: state,
  logger: Pino({ level: 'silent' }),
  printQRInTerminal: true,
});

// Save session on changes
sock.ev.on('creds.update', saveState);

// Auto-reply logic
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return;

  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  const reply = autoReplies[text.toLowerCase()];

  if (reply) {
    await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
    console.log(`Auto-replied to: ${text}`);
  }
});
