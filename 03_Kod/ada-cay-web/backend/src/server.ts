import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { pool, initDB } from './db.js';
import { garsonRoutes } from './routes/garson.js';
import { adminRoutes } from './routes/admin.js';
import { authMiddleware, roleMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: false }
});

app.disable('x-powered-by');
app.use(cors({ origin: corsOrigin, credentials: false }));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/garson', garsonRoutes); // login açık, diğerleri auth gerektirir
app.use('/api/admin', authMiddleware, roleMiddleware('admin'), adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

import { verifyToken } from './auth.js';

// Socket.io — JWT auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token yok'));
  }
  const payload = verifyToken(token);
  if (!payload) {
    return next(new Error('Geçersiz token'));
  }
  socket.data.user = payload;
  next();
});

io.on('connection', (socket) => {
  console.log('Garson bağlandı:', socket.id);

  socket.on('adisyon:open', (masaId: number) => {
    if (typeof masaId !== 'number') return;
    io.emit('masa:updated', { masaId, durum: 'dolu' });
  });

  socket.on('adisyon:close', (masaId: number) => {
    if (typeof masaId !== 'number') return;
    io.emit('masa:updated', { masaId, durum: 'bos' });
  });

  socket.on('adisyon:item-added', (data: unknown) => {
    if (!data || typeof data !== 'object') return;
    io.emit('adisyon:updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Garson ayrıldı:', socket.id);
  });
});

// Graceful shutdown
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

// DB init + start
async function start() {
  let retries = 5;
  while (retries > 0) {
    try {
      await initDB();
      server.listen(PORT, () => {
        console.log(`✅ Ada Çay Evi server: http://localhost:${PORT}`);
      });
      return;
    } catch (err) {
      retries--;
      console.error(`DB bağlantı hatası (kalan deneme: ${retries}):`, err);
      if (retries > 0) await new Promise(r => setTimeout(r, 3000));
    }
  }
  // DB yoksa yine de başlat
  server.listen(PORT, () => {
    console.log(`⚠️ Ada Çay Evi server (DB'siz): http://localhost:${PORT}`);
  });
}

start();

export { app, io };