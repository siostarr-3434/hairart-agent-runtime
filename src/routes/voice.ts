import { Router, Request, Response } from 'express';
import { WebSocket } from 'ws';

export const voiceRouter = Router();

/**
 * Inbound Call Webhook (Twilio / VoIP)
 * When a patient calls the clinic number, Twilio hits this endpoint.
 */
voiceRouter.post('/api/voice/incoming', (req: Request, res: Response) => {
  const callerNumber = req.body.From || 'Bilinmeyen Numara';
  console.log(`📞 Gelen telefon çağrısı: ${callerNumber}`);

  // TwiML response: Connects call to our real-time streaming WebSocket
  const host = req.headers.host || 'localhost:8080';
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="nl-NL" voice="Polly.Ruben">
        Welkom bij Sio Hair Clinic. Een ogenblik geduld alstublieft, u wordt doorverbonden met onze assistent.
    </Say>
    <Connect>
        <Stream url="${protocol}://${host}/ws/voice">
            <Parameter name="caller" value="${callerNumber}" />
        </Stream>
    </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

/**
 * Speed-to-lead Outbound Call Trigger
 */
voiceRouter.post('/api/voice/outbound', async (req: Request, res: Response) => {
  const { phone, name, language = 'nl' } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'Telefon numarası zorunludur' });
    return;
  }

  console.log(`🚀 [Speed-to-Lead] ${name} (${phone}) için giden sesli arama tetiklendi.`);

  // In production with Twilio:
  // twilioClient.calls.create({
  //   url: `https://${req.headers.host}/api/voice/outbound-twiml?name=${encodeURIComponent(name)}&lang=${language}`,
  //   to: phone,
  //   from: config.voice.twilioPhoneNumber,
  // });

  res.json({
    success: true,
    message: `${phone} numarası için arama kuyruğa alındı.`,
    target: { name, phone, language },
  });
});

/**
 * WebSocket Voice Streaming Handler for Gemini Live API
 */
export function handleVoiceWebSocket(ws: WebSocket): void {
  console.log('🎙️ Yeni ses akışı (WebSocket) bağlandı.');

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.event === 'start') {
        console.log('Ses akışı başladı:', message.start.streamSid);
      } else if (message.event === 'media') {
        // Audio chunk received from caller (mulaw/8000Hz base64)
        // Stream to Gemini Live API / Audio model
      } else if (message.event === 'stop') {
        console.log('Ses akışı sonlandı.');
      }
    } catch {
      // Binary raw audio stream handling
    }
  });

  ws.on('close', () => {
    console.log('Ses akışı WebSocket bağlantısı kapandı.');
  });
}
