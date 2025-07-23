const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Cold Call AI is live!');
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});

// WebSocket example (extend as needed)
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  ws.send('📞 WebSocket connected');
});