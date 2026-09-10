import React from 'react';
import { Camera, ShieldCheck, UserCheck, RefreshCw, Lock, LogOut, User as UserIcon } from 'lucide-react';
import { Gallery, PhotographerProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';

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
  onLogout
}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const activeGallery = galleries.find((g) => g.id === activeGalleryId);

  const isAuthenticated = !!user || isPhotographerAuthenticated;

  const handleUserLogout = () => {
    signOut();
    if (onLogout) onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Studio Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-zinc-800 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg tracking-wide text-zinc-100 font-semibold">
                  LUMINA
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Proofing Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Seleção & Aprovação de Fotos Profissional
              </p>
            </div>
          </div>

          {/* Center / Role Mode Switcher */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentRole === 'admin'
                  ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" />
              )}
              <span>Painel do Fotógrafo</span>
              {!isAuthenticated && (
                <span className="hidden sm:inline-block text-[10px] text-amber-400/80 font-mono">
                  (Restrito)
                </span>
              )}
            </button>

            <button
              onClick={() => onRoleChange('client')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentRole === 'client'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal do Cliente</span>
              {activeGallery && (
                <span className="hidden md:inline-block max-w-[100px] truncate text-[10px] opacity-80">
                  ({activeGallery.clientName.split(' ')[0]})
                </span>
              )}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Gallery Selector dropdown when in client view or quick access */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-zinc-400">Ensaio ativo:</span>
              <select
                value={activeGalleryId || ''}
                onChange={(e) => onSelectGallery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 max-w-[200px] truncate"
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Avatar & User Pill */}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800">
                {profile.avatar_url ? (
                  <img
                    src={sanitizeImageUrl(profile.avatar_url)}
                    alt={profile.full_name || profile.email}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-6 h-6 rounded-full object-cover border border-amber-500/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                    {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-zinc-200 max-w-[120px] truncate font-medium">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 uppercase font-semibold">
                  {profile.role}
                </span>
              </div>
            )}

            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={handleUserLogout}
                title="Encerrar sessão"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            {/* Quick test data reset */}
            <button
              onClick={onResetData}
              title="Sincronização com Supabase"
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
