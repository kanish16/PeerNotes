import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import Chat from './models/chatModel.js';




dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] },
});

app.use(express.json());
app.use(cors());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Websocket
io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('joinNoteChat', (noteId) => {
    socket.join(noteId);
    console.log(`Socket ${socket.id} joined ${noteId}`);
  });

  socket.on('sendMessage', async ({ noteId, sender, message }) => {
    try {
      // sender should be { _id, name } from frontend
      const chat = await Chat.create({ sender: sender._id, message, noteId });
      const populated = await Chat.findById(chat._id).populate('sender', 'name _id');
      io.to(noteId).emit('receiveMessage', populated);
    } catch (err) {
      console.error('chat save error', err);
    }
  });

  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
