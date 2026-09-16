import { useState, useCallback, useRef } from 'react';
import { ApiResponse, VotePayload, VoteResult, VoteStateStatus, StandardErrorPayload } from './types';
import { castVoteAction } from './serverAction';

export interface UseVoteOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  onSuccess?: (result: VoteResult) => void;
  onError?: (error: StandardErrorPayload) => void;
}

export function useVote(options: UseVoteOptions = {}) {
  const { maxRetries = 3, initialBackoffMs = 1000, onSuccess, onError } = options;

  const [status, setStatus] = useState<VoteStateStatus>('idle');
  const [error, setError] = useState<StandardErrorPayload | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const isMountedRef = useRef(true);

  // Helper delay function
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  /**
   * Executes vote action with automatic exponential backoff retry for transient network errors.
   */
  const executeVote = useCallback(
    async (payload: VotePayload): Promise<ApiResponse<VoteResult>> => {
      setStatus('loading');
      setError(null);
      setRetryCount(0);

      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          if (attempt > 0) {
            setStatus('retrying');
            setRetryCount(attempt);
            // Exponential backoff with jitter: backoff * 2^(attempt-1) + random(0..200ms)
            const backoff = initialBackoffMs * Math.pow(2, attempt - 1) + Math.random() * 200;
            await sleep(backoff);
          }

          const response = await castVoteAction(payload);

          if (!isMountedRef.current) return response;

          if (response.success && response.data) {
            setStatus('success');
            setError(null);
            onSuccess?.(response.data);
            return response;
          }

          // Inspect returned structured error
          const errPayload = response.error;

          if (errPayload) {
            // Check if error category allows retry (Transient Network Errors / Timeouts)
            const isRetryable =
              errPayload.category === 'NETWORK_TIMEOUT' ||
              errPayload.code === '57014' ||
              errPayload.code === 'FETCH_ERROR';

            if (isRetryable && attempt < maxRetries) {
              attempt++;
              continue; // Retry loop
            }

            // Non-retryable error (e.g. RLS 42501, Unique 23505) or retries exhausted
            setStatus('error');
            setError(errPayload);
            onError?.(errPayload);
            return response;
          }

          // Fallback generic error
          const fallbackErr: StandardErrorPayload = {
            timestamp: new Date().toISOString(),
            category: 'DATABASE_CRITICAL',
            code: 'UNKNOWN_FAILURE',
            userMessage: 'Falha não identificada ao registrar seu voto.',
            technicalDetails: 'Response returned success: false without error payload.',
            payload
          };

          setStatus('error');
          setError(fallbackErr);
          onError?.(fallbackErr);
          return { success: false, error: fallbackErr };

        } catch (err: any) {
          // Unexpected client transport exception
          if (attempt < maxRetries) {
            attempt++;
            continue;
          }

          const clientTransportErr: StandardErrorPayload = {
            timestamp: new Date().toISOString(),
            category: 'NETWORK_TIMEOUT',
            code: 'CLIENT_TRANSPORT_EXCEPTION',
            userMessage: 'Não foi possível se comunicar com o servidor. Verifique sua conexão.',
            technicalDetails: String(err?.message || err),
            payload
          };

          if (isMountedRef.current) {
            setStatus('error');
            setError(clientTransportErr);
            onError?.(clientTransportErr);
          }

          return { success: false, error: clientTransportErr };
        }
      }

      const exhaustedErr: StandardErrorPayload = {
        timestamp: new Date().toISOString(),
        category: 'NETWORK_TIMEOUT',
        code: 'MAX_RETRIES_EXCEEDED',
        userMessage: 'Tempo limite excedido após múltiplas tentativas. Clique em "Tentar novamente".',
        technicalDetails: `Failed after ${maxRetries} backoff retry attempts.`,
        payload
      };

      if (isMountedRef.current) {
        setStatus('error');
        setError(exhaustedErr);
        onError?.(exhaustedErr);
      }

      return { success: false, error: exhaustedErr };
    },
    [maxRetries, initialBackoffMs, onSuccess, onError]
  );

  const resetState = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    executeVote,
    resetState,
    status,
    isLoading: status === 'loading' || status === 'retrying',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    retryCount
  };
}
