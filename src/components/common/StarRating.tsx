import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  /** Current rating value (0 to 5) */
  rating?: number;
  /** Maximum number of stars (default 5) */
  maxStars?: number;
  /** Callback triggered when star rating changes */
  onChange?: (newRating: number) => void;
  /** If true, star selection is disabled */
  readOnly?: boolean;
  /** Visual size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show text label (e.g., "4/5") */
  showLabel?: boolean;
  /** Custom CSS classes */
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  maxStars = 5,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleStarClick = (starIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (readOnly || !onChange) return;
    // Clicking current active rating toggles it off (sets to 0)
    const newRating = rating === starIndex ? 0 : starIndex;
    onChange(newRating);
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!readOnly && onChange) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly && onChange) {
      setHoverRating(null);
    }
  };

  // Size mapping
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const starIconSize = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onMouseLeave={handleMouseLeave}
      role="radiogroup"
      aria-label={`Avaliação de 0 a ${maxStars} estrelas`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= activeRating;

          return (
            <button
              key={starValue}
              type="button"
              disabled={readOnly}
              onClick={(e) => handleStarClick(starValue, e)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => handleMouseEnter(starValue)}
              className={`p-0.5 rounded transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FDBD00] ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-115 active:scale-95'
              }`}
              title={
                readOnly
                  ? `${rating} de ${maxStars} estrelas`
                  : `Classificar com ${starValue} estrela${starValue > 1 ? 's' : ''}`
              }
              aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starIconSize} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-[#FDBD00] text-[#FDBD00] drop-shadow-[0_0_6px_rgba(253,189,0,0.5)]'
                    : 'text-zinc-600 hover:text-amber-400/80 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="font-mono text-xs text-amber-400 font-semibold ml-1">
          {rating > 0 ? `${rating}★` : 'Sem nota'}
        </span>
      )}
    </div>
  );
};
