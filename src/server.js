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
    origin: [
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5173/',
      'http://localhost:5173',
      'http://localhost:5173/',
      'https://frontend-nomad-list.vercel.app',
      'https://frontend-nomad-list.vercel.app/',
      'https://frontend-nomadlist-production.up.railway.app',
      'https://frontend-nomadlist-production.up.railway.app/',
      'https://master.d2emfrquuo2ol2.amplifyapp.com',
      'https://master.d2emfrquuo2ol2.amplifyapp.com/',
      'https://fronteend-nomad-development.up.railway.app',
      'https://fronteend-nomad-development.up.railway.app/',
    ],
    credentials: true,
  }
});

// SERVER ROUTERS
let connectedUsers = new Set();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => { return res.status(200).json('OK') });

app.get('/chatrooms', (req, res) => {
  const rooms = io.of('/chatrooms').adapter.rooms.entries();
  let roomArray = [];
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
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json('Missing token');
    const { id } = verifyToken(token);
    const getUser = await usersRepository.getUser({ _id: id });
    if (!getUser) return res.status(401).json('Unauthorized');
    const getContacts = await usersRepository.getContacts(id);
    const contacts = getContacts?.contacts?.map(con => {
      return {
        avatar: con.avatar,
        title: con.displayName,
        state: connectedUsers.has(con._id),
        userId: con._id,
      }
    });
    return res.json(contacts || []);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.get('/find/', async (req, res) => {
  try {
    return res.json([]);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.get('/find/:search', async (req, res) => {
  try {
    const { search } = req.params;
    const findUsers = await usersRepository.search(search);
    return res.json(findUsers);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post('/addContact', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json('Missing token');
    const { id } = verifyToken(token);
    const getUser = await usersRepository.getUser({ _id: id });
    if (!getUser) return res.status(401).json('Unauthorized');
    const { contactId } = req.body;
    if (!getUser) return res.status(400).json('Missing contactId parameter');
    const addContact = await usersRepository.addContact(id, contactId);
    const contacts = addContact.contacts?.map(con => {
      return {
        avatar: con.avatar,
        title: con.displayName,
        state: connectedUsers.has(con._id),
        userId: con._id,
      }
    });
    return res.json(contacts);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post('/removeContact', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json('Missing token');
    const { id } = verifyToken(token);
    const getUser = await usersRepository.getUser({ _id: id });
    if (!getUser) return res.status(401).json('Unauthorized');
    const { contactId } = req.body;
    if (!getUser) return res.status(400).json('Missing contactId parameter');
    const removeContact = await usersRepository.removeContact(id, contactId);
    const contacts = removeContact.contacts?.map(con => {
      return {
        avatar: con.avatar,
        title: con.displayName,
        state: connectedUsers.has(con._id),
        userId: con._id,
      }
    });
    return res.json(contacts);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

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
chatrooms.on('connection', async (socket) => {
  const token = socket.handshake.auth.token;
  const { id } = verifyToken(token);
  const getUser = await usersRepository.getUser({ _id: id });
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
    chatrooms.to(room).emit('message', msg, id, getUser.displayName);
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
personal.on('connection', async (socket) => {
  const token = socket.handshake.auth.token;
  const { id } = verifyToken(token);
  const getUser = await usersRepository.getUser({ _id: id });
  connectedUsers.add(id);
  console.log(`User "${id}" connected on "/personal"`);

  socket.on('joinRoom', async (userId, cb) => {
    socket.rooms.forEach(rm => socket.leave(rm))
    socket.join([id, userId]);
    const chat = await chatRepository.retrieveChatHistory(id, userId);
    const setEvents = chat?.messages?.map(item => {
      return {
        type: item.type,
        value: item.value,
        username: item.type === 'message' ? chat.recipient.displayName : chat.user.displayName,
      }
    });
    personal.to(id).emit('chat-history', setEvents);
    console.log(`User "${id}" joined personal chat with "${userId}"`);
    cb('OK')
  });

  socket.on('message', async (msg, userId, cb) => {
    personal.to(id).to(userId).emit('message', msg, id, getUser.displayName);
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
    connectedUsers.delete(id);
  });
});

// SERVER INITIALIZING
server.listen(port, () => {
  const timelog = new Date();
  console.log(`SERVERLOG ${timelog} --> Chat listening on port ${port}`);
});
