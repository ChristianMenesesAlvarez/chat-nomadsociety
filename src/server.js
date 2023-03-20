import * as dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { DBconnection } from './database.js';
import * as usersRepository from '../src/api/usersRepository.js';
import * as chatRepository from '../src/api/chatRepository.js';

dotenv.config();
DBconnection();

const port = process.env.CHAT_PORT || 4000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5173/'
    ],
  }
});

io.on('connection', (socket) => {
  console.log('A user connected ', socket.id)
})


// const chatrooms = io.of('/chatrooms');

// chatrooms.use(async (socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) return next(new Error('Unauthorized'));
//   try {
//     const { id } = verifyToken(token);
//     const getUser = await usersRepository.getUser({ _id: id });
//     if (!getUser) return next(new Error('Unauthorized'));
//     return next();
//   } catch (error) {
//     return next(new Error(error.message));
//   }
// });

// chatrooms.on('connection', (socket) => {
//   const token = socket.handshake.auth.token;
//   const { id } = verifyToken(token);
//   console.log(`User connected on "/chatrooms" with id "${id}"`);

//   socket.on('joinRoom', (room) => {
//     socket.join(room);
//     console.log(`User "${id}" joined room ${room}`)
//     io.of('/chatrooms').to(room).emit('message', `You have joined room #${room}`, 'warning');
//   });

//   socket.on('message', (msg, room, cb) => {
//     io.of('/chatrooms').to(room).emit('message', msg, token);
//     cb('OK');
//   });

//   socket.on('disconnect', () => {
//     console.log(`User "${id}" disconnected`);
//   });
// });

// const personal = io.of('/personal');

// personal.use(async (socket, next) => {
//   console.log('Tried')
//   const token = socket.handshake.auth.token;
//   if (!token) return next(new Error('Unauthorized'));
//   try {
//     const { id } = verifyToken(token);
//     const getUser = await usersRepository.getUser({ _id: id });
//     if (!getUser) return next(new Error('Unauthorized'));
//     return next();
//   } catch (error) {
//     return next(new Error(error.message));
//   }
// });

// personal.on('connection', (socket) => {
//   const token = socket.handshake.auth.token;
//   const { id } = verifyToken(token);
//   console.log(`User connected on "/personal" with id "${id}"`);

//   socket.on('joinRoom', async (userId) => {
//     socket.join([id, userId]);
//     console.log(`User "${id}" joined personal chat with ${userId}`);
//   });

//   socket.on('message', async (msg, userId, cb) => {
//     io.of('/personal').to(id).to(userId).emit('message', msg, token);
//     try {
//       await chatRepository.addMessageRecord(id, userId, 'message', msg);
//       await chatRepository.addMessageRecord(userId, id, 'inc_message', msg);
//     } catch (error) {
//       console.log(error.message);
//     }
//     cb('OK');
//   });

//   socket.on('disconnect', () => {
//     console.log(`User "${id}" disconnected`);
//   });
// });

server.listen(port, () => {
  const timelog = new Date();
  console.log(`SERVERLOG ${timelog} --> Chat listening on port ${port}`);
});
