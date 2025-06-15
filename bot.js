import fs from 'fs';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const client = new Client({
  authStrategy: new LocalAuth()
});

const dataPath = './data.json';

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready.');

  setInterval(() => {
    if (!fs.existsSync(dataPath)) return;

    const data = JSON.parse(fs.readFileSync(dataPath));
    const now = Date.now();
    let dataModified = false;

    data.forEach((entry, index) => {
      // ✅ Skip if already sent or failed
      if (entry.status && entry.status !== 'pending') {
        return;
      }

      const scheduledTime = new Date(entry.scheduledAt).getTime() + parseInt(entry.delay) * 1000;

      if (now >= scheduledTime) {
        const cleanNumber = entry.number.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
          console.error(`❌ Invalid number format: ${entry.number}`);
          entry.status = 'failed';
          dataModified = true;
          return;
        }

        const chatId = `${cleanNumber}@c.us`;
        console.log(`⏰ Attempting to send to: ${chatId}`);

        client.isRegisteredUser(chatId).then(valid => {
          if (!valid) {
            console.log(`❌ Number is not registered on WhatsApp: ${entry.number}`);
            entry.status = 'failed';
            dataModified = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            return;
          }

          client.sendMessage(chatId, entry.message).then(msg => {
            console.log(`✅ Message sent to ${entry.number} (ID: ${msg.id.id})`);
            entry.status = 'sent';
            dataModified = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
          }).catch(err => {
            console.error(`❌ Failed to send to ${entry.number}:`, err);
            entry.status = 'failed';
            dataModified = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
          });

        }).catch(err => {
          console.error(`❌ Error checking user ${entry.number}:`, err);
          entry.status = 'failed';
          dataModified = true;
          fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        });
      }
    });

    // Fallback: write any general modifications
    if (dataModified) {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    }

  }, 3000); // check every 3 seconds
});

client.initialize();
