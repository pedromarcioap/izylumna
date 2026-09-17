import React, { useEffect, useState } from 'react';
import { Gallery, Photo, GalleryVoter, PhotoVote, PhotoCommentItem } from '../../types';
import { Watermark } from '../common/Watermark';
import { SafeImage } from '../common/SafeImage';
import { PhotoTechnicalDetails } from '../common/PhotoTechnicalDetails';
import { StarRating } from '../common/StarRating';
import { X, ChevronLeft, ChevronRight, Heart, MessageSquare, Sparkles, Users, ZoomIn, ZoomOut, Check, XCircle } from 'lucide-react';
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
  onSetRating?: (photo: Photo, rating: number) => void;
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
  onOpenCommentModal,
  onSetRating
}) => {
  const currentPhoto = photos[currentIndex];
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset zoom state on photo change
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  const threshold = gallery.consensusThreshold || 2;
  const votesMap = gallery.clientSelection.votes || {};
  const photoVotes: PhotoVote[] = currentPhoto?.votes?.length
    ? currentPhoto.votes
    : votesMap[currentPhoto?.id || ''] || [];

  const hasVoted = photoVotes.some((v) => v.voterId === currentVoter?.id);
  const isConsensus = photoVotes.length >= threshold;

  const commentsMap = gallery.clientSelection.commentsMap || {};
  const photoComments: PhotoCommentItem[] = currentPhoto?.commentsList?.length
    ? currentPhoto.commentsList
    : commentsMap[currentPhoto?.id || ''] || [];

  // Hotkeys handling: 1-5 (stars), 0 (clear rating), P (pick photo), X (reject photo), Space (zoom toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !currentPhoto) return;

      // Ignore when typing inside input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setIsZoomed(false);
        onNavigate((currentIndex + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setIsZoomed(false);
        onNavigate((currentIndex - 1 + photos.length) % photos.length);
      } else if (e.key === ' ' || e.code === 'Space') {
        // Zoom hotkey: Espaço
        e.preventDefault();
        setIsZoomed((prev) => !prev);
      } else if ((e.key === 'p' || e.key === 'P') && !isSubmitted) {
        // Pick Photo hotkey: P
        e.preventDefault();
        if (!hasVoted) {
          onToggleSelect(currentPhoto);
        }
      } else if ((e.key === 'x' || e.key === 'X') && !isSubmitted) {
        // Reject Photo hotkey: X
        e.preventDefault();
        if (hasVoted) {
          onToggleSelect(currentPhoto);
        }
      } else if (/^[0-5]$/.test(e.key) && !isSubmitted && onSetRating) {
        // Rating hotkeys: 1 to 5 (and 0 to clear)
        e.preventDefault();
        onSetRating(currentPhoto, parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, currentPhoto, isSubmitted, hasVoted, onClose, onNavigate, onToggleSelect, onSetRating]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-walnut-950/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-4 sm:p-6 z-30 bg-gradient-to-b from-walnut-950 via-walnut-950/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm text-walnut-200 bg-walnut-800/80 px-3 py-1 rounded-full border border-brand-dark/40">
            Foto {currentIndex + 1} de {photos.length}
          </span>
          <span className="font-mono text-xs text-walnut-400 hidden sm:inline-block truncate max-w-[180px]">
            {currentPhoto.originalFileName}
          </span>
          {isConsensus && (
            <Badge variant="amber" size="sm" className="gap-1 animate-pulse font-extrabold bg-brand-accent text-brand-dark">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Consenso ({photoVotes.length} Votos)</span>
            </Badge>
          )}
        </div>

        {/* Center/Right Hotkeys Legend Banner */}
        <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-mono text-walnut-300 bg-walnut-900/90 px-3 py-1 rounded-xl border border-brand-dark/50 shadow-md">
          <span className="text-walnut-400 font-bold uppercase tracking-wider text-[9px]">Atalhos:</span>
          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">1-5</span>
          <span className="text-walnut-300">Estrelas</span>
          <span className="text-walnut-600">•</span>
          <span className="bg-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded font-bold">P</span>
          <span className="text-walnut-300">Pick</span>
          <span className="text-walnut-600">•</span>
          <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">X</span>
          <span className="text-walnut-300">Rejeitar</span>
          <span className="text-walnut-600">•</span>
          <span className="bg-white/20 text-white px-1.5 py-0.5 rounded font-bold">Espaço</span>
          <span className="text-walnut-300">Zoom</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Photo Star Rating in Lightbox Top Bar */}
          <div className="hidden md:flex items-center gap-2 bg-walnut-900/80 px-3 py-1.5 rounded-xl border border-brand-dark/50">
            <span className="text-xs text-walnut-400 font-medium">Nota (0-5):</span>
            <StarRating
              rating={currentPhoto.rating || 0}
              size="sm"
              readOnly={isSubmitted || !onSetRating}
              onChange={(newRating) => onSetRating && onSetRating(currentPhoto, newRating)}
              showLabel
            />
          </div>

          {/* Photo EXIF Technical Details */}
          <PhotoTechnicalDetails
            metadata={currentPhoto.metadata}
            photoSeed={currentPhoto.originalFileName || currentPhoto.id}
            variant="popover"
          />

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

      {/* Main Image Area with Previous/Next controls and Zoom Overlay */}
      <div className="relative flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        {/* Previous button */}
        <button
          onClick={() => {
            setIsZoomed(false);
            onNavigate((currentIndex - 1 + photos.length) % photos.length);
          }}
          className="absolute left-4 z-30 p-3 rounded-full bg-walnut-900/80 hover:bg-walnut-800 text-walnut-100 border border-brand-dark/50 transition-all active:scale-95 shadow-lg"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Floating Zoom Indicator Badge */}
        {isZoomed && (
          <div className="absolute top-4 z-40 px-4 py-1.5 rounded-full bg-walnut-950/90 border border-brand-cyan/70 text-brand-cyan text-xs font-mono font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in fade-in">
            <ZoomIn className="w-4 h-4 animate-pulse" />
            <span>ZOOM ATIVO (Pressione Espaço ou clique na foto para sair)</span>
          </div>
        )}

        {/* The Photo Container with Watermark and Interactive Zoom */}
        <div
          onClick={() => setIsZoomed((prev) => !prev)}
          className={`relative max-h-full max-w-full flex items-center justify-center transition-all duration-300 ${
            isZoomed
              ? 'cursor-zoom-out overflow-auto max-h-[85vh] max-w-[95vw]'
              : 'cursor-zoom-in'
          }`}
          title={isZoomed ? 'Clique para reduzir (Sair do Zoom)' : 'Clique ou pressione Espaço para Zoom 200%'}
        >
          <SafeImage
            src={currentPhoto.url}
            alt={currentPhoto.caption || currentPhoto.originalFileName}
            fallbackText={currentPhoto.originalFileName}
            draggable={false}
            className={`transition-transform duration-300 rounded-lg shadow-2xl protected-photo select-none ${
              isZoomed
                ? 'scale-[2] sm:scale-[2.4] my-24 mx-auto shadow-black/80'
                : 'max-h-[72vh] sm:max-h-[78vh] max-w-[90vw] object-contain'
            }`}
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
          onClick={() => {
            setIsZoomed(false);
            onNavigate((currentIndex + 1) % photos.length);
          }}
          className="absolute right-4 z-30 p-3 rounded-full bg-walnut-900/80 hover:bg-walnut-800 text-walnut-100 border border-brand-dark/50 transition-all active:scale-95 shadow-lg"
          aria-label="Próxima foto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Control Bar with EXIF Banner & Rating Controls */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-walnut-950 via-walnut-900 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 z-30 border-t border-brand-dark/50">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <PhotoTechnicalDetails
            metadata={currentPhoto.metadata}
            photoSeed={currentPhoto.originalFileName || currentPhoto.id}
            variant="banner"
          />

          <div className="space-y-0.5">
            {photoVotes.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-brand-cyan font-medium justify-center sm:justify-start">
                <Users className="w-4 h-4 text-brand-cyan" />
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
              <p className="text-xs text-brand-flame italic">
                Última observação: &ldquo;{photoComments[photoComments.length - 1].text}&rdquo; ({photoComments[photoComments.length - 1].voterName})
              </p>
            )}
          </div>
        </div>

        {/* Favorite / Vote Toggle and Star Rating in Lightbox */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-walnut-900/90 px-4 py-2 rounded-xl border border-brand-dark/60 shadow-inner">
            <span className="text-xs text-walnut-300 font-medium hidden sm:inline">Avaliar (1-5):</span>
            <StarRating
              rating={currentPhoto.rating || 0}
              size="md"
              readOnly={isSubmitted || !onSetRating}
              onChange={(newRating) => onSetRating && onSetRating(currentPhoto, newRating)}
              showLabel
            />
          </div>

          <Button
            variant={hasVoted ? 'emerald' : 'outline'}
            size="lg"
            disabled={isSubmitted}
            onClick={() => onToggleSelect(currentPhoto)}
            className="text-sm px-6 font-semibold shadow-lg"
          >
            <Heart className={`w-5 h-5 mr-2 ${hasVoted ? 'fill-current' : ''}`} />
            <span>{hasVoted ? 'Voto Registrado (P / X)' : 'Votar Nesta Foto (P)'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
