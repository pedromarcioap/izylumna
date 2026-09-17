import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { LumnaLogo } from './LumnaLogo';
import { Gallery, PhotographerProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export interface AppLayoutProps {
  children: React.ReactNode;
  currentRole: 'admin' | 'client';
  onRoleChange: (role: 'admin' | 'client') => void;
  galleries: Gallery[];
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
}

export interface NotificationItem {
  id: string;
  type: 'vote' | 'payment' | 'comment' | 'user';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentRole,
  onRoleChange,
  galleries,
  activeGalleryId,
  onSelectGallery,
  onCreateGallery,
  activeNavTab,
  onNavTabChange,
  activeSidebarItem,
  onSidebarItemChange,
  onNavigateToSettingsTab,
  photographerProfile,
  onLogout
}) => {
  const { user, profile, signOut } = useAuth();
  const activeGallery = galleries.find((g) => g.id === activeGalleryId);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      type: 'vote',
      title: 'Votação em Aberto',
      message: 'Marina Alencar adicionou novos votos na galeria "Casamento Marina & Lucas".',
      timestamp: 'há 10 min',
      isRead: false
    },
    {
      id: 'n2',
      type: 'payment',
      title: 'Pagamento PIX Confirmado',
      message: 'Recebido R$ 360,00 (+12 fotos extras selecionadas) no Ensaio Casamento.',
      timestamp: 'há 25 min',
      isRead: false
    },
    {
      id: 'n3',
      type: 'comment',
      title: 'Novo Comentário',
      message: 'Camila Rossi: "Poderia enviar uma versão em alta resolução desta foto?"',
      timestamp: 'há 1h',
      isRead: false
    },
    {
      id: 'n4',
      type: 'user',
      title: 'Membro na Equipe',
      message: 'Novo usuário "Marcos Oliveira" adicionado ao estúdio com nível de Fotógrafo.',
      timestamp: 'há 3h',
      isRead: true
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleLogoutAction = async () => {
    setIsUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-[#07050E] text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-[#0A0714] border-b border-white/10 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Emblem Logo */}
        <div 
          onClick={() => onRoleChange('admin')}
          className="flex items-center gap-3 cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold bg-[#1A142E] text-purple-300 border border-purple-500/30 rounded">
              CC_
            </span>
            <LumnaLogo variant="dark" size="sm" showSubtitle={true} />
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#120E22] p-1 rounded-xl border border-white/10">
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
              {galleries.length || 12}
            </span>
          </button>

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
            <span>Portal do Cliente (Demo Ao Vivo)</span>
          </button>
        </div>

        {/* Right: Lightroom status + New Gallery CTA + Notifications + Profile */}
        {/* Right: Lightroom status + New Gallery CTA + Notifications + Profile */}
        <div className="flex items-center gap-3 shrink-0 relative">
          {/* Lightroom Connected Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#120E22] border border-[#46BDC6]/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
            <span className="text-zinc-300 text-[11px] font-medium">Lightroom Cloud Conectado</span>
          </div>

          {/* New Gallery Button */}
          <button
            onClick={onCreateGallery}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8300E9] to-[#7000C8] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-[#8300E9]/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ensaio</span>
          </button>

          {/* Bell Notifications */}
          <div className="relative z-40">
            <button
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                setIsUserMenuOpen(false);
              }}
              className={`relative p-2 text-zinc-400 hover:text-white rounded-xl bg-[#120E22] border border-white/10 transition-colors ${
                isNotificationsOpen ? 'border-[#8300E9] text-white bg-[#8300E9]/20' : ''
              }`}
              title="Central de Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8300E9] text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#120E22] border border-white/10 shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in duration-150">
                {/* Header */}
                <div className="p-3.5 bg-[#0A0714] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#46BDC6]" />
                    <span className="font-bold text-white text-sm">Notificações do Estúdio</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#8300E9]/30 text-purple-300 text-[10px] font-mono">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[11px] text-[#46BDC6] hover:underline font-medium"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      <Bell className="w-6 h-6 mx-auto mb-2 text-zinc-600 opacity-50" />
                      <span>Nenhuma notificação no momento.</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleToggleNotificationRead(n.id)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                          !n.isRead ? 'bg-[#8300E9]/10' : ''
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-[#0A0714] border border-white/10 shrink-0 mt-0.5">
                          {n.type === 'vote' && <Heart className="w-4 h-4 text-purple-400" />}
                          {n.type === 'payment' && <DollarSign className="w-4 h-4 text-amber-400" />}
                          {n.type === 'comment' && <MessageSquare className="w-4 h-4 text-[#46BDC6]" />}
                          {n.type === 'user' && <UserCheck className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-100">{n.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{n.timestamp}</span>
                          </div>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#8300E9] shrink-0 mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-2.5 bg-[#0A0714] border-t border-white/10 text-center">
                    <button
                      onClick={handleClearNotifications}
                      className="text-[11px] text-zinc-400 hover:text-white hover:underline font-mono"
                    >
                      Limpar todas as notificações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown Button */}
          <div className="relative z-40">
            <button 
              onClick={() => {
                setIsUserMenuOpen((prev) => !prev);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
              title="Menu do Usuário"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8300E9] to-[#7000C8] text-white border border-[#46BDC6]/50 flex items-center justify-center font-bold text-xs shadow-md">
                {profile?.full_name
                  ? profile.full_name.slice(0, 2).toUpperCase()
                  : photographerProfile?.name
                  ? photographerProfile.name.slice(0, 2).toUpperCase()
                  : 'IZ'}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* User Dropdown Menu Popover */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#120E22] border border-white/10 shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in duration-150">
                {/* Header User Details */}
                <div className="p-4 bg-[#0A0714] border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8300E9] to-[#46BDC6] text-white flex items-center justify-center font-bold text-sm shadow-inner">
                    {profile?.full_name
                      ? profile.full_name.slice(0, 2).toUpperCase()
                      : photographerProfile?.name
                      ? photographerProfile.name.slice(0, 2).toUpperCase()
                      : 'IZ'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate text-sm">
                      {profile?.full_name || photographerProfile?.name || 'Fotógrafo Lumina'}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {profile?.email || photographerProfile?.email || 'estudio@lumina.com'}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                      {profile?.role === 'admin' ? 'Administrador' : 'Fotógrafo Pro'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-2 space-y-1">
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
                    <span>Meu Perfil & Estúdio</span>
                  </button>

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
                    <span>Gestão de Equipe</span>
                  </button>

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
    </div>
  );
};
