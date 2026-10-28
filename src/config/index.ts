import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'hair-art-son',
    region: process.env.GCP_REGION || 'europe-west4',
  },
  supabase: {
    commandCenterUrl: process.env.COMMAND_CENTER_SUPABASE_URL || 'https://djbflsqljeoptmpruhka.supabase.co',
    commandCenterKey: process.env.COMMAND_CENTER_SERVICE_ROLE_KEY || '',
    signalUrl: process.env.SIGNAL_SUPABASE_URL || 'https://vpanoajjzzakjbsbkwoo.supabase.co',
    ingestionSecret: process.env.SIGNAL_INGESTION_SECRET || 'dev_secret_change_in_prod',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  voice: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  whatsapp: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'hairart_verify_token',
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  },
};
