import { supabase } from '@/lib/supabaseClient';

export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AppLogContext = Record<string, unknown>;

export async function logAppEvent(level: AppLogLevel, message: string, context?: AppLogContext) {
  if (!supabase) return;

  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    const path = typeof window !== 'undefined' ? window.location.pathname : null;

    await supabase.from('app_logs').insert({
      level,
      message,
      context: context ?? null,
      user_id: userId,
      path,
      source: 'web',
    });
  } catch {
  }
}

export function logError(message: string, context?: AppLogContext) {
  return logAppEvent('error', message, context);
}

export function logWarn(message: string, context?: AppLogContext) {
  return logAppEvent('warn', message, context);
}

export function logInfo(message: string, context?: AppLogContext) {
  return logAppEvent('info', message, context);
}
