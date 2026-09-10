import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  containerClassName?: string;
  showFallbackText?: boolean;
}

/**
 * Defensive Image component that gracefully handles loading errors,
 * missing src, and stale or expired blob URLs by showing a sleek visual placeholder.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Fotografia',
  className = '',
  containerClassName = '',
  fallbackText,
  showFallbackText = true,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState<boolean>(false);

  // Validate src: filter empty or stale blob URLs
  const isInvalidBlob = !src || typeof src !== 'string' || src.trim() === '' || src.startsWith('blob:');
  const displayUrl = isInvalidBlob ? DEFAULT_FALLBACK_IMAGE : src;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Replace broken image source with standard placeholder to avoid endless error loops
    e.currentTarget.onerror = null;
    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  if (hasError && showFallbackText) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center bg-zinc-900/90 border border-zinc-850 rounded-xl text-zinc-500 select-none overflow-hidden ${containerClassName || className}`}
        title={fallbackText || alt || 'Imagem indisponível'}
      >
        <ImageOff className="w-6 h-6 mb-1 text-zinc-600 opacity-80" />
        <span className="text-[10px] font-mono text-zinc-500 line-clamp-1 max-w-[90%]">
          {fallbackText || alt || 'Imagem indisponível'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
