import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';

export const whatsappRouter = Router();

/**
 * Meta WhatsApp Cloud API Webhook Verification (Handshake)
 */
whatsappRouter.get('/api/webhooks/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('✅ WhatsApp Webhook başarıyla doğrulandı.');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verification failed');
  }
});

/**
 * WhatsApp Inbound Messages & Voice Notes Handler
 */
whatsappRouter.post('/api/webhooks/whatsapp', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from;
        const msgType = message.type;

        console.log(`💬 Yeni WhatsApp mesajı (${msgType}) kimden: ${from}`);

        if (msgType === 'text') {
          const textBody = message.text?.body;
          console.log(`Mesaj metni: "${textBody}"`);
          // Dispatch to Patient Experience Chat Agent
        } else if (msgType === 'audio' || msgType === 'voice') {
          console.log(`🎤 Sesli not alındı! Ses ID: ${message.voice?.id || message.audio?.id}`);
          // 1. Download voice note via Meta Graph API
          // 2. Transcribe using Gemini / Speech-to-text
          // 3. Process answer and optionally send back a voice note or text
        } else if (msgType === 'image') {
          console.log(`📷 Saç fotoğrafı alındı! Fotoğraf ID: ${message.image?.id}`);
          // Dispatch to Gemini Multimodal Hair Analyst
        }
      }
    }

    // Always respond 200 OK fast to acknowledge Meta
    res.sendStatus(200);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.sendStatus(500);
  }
});
