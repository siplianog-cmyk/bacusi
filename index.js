const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
// Esta linha já aponta para a pasta 'public', o que está correto.
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Map(); // ws -> id
let players = {}; // id -> player state

function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const c of wss.clients) if (c.readyState === WebSocket.OPEN) c.send(s);
}

wss.on('connection', ws => {
  const id = (Math.random() * 1e9 | 0).toString(36);
  clients.set(ws, id);
  players[id] = { id, x: 0, y: 0, size: 36, vida: 5, armadura: false };

  ws.send(JSON.stringify({ type: 'welcome', id }));
  ws.send(JSON.stringify({ type: 'state', players: Object.values(players) }));

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'update' && msg.player) {
        players[id] = { ...players[id], ...msg.player };
        const up = { type: 'update', player: players[id] };
        for (const c of wss.clients) if (c !== ws && c.readyState === WebSocket.OPEN) c.send(JSON.stringify(up));
      } else if (msg.type === 'attack' && msg.attack) {
        broadcast({ type: 'attack', attack: msg.attack });
      } else if (msg.type === 'pickup' && msg.id) {
        broadcast({ type: 'pickup', id: msg.id, by: msg.by });
      }
    } catch (e) { }
  });

  ws.on('close', () => {
    const id = clients.get(ws);
    if (id) {
      delete players[id];
      clients.delete(ws);
      broadcast({ type: 'leave', id });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
