const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    // Подключение к комнате
    socket.on('joinRoom', ({ roomId, playerName }) => {
        socket.join(roomId);
        if (!rooms[roomId]) rooms[roomId] = { players: {} };
        
        rooms[roomId].players[socket.id] = { name: playerName, score: 0, alive: true, y: 250 };
        io.to(roomId).emit('roomState', rooms[roomId].players);
    });

    // Постоянное обновление состояния (координаты, жизнь, счет)
    socket.on('updateState', (data) => {
        const { roomId, score, alive, y } = data;
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].score = score;
            rooms[roomId].players[socket.id].alive = alive;
            rooms[roomId].players[socket.id].y = y;
            
            // Рассылаем всем остальным в комнате, чтобы они видели твой полет
            socket.to(roomId).emit('playerMoved', { 
                id: socket.id, 
                score: score, 
                alive: alive, 
                y: y 
            });
        }
    });

    // Кнопка выхода из комнаты
    socket.on('leaveRoom', ({ roomId }) => {
        socket.leave(roomId);
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            delete rooms[roomId].players[socket.id];
            io.to(roomId).emit('roomState', rooms[roomId].players);
        }
    });

    // Отключение от сервера (закрыл вкладку/приложение)
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            if (rooms[roomId]?.players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                io.to(roomId).emit('roomState', rooms[roomId].players);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
