import React, { useState, useEffect } from 'react';
import { Gallery, Photo } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { Button } from '../ui/Button';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Heart,
  Volume2,
  VolumeX,
  Info,
  Shield,
  Sparkles,
  Sliders
} from 'lucide-react';

export interface PresentationModeViewProps {
  gallery: Gallery;
  onExit: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({
  gallery,
  onExit,
  onShowToast
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(4000); // 4 seconds interval
  const [showExif, setShowExif] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  const photos = gallery.photos || [];
  const currentPhoto = photos[currentIndex] || photos[0];

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, speed);
    return () => clearInterval(timer);
  }, [isPlaying, speed, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      } else if (e.key === 'Space') {
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onExit]);

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#07050E] flex flex-col items-center justify-center text-white">
        <p>Nenhuma foto disponível para apresentação.</p>
        <Button variant="cyan" onClick={onExit} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#05030A] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. TOP CINEMATIC HEADER */}
      <div className="p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#46BDC6] animate-pulse" />
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">
              {gallery.title}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Modo Apresentação Cinematográfica • Foto {currentIndex + 1} de {photos.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute toggle */}
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              onShowToast(
                isAudioMuted ? 'Áudio Ativado' : 'Áudio Mudo',
                isAudioMuted ? 'Música de fundo iniciada' : 'Áudio pausado',
                'info'
              );
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
            title="Música de Fundo"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#46BDC6]" />}
          </button>

          {/* EXIF toggle */}
          <button
            onClick={() => setShowExif(!showExif)}
            className={`p-2 rounded-xl transition-colors ${
              showExif ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-zinc-300'
            }`}
            title="Exibir Detalhes EXIF"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Watermark toggle */}
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className={`p-2 rounded-xl transition-colors ${
              showWatermark ? 'bg-[#46BDC6] text-[#160F29] font-bold' : 'bg-white/10 hover:bg-white/20 text-zinc-300'
            }`}
            title="Marca d'Água"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Exit Presentation */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
          >
            <X className="w-4 h-4" />
            <span>Sair (Esc)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN IMAGE DISPLAY CANVAS */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)}
          className="absolute left-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Image */}
        <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
          <SafeImage
            src={currentPhoto.url}
            alt={currentPhoto.originalFileName}
            className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl transition-all duration-700"
          />

          {/* Watermark Overlay */}
          {showWatermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 select-none">
              <span className="font-serif text-3xl sm:text-5xl font-extrabold tracking-widest text-white/50 border-2 border-white/30 px-8 py-3 rounded-2xl transform -rotate-12">
                IZY LUMNA PROOFING
              </span>
            </div>
          )}

          {/* EXIF Info Card Floating Overlay */}
          {showExif && (
            <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/80 border border-white/20 backdrop-blur-md text-xs font-mono space-y-1 z-30">
              <div className="text-white font-bold">{currentPhoto.originalFileName}</div>
              <div className="text-purple-300">
                {currentPhoto.technicalDetails?.camera || currentPhoto.cameraModel || 'Sony A7IV'} • {currentPhoto.technicalDetails?.lens || '85mm f/1.4'}
              </div>
              <div className="text-zinc-400 text-[10px]">
                {currentPhoto.technicalDetails?.aperture || 'f/1.4'} | {currentPhoto.technicalDetails?.shutterSpeed || '1/800s'} | ISO {currentPhoto.technicalDetails?.iso || 100}
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % photos.length)}
          className="absolute right-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 3. CINEMATIC FOOTER CONTROLS */}
      <div className="p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-[#8300E9] hover:bg-purple-600 text-white shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <span className="text-xs font-mono text-zinc-300">
            {isPlaying ? 'Reprodução Automática' : 'Pausado'}
          </span>
        </div>

        {/* Progress Dots / Bar */}
        <div className="hidden sm:flex items-center gap-1.5 max-w-md w-full px-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8300E9] to-[#46BDC6] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Velocidade:</span>
          <button
            onClick={() => setSpeed(3000)}
            className={`px-2 py-1 rounded ${speed === 3000 ? 'bg-[#8300E9] text-white font-bold' : 'bg-white/10'}`}
          >
            3s
          </button>
          <button
            onClick={() => setSpeed(5000)}
            className={`px-2 py-1 rounded ${speed === 5000 ? 'bg-[#8300E9] text-white font-bold' : 'bg-white/10'}`}
          >
            5s
          </button>
        </div>
      </div>
    </div>
  );
};
