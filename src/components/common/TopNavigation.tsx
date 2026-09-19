import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw, Lock, LogOut, PlusCircle } from 'lucide-react';
import { Gallery, PhotographerProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { LumnaLogo } from './LumnaLogo';

export interface TopNavigationProps {
  currentRole: 'admin' | 'client';
  onRoleChange: (role: 'admin' | 'client') => void;
  activeGalleryId?: string;
  galleries: Gallery[];
  onSelectGallery: (id: string) => void;
  onResetData: () => void;
  isPhotographerAuthenticated: boolean;
  photographerProfile?: PhotographerProfile;
  onLogout?: () => void;
  onCreateGallery?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentRole,
  onRoleChange,
  activeGalleryId,
  galleries,
  onSelectGallery,
  onResetData,
  isPhotographerAuthenticated,
  photographerProfile,
  onLogout,
  onCreateGallery
}) => {
  const { user, profile, signOut, isAdmin, isPhotographer } = useAuth();
  const activeGallery = galleries.find((g) => g.id === activeGalleryId);

  const isAuthenticated = !!user || isPhotographerAuthenticated;

  const handleUserLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0714]/95 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Identity with LumnaLogo (Dark Cinema Variant) */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => {
              if (isAdmin || isPhotographer) {
                onRoleChange('admin');
              }
            }}
          >
            <LumnaLogo variant="dark" size="md" showSubtitle={true} />
          </div>

          {/* Center Role Mode Switcher & 1-Click Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#140F24]/90 p-1 rounded-xl border border-white/10 shadow-inner">
              {(isAdmin || isPhotographer) && (
                <button
                  onClick={() => onRoleChange('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentRole === 'admin'
                      ? 'bg-[#8300E9] text-white font-semibold shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isAuthenticated ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#46BDC6]" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-[#F94713]" />
                  )}
                  <span>Fotógrafo</span>
                </button>
              )}

              <button
                onClick={() => onRoleChange('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'client'
                    ? 'bg-[#46BDC6] text-[#160F29] font-bold shadow-md shadow-[#46BDC6]/30 border border-[#46BDC6]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cliente</span>
                {activeGallery && (
                  <span className="hidden md:inline-block max-w-[90px] truncate text-[10px] opacity-90 font-mono">
                    ({activeGallery.clientName.split(' ')[0]})
                  </span>
                )}
              </button>
            </div>

            {/* Direct 1-Click Action: Create Gallery shortcut for Admin */}
            {currentRole === 'admin' && (isAdmin || isPhotographer) && isAuthenticated && onCreateGallery && (
              <button
                onClick={onCreateGallery}
                title="Criar novo ensaio em 1 clique"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8300E9]/20 hover:bg-[#8300E9]/30 text-[#8300E9] dark:text-purple-300 text-xs font-semibold border border-[#8300E9]/40 transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#8300E9]" />
                <span>Novo Ensaio</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Gallery Selector dropdown */}
            {galleries.length > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-zinc-400">Ensaio:</span>
                <select
                  value={activeGalleryId || ''}
                  onChange={(e) => onSelectGallery(e.target.value)}
                  className="bg-[#140F24] border border-white/10 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#8300E9] max-w-[180px] truncate"
                >
                  {galleries.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Profile Pill */}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#140F24] border border-white/10">
                {profile.avatar_url ? (
                  <img
                    src={sanitizeImageUrl(profile.avatar_url)}
                    alt={profile.full_name || profile.email}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-6 h-6 rounded-full object-cover border border-[#46BDC6]/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#8300E9] text-white flex items-center justify-center text-[10px] font-bold">
                    {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-zinc-200 max-w-[110px] truncate font-medium">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
              </div>
            )}

            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={handleUserLogout}
                title="Encerrar sessão"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            {/* Refresh / Sync status indicator */}
            <button
              onClick={onResetData}
              title="Sincronização com Supabase"
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
