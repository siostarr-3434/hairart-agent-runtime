import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let commandCenterClient: SupabaseClient | null = null;

export function getCommandCenterClient(): SupabaseClient {
  if (!commandCenterClient) {
    if (!config.supabase.commandCenterKey) {
      console.warn('⚠️ COMMAND_CENTER_SERVICE_ROLE_KEY missing. Supabase writes may fail in production.');
    }
    commandCenterClient = createClient(
      config.supabase.commandCenterUrl,
      config.supabase.commandCenterKey || 'dummy_key_for_initial_bootstrap',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return commandCenterClient;
}
