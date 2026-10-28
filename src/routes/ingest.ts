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

    const supabase = getCommandCenterClient();

    // 3. Deduplication Check in Clinic Command Center
    const { data: existingLead, error: lookupError } = await supabase
      .from('leads')
      .select('id, full_name, phone, stage')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Supabase lookup error:', lookupError);
    }

    if (existingLead) {
      // Lead already exists: record new touchpoint/event without creating duplicate
      console.log(`Lead already exists with ID ${existingLead.id}, updating activity.`);
      
      await supabase.from('lead_stage_history').insert({
        lead_id: existingLead.id,
        event_type: 'repeated_submission',
        source: validatedData.source,
        notes: validatedData.notes || 'Hasta tekrar form gönderdi',
      }).maybeSingle();

      res.status(200).json({
        success: true,
        status: 'updated_existing',
        leadId: existingLead.id,
        message: 'Mevcut lead kaydı güncellendi.',
      });
      return;
    }

    // 4. Create New Lead in Command Center
    const { data: newLead, error: insertError } = await supabase
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
      .single();

    if (insertError) {
      console.error('Failed to insert lead into Command Center:', insertError);
      res.status(500).json({ error: 'Veritabanına kayıt başarısız oldu', details: insertError.message });
      return;
    }

    console.log(`✅ Yeni lead başarıyla Command Center'a kaydedildi. ID: ${newLead.id}`);

    // Trigger Speed-to-lead outbound action / notification here if configured
    res.status(201).json({
      success: true,
      status: 'created',
      leadId: newLead.id,
      message: 'Lead başarıyla Command Center veritabanına aktarıldı.',
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
