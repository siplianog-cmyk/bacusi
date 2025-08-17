let ws = null;
let clientId = null;
let otherPlayers = {};

function connectNetwork() {
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = proto + location.host;
  ws = new WebSocket(host);

  ws.onopen = () => { console.log('WS open'); ws.send(JSON.stringify({ type: 'join' })); };
  ws.onmessage = ev => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'welcome') clientId = msg.id;
      else if (msg.type === 'state') {
        otherPlayers = {};
        for (const p of msg.players) if (p.id !== clientId) otherPlayers[p.id] = { ...p, lastUpdate: Date.now() };
      } else if (msg.type === 'update') {
        if (msg.player && msg.player.id !== clientId) otherPlayers[msg.player.id] = { ...msg.player, lastUpdate: Date.now() };
      } else if (msg.type === 'attack') {
        const atk = msg.attack;
        if (typeof player !== 'undefined') {
          const dx = player.x - atk.x, dy = player.y - atk.y;
          if (Math.hypot(dx, dy) <= (atk.range || 24) + (player.size || 24) / 2) {
            player.vida = Math.max(0, (player.vida || 0) - (atk.dano || 1));
          }
        }
      } else if (msg.type === 'pickup') {
        for (let i = (typeof materials !== 'undefined' ? materials.length - 1 : -1); i >= 0; i--) {
          if (materials && materials[i] && materials[i].id === msg.id) materials.splice(i, 1);
        }
      }
    } catch (e) { console.warn('WS parse', e); }
  };
  ws.onclose = () => { console.log('WS closed — reconectando'); setTimeout(() => connectNetwork(), 1000); };
}

function sendLocalState() {
  if (!ws || ws.readyState !== WebSocket.OPEN || !clientId) return;
  const payload = { type: 'update', player: { id: clientId, x: player.x, y: player.y, size: player.size || 32, vida: player.vida || 0, armadura: inventory && inventory.armadura } };
  ws.send(JSON.stringify(payload));
}

function sendAttack(x, y, range, dano = 1) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !clientId) return;
  ws.send(JSON.stringify({ type: 'attack', attack: { by: clientId, x, y, range, dano } }));
}

function sendPickup(materialId) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !clientId) return;
  ws.send(JSON.stringify({ type: 'pickup', id: materialId, by: clientId }));
}

setInterval(() => { sendLocalState(); }, 100);

function drawOtherPlayers(ctxLocal) {
  if (!otherPlayers) return;
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    if (Date.now() - p.lastUpdate > 5000) { delete otherPlayers[id]; continue; }
    ctxLocal.save();
    ctxLocal.translate(p.x - (typeof camera !== 'undefined' ? camera.x : 0), p.y - (typeof camera !== 'undefined' ? camera.y : 0));
    ctxLocal.fillStyle = '#4dd0e1';
    const s = p.size || 28;
    ctxLocal.beginPath();
    ctxLocal.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctxLocal.fill();
    ctxLocal.fillStyle = '#000';
    ctxLocal.font = '12px sans-serif';
    ctxLocal.fillText(Math.round(p.vida || 0), s + 4, 12);
    ctxLocal.restore();
  }
}

