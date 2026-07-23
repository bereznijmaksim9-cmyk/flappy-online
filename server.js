const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

 // Указываем папку, где будет лежать игра (index.html)
app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) = {
    socket.on('joinRoom', ({ roomId, playerName }) = {
        socket.join(roomId);
        if (!rooms[roomId]) rooms[roomId] = { players {} };
        
        rooms[roomId].players[socket.id] = { name playerName, score 0, alive true };
        io.to(roomId).emit('roomState', rooms[roomId].players);
    });

    socket.on('scoreUpdate', ({ roomId, score }) = {
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].score = score;
            io.to(roomId).emit('roomState', rooms[roomId].players);
        }
    });

    socket.on('playerDied', ({ roomId }) = {
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id].alive = false;
            io.to(roomId).emit('roomState', rooms[roomId].players);
        }
    });

    socket.on('disconnect', () = {
        for (const roomId in rooms) {
            if (rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                io.to(roomId).emit('roomState', rooms[roomId].players);
            }
        }
    });
});

 Используем порт среды (для хостинга) или 3000 локально
const PORT = process.env.PORT  3000;
http.listen(PORT, () = console.log(`Сервер запущен на порту ${PORT}`));
