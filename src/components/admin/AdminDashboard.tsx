import React, { useState } from 'react';
import { Gallery, PhotographerProfile } from '../../types';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { SafeImage } from '../common/SafeImage';
import { PhotographerSettingsModal } from './PhotographerSettingsModal';
import { WatermarkSettingsModal } from './WatermarkSettingsModal';
import { AdobeImportModal } from './AdobeImportModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { UserManagementView } from './UserManagementView';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Search,
  Calendar,
  Image as ImageIcon,
  Lock,
  Globe,
  SlidersHorizontal,
  Eye,
  Trash2,
  Share2,
  FileCheck,
  ShieldCheck,
  LogOut,
  BarChart3,
  Users,
  Settings,
  MessageCircle,
  Mail,
  Phone,
  Cloud,
  Sparkles,
  DollarSign,
  Ban,
  Download,
  Copy,
  CheckCircle2,
  Heart,
  TrendingUp,
  Activity,
  HardDrive,
  RefreshCw,
  Sliders,
  ExternalLink,
  FolderKanban
} from 'lucide-react';

export interface AdminDashboardProps {
  galleries: Gallery[];
  photographerProfile: PhotographerProfile;
  onUpdateProfile: (profile: PhotographerProfile) => void;
  onLogout: () => void;
  onCreateGallery: () => void;
  onEditGallery: (gallery: Gallery) => void;
  onDeleteGallery: (id: string) => void;
  onViewGalleryDetails: (gallery: Gallery) => void;
  onOpenClientView: (galleryId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  galleries,
  photographerProfile,
  onUpdateProfile,
  onLogout,
  onCreateGallery,
  onEditGallery,
  onDeleteGallery,
  onViewGalleryDetails,
  onOpenClientView,
  onShowToast
}) => {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'pending_extras' | 'ready_lightroom' | 'completed'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdobeImportOpen, setIsAdobeImportOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null);
  const [watermarkGallery, setWatermarkGallery] = useState<Gallery | null>(null);
  const [copiedGalleryId, setCopiedGalleryId] = useState<string | null>(null);

  // Computations matching KPI numbers and dynamic filters
  const safeGalleries = Array.isArray(galleries) ? galleries : [];
  const totalGalleries = safeGalleries.length;
  const inProgressGalleries = safeGalleries.filter(
    (g) =>
      g &&
      (g.status === 'awaiting_client' ||
        g.clientSelection?.status === 'pending' ||
        (Array.isArray(g.voters) && g.voters.length > 0) ||
        (g.clientSelection?.votes && Object.keys(g.clientSelection.votes).length > 0))
  );

  const pendingExtrasGalleries = safeGalleries.filter((g) => {
    if (!g) return false;
    const selectedCount = g.clientSelection?.selectedPhotoIds?.length || 0;
    const quotaIncluded = typeof g.quotaIncluded === 'number' ? g.quotaIncluded : 0;
    return selectedCount > quotaIncluded && g.paymentStatus !== 'paid';
  });

  const readyLightroomGalleries = safeGalleries.filter(
    (g) => g && (g.status === 'completed' || Boolean(g.adobeAlbumId))
  );

  const completedGalleries = safeGalleries.filter((g) => g && g.status === 'completed');

  const filteredGalleries = safeGalleries.filter((g) => {
    if (!g) return false;
    const title = g.title || '';
    const clientName = g.clientName || '';
    const query = searchQuery || '';
    const matchesQuery =
      title.toLowerCase().includes(query.toLowerCase()) ||
      clientName.toLowerCase().includes(query.toLowerCase());

    if (!matchesQuery) return false;

    if (statusFilter === 'in_progress') {
      return (
        g.status === 'awaiting_client' ||
        g.clientSelection?.status === 'pending' ||
        (Array.isArray(g.voters) && g.voters.length > 0) ||
        (g.clientSelection?.votes && Object.keys(g.clientSelection.votes).length > 0)
      );
    }
    if (statusFilter === 'pending_extras') {
      const selectedCount = g.clientSelection?.selectedPhotoIds?.length || 0;
      const quotaIncluded = typeof g.quotaIncluded === 'number' ? g.quotaIncluded : 0;
      return selectedCount > quotaIncluded && g.paymentStatus !== 'paid';
    }
    if (statusFilter === 'ready_lightroom') {
      return g.status === 'completed' || Boolean(g.adobeAlbumId);
    }
    if (statusFilter === 'completed') {
      return g.status === 'completed';
    }

    return true;
  });

  const getClientGalleryUrl = (galleryId: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://izylumna.ai.studio';
    const base = origin.includes('localhost') || origin.includes('127.0.0.1') ? 'https://izylumna.ai.studio' : origin;
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return `${base}${pathname}?gallery=${galleryId}&role=client`;
  };

  const handleCopyClientLink = (gallery: Gallery) => {
    const url = getClientGalleryUrl(gallery.id);
    navigator.clipboard.writeText(url);
    setCopiedGalleryId(gallery.id);
    setTimeout(() => setCopiedGalleryId(null), 2000);
    onShowToast(
      'Link Copiado!',
      `Link seguro com PIN (${gallery.pinCode}) copiado para a área de transferência.`,
      'success'
    );
  };

  const handleWhatsAppShare = (gallery: Gallery) => {
    const url = getClientGalleryUrl(gallery.id);
    const pinInfo = gallery.privacy === 'private' ? `\n🔑 PIN de acesso: ${gallery.pinCode}` : '';
    const message = `Olá, ${gallery.clientName}! Sua galeria de fotos "${gallery.title}" está disponível para seleção!\n\n🔗 Acesse o link: ${url}${pinInfo}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${gallery.clientPhone ? gallery.clientPhone.replace(/\D/g, '') : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. TOP HEADER TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#46BDC6]">
              ESTÚDIO AO VIVO • TEMPORADA 2025
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Painel Geral de Provas
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Gerencie galerias ativas, rastreie aprovações em tempo real e sincronize metadados com seu catálogo do Lightroom.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowToast('Exportando Relatório', 'Gerando relatório financeiro em PDF/CSV...', 'info')}
            className="text-xs bg-[#120E22] border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            <span>Exportar Relatório Geral</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onCreateGallery}
            className="text-xs shadow-lg shadow-[#8300E9]/30 font-bold"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Novo Ensaio</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 METRIC CARDS GRID (EXACTLY MATCHING IMAGE 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: ENSAIOS ATIVOS */}
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 relative overflow-hidden group hover:border-[#8300E9]/50 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
              ENSAIOS ATIVOS
            </span>
            <div className="p-1.5 rounded-lg bg-[#46BDC6]/15 text-[#46BDC6] border border-[#46BDC6]/30">
              <FolderKanbanIcon />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-3xl font-extrabold text-white">14</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#46BDC6]/20 text-[#46BDC6] border border-[#46BDC6]/30">
              📈 +3 esta semana
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
            <div className="h-full bg-gradient-to-r from-[#8300E9] to-[#46BDC6] w-[75%]" />
          </div>
        </div>

        {/* Metric Card 2: AGUARDANDO SELEÇÃO */}
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
              AGUARDANDO SELEÇÃO
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-extrabold text-white">06</span>
            <span className="text-xs text-zinc-400 font-medium">
              <strong className="text-[#46BDC6]">●</strong> clientes navegando
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span>Tempo médio p/ prova:</span>
            <strong className="text-white font-mono">4.2 dias</strong>
          </div>
        </div>

        {/* Metric Card 3: SELEÇÕES FINALIZADAS */}
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
              SELEÇÕES FINALIZADAS
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-extrabold text-white">08</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Prontas p/ Pós
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span>Fila de Revelação:</span>
            <strong className="text-white font-mono">524 fotos raw</strong>
          </div>
        </div>

        {/* Metric Card 4: FATURAMENTO EXTRAS */}
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 relative overflow-hidden group hover:border-[#FDBD00]/50 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-wider text-zinc-400 text-[11px]">
              FATURAMENTO EXTRAS
            </span>
            <div className="p-1.5 rounded-lg bg-[#FDBD00]/15 text-[#FDBD00] border border-[#FDBD00]/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-3xl font-extrabold text-[#FDBD00]">
              R$ 4.850<span className="text-xl font-normal">,00</span>
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FDBD00]/20 text-[#FDBD00] border border-[#FDBD00]/30">
              +32% vs mês ant.
            </span>
            <strong className="text-zinc-300 font-mono text-[11px]">162 fotos adicionais</strong>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TAB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#120E22] border border-white/10">
        {/* Search Input with ⌘K Badge */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ensaio por noivos, cliente..."
            className="w-full py-2 px-3 pl-10 pr-12 rounded-xl bg-[#0A0714] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#8300E9]"
          />
          <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-[#1A142E] text-zinc-400 font-mono text-[10px] font-bold border border-white/10">
            ⌘ K
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#8300E9] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todos <span className="ml-1 text-[10px] font-mono opacity-80">{totalGalleries}</span>
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'in_progress'
                ? 'bg-[#46BDC6] text-[#160F29] font-bold shadow-md'
                : 'text-zinc-400 hover:text-[#46BDC6] hover:bg-white/5'
            }`}
          >
            Em Seleção / Votação <span className="ml-1 text-[10px] font-mono opacity-80">{inProgressGalleries.length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending_extras')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'pending_extras'
                ? 'bg-[#FDBD00] text-[#160F29] font-bold shadow-md'
                : 'text-zinc-400 hover:text-[#FDBD00] hover:bg-white/5'
            }`}
          >
            Extras Pendentes <span className="ml-1 text-[10px] font-mono opacity-80">{pendingExtrasGalleries.length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('ready_lightroom')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'ready_lightroom'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Prontos p/ Lightroom <span className="ml-1 text-[10px] font-mono opacity-80">{readyLightroomGalleries.length}</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Finalizados <span className="ml-1 text-[10px] font-mono opacity-80">{completedGalleries.length}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN SECTION: GALLERIES (2/3) + SIDEBAR WIDGETS (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: GALLERIES CARDS (2 COLUMNS SPAN) */}
        <div className="lg:col-span-2 space-y-4">
          {filteredGalleries.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#120E22] border border-white/10 text-center space-y-3">
              <FolderKanban className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-white font-bold text-base">Nenhuma coleção encontrada</h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                Não encontramos nenhuma coleção correspondente aos filtros aplicados ou à sua busca.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs bg-[#0A0714] border-white/10 text-zinc-300"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            filteredGalleries.map((g) => {
              const selectedCount = g.clientSelection?.selectedPhotoIds?.length || 0;
              const hasActiveVoting =
                (g.voters && g.voters.length > 0) ||
                (g.clientSelection?.votes && Object.keys(g.clientSelection.votes).length > 0);
              const extraPhotosCount = Math.max(0, selectedCount - g.quotaIncluded);
              const extraCost = extraPhotosCount * (g.extraPhotoPrice || 30);
              const progressPercentage = Math.min(100, Math.round((selectedCount / (g.quotaIncluded || 1)) * 100));

              return (
                <div
                  key={g.id}
                  className={`p-5 rounded-2xl bg-[#120E22] border shadow-xl transition-all space-y-4 ${
                    hasActiveVoting
                      ? 'border-[#8300E9]/60 hover:border-[#8300E9]'
                      : g.status === 'completed'
                      ? 'border-emerald-500/30 hover:border-emerald-500/60'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Cover Thumbnail */}
                    <div className="relative w-full sm:w-48 h-40 rounded-xl overflow-hidden shrink-0 border border-white/10 group">
                      <SafeImage
                        src={g.coverPhotoUrl || (g.photos && g.photos[0]?.url) || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
                        alt={g.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white">
                        <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20">
                          {g.photos?.length || 0} Fotos
                        </span>
                        {g.privacy === 'private' && (
                          <span className="px-1.5 py-0.5 rounded bg-[#8300E9]/80 border border-purple-400/30 text-purple-200">
                            PIN: {g.pinCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details & Status */}
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {g.status === 'completed' ? (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                              ✓ Finalizado pelo Cliente
                            </span>
                          ) : hasActiveVoting ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                              Votação Coletiva Em Aberto ({g.voters?.length || Object.keys(g.clientSelection?.votes || {}).length || 1} membros)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#46BDC6] px-2 py-0.5 rounded-full bg-[#46BDC6]/15 border border-[#46BDC6]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#46BDC6] animate-pulse" />
                              Em Seleção de Prova
                            </span>
                          )}

                          {g.paymentStatus === 'paid' && (
                            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-[#FDBD00] text-[#160F29]">
                              PIX Confirmado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                          <button
                            onClick={() => handleCopyClientLink(g)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0A0714] border border-white/10 text-zinc-300 hover:text-white hover:border-[#8300E9] transition-colors"
                            title="Copiar Link Seguro com PIN"
                          >
                            <Lock className="w-3 h-3 text-[#46BDC6]" />
                            <span>PIN: <strong>{g.pinCode || '1234'}</strong></span>
                            <Copy className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h2 className="font-sans text-xl font-extrabold text-white truncate">
                          {g.title}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          Cliente: <strong className="text-zinc-200">{g.clientName}</strong> • Data: {g.eventDate || 'Recente'}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 text-[11px]">
                            Progresso da Seleção (Contratado: <strong className="text-white">{g.quotaIncluded}</strong>)
                          </span>
                          <span className="font-mono font-bold text-white text-xs">
                            <strong className="text-[#46BDC6]">{selectedCount}</strong> / {g.quotaIncluded} selecionadas
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-[#8300E9] via-[#46BDC6] to-[#FDBD00] transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Extras Pending Box */}
                      {extraPhotosCount > 0 && g.paymentStatus !== 'paid' && (
                        <div className="p-2.5 rounded-xl bg-[#FDBD00]/10 border border-[#FDBD00]/30 flex items-center justify-between text-xs">
                          <span className="text-[#FDBD00] font-bold flex items-center gap-1.5">
                            🛒 +{extraPhotosCount} Fotos Extras Pendentes
                          </span>
                          <span className="text-[#FDBD00] font-mono font-extrabold text-sm">
                            R$ {extraCost.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleWhatsAppShare(g)}
                            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            title="Enviar via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleCopyClientLink(g)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              copiedGalleryId === g.id
                                ? 'text-emerald-400 font-bold'
                                : 'text-[#46BDC6] hover:text-white'
                            }`}
                            title="Copiar link seguro do ensaio"
                          >
                            {copiedGalleryId === g.id ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copiar Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenClientView(g.id)}
                            className="text-xs bg-[#0A0714] border-white/10 text-zinc-200 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#46BDC6]" />
                            <span>Visão Cliente</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onViewGalleryDetails(g)}
                            className="text-xs bg-[#1A142E] text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white"
                          >
                            <span>Ver Seleção ({selectedCount})</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: WIDGETS (1/3 SPAN) */}
        <div className="space-y-4">
          {/* WIDGET 1: FEED AO VIVO (SUPABASE REALTIME) */}
          <div className="p-5 rounded-2xl bg-[#120E22] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
                <h3 className="font-bold text-white text-sm">Feed Ao Vivo</h3>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-[#46BDC6] px-2 py-0.5 rounded bg-[#46BDC6]/15 border border-[#46BDC6]/30">
                SUPABASE REALTIME
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Event 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A0714] border border-white/5">
                <div className="p-1.5 rounded-lg bg-pink-500/15 text-pink-400 shrink-0">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200">
                    <strong className="text-white">Marina Silva</strong> favoritou <strong className="text-[#46BDC6] font-mono">DSC_4912.NEF</strong>
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                    Casamento Marina & Gui • há 2 min
                  </span>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A0714] border border-white/5">
                <div className="p-1.5 rounded-lg bg-[#FDBD00]/15 text-[#FDBD00] shrink-0">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200">
                    Pagamento PIX confirmado: <strong className="text-[#FDBD00] font-bold">R$ 360,00</strong> de Guilherme Santos (+12 extras)
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                    Gateway Automático • há 14 min
                  </span>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A0714] border border-white/5">
                <div className="p-1.5 rounded-lg bg-[#46BDC6]/15 text-[#46BDC6] shrink-0">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200">
                    Exportação Lightroom para <strong className="text-white">Editorial Moda</strong> concluída com sucesso
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                    45 fotos marcadas c/ label 5★ • há 1h
                  </span>
                </div>
              </div>

              {/* Event 4 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0A0714] border border-white/5">
                <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200">
                    Novo acesso registrado via PIN na galeria <strong className="text-white">Formatura Medicina</strong>
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                    IP: São Paulo, BR • há 3h
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onShowToast('Auditoria Completa', 'Carregando histórico completo de logs...', 'info')}
              className="w-full text-center text-xs text-zinc-400 hover:text-white font-medium hover:underline pt-1 block"
            >
              Ver Histórico Completo de Auditoria
            </button>
          </div>

          {/* WIDGET 2: PLUGIN LIGHTROOM CLASSIC (v3.4.1) */}
          <div className="p-5 rounded-2xl bg-[#120E22] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#46BDC6]" />
                <h3 className="font-bold text-white text-sm">Plugin Lightroom Classic</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#1A142E] text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                v3.4.1
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              As seleções e estrelas dos clientes são sincronizadas diretamente com os metadados XMP locais da sua máquina.
            </p>

            <div className="p-3 rounded-xl bg-[#0A0714] border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Último Heartbeat:</span>
                <strong className="text-[#46BDC6]">Agora há pouco (14:32)</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Pasta Monitorada:</span>
                <span className="text-zinc-300 truncate max-w-[140px]">/Volumes/ProStudio/2...</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdobeImportOpen(true)}
              className="w-full text-xs bg-[#0A0714] border-white/10 text-zinc-200 hover:text-white"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              <span>Configurar Sincronização em Lote</span>
            </Button>
          </div>

          {/* WIDGET 3: CONSUMO DE NUVEM */}
          <div className="p-5 rounded-2xl bg-[#120E22] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-zinc-400">
                CONSUMO DE NUVEM
              </span>
              <span className="font-mono font-extrabold text-xs text-white">60%</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="font-sans text-2xl font-extrabold text-white">
                1.2 TB <span className="text-xs font-normal text-zinc-400">de 2.0 TB</span>
              </span>
            </div>

            <div className="h-2 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
              <div className="h-full bg-[#8300E9] w-[45%]" />
              <div className="h-full bg-[#46BDC6] w-[15%]" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8300E9]" />
                <span>RAWs Originais (920 GB)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#46BDC6]" />
                <span>Previews Web (280 GB)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PhotographerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={photographerProfile}
        onSaveProfile={onUpdateProfile}
      />

      <AdobeImportModal
        isOpen={isAdobeImportOpen}
        onClose={() => setIsAdobeImportOpen(false)}
        onImportSuccess={() => {
          setIsAdobeImportOpen(false);
          onShowToast('Coleção Importada!', 'Seus arquivos do Lightroom foram catalogados.', 'success');
        }}
      />

      <DeleteConfirmModal
        isOpen={!!galleryToDelete}
        onClose={() => setGalleryToDelete(null)}
        onConfirm={() => {
          if (galleryToDelete) {
            onDeleteGallery(galleryToDelete.id);
            setGalleryToDelete(null);
          }
        }}
        title="Excluir Galeria de Fotos?"
        description={`Tem certeza que deseja excluir "${galleryToDelete?.title}"? Esta ação removerá permanentemente as imagens e escolhas do cliente.`}
      />
    </div>
  );
};

const FolderKanbanIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
