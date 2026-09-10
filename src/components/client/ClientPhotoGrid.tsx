import React from 'react';
import { Gallery, Photo, GalleryVoter, PhotoVote } from '../../types';
import { Watermark } from '../common/Watermark';
import { SafeImage } from '../common/SafeImage';
import { PhotoTechnicalDetails } from '../common/PhotoTechnicalDetails';
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
      <div className="text-center py-20 px-4 rounded-2xl border border-brand-dark/40 bg-walnut-800/40 max-w-xl mx-auto my-12">
        <Heart className="w-12 h-12 mx-auto text-walnut-500 mb-3" />
        <h3 className="text-lg font-semibold text-walnut-100">Nenhuma foto para exibir</h3>
        <p className="text-sm text-walnut-400 mt-1">
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
            className={`group relative rounded-2xl overflow-hidden bg-walnut-900 border transition-all duration-300 flex flex-col justify-between ${
              isConsensus
                ? 'border-brand-accent shadow-xl shadow-[#FEF600]/10 ring-2 ring-brand-accent/60'
                : hasVoted
                ? 'border-brand-emerald shadow-lg shadow-[#4CB963]/20 ring-1 ring-brand-emerald/40'
                : 'border-brand-dark/40 hover:border-brand-primary/60 shadow-lg shadow-black/40'
            }`}
          >
            {/* Image Container with Watermark and Anti-Copy */}
            <div className="relative aspect-4/3 sm:aspect-3/2 bg-walnut-950 overflow-hidden select-none">
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
                text={gallery.watermarkText || 'PROVA • IZY LUMNA STUDIO'}
                position={gallery.watermarkPosition}
                opacity={gallery.watermarkOpacity}
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
                    className="font-extrabold shadow-lg backdrop-blur-md bg-brand-accent text-brand-dark border-brand-dark/30 gap-1 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>CONSENSO ({photoVotes.length} Votos)</span>
                  </Badge>
                )}

                {!isConsensus && photoVotes.length > 0 && (
                  <Badge
                    variant="success"
                    size="sm"
                    className="font-mono font-bold shadow-lg backdrop-blur-md bg-brand-emerald text-white border-brand-emerald/60 gap-1"
                  >
                    <Heart className="w-3 h-3 fill-current" />
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
                      ? 'bg-brand-emerald text-white shadow-[#4CB963]/40 ring-2 ring-white/70'
                      : 'bg-walnut-950/70 text-white/80 hover:text-white hover:bg-walnut-900 border border-white/20'
                  }`}
                  aria-label={hasVoted ? 'Remover voto' : 'Votar nesta foto'}
                  title={hasVoted ? 'Remover seu voto' : 'Votar nesta foto'}
                >
                  <Heart className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom Actions Row (EXIF details, Comment, and Fullscreen Lightbox) */}
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <PhotoTechnicalDetails metadata={photo.metadata} />
                {/* Comment button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCommentModal(photo);
                  }}
                  className={`p-2 rounded-full backdrop-blur-md transition-all relative ${
                    photoComments.length > 0
                      ? 'bg-brand-ochre text-white shadow-md shadow-brand-ochre/30'
                      : 'bg-walnut-950/70 text-white/80 hover:text-white hover:bg-walnut-900 border border-white/20'
                  }`}
                  title={photoComments.length > 0 ? 'Ver observações da foto' : 'Adicionar comentário'}
                >
                  <MessageSquare className={`w-4 h-4 ${photoComments.length > 0 ? 'fill-current' : ''}`} />
                  {photoComments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-ochre text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
                  className="p-2 rounded-full bg-walnut-950/70 text-white/80 hover:text-white hover:bg-walnut-900 backdrop-blur-md border border-white/20 transition-all"
                  title="Ver em tela cheia (Zoom)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Footer: Filename, Voter Chips, & Comments preview */}
            <div className="p-3 bg-walnut-900 border-t border-brand-dark/40 flex flex-col justify-between gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-walnut-400 truncate max-w-[150px] text-[11px]">
                  {photo.originalFileName}
                </span>

                {/* Voters List Badges */}
                {photoVotes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-walnut-400" />
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {photoVotes.map((v, i) => (
                        <div
                          key={v.voterId || i}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary text-white border border-brand-emerald/40 font-bold text-[9px] shadow-xs"
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
                  className="mt-1 p-2 rounded-lg bg-walnut-950/60 border border-brand-ochre/30 text-walnut-200 text-[11px] leading-snug cursor-pointer hover:bg-walnut-950 transition-colors space-y-1"
                >
                  <span className="font-semibold text-brand-ochre block text-[9px] uppercase tracking-wider">
                    {photoComments.length} {photoComments.length === 1 ? 'Comentário:' : 'Comentários:'}
                  </span>
                  <p className="line-clamp-2 italic text-walnut-300">
                    <strong className="text-brand-ochre font-semibold">{photoComments[photoComments.length - 1].voterName}:</strong> &ldquo;{photoComments[photoComments.length - 1].text}&rdquo;
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
