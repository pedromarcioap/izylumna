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
  ExternalLink
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

  // Computations matching Image 1 KPI numbers
  const totalGalleries = galleries.length || 14;
  const awaitingSelectionCount = 6;
  const completedCount = 8;
  const totalExtrasBilled = 4850;

  const filteredGalleries = galleries.filter((g) => {
    const matchesQuery =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
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
            Todos <span className="ml-1 text-[10px] font-mono opacity-80">14</span>
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'in_progress'
                ? 'bg-[#46BDC6] text-[#160F29] font-bold shadow-md'
                : 'text-zinc-400 hover:text-[#46BDC6] hover:bg-white/5'
            }`}
          >
            Em Seleção <span className="ml-1 text-[10px] font-mono opacity-80">6</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending_extras')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'pending_extras'
                ? 'bg-[#FDBD00] text-[#160F29] font-bold shadow-md'
                : 'text-zinc-400 hover:text-[#FDBD00] hover:bg-white/5'
            }`}
          >
            Extras Pendentes <span className="ml-1 text-[10px] font-mono opacity-80">2</span>
          </button>

          <button
            onClick={() => setStatusFilter('ready_lightroom')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'ready_lightroom'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Prontos p/ Lightroom <span className="ml-1 text-[10px] font-mono opacity-80">4</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN SECTION: GALLERIES (2/3) + SIDEBAR WIDGETS (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: GALLERIES CARDS (2 COLUMNS SPAN) */}
        <div className="lg:col-span-2 space-y-4">
          {/* GALLERY CARD 1: Casamento Marina & Guilherme (IN SELECTION) */}
          <div className="p-5 rounded-2xl bg-[#120E22] border border-[#8300E9]/40 hover:border-[#8300E9] shadow-xl transition-all space-y-4">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Cover Thumbnail */}
              <div className="relative w-full sm:w-48 h-40 rounded-xl overflow-hidden shrink-0 border border-white/10 group">
                <SafeImage
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
                  alt="Casamento Marina & Guilherme"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20">
                    420 RAWs
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#8300E9]/80 border border-purple-400/30 text-purple-200">
                    ISO 100 • 85mm
                  </span>
                </div>
              </div>

              {/* Details & Status */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#46BDC6] px-2 py-0.5 rounded-full bg-[#46BDC6]/15 border border-[#46BDC6]/30">
                      Em Seleção (Cliente Online Agora)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>ID #2488</span>
                    <button
                      onClick={() => handleCopyClientLink(galleries[0] || { id: '2488', title: 'Casamento Marina', pinCode: '8492' } as any)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0A0714] border border-white/10 text-zinc-300 hover:text-white hover:border-[#8300E9]"
                    >
                      <Lock className="w-3 h-3 text-[#46BDC6]" />
                      <span>PIN: <strong>8492</strong></span>
                      <Copy className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="font-sans text-xl font-extrabold text-white">
                    Casamento Marina & Guilherme
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Igreja Santa Tereza + Espaço Bosque Real • Realizado em 18 de Outubro
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      Progresso da Escolha (Contratado: <strong className="text-white">80</strong>)
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      <strong className="text-[#46BDC6]">92</strong> / 80 selecionadas
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
                    <div className="h-full bg-gradient-to-r from-[#8300E9] via-[#46BDC6] to-[#FDBD00] w-[95%]" />
                  </div>
                </div>

                {/* Extras Pending Box */}
                <div className="p-2.5 rounded-xl bg-[#FDBD00]/10 border border-[#FDBD00]/30 flex items-center justify-between text-xs">
                  <span className="text-[#FDBD00] font-bold flex items-center gap-1.5">
                    🛒 +12 Fotos Extras Pendentes
                  </span>
                  <span className="text-[#FDBD00] font-mono font-extrabold text-sm">
                    R$ 360,00
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Último clique há 2 min
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenClientView(galleries[0]?.id || '')}
                      className="text-xs bg-[#0A0714] border-white/10 text-zinc-200 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-[#46BDC6]" />
                      <span>Abrir Visão do Cliente</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewGalleryDetails(galleries[0] || {} as any)}
                      className="text-xs bg-[#1A142E] text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white"
                    >
                      <span>Ver Seleção (92)</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GALLERY CARD 2: Editorial Moda Autoral - Vl. 04 (COMPLETED & PIX CONFIRMED) */}
          <div className="p-5 rounded-2xl bg-[#120E22] border border-white/10 hover:border-emerald-500/50 shadow-xl transition-all space-y-4">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Cover Thumbnail */}
              <div className="relative w-full sm:w-48 h-40 rounded-xl overflow-hidden shrink-0 border border-white/10 group">
                <SafeImage
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
                  alt="Editorial Moda Autoral"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20">
                    185 RAWs
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-600/80 border border-cyan-400/30 text-cyan-100">
                    Hasselblad 50C
                  </span>
                </div>
              </div>

              {/* Details & Status */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                      ✓ Finalizado pelo Cliente
                    </span>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-[#FDBD00] text-[#160F29]">
                      PIX Confirmado R$ 525,00
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">PIN: <strong>4410</strong></span>
                </div>

                <div>
                  <h2 className="font-sans text-xl font-extrabold text-white">
                    Editorial Moda Autoral – Vl. 04
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Cliente: Ateliê Lumini • 45 fotos escolhidas (30 pacote + 15 extras)
                  </p>
                </div>

                {/* Lightroom Sync Banner */}
                <div className="p-3 rounded-xl bg-[#1A142E] border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#46BDC6]" />
                    <div>
                      <strong className="text-white block">Catálogo Lightroom Vinculado</strong>
                      <span className="text-[11px] text-zinc-400">Filtro de metadados pronto para download (.xmp)</span>
                    </div>
                  </div>
                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={() => onShowToast('Sincronizando Lightroom', 'Enviando seleções de 45 fotos para a nuvem da Adobe...', 'success')}
                    className="text-xs font-bold whitespace-nowrap shadow-md shadow-[#46BDC6]/20"
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1" />
                    <span>Sincronizar Cloud (45 fotos)</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                  <span>Aprovado por Camila V. às 10:42</span>
                  <span>Coleção: Editorial_2025_Final</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM 2-GRID CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Small Card 1: Ensaio Gestante */}
            <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 px-2 py-0.5 rounded bg-white/5">
                  ● Aguardando Acesso
                </span>
                <span className="font-mono text-xs text-[#46BDC6] font-bold">PIN: 2914</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Ensaio Gestante – Helena & Theo</h3>
                <p className="text-[11px] text-zinc-400">210 fotos carregadas • Limite: 40 fotos</p>
              </div>
              <div className="p-2 rounded-lg bg-[#0A0714] border border-white/10 text-[11px] text-zinc-400">
                Galerias enviadas ontem via e-mail • Nenhum acesso registrado
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWhatsAppShare(galleries[0] || {} as any)}
                className="w-full text-xs bg-[#0A0714] border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Enviar WhatsApp com Link</span>
              </Button>
            </div>

            {/* Small Card 2: Formatura Medicina */}
            <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                  ● Multi-Usuários
                </span>
                <span className="font-mono text-xs text-zinc-400">PIN Coletivo</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Formatura Medicina Turma XLVIII</h3>
                <p className="text-[11px] text-zinc-400">950 fotos totais • Limite cota: 150 fotos</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Votos da Comissão (4 membros online)</span>
                  <strong className="text-white font-mono">112 / 150</strong>
                </div>
                <div className="h-1.5 w-full bg-[#0A0714] rounded-full overflow-hidden flex border border-white/10">
                  <div className="h-full bg-purple-500 w-[75%]" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowToast('Moderando Votação', 'Abrindo mesa de mediação de votos da comissão...', 'info')}
                className="w-full text-xs bg-[#0A0714] border-white/10 text-zinc-300 hover:text-white"
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                <span>Moderar Votação</span>
              </Button>
            </div>
          </div>
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
