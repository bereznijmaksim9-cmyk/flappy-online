const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const rooms = {};

// Функция рассылки списка комнат всем в главном меню
function broadcastRooms() {
    const publicRooms = [];
    for (let id in rooms) {
        publicRooms.push({ id: id, count: Object.keys(rooms[id].players).length });
    }
    io.emit('roomList', publicRooms);
}

io.on('connection', (socket) => {
    // При подключении сразу шлем список лобби
    socket.emit('roomList', Object.keys(rooms).map(id => ({ id, count: Object.keys(rooms[id].players).length })));

    socket.on('joinRoom', ({ roomId, playerName, color, skin }) => {
        socket.join(roomId);
        if (!rooms[roomId]) rooms[roomId] = { players: {} };
        
        // Теперь отслеживаем и пройденную дистанцию
        rooms[roomId].players[socket.id] = { name: playerName, score: 0, alive: true, y: 300, distance: 0, color, skin };
        
        broadcastRooms();
        io.to(roomId).emit('roomState', rooms[roomId].players);
    });

    socket.on('updateState', (data) => {
        const { roomId, score, alive, y, distance } = data;
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            const p = rooms[roomId].players[socket.id];
            p.score = score; p.alive = alive; p.y = y; p.distance = distance;
            
            // Рассылаем остальным
            socket.to(roomId).emit('playerMoved', { 
                id: socket.id, score, alive, y, distance 
            });
        }
    });

    socket.on('leaveRoom', ({ roomId }) => {
        socket.leave(roomId);
        removePlayer(roomId, socket.id);
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            removePlayer(roomId, socket.id);
        }
    });

    function removePlayer(roomId, socketId) {
        if (rooms[roomId] && rooms[roomId].players[socketId]) {
            delete rooms[roomId].players[socketId];
            if (Object.keys(rooms[roomId].players).length === 0) {
                delete rooms[roomId]; // Удаляем пустую комнату
            } else {
                io.to(roomId).emit('roomState', rooms[roomId].players);
            }
            broadcastRooms();
        }
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
