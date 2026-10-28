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

  // Smart Fallback if Gemini API key is not yet set or fails
  const lowerMsg = userMessage.toLowerCase();
  let fallbackReply = 'Sio Hair Clinic’e hoş geldiniz! Ben kliniğimizin asistanı Cio. FUE ve DHI saç restorasyonu, fiyat paketlerimiz ve doktor konsültasyonu hakkında size bilgi verebilirim.';

  if (lowerMsg.includes('randevu') || lowerMsg.includes('bu hafta') || lowerMsg.includes('afspraak')) {
    fallbackReply = 'Tabii ki! Bu hafta için doktorumuzla ücretsiz saç analizi ve ön konsültasyon randevusu ayarlayabiliriz. Hafta içi mi yoksa hafta sonu mu sizin için daha uygun olur?';
  } else if (lowerMsg.includes('fiyat') || lowerMsg.includes('ücret') || lowerMsg.includes('ne kadar') || lowerMsg.includes('prijs')) {
    fallbackReply = 'Hollanda kliniğimizde her şey dahil standart FUE ve DHI paketlerimiz 5.000 ile 8.500 Euro arasındadır. Net fiyatınız saçınızın açıklığına ve greft sayısına göre belirlenir.';
  } else if (lowerMsg.includes('dhi') || lowerMsg.includes('fue') || lowerMsg.includes('teknik')) {
    fallbackReply = 'Kliniğimizde Safir FUE ve DHI (Choi Pen) teknikleri kullanılmaktadır. DHI tekniğinde kökler tıraşsız ve doğrudan ekilirken, FUE geniş alanlarda yüksek greft sayıları için idealdir.';
  } else if (lowerMsg.includes('nerede') || lowerMsg.includes('adres') || lowerMsg.includes('yeriniz') || lowerMsg.includes('waari')) {
    fallbackReply = 'Kliniğimiz Hollanda merkezlidir. Konsültasyonlarımız ve operasyonlarımız Hollanda sağlık standartlarında (BIG uyumlu) gerçekleştirilmektedir.';
  }

  // If no Gemini key is set, return the smart answer directly
  if (!config.ai.geminiApiKey) {
    console.warn('⚠️ GEMINI_API_KEY Cloud Run ortamında henüz tanımlı değil. Akıllı klinik kuralı ile yanıtlandı.');
    res.json({ reply: fallbackReply });
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
    console.error('Gemini Chat error:', error);
    res.json({ reply: fallbackReply });
  }
});
