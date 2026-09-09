import React from 'react';
import { Gallery, Photo } from '../../types';
import { Watermark } from '../common/Watermark';
import { Heart, Maximize2, MessageSquare, Check, Sparkles, DollarSign, Ban } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface ClientPhotoGridProps {
  gallery: Gallery;
  photos: Photo[];
  selectedIds: string[];
  comments: Record<string, string>;
  isSubmitted: boolean;
  onToggleSelect: (photo: Photo) => void;
  onOpenLightbox: (index: number) => void;
  onOpenCommentModal: (photo: Photo) => void;
}

export const ClientPhotoGrid: React.FC<ClientPhotoGridProps> = ({
  gallery,
  photos,
  selectedIds,
  comments,
  isSubmitted,
  onToggleSelect,
  onOpenLightbox,
  onOpenCommentModal
}) => {
  const selectedSet = new Set(selectedIds);
  const quota = gallery.quotaIncluded;

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 px-4 rounded-2xl border border-zinc-850 bg-zinc-900/30 max-w-xl mx-auto my-12">
        <Heart className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <h3 className="text-lg font-semibold text-zinc-200">Nenhuma foto para exibir</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Nenhuma fotografia encontrada para o filtro atual. Mude o filtro para visualizar todo o ensaio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {photos.map((photo, index) => {
        const isSelected = selectedSet.has(photo.id);
        const selectionIndex = selectedIds.indexOf(photo.id);
        const isExtra = isSelected && selectionIndex >= quota;
        const comment = comments[photo.id];

        return (
          <div
            key={photo.id}
            onContextMenu={(e) => e.preventDefault()}
            className={`group relative rounded-2xl overflow-hidden bg-zinc-950 border transition-all duration-300 flex flex-col justify-between ${
              isSelected
                ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/50'
                : 'border-zinc-850 hover:border-zinc-700 shadow-lg shadow-black/40'
            }`}
          >
            {/* Image Container with Watermark and Anti-Copy */}
            <div className="relative aspect-4/3 sm:aspect-3/2 bg-zinc-900 overflow-hidden select-none">
              <img
                src={photo.url}
                alt={photo.caption || photo.originalFileName}
                loading="lazy"
                draggable={false}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 protected-photo select-none pointer-events-none ${
                  isSelected ? 'brightness-105' : 'brightness-95 group-hover:brightness-100'
                }`}
              />

              {/* Watermark Overlay */}
              <Watermark
                enabled={gallery.watermarkEnabled}
                text={gallery.watermarkText || 'PROVA • LUMINA STUDIO'}
              />

              {/* Anti-download Transparent Click Guard Shield */}
              <div
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={() => !isSubmitted && onToggleSelect(photo)}
                onDoubleClick={() => onOpenLightbox(index)}
              />

              {/* Top Left: Order Badge (#1, #2, etc.) and Extra Badge */}
              <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
                {isSelected && (
                  <Badge
                    variant={isExtra ? 'amber' : 'default'}
                    size="sm"
                    className="font-mono font-bold shadow-lg backdrop-blur-md bg-black/80 border-amber-400/40 text-amber-300"
                  >
                    {isExtra ? `+ EXTRA #${selectionIndex + 1}` : `#${selectionIndex + 1}`}
                  </Badge>
                )}
              </div>

              {/* Top Right: Selection Heart / Check Button */}
              <div className="absolute top-3 right-3 z-30">
                <button
                  type="button"
                  disabled={isSubmitted}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(photo);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-md active:scale-90 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-amber-500/40 ring-2 ring-white/60'
                      : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20'
                  }`}
                  aria-label={isSelected ? 'Desmarcar foto' : 'Selecionar foto'}
                >
                  <Heart className={`w-5 h-5 ${isSelected ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom Actions Row (Comment and Fullscreen Lightbox) */}
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                {/* Comment button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCommentModal(photo);
                  }}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    comment
                      ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/30'
                      : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20'
                  }`}
                  title={comment ? 'Editar observação' : 'Adicionar comentário nesta foto'}
                >
                  <MessageSquare className={`w-4 h-4 ${comment ? 'fill-current' : ''}`} />
                </button>

                {/* Lightbox button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox(index);
                  }}
                  className="p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md border border-white/20 transition-all"
                  title="Ver em tela cheia (Zoom)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Footer: Filename & Comment preview */}
            <div className="p-3 bg-zinc-950/90 border-t border-zinc-850 flex flex-col justify-between gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-zinc-400 truncate max-w-[170px] text-[11px]">
                  {photo.originalFileName}
                </span>

                {isExtra && gallery.excessPolicy === 'charge' && (
                  <span className="text-[11px] font-mono text-amber-400 font-semibold">
                    +R$ {gallery.extraPhotoPrice.toFixed(2)}
                  </span>
                )}
                {isExtra && gallery.excessPolicy === 'free_approval' && (
                  <span className="text-[10px] uppercase font-mono text-sky-400 font-semibold">
                    Extra Cortesia
                  </span>
                )}
              </div>

              {photo.caption && (
                <p className="text-zinc-500 text-[11px] truncate">{photo.caption}</p>
              )}

              {/* Comment Bubble display */}
              {comment && (
                <div
                  onClick={() => onOpenCommentModal(photo)}
                  className="mt-1 p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-200 text-[11px] leading-snug cursor-pointer hover:bg-sky-950/50 transition-colors"
                >
                  <span className="font-semibold text-sky-400 block text-[9px] uppercase tracking-wider">
                    Sua observação:
                  </span>
                  <p className="line-clamp-2 italic">&ldquo;{comment}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
