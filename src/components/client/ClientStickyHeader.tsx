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
  isSubmitted
}) => {
  const quota = gallery.quotaIncluded;
  const threshold = gallery.consensusThreshold || 2;
  const extraCount = Math.max(0, myVotesCount - quota);
  const extraTotal = extraCount * gallery.extraPhotoPrice;

  // Percentage for progress bar based on current voter's choices
  const progressPercent = quota > 0 ? Math.min(100, Math.round((myVotesCount / quota) * 100)) : 0;

  const renderStatusText = () => {
    if (gallery.excessPolicy === 'charge') {
      if (extraCount > 0) {
        return (
          <span className="text-brand-ochre font-medium">
            <strong className="text-walnut-100 font-mono">{myVotesCount} votos por você</strong> — {quota} no pacote +{' '}
            <strong className="text-brand-ochre font-mono">{extraCount} extras</strong>{' '}
            <span className="text-brand-ochre font-bold">(+ R$ {extraTotal.toFixed(2)})</span>
          </span>
        );
      }
      return (
        <span className="text-walnut-300">
          <strong className="text-walnut-100 font-mono">{myVotesCount}</strong> de{' '}
          <strong className="text-walnut-200 font-mono">{quota}</strong> inclusas no pacote
          {myVotesCount === quota && <span className="text-brand-emerald font-semibold ml-1.5">(Cota atingida)</span>}
        </span>
      );
    }

    if (gallery.excessPolicy === 'free_approval') {
      if (extraCount > 0) {
        return (
          <span className="text-brand-primary font-medium">
            <strong className="text-walnut-100 font-mono">{myVotesCount} votos por você</strong> ({extraCount} além da cota)
          </span>
        );
      }
      return (
        <span className="text-walnut-300">
          <strong className="text-walnut-100 font-mono">{myVotesCount}</strong> de{' '}
          <strong className="text-walnut-200 font-mono">{quota}</strong> inclusas
        </span>
      );
    }

    if (gallery.excessPolicy === 'block') {
      const isFull = myVotesCount >= quota;
      return (
        <span className="text-walnut-300">
          <strong className="text-walnut-100 font-mono">{myVotesCount}</strong> de{' '}
          <strong className="text-walnut-200 font-mono">{quota}</strong> inclusas (Limite Fixo)
          {isFull ? (
            <span className="text-red-400 font-semibold ml-1.5">(Cota Máxima Atingida)</span>
          ) : (
            <span className="text-walnut-400 text-xs ml-1.5">({quota - myVotesCount} restantes)</span>
          )}
        </span>
      );
    }

    return (
      <span className="text-walnut-300">
        <strong className="text-walnut-100 font-mono">{myVotesCount}</strong> de{' '}
        <strong className="text-walnut-200 font-mono">{quota}</strong> selecionadas
      </span>
    );
  };

  return (
    <div className="sticky top-16 z-30 w-full bg-walnut-900/95 backdrop-blur-xl border-b border-brand-dark/50 shadow-xl shadow-black/50">
      {/* Top Banner: Current Participant Identity */}
      <div className="bg-gradient-to-r from-brand-primary/20 via-walnut-800 to-walnut-900 border-b border-brand-primary/30 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-brand-primary text-white border border-brand-emerald/40 font-bold flex items-center justify-center text-[11px] shrink-0">
              {currentVoter?.name ? currentVoter.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-walnut-200 truncate">
              Votando como: <strong className="text-brand-emerald font-semibold">{currentVoter?.name || 'Participante'}</strong>
              {currentVoter?.isDecisionMaker && (
                <span className="ml-1.5 text-[10px] bg-brand-accent text-brand-dark font-extrabold px-1.5 py-0.5 rounded border border-[#4F3926]/30">
                  Tomador Principal
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onChangeVoter}
            className="flex items-center text-[11px] text-walnut-400 hover:text-brand-emerald transition-colors shrink-0 font-medium hover:underline"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Alternar participante
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Main Flex Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Gallery Title & Photographer Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-walnut-100 truncate">
                {gallery.title}
              </h1>
              {isSubmitted && (
                <Badge variant="success" size="sm" className="gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Seleção Finalizada</span>
                </Badge>
              )}
            </div>
            <div className="text-xs text-walnut-400 mt-0.5 flex items-center gap-2">
              <span>Cliente: <strong className="text-walnut-200">{gallery.clientName}</strong></span>
              <span className="text-walnut-600">•</span>
              <span className="text-brand-emerald font-medium">
                🎯 {consensusCount} fotos em consenso ({threshold}+ votos)
              </span>
            </div>
          </div>

          {/* Right Area: Status text + Finalize Button */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            <div className="text-left md:text-right text-xs">
              <div className="text-[11px] uppercase tracking-wider text-walnut-400 font-mono">
                Sua Votação
              </div>
              <div className="text-xs sm:text-sm mt-0.5">
                {renderStatusText()}
              </div>
            </div>

            {/* Finalize Button - Primary Turf Green CTA */}
            {!currentVoter?.hasFinalized ? (
              <Button
                variant="primary"
                size="md"
                onClick={onOpenFinalizeModal}
                disabled={myVotesCount === 0}
                className="shadow-lg shadow-[#01743F]/25 whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Finalizar Minha Seleção</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/30 text-white font-mono font-bold text-xs">
                  {myVotesCount}
                </span>
              </Button>
            ) : (
              <Button
                variant="emerald"
                size="md"
                onClick={onOpenFinalizeModal}
                className="text-xs"
              >
                <Check className="w-4 h-4" />
                <span>Minha Seleção Finalizada</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar with Institutional Colors */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-walnut-800 rounded-full overflow-hidden flex border border-brand-dark/40">
            <div
              className={`h-full transition-all duration-300 ${
                extraCount > 0
                  ? 'bg-brand-ochre'
                  : myVotesCount === quota
                  ? 'bg-brand-emerald'
                  : 'bg-gradient-to-r from-brand-primary to-brand-emerald'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filters and Navigation Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-brand-primary text-white font-semibold shadow-sm'
                  : 'text-walnut-400 hover:text-walnut-100 hover:bg-walnut-800'
              }`}
            >
              Todas as fotos ({gallery.photos.length})
            </button>

            <button
              onClick={() => onFilterChange('my_choices')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'my_choices'
                  ? 'bg-brand-emerald text-white font-semibold shadow-sm'
                  : 'text-walnut-400 hover:text-brand-emerald hover:bg-walnut-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Minhas Escolhas ({myVotesCount})</span>
            </button>

            <button
              onClick={() => onFilterChange('consensus')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'consensus'
                  ? 'bg-brand-accent text-brand-dark font-extrabold shadow-sm border border-[#4F3926]/30'
                  : 'text-walnut-400 hover:text-brand-accent hover:bg-walnut-800'
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
                    ? 'bg-brand-ochre text-white font-semibold shadow-sm'
                    : 'text-walnut-400 hover:text-brand-ochre hover:bg-walnut-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>Com Comentários ({commentsCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
