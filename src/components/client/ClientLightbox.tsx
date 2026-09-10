import React, { useEffect } from 'react';
import { Gallery, Photo, GalleryVoter, PhotoVote, PhotoCommentItem } from '../../types';
import { Watermark } from '../common/Watermark';
import { SafeImage } from '../common/SafeImage';
import { PhotoTechnicalDetails } from '../common/PhotoTechnicalDetails';
import { X, ChevronLeft, ChevronRight, Heart, MessageSquare, Sparkles, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface ClientLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  photos: Photo[];
  gallery: Gallery;
  currentVoter: GalleryVoter | null;
  isSubmitted: boolean;
  onNavigate: (index: number) => void;
  onToggleSelect: (photo: Photo) => void;
  onOpenCommentModal: (photo: Photo) => void;
}

export const ClientLightbox: React.FC<ClientLightboxProps> = ({
  isOpen,
  onClose,
  currentIndex,
  photos,
  gallery,
  currentVoter,
  isSubmitted,
  onNavigate,
  onToggleSelect,
  onOpenCommentModal
}) => {
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % photos.length);
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + photos.length) % photos.length);
      if (e.key === ' ') {
        e.preventDefault();
        if (currentPhoto && !isSubmitted) onToggleSelect(currentPhoto);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, currentPhoto, isSubmitted, onClose, onNavigate, onToggleSelect]);

  if (!isOpen || !currentPhoto) return null;

  const threshold = gallery.consensusThreshold || 2;
  const votesMap = gallery.clientSelection.votes || {};
  const photoVotes: PhotoVote[] = currentPhoto.votes?.length
    ? currentPhoto.votes
    : votesMap[currentPhoto.id] || [];

  const hasVoted = photoVotes.some((v) => v.voterId === currentVoter?.id);
  const isConsensus = photoVotes.length >= threshold;

  const commentsMap = gallery.clientSelection.commentsMap || {};
  const photoComments: PhotoCommentItem[] = currentPhoto.commentsList?.length
    ? currentPhoto.commentsList
    : commentsMap[currentPhoto.id] || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-walnut-950/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-4 sm:p-6 z-30 bg-gradient-to-b from-walnut-950 to-transparent">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm text-walnut-200 bg-walnut-800/80 px-3 py-1 rounded-full border border-brand-dark/40">
            Foto {currentIndex + 1} de {photos.length}
          </span>
          <span className="font-mono text-xs text-walnut-400 hidden sm:inline-block">
            {currentPhoto.originalFileName}
          </span>
          {isConsensus && (
            <Badge variant="amber" size="sm" className="gap-1 animate-pulse font-extrabold bg-brand-accent text-brand-dark">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Consenso ({photoVotes.length} Votos)</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Photo EXIF Technical Details */}
          <PhotoTechnicalDetails metadata={currentPhoto.metadata} />

          {/* Add comment button */}
          <Button
            variant={photoComments.length > 0 ? 'ochre' : 'outline'}
            size="sm"
            onClick={() => onOpenCommentModal(currentPhoto)}
            className="text-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            <span>{photoComments.length > 0 ? `Comentários (${photoComments.length})` : 'Adicionar Comentário'}</span>
          </Button>

          {/* Close Lightbox */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-walnut-800 hover:bg-walnut-700 text-walnut-100 transition-colors"
            aria-label="Fechar visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Area with Previous/Next controls */}
      <div className="relative flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        {/* Previous button */}
        <button
          onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}
          className="absolute left-4 z-30 p-3 rounded-full bg-walnut-900/80 hover:bg-walnut-800 text-walnut-100 border border-brand-dark/50 transition-all active:scale-95 shadow-lg"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* The Photo Container with Watermark */}
        <div className="relative max-h-full max-w-full flex items-center justify-center">
          <SafeImage
            src={currentPhoto.url}
            alt={currentPhoto.caption || currentPhoto.originalFileName}
            fallbackText={currentPhoto.originalFileName}
            draggable={false}
            className="max-h-[72vh] sm:max-h-[78vh] max-w-[90vw] object-contain rounded-lg shadow-2xl protected-photo pointer-events-none"
          />

          {/* Watermark overlay */}
          <Watermark
            enabled={gallery.watermarkEnabled}
            text={gallery.watermarkText || 'PROVA • IZY LUMNA STUDIO'}
            position={gallery.watermarkPosition}
            opacity={gallery.watermarkOpacity}
          />
        </div>

        {/* Next button */}
        <button
          onClick={() => onNavigate((currentIndex + 1) % photos.length)}
          className="absolute right-4 z-30 p-3 rounded-full bg-walnut-900/80 hover:bg-walnut-800 text-walnut-100 border border-brand-dark/50 transition-all active:scale-95 shadow-lg"
          aria-label="Próxima foto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-walnut-950 via-walnut-900 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 z-30 border-t border-brand-dark/50">
        <div className="text-center sm:text-left space-y-1">
          {photoVotes.length > 0 ? (
            <div className="flex items-center gap-2 text-xs text-brand-emerald font-medium justify-center sm:justify-start">
              <Users className="w-4 h-4 text-brand-emerald" />
              <span>
                Votado por:{' '}
                <strong className="text-walnut-100 font-semibold">
                  {photoVotes.map((v) => v.voterName).join(', ')}
                </strong>
              </span>
            </div>
          ) : (
            <p className="text-xs text-walnut-400">Nenhum voto registrado nesta foto ainda.</p>
          )}

          {photoComments.length > 0 && (
            <p className="text-xs text-brand-ochre italic">
              Última observação: &ldquo;{photoComments[photoComments.length - 1].text}&rdquo; ({photoComments[photoComments.length - 1].voterName})
            </p>
          )}
        </div>

        {/* Favorite / Vote Toggle in Lightbox */}
        <div className="flex items-center gap-3">
          <Button
            variant={hasVoted ? 'emerald' : 'outline'}
            size="lg"
            disabled={isSubmitted}
            onClick={() => onToggleSelect(currentPhoto)}
            className="text-sm px-6 font-semibold shadow-lg"
          >
            <Heart className={`w-5 h-5 mr-2 ${hasVoted ? 'fill-current' : ''}`} />
            <span>{hasVoted ? 'Voto Registrado (Remover)' : 'Votar Nesta Foto'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
