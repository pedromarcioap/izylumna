import React from 'react';
import { Gallery, GalleryVoter } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Heart, CheckCheck, MessageSquare, Check, User, RefreshCw, Lock, Sparkles } from 'lucide-react';

export interface ClientStickyHeaderProps {
  gallery: Gallery;
  currentVoter: GalleryVoter | null;
  onChangeVoter: () => void;
  myVotesCount: number;
  consensusCount: number;
  commentsCount: number;
  activeFilter: 'all' | 'my_choices' | 'consensus' | 'commented';
  onFilterChange: (filter: 'all' | 'my_choices' | 'consensus' | 'commented') => void;
  onOpenFinalizeModal: () => void;
  isSubmitted: boolean;
  onResetMyVotes?: () => void;
}

export const ClientStickyHeader: React.FC<ClientStickyHeaderProps> = ({
  gallery,
  currentVoter,
  onChangeVoter,
  myVotesCount,
  consensusCount,
  commentsCount,
  activeFilter,
  onFilterChange,
  onOpenFinalizeModal,
  isSubmitted,
  onResetMyVotes
}) => {
  const quota = gallery.quotaIncluded;
  const threshold = gallery.consensusThreshold || 2;
  const extraCount = Math.max(0, myVotesCount - quota);
  const extraTotal = extraCount * gallery.extraPhotoPrice;

  const progressPercent = quota > 0 ? Math.min(100, Math.round((myVotesCount / quota) * 100)) : 0;

  const renderStatusText = () => {
    if (gallery.excessPolicy === 'charge') {
      if (extraCount > 0) {
        return (
          <span className="text-[#F94713] font-medium">
            <strong className="text-white font-mono">{myVotesCount} fotos</strong> — {quota} no pacote +{' '}
            <strong className="text-[#F94713] font-mono font-bold">{extraCount} extras</strong>{' '}
            <span className="text-[#F94713] font-extrabold">(+ R$ {extraTotal.toFixed(2)})</span>
          </span>
        );
      }
      return (
        <span className="text-zinc-300">
          <strong className="text-white font-mono font-bold">{myVotesCount}</strong> de{' '}
          <strong className="text-zinc-200 font-mono">{quota}</strong> inclusas no pacote
          {myVotesCount === quota && <span className="text-[#46BDC6] font-bold ml-1.5">(Cota atingida)</span>}
        </span>
      );
    }

    if (gallery.excessPolicy === 'free_approval') {
      if (extraCount > 0) {
        return (
          <span className="text-[#46BDC6] font-medium">
            <strong className="text-white font-mono font-bold">{myVotesCount} fotos</strong> ({extraCount} além da cota)
          </span>
        );
      }
      return (
        <span className="text-zinc-300">
          <strong className="text-white font-mono font-bold">{myVotesCount}</strong> de{' '}
          <strong className="text-zinc-200 font-mono">{quota}</strong> inclusas
        </span>
      );
    }

    if (gallery.excessPolicy === 'block') {
      const isFull = myVotesCount >= quota;
      return (
        <span className="text-zinc-300">
          <strong className="text-white font-mono font-bold">{myVotesCount}</strong> de{' '}
          <strong className="text-zinc-200 font-mono">{quota}</strong> (Limite Fixo)
          {isFull ? (
            <span className="text-red-400 font-semibold ml-1.5">(Cota Máxima Atingida)</span>
          ) : (
            <span className="text-zinc-400 text-xs ml-1.5">({quota - myVotesCount} restantes)</span>
          )}
        </span>
      );
    }

    return (
      <span className="text-zinc-300">
        <strong className="text-white font-mono font-bold">{myVotesCount}</strong> de{' '}
        <strong className="text-zinc-200 font-mono">{quota}</strong> selecionadas
      </span>
    );
  };

  return (
    <div className="sticky top-16 z-30 w-full bg-[#0A0714]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      {/* Top Banner: Current Participant Identity */}
      <div className="bg-gradient-to-r from-[#8300E9]/20 via-[#140F24] to-[#0A0714] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#8300E9] text-white border border-[#46BDC6]/50 font-bold flex items-center justify-center text-[11px] shrink-0">
              {currentVoter?.name ? currentVoter.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-zinc-200 truncate">
              Votando como: <strong className="text-[#46BDC6] font-semibold">{currentVoter?.name || 'Participante'}</strong>
              {currentVoter?.isDecisionMaker && (
                <span className="ml-2 text-[10px] bg-[#FDBD00] text-[#160F29] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                  Tomador Principal
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {myVotesCount > 0 && onResetMyVotes && (
              <button
                type="button"
                onClick={onResetMyVotes}
                className="flex items-center text-[11px] text-red-400/90 hover:text-red-300 transition-colors font-medium hover:underline"
                title="Zerar todos os seus votos nesta galeria"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Zerar meus votos ({myVotesCount})
              </button>
            )}
            <button
              type="button"
              onClick={onChangeVoter}
              className="flex items-center text-[11px] text-zinc-400 hover:text-[#46BDC6] transition-colors font-medium hover:underline"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Alternar participante
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Main Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Gallery Title & Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-lg sm:text-xl font-extrabold text-white truncate">
                {gallery.title}
              </h1>
              {isSubmitted && (
                <Badge variant="success" size="sm" className="gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Seleção Finalizada</span>
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Cliente: <strong className="text-zinc-200">{gallery.clientName}</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#46BDC6] font-semibold">
                🎯 {consensusCount} em consenso ({threshold}+ votos)
              </span>
            </div>
          </div>

          {/* Right Status & 1-Click Finalize CTA */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            <div className="text-left md:text-right text-xs">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold">
                Sua Votação
              </div>
              <div className="text-xs sm:text-sm mt-0.5">
                {renderStatusText()}
              </div>
            </div>

            {!currentVoter?.hasFinalized ? (
              <Button
                variant="primary"
                size="md"
                onClick={onOpenFinalizeModal}
                disabled={myVotesCount === 0}
                className="shadow-lg shadow-[#8300E9]/30 whitespace-nowrap font-bold"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Finalizar Seleção</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-black/30 text-white font-mono font-extrabold text-xs">
                  {myVotesCount}
                </span>
              </Button>
            ) : (
              <Button
                variant="cyan"
                size="md"
                onClick={onOpenFinalizeModal}
                className="text-xs font-bold"
              >
                <Check className="w-4 h-4" />
                <span>Seleção Concluída</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-[#140F24] rounded-full overflow-hidden flex border border-white/10">
            <div
              className={`h-full transition-all duration-300 ${
                extraCount > 0
                  ? 'bg-[#F94713]'
                  : myVotesCount === quota
                  ? 'bg-[#46BDC6]'
                  : 'bg-gradient-to-r from-[#8300E9] to-[#46BDC6]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#8300E9] text-white font-bold shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Todas ({gallery.photos.length})
            </button>

            <button
              onClick={() => onFilterChange('my_choices')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'my_choices'
                  ? 'bg-[#46BDC6] text-[#160F29] font-extrabold shadow-md shadow-[#46BDC6]/30 border border-[#46BDC6]'
                  : 'text-zinc-400 hover:text-[#46BDC6] hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Minhas Escolhas ({myVotesCount})</span>
            </button>

            <button
              onClick={() => onFilterChange('consensus')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'consensus'
                  ? 'bg-[#FDBD00] text-[#160F29] font-extrabold shadow-md shadow-[#FDBD00]/30 border border-[#FDBD00]'
                  : 'text-zinc-400 hover:text-[#FDBD00] hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consenso ({consensusCount})</span>
            </button>

            {commentsCount > 0 && (
              <button
                onClick={() => onFilterChange('commented')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'commented'
                    ? 'bg-[#F94713] text-white font-bold shadow-md shadow-[#F94713]/30'
                    : 'text-zinc-400 hover:text-[#F94713] hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>Comentadas ({commentsCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
