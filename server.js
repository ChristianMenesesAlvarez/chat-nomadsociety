import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const port = 4000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5173/'
    ],
    allowedHeaders: 'authorization',
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // CHECK TOKEN
  if (token == 'abcd') {
    next()
  } else {
    next(new Error('You were unable to connect'));
  }
})

io.on('connection', (socket) => {
  console.log('User connected with token', socket.handshake.auth.token);
  io.emit('message', 'You are now connected', 'warning');

  socket.on('message', (msg, recipient, cb) => {
    cb('OK');
    io.emit('message', msg, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
