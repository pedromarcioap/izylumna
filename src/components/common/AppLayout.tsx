import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  SlidersHorizontal, 
  Receipt, 
  Monitor, 
  Settings, 
  Plus, 
  Bell, 
  Cloud,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  Heart,
  DollarSign,
  UserCheck,
  KeyRound,
  Trash2
} from 'lucide-react';
import { LumnaLogo } from './LumnaLogo';
import { Gallery, PhotographerProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { UserProfileModal } from '../settings/UserProfileModal';
import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  toggleNotificationRead,
  clearNotifications,
  NOTIFICATION_EVENT_NAME,
  NotificationItem
} from '../../lib/notifications';

export type { NotificationItem };

export interface AppLayoutProps {
  children: React.ReactNode;
  currentRole: 'admin' | 'client';
  onRoleChange: (role: 'admin' | 'client') => void;
  galleries: Gallery[];
  trashGalleriesCount?: number;
  activeGalleryId?: string;
  onSelectGallery: (id: string) => void;
  onCreateGallery: () => void;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
  activeSidebarItem: string;
  onSidebarItemChange: (item: string) => void;
  onNavigateToSettingsTab?: (tab: 'perfil' | 'team' | 'adobe' | 'pix') => void;
  photographerProfile?: PhotographerProfile;
  onLogout?: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentRole,
  onRoleChange,
  galleries,
  trashGalleriesCount,
  activeGalleryId,
  onSelectGallery,
  onCreateGallery,
  activeNavTab,
  onNavTabChange,
  activeSidebarItem,
  onSidebarItemChange,
  onNavigateToSettingsTab,
  photographerProfile,
  onLogout,
  onShowToast
}) => {
  const { user, profile, signOut, isAdmin, isPhotographer, canAccessTrash, canAccessFinancial } = useAuth();
  const activeGallery = galleries.find((g) => g.id === activeGalleryId);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredNotifications());

  useEffect(() => {
    const handleNotificationChange = () => {
      setNotifications(getStoredNotifications());
    };

    window.addEventListener(NOTIFICATION_EVENT_NAME, handleNotificationChange);
    window.addEventListener('storage', handleNotificationChange);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT_NAME, handleNotificationChange);
      window.removeEventListener('storage', handleNotificationChange);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogoutAction = async () => {
    try {
      setIsUserMenuOpen(false);
      await signOut();
      if (onLogout) onLogout();
    } catch (err) {
      console.error('Erro ao realizar logout:', err);
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07050E] text-zinc-100 font-sans selection:bg-[#8300E9] selection:text-white">
      {/* 1. TOP HEADER ("CINEMATIC DARKROOM") */}
      <header className="h-16 shrink-0 bg-[#0A0714] border-b border-white/10 px-4 flex items-center justify-between z-40 sticky top-0 backdrop-blur-xl">
        {/* Left: Brand Emblem Logo */}
        <div 
          onClick={() => {
            if (isAdmin || isPhotographer) {
              onRoleChange('admin');
            }
          }}
          className="flex items-center gap-3 cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <LumnaLogo variant="dark" size="md" showSubtitle={true} />
          </div>
        </div>

        {/* Center: Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#120E22] p-1 rounded-xl border border-white/10">
          {(isAdmin || isPhotographer) && (
            <button
              onClick={() => {
                onRoleChange('admin');
                onNavTabChange('galleries');
                onSidebarItemChange('collections');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeNavTab === 'galleries' && activeSidebarItem === 'collections' && currentRole === 'admin'
                  ? 'bg-[#1D1636] text-white border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Ensaios & Galerias</span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#8300E9] text-white rounded-full">
                {galleries.length}
              </span>
            </button>
          )}

          {(isAdmin || isPhotographer) && (
            <button
              onClick={() => {
                onRoleChange('admin');
                onNavTabChange('pos_production');
                onSidebarItemChange('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeNavTab === 'pos_production' && currentRole === 'admin'
                  ? 'bg-[#1D1636] text-white border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Central de Pós-Produção
            </button>
          )}

          {canAccessFinancial && (
            <button
              onClick={() => {
                onRoleChange('admin');
                onNavTabChange('financial');
                onSidebarItemChange('billing');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                (activeNavTab === 'financial' || activeSidebarItem === 'billing') && currentRole === 'admin'
                  ? 'bg-[#1D1636] text-white border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Financeiro & Extras
            </button>
          )}

          <button
            onClick={() => {
              onRoleChange('client');
              onNavTabChange('client_demo');
              onSidebarItemChange('presentation');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'client'
                ? 'bg-[#46BDC6] text-[#160F29] shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Portal do Cliente</span>
          </button>
        </nav>

        {/* Right: Actions, Notifications & Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Create New Gallery Button */}
          {currentRole === 'admin' && (isAdmin || isPhotographer) && (
            <button
              onClick={onCreateGallery}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8300E9] to-[#7000C8] hover:from-[#7000C8] hover:to-[#5E00A8] text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Ensaio</span>
            </button>
          )}

          {/* Notifications Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-[#120E22] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
              title="Notificações em tempo real"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-[#0A0714] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#120E22] border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-3 bg-[#0A0714] border-b border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">Notificações Recentes</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllNotificationsAsRead();
                        setNotifications(getStoredNotifications());
                      }}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Marcar todas lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const formattedTime = (() => {
                        if (n.createdIso && n.createdIso !== 'Invalid Date' && !n.createdIso.includes('NaN')) {
                          const dateObj = new Date(n.createdIso);
                          if (!isNaN(dateObj.getTime())) {
                            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                        }
                        if (n.timestamp && n.timestamp !== 'Invalid Date' && !n.timestamp.includes('NaN')) {
                          const dateObj = new Date(n.timestamp);
                          if (!isNaN(dateObj.getTime())) {
                            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                          return n.timestamp;
                        }
                        return 'Agora';
                      })();

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            toggleNotificationRead(n.id);
                            setNotifications(getStoredNotifications());
                          }}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-white/5 ${
                            !n.isRead ? 'bg-purple-500/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {formattedTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                            {n.message || n.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 bg-[#0A0714] border-t border-white/10 text-center">
                    <button
                      onClick={() => {
                        clearNotifications();
                        setNotifications([]);
                      }}
                      className="text-[10px] font-mono text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      Limpar Histórico
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-[#120E22] hover:bg-white/10 border border-white/10 transition-colors"
            >
              {profile?.avatar_url ? (
                <img
                  src={sanitizeImageUrl(profile.avatar_url)}
                  alt={profile.full_name || 'Avatar'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                  className="w-8 h-8 rounded-xl object-cover border border-[#46BDC6]/50 shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8300E9] to-[#7000C8] text-white border border-[#46BDC6]/50 flex items-center justify-center font-bold text-xs shadow-md">
                  {profile?.full_name
                    ? profile.full_name.slice(0, 2).toUpperCase()
                    : photographerProfile?.name
                    ? photographerProfile.name.slice(0, 2).toUpperCase()
                    : 'IZ'}
                </div>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* User Dropdown Menu Popover */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#120E22] border border-white/10 shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in duration-150">
                {/* Header User Details */}
                <div className="p-4 bg-[#0A0714] border-b border-white/10 flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img
                      src={sanitizeImageUrl(profile.avatar_url)}
                      alt={profile.full_name || 'Avatar'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-[#46BDC6]/50 shadow-inner shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8300E9] to-[#46BDC6] text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                      {profile?.full_name
                        ? profile.full_name.slice(0, 2).toUpperCase()
                        : photographerProfile?.name
                        ? photographerProfile.name.slice(0, 2).toUpperCase()
                        : 'IZ'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate text-sm">
                      {profile?.full_name || photographerProfile?.name || 'Usuário Lumina'}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {profile?.email || photographerProfile?.email || 'usuario@lumina.com'}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                      {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'photographer' ? 'Fotógrafo Pro' : 'Usuário Comum'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left font-medium"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">Meu Perfil & Senha</span>
                      <span className="text-[10px] text-zinc-400">Alterar nome e senha de acesso</span>
                    </div>
                  </button>

                  {(isAdmin || isPhotographer) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onRoleChange('admin');
                        onNavigateToSettingsTab?.('perfil');
                        onSidebarItemChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-[#46BDC6]" />
                      <span>Ajustes do Estúdio</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onRoleChange('admin');
                        onNavigateToSettingsTab?.('team');
                        onSidebarItemChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>Gestão de Equipe (RBAC)</span>
                    </button>
                  )}

                  {(isAdmin || isPhotographer) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onRoleChange('admin');
                        onSidebarItemChange('collections');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <FolderKanban className="w-4 h-4 text-amber-400" />
                      <span>Coleções Ativas</span>
                    </button>
                  )}

                  {(isAdmin || isPhotographer) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onRoleChange('admin');
                        onNavigateToSettingsTab?.('adobe');
                        onSidebarItemChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                      <span>Lightroom & Preferências</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-white/10" />

                  <button
                    onClick={handleLogoutAction}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar ("WORKSPACE") */}
        <aside className="w-56 shrink-0 bg-[#0A0714] border-r border-white/10 hidden md:flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-zinc-500 px-3">
                WORKSPACE
              </span>
            </div>

            <nav className="space-y-1 text-xs">
              {(isAdmin || isPhotographer) && (
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    onNavTabChange('galleries');
                    onSidebarItemChange('collections');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeSidebarItem === 'collections' && currentRole === 'admin'
                      ? 'bg-[#1A142E] text-white font-bold border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 text-[#46BDC6]" />
                  <span>Coleções Ativas</span>
                </button>
              )}

              {(isAdmin || isPhotographer) && (
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    onNavTabChange('galleries');
                    onSidebarItemChange('filters');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeSidebarItem === 'filters' && currentRole === 'admin'
                      ? 'bg-[#1A142E] text-white font-bold border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <span>Filtros & Metadados</span>
                </button>
              )}

              {canAccessFinancial && (
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    onNavTabChange('financial');
                    onSidebarItemChange('billing');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeSidebarItem === 'billing' && currentRole === 'admin'
                      ? 'bg-[#1A142E] text-white font-bold border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Faturamento & Extras</span>
                </button>
              )}

              <button
                onClick={() => {
                  onRoleChange('client');
                  onNavTabChange('client_demo');
                  onSidebarItemChange('presentation');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentRole === 'client'
                    ? 'bg-[#1A142E] text-white font-bold border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <Monitor className="w-4 h-4 text-[#46BDC6]" />
                <span>Modo Apresentação</span>
              </button>

              {(isAdmin || isPhotographer) && (
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    onNavTabChange('galleries');
                    onSidebarItemChange('settings');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeSidebarItem === 'settings' && currentRole === 'admin'
                      ? 'bg-[#1A142E] text-white font-bold border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Ajustes do Estúdio</span>
                </button>
              )}

              {canAccessTrash && (
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    onNavTabChange('galleries');
                    onSidebarItemChange('trash');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeSidebarItem === 'trash' && currentRole === 'admin'
                      ? 'bg-red-500/10 text-red-200 font-bold border border-red-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Lixeira</span>
                  </div>
                {typeof trashGalleriesCount === 'number' && trashGalleriesCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded-full">
                    {trashGalleriesCount}
                  </span>
                )}
              </button>
              )}
            </nav>
          </div>

          {/* Storage Box Bottom Left */}
          <div className="p-3 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Armazenamento</span>
              <span className="text-white font-bold">1.2TB / 2TB</span>
            </div>
            <div className="h-1.5 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
              <div className="h-full bg-gradient-to-r from-[#8300E9] to-[#46BDC6] w-[60%]" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 bg-[#07050E] overflow-y-auto pb-16">
          {children}
        </main>
      </div>

      {/* 3. FIXED BOTTOM BAR ("ATALHOS RÁPIDOS") */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0714]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
            ATALHOS RÁPIDOS:
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-[#140F24] px-2 py-0.5 rounded border border-white/10 text-zinc-200">
              <strong className="text-white">1-5</strong> Estrelas
            </span>
            <span className="bg-[#140F24] px-2 py-0.5 rounded border border-white/10 text-zinc-200">
              <strong className="text-[#8300E9]">P</strong> Pick Flag
            </span>
            <span className="bg-[#140F24] px-2 py-0.5 rounded border border-white/10 text-zinc-200">
              <strong className="text-red-400">X</strong> Rejeitar
            </span>
            <span className="bg-[#140F24] px-2 py-0.5 rounded border border-white/10 text-zinc-200">
              <strong className="text-white">Espaço</strong> Zoom 1:1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
          <span className="text-[#46BDC6] font-semibold">Auto-Sync Lightroom: Ativo</span>
        </div>
      </footer>

      {/* Centralized User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onShowToast={onShowToast || (() => {})}
      />
    </div>
  );
};
