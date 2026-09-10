import React from 'react';
import { Gallery, Photo, GalleryVoter, PhotoVote } from '../../types';
import { Watermark } from '../common/Watermark';
import { SafeImage } from '../common/SafeImage';
import { Heart, Maximize2, MessageSquare, Sparkles, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface ClientPhotoGridProps {
  gallery: Gallery;
  photos: Photo[];
  currentVoter: GalleryVoter | null;
  isSubmitted: boolean;
  onToggleSelect: (photo: Photo) => void;
  onOpenLightbox: (index: number) => void;
  onOpenCommentModal: (photo: Photo) => void;
}

export const ClientPhotoGrid: React.FC<ClientPhotoGridProps> = ({
  gallery,
  photos,
  currentVoter,
  isSubmitted,
  onToggleSelect,
  onOpenLightbox,
  onOpenCommentModal
}) => {
  const threshold = gallery.consensusThreshold || 2;
  const votesMap = gallery.clientSelection.votes || {};
  const commentsMap = gallery.clientSelection.commentsMap || {};

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 px-4 rounded-2xl border border-zinc-850 bg-zinc-900/30 max-w-xl mx-auto my-12">
        <Heart className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
        <h3 className="text-lg font-semibold text-zinc-200">Nenhuma foto para exibir</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Nenhuma fotografia encontrada para o filtro atual. Mude o filtro no menu superior para visualizar o ensaio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {photos.map((photo, index) => {
        const photoVotes: PhotoVote[] = photo.votes?.length
          ? photo.votes
          : votesMap[photo.id] || [];

        const hasVoted = photoVotes.some((v) => v.voterId === currentVoter?.id);
        const isConsensus = photoVotes.length >= threshold;
        const photoComments = photo.commentsList?.length
          ? photo.commentsList
          : commentsMap[photo.id] || [];

        return (
          <div
            key={photo.id}
            onContextMenu={(e) => e.preventDefault()}
            className={`group relative rounded-2xl overflow-hidden bg-zinc-950 border transition-all duration-300 flex flex-col justify-between ${
              isConsensus
                ? 'border-amber-400 shadow-xl shadow-amber-500/20 ring-1 ring-amber-400/50'
                : hasVoted
                ? 'border-amber-500/80 shadow-lg shadow-amber-500/10'
                : 'border-zinc-850 hover:border-zinc-700 shadow-lg shadow-black/40'
            }`}
          >
            {/* Image Container with Watermark and Anti-Copy */}
            <div className="relative aspect-4/3 sm:aspect-3/2 bg-zinc-900 overflow-hidden select-none">
              <SafeImage
                src={photo.url}
                alt={photo.caption || photo.originalFileName}
                fallbackText={photo.originalFileName}
                loading="lazy"
                draggable={false}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 protected-photo select-none pointer-events-none ${
                  hasVoted ? 'brightness-105' : 'brightness-95 group-hover:brightness-100'
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

              {/* Top Left: Badges for Consensus & Votes count */}
              <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none">
                {isConsensus && (
                  <Badge
                    variant="amber"
                    size="sm"
                    className="font-semibold shadow-lg backdrop-blur-md bg-amber-500 text-zinc-950 border-amber-300 gap-1 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>CONSENSO ({photoVotes.length} Votos)</span>
                  </Badge>
                )}

                {!isConsensus && photoVotes.length > 0 && (
                  <Badge
                    variant="default"
                    size="sm"
                    className="font-mono font-bold shadow-lg backdrop-blur-md bg-black/80 border-amber-500/40 text-amber-300 gap-1"
                  >
                    <Heart className="w-3 h-3 fill-current text-amber-400" />
                    <span>{photoVotes.length} {photoVotes.length === 1 ? 'voto' : 'votos'}</span>
                  </Badge>
                )}
              </div>

              {/* Top Right: Heart Vote Button for Current Participant */}
              <div className="absolute top-3 right-3 z-30">
                <button
                  type="button"
                  disabled={isSubmitted}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(photo);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-md active:scale-90 ${
                    hasVoted
                      ? 'bg-amber-500 text-zinc-950 shadow-amber-500/40 ring-2 ring-white/60'
                      : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20'
                  }`}
                  aria-label={hasVoted ? 'Remover voto' : 'Votar nesta foto'}
                  title={hasVoted ? 'Remover seu voto' : 'Votar nesta foto'}
                >
                  <Heart className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
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
                  className={`p-2 rounded-full backdrop-blur-md transition-all relative ${
                    photoComments.length > 0
                      ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/30'
                      : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20'
                  }`}
                  title={photoComments.length > 0 ? 'Ver observações da foto' : 'Adicionar comentário'}
                >
                  <MessageSquare className={`w-4 h-4 ${photoComments.length > 0 ? 'fill-current' : ''}`} />
                  {photoComments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sky-400 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {photoComments.length}
                    </span>
                  )}
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

            {/* Photo Footer: Filename, Voter Chips, & Comments preview */}
            <div className="p-3 bg-zinc-950/90 border-t border-zinc-850 flex flex-col justify-between gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-zinc-400 truncate max-w-[150px] text-[11px]">
                  {photo.originalFileName}
                </span>

                {/* Voters List Badges */}
                {photoVotes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-zinc-500" />
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {photoVotes.map((v, i) => (
                        <div
                          key={v.voterId || i}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[9px] shadow-sm"
                          title={`Votado por: ${v.voterName}`}
                        >
                          {v.voterName.slice(0, 1).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Display recent comments */}
              {photoComments.length > 0 && (
                <div
                  onClick={() => onOpenCommentModal(photo)}
                  className="mt-1 p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-200 text-[11px] leading-snug cursor-pointer hover:bg-sky-950/50 transition-colors space-y-1"
                >
                  <span className="font-semibold text-sky-400 block text-[9px] uppercase tracking-wider">
                    {photoComments.length} {photoComments.length === 1 ? 'Comentário:' : 'Comentários:'}
                  </span>
                  <p className="line-clamp-2 italic text-zinc-300">
                    <strong className="text-sky-300 font-semibold">{photoComments[photoComments.length - 1].voterName}:</strong> &ldquo;{photoComments[photoComments.length - 1].text}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
