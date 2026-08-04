import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { pool } from './db/index.js';
import { garsonRoutes } from './routes/garson.js';
import { adminRoutes } from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/garson', garsonRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Socket.io — realtime adisyon güncelleme
io.on('connection', (socket) => {
  console.log('Garson bağlandı:', socket.id);

  socket.on('adisyon:open', (masaId) => {
    io.emit('masa:updated', { masaId, durum: 'dolu' });
  });

  socket.on('adisyon:close', (masaId) => {
    io.emit('masa:updated', { masaId, durum: 'bos' });
  });

  socket.on('adisyon:item-added', (data) => {
    io.emit('adisyon:updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Garson ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Ada Çay Evi server çalışıyor: http://localhost:${PORT}`);
});

export { app, io };