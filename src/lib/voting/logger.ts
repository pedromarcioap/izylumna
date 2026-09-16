import { supabase } from '../supabase';
import { StandardErrorPayload } from './types';

export interface LogContext {
  component: string;
  action: string;
  environment?: string;
}

/**
 * Generic Observability & Structured Logging Utility
 * Persists failure details into Supabase `error_logs` table with fallback to Sentry/Console.
 */
export async function logError(
  context: string | LogContext,
  error: unknown,
  userId?: string,
  payload?: Record<string, any>
): Promise<string> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const contextStr = typeof context === 'string' ? context : `${context.component}:${context.action}`;

  // Extract error properties safely
  const errObj = error instanceof Error ? error : (error as any);
  const errorCode = String(errObj?.code || errObj?.statusCode || 'UNKNOWN_ERROR');
  const message = String(errObj?.message || errObj?.details || error || 'Unknown failure occurred');
  const stack = errObj?.stack || null;

  const logEntry = {
    id: requestId,
    context: contextStr,
    user_id: userId || 'anonymous',
    error_code: errorCode,
    message,
    stack_trace: stack,
    payload: payload || {},
    environment: process.env.NODE_ENV || 'production',
    created_at: timestamp,
  };

  // 1. Terminal / Developer Console Output (Structured JSON for CloudWatch/Vercel Logs)
  console.error(`[ERROR_LOG][${contextStr}][TraceID: ${requestId}]`, JSON.stringify(logEntry, null, 2));

  // 2. Persistent Storage: Attempt writing to Supabase 'error_logs' table
  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert({
          id: requestId,
          context: contextStr,
          user_id: userId || null,
          error_code: errorCode,
          message,
          stack_trace: stack,
          payload: payload || {},
          created_at: timestamp
        });

      if (dbError) {
        console.warn(`[Logging Fallback] Failed to write log to Supabase 'error_logs': ${dbError.message}`);
      }
    }
  } catch (logDbException) {
    console.warn('[Logging Fallback] Exception while sending log to DB:', logDbException);
  }

  // 3. Sentry Integration Hook (If Sentry or Telemetry SDK is installed)
  try {
    const globalObj = globalThis as any;
    if (globalObj.Sentry && typeof globalObj.Sentry.captureException === 'function') {
      globalObj.Sentry.captureException(error, {
        extra: {
          requestId,
          context: contextStr,
          userId,
          payload
        }
      });
    }
  } catch {
    // Ignore third-party telemetry failures
  }

  return requestId;
}

/**
 * Builds a standardized error response object from raw Postgres/Supabase errors
 */
export function buildStandardErrorResponse(
  error: any,
  payload: Record<string, any>,
  requestId: string
): StandardErrorPayload {
  const timestamp = new Date().toISOString();
  const code = String(error?.code || error?.status || 'INTERNAL_ERROR');
  const rawMsg = String(error?.message || error?.details || error || '');

  let category: StandardErrorPayload['category'] = 'DATABASE_CRITICAL';
  let userMessage = 'Ocorreu um problema ao processar seu voto. Tente novamente.';

  // Map PostgreSQL / Supabase Error Codes
  switch (code) {
    case '23505': // Unique constraint violation
      category = 'UNIQUE_CONSTRAINT';
      userMessage = 'Seu voto já foi registrado anteriormente nesta foto.';
      break;

    case '42501': // RLS Permission Denied
    case 'PGRST301': // JWT Expired or Invalid Token
      category = 'RLS_PERMISSION';
      userMessage = 'Sua sessão expirou ou você não possui permissão para votar nesta galeria.';
      break;

    case '23503': // Foreign key violation
      category = 'FOREIGN_KEY';
      userMessage = 'A foto ou galeria selecionada não foi encontrada ou foi removida.';
      break;

    case '57014': // Query Timeout
    case 'PGRST000':
    case 'NETWORK_ERROR':
    case 'FETCH_ERROR':
      category = 'NETWORK_TIMEOUT';
      userMessage = 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.';
      break;

    case 'VOTE_RACE_CONDITION':
      category = 'RACE_CONDITION';
      userMessage = 'Conflito de votos simultâneos detectado. Atualizando dados...';
      break;

    case 'INVALID_VOTER_SESSION':
      category = 'AUTH_SESSION';
      userMessage = 'Identificação do eleitor inválida. Selecione seu perfil novamente.';
      break;

    default:
      if (rawMsg.toLowerCase().includes('jwt') || rawMsg.toLowerCase().includes('permission')) {
        category = 'RLS_PERMISSION';
        userMessage = 'Permissão de acesso negada.';
      } else if (rawMsg.toLowerCase().includes('timeout') || rawMsg.toLowerCase().includes('fetch')) {
        category = 'NETWORK_TIMEOUT';
        userMessage = 'Tempo limite de rede excedido.';
      }
      break;
  }

  return {
    timestamp,
    category,
    code,
    userMessage,
    technicalDetails: rawMsg || 'Detalhes técnicos não fornecidos',
    payload,
    requestId
  };
}
