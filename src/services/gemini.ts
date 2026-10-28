import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.ai.geminiApiKey || process.env.GEMINI_API_KEY || '',
    });
  }
  return aiClient;
}

export interface HairAnalysisResult {
  norwoodScale: string;
  donorQuality: 'İyi' | 'Orta' | 'Zayıf' | 'Belirsiz';
  estimatedGrafts: string;
  suitableTechniques: string[];
  recommendationNote: string;
  requiresDoctorReview: boolean;
}

/**
 * Analyzes patient scalp photos for Norwood scale and graft estimation
 */
export async function analyzeHairPhotos(base64Image: string, mimeType = 'image/jpeg'): Promise<HairAnalysisResult> {
  const ai = getGeminiClient();
  
  const systemInstruction = `Sen Sio Hair Clinic / Hair Art Clinics (Hollanda) için çalışan medikal ön triyaj uzmanısın.
Gönderilen saç fotoğraflarını incele:
1. Norwood ölçeği dökülme derecesi (Norwood 1-7).
2. Donör bölge kalitesi (ense ve yanlar).
3. Tahmini greft aralığı (örn. 3000-3500 greft).
4. Uygun teknikler (Sapphire FUE, DHI).
5. Hollanda medikal kuralları gereği KESİN TEŞHİS KOYMA. Bu bir ön tahmindir ve doktor onayı gerektirir.

Yanıtını kesinlikle geçerli bir JSON olarak ver:
{
  "norwoodScale": "Norwood 3V",
  "donorQuality": "İyi",
  "estimatedGrafts": "3000 - 3500",
  "suitableTechniques": ["Sapphire FUE", "DHI"],
  "recommendationNote": "Ön saç çizgisi ve tepe bölgesi için yoğunlaştırma önerilir.",
  "requiresDoctorReview": true
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Lütfen bu saç fotoğrafını klinik protokolümüze göre analiz et.' },
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as HairAnalysisResult;
  } catch (error) {
    console.error('Gemini photo analysis error:', error);
    return {
      norwoodScale: 'Belirsiz',
      donorQuality: 'Belirsiz',
      estimatedGrafts: 'Doktor konsültasyonu gerekiyor',
      suitableTechniques: ['FUE', 'DHI'],
      recommendationNote: 'Fotoğraf netliği yetersiz olduğundan hekim değerlendirmesi önerilir.',
      requiresDoctorReview: true,
    };
  }
}
