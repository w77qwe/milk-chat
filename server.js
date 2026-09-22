const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB = path.join(__dirname, 'data.json');
const USERS = {
  vamped: { password: 'lowyysx', name: 'vamped', badge: 'Main Dev', avatar: '/avatars/vamped.jpg' },
  eawie: { password: 'teawave1', name: 'eawie', badge: null, avatar: '/avatars/eawie.jpg' }
};

function load() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { return { messages: [] }; }
}
function save(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }
let db = load();

// Токен без состояния: переживает перезапуск сервера, не ломает открытые вкладки
const crypto = require('crypto');
const SECRET = process.env.SECRET || 'milk-cookie-secret';
const sign = name => name + '.' + crypto.createHmac('sha256', SECRET).update(name).digest('hex').slice(0, 24);
function verify(token) {
  const name = String(token || '').split('.')[0];
  return USERS[name] && sign(name) === token ? name : null;
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = USERS[(username || '').toLowerCase().trim()];
  if (!u || u.password !== password) return res.status(401).json({ error: 'Неверный логин или пароль' });
  res.json({ token: sign(u.name), me: pub(u), peer: pub(USERS[u.name === 'vamped' ? 'eawie' : 'vamped']) });
});

const pub = u => ({ name: u.name, badge: u.badge, avatar: u.avatar });

app.get('/api/messages', (req, res) => {
  if (!verify(req.query.token)) return res.status(401).json({ error: 'auth' });
  res.json(db.messages.slice(-200));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'auth') {
      const user = verify(m.token);
      if (!user) return ws.close();
      ws.user = user;
      ws.send(JSON.stringify({ type: 'history', messages: db.messages.slice(-200) }));
      return;
    }
    if (!ws.user) return;
    if (m.type === 'msg' && m.text && m.text.trim()) {
      const msg = { id: Date.now() + '-' + Math.random().toString(36).slice(2), from: ws.user, text: String(m.text).slice(0, 2000), ts: Date.now() };
      db.messages.push(msg); save(db);
      broadcast({ type: 'msg', message: msg });
    }
    if (m.type === 'typing') broadcast({ type: 'typing', from: ws.user }, ws);
  });
});

// Пинг раз в 30 сек — чтобы прокси не рвали простаивающее WebSocket-соединение
setInterval(() => wss.clients.forEach(c => { if (c.readyState === 1) c.ping(); }), 30000);

function broadcast(obj, except) {
  const s = JSON.stringify(obj);
  wss.clients.forEach(c => { if (c.readyState === 1 && c.user && c !== except) c.send(s); });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('cozy chat on ' + PORT));
