import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getCommandCenterClient } from '../services/supabase.js';
import { config } from '../config/index.js';

export const ingestRouter = Router();

// Zod Schema for incoming leads from Signal website or campaigns
const LeadIngestSchema = z.object({
  fullName: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable(),
  phone: z.string().min(8, 'Geçerli bir telefon numarası giriniz'),
  language: z.string().default('nl'),
  source: z.string().default('signal_website'),
  utmSource: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'GDPR onayı zorunludur',
  }),
  notes: z.string().optional().nullable(),
  idempotencyKey: z.string().optional(),
});

/**
 * Normalizes phone number to international format
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Default to Netherlands if starts with 06
  if (cleaned.startsWith('06') && cleaned.length === 10) {
    cleaned = '+31' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

ingestRouter.post('/api/leads/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Verify Shared Ingestion Secret for Security
    const authHeader = req.headers['x-ingest-secret'];
    if (config.env === 'production' && authHeader !== config.supabase.ingestionSecret) {
      res.status(401).json({ error: 'Unauthorized: Invalid ingestion secret' });
      return;
    }

    // 2. Validate Request Body with Zod
    const validatedData = LeadIngestSchema.parse(req.body);
    const normalizedPhone = normalizePhone(validatedData.phone);

    // 3. Optional Supabase Command Center Persistence (Non-blocking)
    let leadId = 'lead_' + Date.now();
    try {
      const supabase = getCommandCenterClient();
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, full_name, phone, stage')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
        console.log(`[Command Center] Mevcut lead güncellendi: ${leadId}`);
      } else {
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            full_name: validatedData.fullName,
            email: validatedData.email,
            phone: normalizedPhone,
            preferred_language: validatedData.language,
            source: validatedData.source,
            utm_source: validatedData.utmSource,
            utm_campaign: validatedData.utmCampaign,
            consent_status: 'opted_in',
            stage: 'new_inquiry',
            notes: validatedData.notes,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .maybeSingle();

        if (newLead?.id) leadId = newLead.id;
        console.log(`[Command Center] Yeni lead kaydı açıldı: ${leadId}`);
      }
    } catch (dbErr) {
      console.warn('⚠️ Command Center henüz hazır değil veya erişilemedi. Lead konsola kaydedildi ve işleme devam ediliyor:', dbErr);
    }

    console.log(`✅ [Lead Kabul Edildi] ${validatedData.fullName} (${normalizedPhone})`);

    res.status(200).json({
      success: true,
      status: 'received',
      leadId: leadId,
      message: 'Lead başarıyla alındı ve işleme alındı.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Doğrulama hatası', issues: err.issues });
      return;
    }
    console.error('Ingest route error:', err);
    res.status(500).json({ error: 'Beklenmeyen sunucu hatası' });
  }
});
