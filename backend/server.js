require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Controllers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Config
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET || !MONGO_URI) {
  console.error('❌ Missing environment variables: JWT_SECRET or MONGO_URI');
  process.exit(1);
}

// Security & Performance Middlewares
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('combined'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'chat.html')));

// MongoDB connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN, credentials: true }
});

// JWT auth middleware for sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: token missing'));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: token invalid'));
    socket.userId = decoded.id;
    next();
  });
});

// Online users map
const onlineUsers = new Map();

// Handle connections
io.on('connection', socket => {
  console.log(`⚡ User connected: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  // Join private room
  socket.on('joinRoom', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
  });

  // Send text message
  socket.on('sendMessage', async ({ to, text }) => {
    if (!to || !text.trim()) return;
    try {
      const msg = await require('./models/Message').create({
        from: socket.userId,
        to,
        text: text.trim(),
        createdAt: new Date(),
      });
      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);
    } catch (err) {
      console.error('❌ Message save error:', err);
    }
  });

  // Media message
  socket.on('mediaMessage', async ({ to, base64, type, text = '' }) => {
    if (!to || !base64 || !type) return;
    try {
      const msg = await require('./models/Message').create({
        from: socket.userId,
        to,
        text: text.trim(),
        media: { type, url: base64 },
        createdAt: new Date(),
      });
      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);
    } catch (err) {
      console.error('❌ Media message save error:', err);
    }
  });

  // React to message
  socket.on('react', async ({ messageId, emoji }) => {
    if (!messageId || !emoji) return;
    try {
      const model = require('./models/Message');
      const msg = await model.findById(messageId);
      if (!msg) return;
      msg.reactions = msg.reactions.filter(r => r.userId.toString() !== socket.userId);
      msg.reactions.push({ userId: socket.userId, emoji });
      await msg.save();
      const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
      io.to(room).emit('reaction', { messageId, reactions: msg.reactions });
    } catch (err) {
      console.error('❌ Reaction error:', err);
    }
  });

  // Self-destruct message
  socket.on('selfDestructMessage', async ({ to, text, seconds }) => {
    if (!to || !text.trim() || !seconds || seconds <= 0) return;
    try {
      const destructAt = new Date(Date.now() + seconds * 1000);
      const msg = await require('./models/Message').create({
        from: socket.userId,
        to,
        text: text.trim(),
        isSelfDestruct: true,
        destructAt,
        createdAt: new Date(),
      });
      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);
      setTimeout(async () => {
        try {
          await require('./models/Message').findByIdAndDelete(msg._id);
          io.to(room).emit('messageDeleted', { id: msg._id });
        } catch (err) {
          console.error('❌ Self-destruct deletion error:', err);
        }
      }, seconds * 1000);
    } catch (err) {
      console.error('❌ Self-destruct creation error:', err);
    }
  });

  // Pin message
  socket.on('pinMessage', async ({ messageId }) => {
    if (!messageId) return;
    try {
      const msg = await require('./models/Message').findByIdAndUpdate(
        messageId,
        { isPinned: true },
        { new: true }
      );
      if (msg) {
        const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
        io.to(room).emit('pinned', { messageId: msg._id });
      }
    } catch (err) {
      console.error('❌ Pin error:', err);
    }
  });

  // Upload story
  socket.on('uploadStory', async ({ base64, type }) => {
    if (!base64 || !type) return;
    try {
      const story = await require('./models/Story').create({
        userId: socket.userId,
        media: base64,
        type,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });
      io.emit('newStory', { userId: story.userId, media: story.media, type: story.type });
    } catch (err) {
      console.error('❌ Story upload error:', err);
    }
  });

  // WebRTC signaling
  socket.on('callUser', ({ to, signalData }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('incomingCall', { from: socket.userId, signalData });
  });

  socket.on('answerCall', ({ to, signal }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('callAccepted', { signal });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
  });
});

// Global error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
