import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;
const dataPath = './data.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/schedule', (req, res) => {
  const { number, message, delay } = req.body;
  const newEntry = {
    number,
    message,
    delay,
    scheduledAt: new Date().toISOString(),
  };

  let data = [];
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }

  data.push(newEntry);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  setTimeout(() => {
    console.log(`Message to ${number}: "${message}" sent after ${delay} seconds.`);
  }, delay * 1000);

  res.json({ message: `Message scheduled in ${delay} seconds!` });
});

app.get('/scheduled', (req, res) => {
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : [];
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});