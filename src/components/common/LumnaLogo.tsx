import React from 'react';

export type LogoVariant = 'dark' | 'light' | 'mono' | 'royal';
export type LogoLayout = 'horizontal' | 'vertical' | 'icon-only';

export interface LumnaLogoProps {
  variant?: LogoVariant;
  layout?: LogoLayout;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const LumnaLogo: React.FC<LumnaLogoProps> = ({
  variant = 'dark',
  layout = 'horizontal',
  size = 'md',
  showBadge = false,
  showSubtitle = true,
  className = ''
}) => {
  // Dimension scale mapping
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl'
  };

  const subtitleSizes = {
    sm: 'text-[9px] tracking-widest',
    md: 'text-[10px] sm:text-[11px] tracking-[0.2em]',
    lg: 'text-[12px] tracking-[0.25em]',
    xl: 'text-[14px] tracking-[0.3em]'
  };

  // Render SVG Emblem with exact vector geometry matching user graphics
  const renderEmblem = () => {
    switch (variant) {
      case 'royal':
        return (
          <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
            <div className="absolute inset-0 rounded-full bg-[#120B24] border-2 border-[#46BDC6] shadow-[0_0_12px_rgba(70,189,198,0.5)] flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full p-1.5" fill="none">
                <polygon
                  points="20,7 32,15 28,29 12,29 8,15"
                  stroke="#8300E9"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="3" fill="#46BDC6" />
              </svg>
            </div>
          </div>
        );
      case 'mono':
        return (
          <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
            <div className="absolute inset-0 rounded-full border-2 border-white flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full p-1.5" fill="none">
                <polygon
                  points="20,7 32,15 28,29 12,29 8,15"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
              </svg>
            </div>
          </div>
        );
      case 'light':
        return (
          <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
            <div className="absolute inset-0 rounded-full border-2 border-[#8300E9] flex items-center justify-center bg-white/50">
              <svg viewBox="0 0 40 40" className="w-full h-full p-1.5" fill="none">
                <polygon
                  points="20,7 32,15 28,29 12,29 8,15"
                  stroke="#8300E9"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="3" fill="#8300E9" />
              </svg>
            </div>
          </div>
        );
      case 'dark':
      default:
        return (
          <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
            <div className="absolute inset-0 rounded-full bg-[#161224] border-2 border-[#8300E9] shadow-[0_0_10px_rgba(131,0,233,0.4)] flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full p-1.5" fill="none">
                <polygon
                  points="20,7 32,15 28,29 12,29 8,15"
                  stroke="#8300E9"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="3.5" fill="#FFFFFF" />
              </svg>
            </div>
          </div>
        );
    }
  };

  if (layout === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{renderEmblem()}</div>;
  }

  // Text Contrast Color Mapping for Title & Subtitle
  const getTextColors = () => {
    switch (variant) {
      case 'royal':
        return {
          izy: 'text-white font-extrabold',
          lumna: 'text-[#46BDC6] font-extrabold',
          subtitle: 'text-white/90',
          badgeBg: 'bg-[#250048] border-[#46BDC6]/50 text-[#46BDC6]'
        };
      case 'mono':
        return {
          izy: 'text-white font-extrabold',
          lumna: 'text-zinc-300 font-extrabold',
          subtitle: 'text-zinc-400',
          badgeBg: 'bg-zinc-800 border-zinc-600 text-zinc-300'
        };
      case 'light':
        return {
          izy: 'text-[#160F29] font-extrabold',
          lumna: 'text-[#8300E9] font-extrabold',
          subtitle: 'text-[#504769]',
          badgeBg: 'bg-white border-[#8300E9]/30 text-[#8300E9]'
        };
      case 'dark':
      default:
        return {
          izy: 'text-white font-extrabold',
          lumna: 'text-[#8300E9] font-extrabold',
          subtitle: 'text-zinc-400',
          badgeBg: 'bg-[#1F1836] border-[#8300E9]/40 text-[#8300E9]'
        };
    }
  };

  const colors = getTextColors();

  const getBadgeLabel = () => {
    switch (variant) {
      case 'royal':
        return 'ROYAL VIOLET';
      case 'mono':
        return 'MONO PURE';
      case 'light':
        return 'LIGHT PURE';
      case 'dark':
      default:
        return 'DARK CINEMA';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        layout === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      {renderEmblem()}

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`font-sans tracking-tight leading-none ${titleSizes[size]} ${colors.izy}`}>
            IZY{' '}
            <span className={colors.lumna}>LUMNA</span>
          </span>

          {showBadge && (
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shadow-sm ${colors.badgeBg}`}
            >
              {getBadgeLabel()}
            </span>
          )}
        </div>

        {showSubtitle && (
          <span className={`font-sans uppercase font-medium mt-1 leading-none ${subtitleSizes[size]} ${colors.subtitle}`}>
            STUDIO PROOFING & WORKFLOW
          </span>
        )}
      </div>
    </div>
  );
};
