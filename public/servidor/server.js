// server.js (código completo - CORRIGIDO)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const players = {};

io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: socket.id,
        espada: false, picareta: false, superpicareta: false, armadura: false,
    };
    
    // Envia a lista completa de jogadores para o novo jogador
    socket.emit('currentPlayers', players);
    
    // Notifica outros jogadores sobre o novo jogador
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    socket.on('disconnect', () => {
        console.log('Jogador desconectou:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    // CORREÇÃO: O evento agora se chama 'playerState', igual no cliente.
    socket.on('playerState', (playerData) => {
        if(players[socket.id]) {
            players[socket.id] = { ...players[socket.id], ...playerData };
        }
    });
});

setInterval(() => {
    // CORREÇÃO: O evento agora se chama 'state' para o cliente receber o estado completo.
    io.emit('state', players);
}, 50); // Envia o estado a cada 50ms (20 vezes por segundo)

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});