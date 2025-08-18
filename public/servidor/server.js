const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = {};
setInterval(() => {
    io.emit('state', players);
}, 50); // Envia o estado a cada 50ms (20 vezes por segundo)

io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: socket.id
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    socket.on('disconnect', () => {
        console.log('Jogador desconectou:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

socket.on('state', (playerData) => {
    if(players[socket.id]) {
        players[socket.id] = { ...players[socket.id], ...playerData };
    }
});
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});