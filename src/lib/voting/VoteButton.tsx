import React from 'react';
import { useVote } from './useVote';
import { VotePayload } from './types';

interface VoteButtonProps {
  galleryId: string;
  photoId: string;
  voterId: string;
  voterName: string;
  initialHasVoted?: boolean;
  initialVotesCount?: number;
  onVoteChanged?: (hasVoted: boolean, totalCount: number) => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  galleryId,
  photoId,
  voterId,
  voterName,
  initialHasVoted = false,
  initialVotesCount = 0,
  onVoteChanged
}) => {
  const [hasVoted, setHasVoted] = React.useState(initialHasVoted);
  const [votesCount, setVotesCount] = React.useState(initialVotesCount);
  const [showToast, setShowToast] = React.useState(false);

  const { executeVote, status, isLoading, isError, error, retryCount, resetState } = useVote({
    maxRetries: 3,
    onSuccess: (result) => {
      setHasVoted(result.hasVoted);
      setVotesCount(result.totalVotesCount);
      setShowToast(false);
      onVoteChanged?.(result.hasVoted, result.totalVotesCount);
    },
    onError: (errPayload) => {
      setShowToast(true);
      console.warn('[Vote Error Toast]', errPayload);
    }
  });

  const handleVoteClick = () => {
    if (isLoading) return;

    const payload: VotePayload = {
      galleryId,
      photoId,
      voterId,
      voterName,
      action: hasVoted ? 'remove' : 'add',
      clientTimestamp: new Date().toISOString()
    };

    executeVote(payload);
  };

  const handleRetry = () => {
    handleVoteClick();
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Interactive Vote Button */}
      <button
        onClick={handleVoteClick}
        disabled={isLoading}
        aria-label={hasVoted ? 'Remover voto da foto' : 'Votar na foto'}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 shadow-sm ${
          hasVoted
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25 ring-2 ring-amber-400/50'
            : 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white ring-1 ring-stone-700'
        } ${isLoading ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}
      >
        {/* Heart Icon / Loading Spinner */}
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className={`w-5 h-5 transition-transform ${hasVoted ? 'scale-110 fill-current' : 'fill-none stroke-current'}`}
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}

        <span>
          {status === 'retrying'
            ? `Reconectando (${retryCount})...`
            : isLoading
            ? 'Gravando...'
            : hasVoted
            ? 'Votado'
            : 'Votar'}
        </span>

        {votesCount > 0 && (
          <span
            className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
              hasVoted ? 'bg-amber-600 text-amber-50' : 'bg-stone-700 text-stone-300'
            }`}
          >
            {votesCount}
          </span>
        )}
      </button>

      {/* Floating Detailed Error Toast for Failure UX */}
      {isError && error && showToast && (
        <div className="absolute top-full mt-3 z-50 w-72 p-3 bg-red-950 text-red-100 border border-red-800 rounded-xl shadow-2xl animate-fade-in text-xs space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 font-bold text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Falha na Votação</span>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-red-400 hover:text-red-200 text-base leading-none"
            >
              &times;
            </button>
          </div>

          <p className="text-red-200 leading-relaxed font-medium">{error.userMessage}</p>

          <div className="pt-1 flex items-center justify-between text-[10px] text-red-400 border-t border-red-900/60">
            <span>Código: {error.code}</span>
            {error.category === 'NETWORK_TIMEOUT' && (
              <button
                onClick={handleRetry}
                className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
              >
                Tentar novamente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
