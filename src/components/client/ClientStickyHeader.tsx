import React from 'react';
import { Gallery } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Heart, CheckCheck, MessageSquare, Check, Sparkles, DollarSign, Lock } from 'lucide-react';

export interface ClientStickyHeaderProps {
  gallery: Gallery;
  selectedIds: string[];
  commentsCount: number;
  activeFilter: 'all' | 'selected' | 'commented';
  onFilterChange: (filter: 'all' | 'selected' | 'commented') => void;
  onOpenFinalizeModal: () => void;
  isSubmitted: boolean;
}

export const ClientStickyHeader: React.FC<ClientStickyHeaderProps> = ({
  gallery,
  selectedIds,
  commentsCount,
  activeFilter,
  onFilterChange,
  onOpenFinalizeModal,
  isSubmitted
}) => {
  const totalSelected = selectedIds.length;
  const quota = gallery.quotaIncluded;
  const extraCount = Math.max(0, totalSelected - quota);
  const extraTotal = extraCount * gallery.extraPhotoPrice;

  // Percentage for the progress bar
  const progressPercent = quota > 0 ? Math.min(100, Math.round((totalSelected / quota) * 100)) : 0;

  // Status text computation based on policy and current count
  const renderStatusText = () => {
    if (gallery.excessPolicy === 'charge') {
      if (extraCount > 0) {
        return (
          <span className="text-amber-300 font-medium">
            <strong className="text-white font-mono">{totalSelected} selecionadas</strong> — {quota} no pacote +{' '}
            <strong className="text-amber-400 font-mono">{extraCount} extras</strong>{' '}
            <span className="text-amber-400 font-semibold">(+ R$ {extraTotal.toFixed(2)})</span>
          </span>
        );
      }
      return (
        <span className="text-zinc-300">
          <strong className="text-white font-mono">{totalSelected}</strong> de{' '}
          <strong className="text-zinc-200 font-mono">{quota}</strong> selecionadas
          {totalSelected === quota && <span className="text-emerald-400 font-medium ml-1.5">(Cota completa!)</span>}
        </span>
      );
    }

    if (gallery.excessPolicy === 'free_approval') {
      if (extraCount > 0) {
        return (
          <span className="text-sky-300 font-medium">
            <strong className="text-white font-mono">{totalSelected} selecionadas</strong> — {quota} no pacote +{' '}
            <strong className="text-sky-400 font-mono">{extraCount} extras autorizadas</strong>{' '}
            <span className="text-sky-400 text-xs">(sem custo)</span>
          </span>
        );
      }
      return (
        <span className="text-zinc-300">
          <strong className="text-white font-mono">{totalSelected}</strong> de{' '}
          <strong className="text-zinc-200 font-mono">{quota}</strong> selecionadas
        </span>
      );
    }

    // Default: 'block' (Rigid limit)
    return (
      <span className="text-zinc-300">
        <strong className="text-white font-mono">{totalSelected}</strong> de{' '}
        <strong className="text-zinc-200 font-mono">{quota}</strong> selecionadas
        {totalSelected >= quota ? (
          <span className="text-amber-400 font-medium ml-1.5">(Limite máximo atingido)</span>
        ) : (
          <span className="text-zinc-400 ml-1.5">({quota - totalSelected} restantes)</span>
        )}
      </span>
    );
  };

  return (
    <div className="sticky top-16 z-30 w-full bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/90 shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        {/* Main Flex Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Gallery Title & Photographer Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-zinc-100 truncate">
                {gallery.title}
              </h1>
              {isSubmitted && (
                <Badge variant="success" size="sm" className="gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Seleção Enviada</span>
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Cliente: <strong className="text-zinc-200">{gallery.clientName}</strong></span>
              <span className="text-zinc-600">•</span>
              <span>{gallery.photos.length} fotos disponíveis para escolha</span>
            </div>
          </div>

          {/* Right Area: Status text + Finalize Button */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            {/* Dynamic Status Counter */}
            <div className="text-left md:text-right text-xs">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                Seu Pacote
              </div>
              <div className="text-xs sm:text-sm mt-0.5">
                {renderStatusText()}
              </div>
            </div>

            {/* Finalize Button */}
            {!isSubmitted ? (
              <Button
                variant="amber"
                size="md"
                onClick={onOpenFinalizeModal}
                disabled={totalSelected === 0}
                className="shadow-lg shadow-amber-500/20 whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Finalizar Aprovação</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/30 text-zinc-950 font-mono font-bold text-xs">
                  {totalSelected}
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenFinalizeModal}
                className="text-xs border-emerald-500/30 text-emerald-300"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Revisar Seleção</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar with Excess Visual Indicator */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                extraCount > 0
                  ? 'bg-amber-400'
                  : totalSelected === quota
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-zinc-300 to-amber-400'
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
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todas as fotos ({gallery.photos.length})
            </button>

            <button
              onClick={() => onFilterChange('selected')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'selected'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Apenas Selecionadas ({totalSelected})</span>
            </button>

            {commentsCount > 0 && (
              <button
                onClick={() => onFilterChange('commented')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'commented'
                    ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>Com comentários ({commentsCount})</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 hidden sm:block">
            {gallery.excessPolicy === 'block' && 'Toque na foto para favoritar até o limite.'}
            {gallery.excessPolicy === 'charge' && `Extras liberadas a R$ ${gallery.extraPhotoPrice.toFixed(2)} cada.`}
            {gallery.excessPolicy === 'free_approval' && 'Selecione todas as fotos que deseja receber tratadas.'}
          </div>
        </div>
      </div>
    </div>
  );
};
