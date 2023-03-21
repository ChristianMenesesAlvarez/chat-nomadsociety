import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { DBconnection } from './database.js';
import * as usersRepository from '../src/api/usersRepository.js';
import * as chatRepository from '../src/api/chatRepository.js';
import { verifyToken } from './api/verifyToken.js';

dotenv.config();
DBconnection();

const port = process.env.CHAT_PORT || 4000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://127.0.0.1:5173',
    credentials: true,
  }
});

app.use(cors());
// SERVER ROUTERS
app.get('/chatrooms', (req, res) => {
  const rooms = io.of('/chatrooms').adapter.rooms.entries();
  let roomArray = [{
    title: 'general',
    state: `(0 users)`,
    room: 'general',
  }];
  for (let room of rooms) {
    roomArray.push({
      title: room[0],
      state: `(${room[1].size} users)`,
      room: room[0],
    })
  }
  return res.json(roomArray);
});

app.get('/contacts', async (req, res) => {
  const contacts = [
    {
      title: 'Paco',
      state: '✅',
      userId: '640b11adf8b45a6aa48a5e40',
    },
    {
      title: 'Pepe',
      state: '✅',
      userId: '640b4ced35fe3ca735760e17',
    },
    {
      title: 'Manolo',
      state: '✅',
      userId: '640e2e68212917eeb459f1dc',
    },
    {
      title: 'Ramon',
      state: '✅',
      userId: '640ee71da8d9b0bb12b6d9af',
    },
  ];
  return res.json(contacts);
})

// CHAT ROOMS NAMESPACE
const chatrooms = io.of('/chatrooms');

// CHAT ROOMS MIDDLEWARE
chatrooms.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const { id } = verifyToken(token);
    const getUser = await usersRepository.getUser({ _id: id });
    if (!getUser) return next(new Error('Unauthorized'));
    return next();
  } catch (error) {
    return next(new Error(error.message));
  }
});

// CHAT ROOMS SERVER
chatrooms.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  const { id } = verifyToken(token);
  socket.leave(socket.id);
  console.log(`User "${id}" connected on "/chatrooms"`);

  socket.on('joinRoom', (room, cb) => {
    socket.rooms.forEach(rm => { if (rm != room) socket.leave(rm) })
    socket.join(room);
    chatrooms.to(id).emit('chat-history', []);
    chatrooms.to(room).emit('message', `You have joined room #${room}`, 'warning');
    cb('OK');
  });

  socket.on('message', (msg, room, cb) => {
    chatrooms.to(room).emit('message', msg, id);
    cb('OK');
  });

  socket.on('disconnect', () => {
    console.log(`Socket "${socket.id}" disconnected`);
  });
});

chatrooms.adapter.on("create-room", (room) => {
  console.log(`Room ${room} was created`);
});

chatrooms.adapter.on("delete-room", (room) => {
  console.log(`Room ${room} was deleted`);
});

chatrooms.adapter.on("join-room", (room, id) => {
  console.log(`Socket ${id} has joined room ${room}`);
});

chatrooms.adapter.on("leave-room", (room, id) => {
  console.log(`Socket ${id} has left room ${room}`);
});

// PERSONAL NAMESPACE
const personal = io.of('/personal');

// PERSONAL MIDDLEWARE
personal.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const { id } = verifyToken(token);
    const getUser = await usersRepository.getUser({ _id: id });
    if (!getUser) return next(new Error('Unauthorized'));
    return next();
  } catch (error) {
    return next(new Error(error.message));
  }
});

// PERSONAL SERVER
personal.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  const { id } = verifyToken(token);
  console.log(`User "${id}" connected on "/personal"`);

  socket.on('joinRoom', async (userId, cb) => {
    socket.rooms.forEach(rm => socket.leave(rm))
    socket.join([id, userId]);
    const getChatHistory = await chatRepository.retrieveChatHistory(id, userId);
    const setEvents = getChatHistory.map(item => {
      return { type: item.type, value: item.value }
    });
    personal.to(id).emit('chat-history', setEvents);
    console.log(`User "${id}" joined personal chat with "${userId}"`);
    cb('OK')
  });

  socket.on('message', async (msg, userId, cb) => {
    personal.to(id).to(userId).emit('message', msg, id);
    try {
      await chatRepository.addMessageRecord(id, userId, 'message', msg);
      await chatRepository.addMessageRecord(userId, id, 'inc_message', msg);
    } catch (error) {
      console.log(error.message);
    }
    cb('OK');
  });

  socket.on('disconnect', () => {
    console.log(`User "${id}" disconnected`);
  });
});

// SERVER INITIALIZING
server.listen(port, () => {
  const timelog = new Date();
  console.log(`SERVERLOG ${timelog} --> Chat listening on port ${port}`);
});