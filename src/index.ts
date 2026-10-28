import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { config } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { ingestRouter } from './routes/ingest.js';
import { voiceRouter, handleVoiceWebSocket } from './routes/voice.js';
import { whatsappRouter } from './routes/whatsapp.js';
import { chatRouter } from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static voice UI
app.use(express.static(path.join(__dirname, 'public')));

// Mount Routes
app.use(healthRouter);
app.use(ingestRouter);
app.use(voiceRouter);
app.use(whatsappRouter);
app.use(chatRouter);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server for real-time Voice Streaming (Gemini Live / Twilio Stream)
const wss = new WebSocketServer({ server, path: '/ws/voice' });

wss.on('connection', (ws) => {
  handleVoiceWebSocket(ws);
});

// Start Server
server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Hair Art Clinics Agent Runtime Aktif!`);
  console.log(`📍 Port: ${config.port} | Ortam: ${config.env}`);
  console.log(`🏢 GCP Proje: ${config.gcp.projectId} | Bölge: ${config.gcp.region}`);
  console.log(`📡 Ingestion API: POST /api/leads/ingest`);
  console.log(`🎙️ Voice AI: POST /api/voice/incoming & /ws/voice`);
  console.log(`💬 WhatsApp API: /api/webhooks/whatsapp`);
  console.log(`====================================================`);
});
