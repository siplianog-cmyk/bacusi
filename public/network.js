const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const players = {};

// Adicionado: Envia o estado de todos os jogadores para os clientes
setInterval(() => {
    io.emit('state', players);
}, 50); // Envia o estado a cada 50ms (20 vezes por segundo)

io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: socket.id,
        // Adicionado: Inicializa o inventário do jogador
        size: 40,
        espada: false,
        picareta: false,
        superpicareta: false,
        armadura: false
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    socket.on('disconnect', () => {
        console.log('Jogador desconectou:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    // Removido 'playerMovement', agora o cliente envia 'state'
    socket.on('state', (playerData) => {
        if(players[socket.id]) {
            players[socket.id] = { ...players[socket.id], ...playerData };
        }
    });

    socket.on('join', (data) => {
        console.log('Jogador entrou no jogo:', data.id);
        players[data.id] = { ...players[data.id], ...data };
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});