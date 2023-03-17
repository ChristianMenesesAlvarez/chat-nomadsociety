import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const chatPort = 4001;
const chatApp = express();
const chatServer = createServer(chatApp);
const io = new Server(chatServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5173/'
    ],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // CHECK TOKEN
  if (token == 'abcd') {
    return next()
  } else {
    return next(new Error('You were unable to connect'));
  }
})

const chatrooms = io.of('/chatrooms');

chatrooms.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  console.log(`User connected on "/chatrooms" with token "${token}"`);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`)
    io.of('/chatrooms').to(room).emit('message', `You have joined room #${room}`, 'warning');
  });

  socket.on('message', (msg, room, cb) => {
    io.of('/chatrooms').to(room).emit('message', msg, token);
    cb('OK');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected with token ${token}`);
  });
});

const personal = io.of('/personal');

personal.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  console.log(`User connected on "/personal" with token "${token}"`);

  socket.on('joinRoom', (userId) => {
    socket.join(token);
    socket.join(userId);
    console.log(`User joined personal chat with ${token}`)
    console.log(`User joined chat with ${userId}`)
  });

  socket.on('message', (msg, userId, cb) => {
    io.of('/personal').to(token).to(userId).emit('message', msg, token);
    cb('OK');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected with token ${token}`);
  });
});

chatServer.listen(chatPort, () => {
  console.log(`Chat listening on port ${chatPort}`);
});

