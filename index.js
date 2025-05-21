const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('baileys');
const Pino = require('pino');
const fs = require('fs');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const sock = makeWASocket({
  auth: state,
  logger: Pino({ level: 'silent' }),
  printQRInTerminal: true,
});

sock.ev.on('creds.update', saveState);

// Load auto replies from file
const autoReplies = JSON.parse(fs.readFileSync('./autoReplies.json', 'utf8'));

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return;
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  const reply = autoReplies[text.toLowerCase()];

  if (reply) {
    await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
    console.log(`Auto-replied: "${text}" => "${reply}"`);
  }
});
