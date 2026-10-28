import { Router, Request, Response } from 'express';
import { getGeminiClient } from '../services/gemini.js';
import { VOICE_AGENT_SYSTEM_PROMPT } from '../agents/voice-assistant.js';
import { config } from '../config/index.js';

export const chatRouter = Router();

chatRouter.post('/api/chat/ask', async (req: Request, res: Response) => {
  const userMessage = req.body.message || '';
  console.log(`🎙️ [Web Voice] Hasta dedi ki: "${userMessage}"`);

  if (!userMessage) {
    res.status(400).json({ error: 'Mesaj boş olamaz' });
    return;
  }

  // Graceful fallback if Gemini API key is missing
  if (!config.ai.geminiApiKey) {
    console.warn('⚠️ GEMINI_API_KEY eksik, kural tabanlı yedek yanıt veriliyor.');
    res.json({
      reply: 'Merhaba! Ben Sio Hair Clinic asistanı Cio. Saç ekimi paketlerimiz 5.000 ile 8.500 Euro arasındadır. Doktor ön muayenesi için WhatsApp hattımıza saç fotoğraflarınızı iletebilirsiniz.',
    });
    return;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        systemInstruction: VOICE_AGENT_SYSTEM_PROMPT + `\nÖNEMLİ: Sen sesli konuşuyorsun. Yanıtın kısa, samimi, konuşma dilinde ve en fazla 2-3 cümle olsun. Telefonda konuşur gibi konuş.`,
      },
    });

    const reply = response.text || 'Anladım. Detaylı bilgi için kliniğimize her zaman ulaşabilirsiniz.';
    console.log(`🤖 [Cio Yanıtı]: "${reply}"`);

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      reply: 'Anladım. Saç ekimi hakkında merak ettiğiniz tüm soruları yanıtlayabilirim. Örneğin FUE veya DHI tekniklerini sorabilirsiniz.',
    });
  }
});
