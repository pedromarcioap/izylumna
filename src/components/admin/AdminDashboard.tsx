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
  Ban
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
  const [dashboardTab, setDashboardTab] = useState<'galleries' | 'financial' | 'clients' | 'users'>('galleries');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_client' | 'completed' | 'draft'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdobeImportOpen, setIsAdobeImportOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null);
  const [watermarkGallery, setWatermarkGallery] = useState<Gallery | null>(null);

  // Metrics computation
  const totalGalleries = galleries.length;
  const awaitingCount = galleries.filter((g) => g.status === 'awaiting_client').length;
  const completedCount = galleries.filter((g) => g.status === 'completed').length;

  const totalExtrasBilled = galleries.reduce((acc, g) => {
    if (g.excessPolicy === 'charge') {
      const selectedCount = g.clientSelection.selectedPhotoIds.length;
      const extraCount = Math.max(0, selectedCount - g.quotaIncluded);
      return acc + extraCount * g.extraPhotoPrice;
    }
    return acc;
  }, 0);

  const totalPhotosCataloged = galleries.reduce((acc, g) => acc + g.photos.length, 0);
  const totalPhotosSelected = galleries.reduce((acc, g) => acc + g.clientSelection.selectedPhotoIds.length, 0);

  const filteredGalleries = galleries.filter((g) => {
    const matchesQuery =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesQuery && matchesStatus;
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
      'Link de Acesso Copiado!',
      `Link direto para "${gallery.title}". Acesso seguro por PIN exclusivo.`,
      'success'
    );
  };

  const handleWhatsAppShare = (gallery: Gallery) => {
    const url = getClientGalleryUrl(gallery.id);
    const pinInfo = gallery.privacy === 'private' ? `\n🔑 PIN de acesso exclusivo: ${gallery.pinCode}` : '';
    const message = `Olá, ${gallery.clientName}! Sua galeria de fotos "${gallery.title}" está disponível para seleção!\n\n🔗 Acesse o link: ${url}${pinInfo}\n\n(Acesso direto por PIN sem necessidade de senha extensa).`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${gallery.clientPhone ? gallery.clientPhone.replace(/\D/g, '') : ''}?text=${encoded}`, '_blank');
  };

  const getPolicyBadge = (gallery: Gallery) => {
    if (gallery.excessPolicy === 'block') {
      return (
        <Badge variant="default" size="sm" className="gap-1 bg-zinc-900 text-zinc-300 border-zinc-700">
          <Ban className="w-3 h-3 text-red-400" />
          <span>Bloqueio Rígido ({gallery.quotaIncluded})</span>
        </Badge>
      );
    }
    if (gallery.excessPolicy === 'charge') {
      return (
        <Badge variant="warning" size="sm" className="gap-1">
          <DollarSign className="w-3 h-3" />
          <span>Extra: R$ {gallery.extraPhotoPrice.toFixed(2)}/foto</span>
        </Badge>
      );
    }
    return (
      <Badge variant="info" size="sm" className="gap-1">
        <Sparkles className="w-3 h-3" />
        <span>Aprovação Pura</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Photographer Studio Header Card */}
      <div className="p-6 rounded-2xl bg-[#140F24]/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {photographerProfile.avatarUrl ? (
              <img
                src={sanitizeImageUrl(photographerProfile.avatarUrl)}
                alt={photographerProfile.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#8300E9] shadow-lg shadow-[#8300E9]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#8300E9]/20 border-2 border-[#8300E9] flex items-center justify-center text-[#8300E9] dark:text-purple-300 font-bold text-xl">
                {photographerProfile.name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#46BDC6] border-2 border-[#0A0714] shadow" title="Estúdio Autenticado" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {photographerProfile.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#46BDC6]/15 text-[#46BDC6] border border-[#46BDC6]/30 text-[10px] font-mono font-bold uppercase">
                <ShieldCheck className="w-3 h-3 text-[#46BDC6]" />
                <span>Autenticado</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              <strong className="text-[#46BDC6] font-semibold">{photographerProfile.studioName}</strong> • {photographerProfile.email}
            </p>
          </div>
        </div>

        {/* Studio Actions in 1-Click */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs border-white/10 text-zinc-300 hover:bg-white/5"
          >
            <Settings className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            <span>Perfil & Configurações</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdobeImportOpen(true)}
            className="text-xs border-[#46BDC6]/30 text-[#46BDC6] hover:bg-[#46BDC6]/10"
            title="Importar álbuns do Adobe Lightroom Cloud"
          >
            <Cloud className="w-3.5 h-3.5 mr-1 text-[#46BDC6]" />
            <span>Lightroom Cloud</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onCreateGallery}
            className="text-xs font-semibold shadow-lg shadow-[#8300E9]/30"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Novo Ensaio</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            title="Encerrar sessão"
            className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setDashboardTab('galleries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'galleries'
              ? 'bg-[#8300E9] text-white shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Ensaios & Galerias ({totalGalleries})</span>
        </button>

        <button
          onClick={() => setDashboardTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'financial'
              ? 'bg-[#8300E9] text-white shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Faturamento & Cotas</span>
        </button>

        <button
          onClick={() => setDashboardTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'clients'
              ? 'bg-[#8300E9] text-white shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes & Envio em 1 Clique</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setDashboardTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              dashboardTab === 'users'
                ? 'bg-[#8300E9] text-white shadow-md shadow-[#8300E9]/30 border border-[#8300E9]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#46BDC6]" />
            <span>Gestão RBAC</span>
          </button>
        )}
      </div>

      {/* Studio Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Total de Ensaios</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">{totalGalleries}</span>
              <span className="text-xs text-zinc-400">projetos</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{totalPhotosCataloged} fotos catalogadas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-[#FDBD00]">Em Seleção de Cliente</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#FDBD00]">{awaitingCount}</span>
              <span className="text-xs text-zinc-400">em andamento</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Aguardando aprovação do cliente</p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-[#46BDC6]">Seleções Concluídas</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#46BDC6]">{completedCount}</span>
              <span className="text-xs text-zinc-400">aprovadas</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Prontas para exportar no Lightroom</p>
          </CardContent>
        </Card>

        <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-emerald-400">Receita em Fotos Extras</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                R$ {totalExtrasBilled.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{totalPhotosSelected} fotos aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* TAB 1: GALLERIES & SHOOTS */}
      {dashboardTab === 'galleries' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Buscar cliente ou nome do ensaio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#0A0714] rounded-xl border border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#8300E9] text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todas ({totalGalleries})
              </button>
              <button
                onClick={() => setStatusFilter('awaiting_client')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'awaiting_client'
                    ? 'bg-[#FDBD00] text-[#160F29] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Aguardando Cliente ({awaitingCount})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-[#46BDC6] text-[#160F29] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Finalizadas ({completedCount})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'draft'
                    ? 'bg-zinc-800 text-zinc-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Rascunho ({galleries.filter((g) => g.status === 'draft').length})
              </button>
            </div>
          </div>

          {/* Galleries Grid */}
          {filteredGalleries.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-white/10 bg-[#140F24]/50 backdrop-blur-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <h3 className="text-lg font-semibold text-zinc-200">Nenhum ensaio encontrado</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? 'Tente ajustar os termos de busca ou filtros aplicados.'
                  : 'Clique em "Novo Ensaio" para publicar sua primeira galeria de clientes.'}
              </p>
              <Button variant="primary" size="sm" onClick={onCreateGallery} className="mt-4 shadow-lg shadow-[#8300E9]/30">
                <Plus className="w-4 h-4 mr-1" />
                <span>Criar Novo Ensaio</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGalleries.map((gallery) => {
                const selectedCount = gallery.clientSelection.selectedPhotoIds.length;
                const quota = gallery.quotaIncluded;
                const extraCount = Math.max(0, selectedCount - quota);
                const isCompleted = gallery.status === 'completed';

                return (
                  <Card
                    key={gallery.id}
                    className="group flex flex-col transition-all duration-300 border-white/10 bg-[#140F24]/90 hover:border-[#8300E9]/60 hover:shadow-2xl hover:shadow-[#8300E9]/15 backdrop-blur-xl"
                  >
                    {/* Cover Image & Badges */}
                    <div className="relative aspect-16/10 bg-[#0A0714] overflow-hidden rounded-t-2xl">
                      <SafeImage
                        src={gallery.coverPhotoUrl}
                        alt={gallery.title}
                        fallbackText={gallery.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 protected-photo"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140F24] via-[#140F24]/20 to-transparent" />

                      {/* Privacy Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {gallery.privacy === 'private' ? (
                          <Badge variant="default" size="sm" className="bg-black/75 backdrop-blur-md text-[#FDBD00] border border-[#FDBD00]/30 gap-1 font-mono">
                            <Lock className="w-3 h-3 text-[#FDBD00]" />
                            <span>PIN: {gallery.pinCode}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm" className="bg-black/75 backdrop-blur-md text-zinc-300 gap-1">
                            <Globe className="w-3 h-3" />
                            <span>Pública</span>
                          </Badge>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={
                            isCompleted
                              ? 'success'
                              : gallery.status === 'awaiting_client'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {isCompleted
                            ? 'Finalizado'
                            : gallery.status === 'awaiting_client'
                            ? 'Aguardando Cliente'
                            : 'Rascunho'}
                        </Badge>
                      </div>

                      {/* Photo Count tag */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-zinc-200 border border-white/10">
                          {gallery.photos.length} fotos
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-sans text-lg font-extrabold text-white group-hover:text-[#46BDC6] transition-colors line-clamp-1">
                            {gallery.title}
                          </h3>
                        </div>
                        <p className="text-xs font-medium text-zinc-400 mt-1 flex items-center gap-1">
                          <span>Cliente:</span>
                          <strong className="text-zinc-200">{gallery.clientName}</strong>
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-[#8300E9]" />
                          <span>{new Date(gallery.eventDate).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {/* Policy pill */}
                        <div className="mt-3">
                          {getPolicyBadge(gallery)}
                        </div>

                        {/* Selection Progress bar */}
                        <div className="mt-4 p-3 rounded-xl bg-[#0A0714] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Progresso de Seleção:</span>
                            <span className="font-mono font-bold text-zinc-200">
                              {selectedCount} / {quota} contratadas
                            </span>
                          </div>

                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                extraCount > 0
                                  ? 'bg-[#FDBD00]'
                                  : selectedCount === quota
                                  ? 'bg-[#46BDC6]'
                                  : 'bg-[#8300E9]'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((selectedCount / quota) * 100))}%`
                              }}
                            />
                          </div>

                          {extraCount > 0 && (
                            <p className="text-[11px] text-[#FDBD00] font-semibold">
                              +{extraCount} {extraCount === 1 ? 'foto excedente' : 'fotos excedentes'}
                              {gallery.excessPolicy === 'charge'
                                ? ` (+ R$ ${(extraCount * gallery.extraPhotoPrice).toFixed(2)})`
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Direct 3-Click Action Grid */}
                      <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onViewGalleryDetails(gallery)}
                            className="w-full text-xs font-semibold"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Ver Seleção</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenClientView(gallery.id)}
                            className="w-full text-xs border-white/10 text-zinc-200 hover:bg-white/5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visão Cliente</span>
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyClientLink(gallery)}
                              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors p-1"
                              title="Copiar link direto do cliente"
                            >
                              <Share2 className="w-3 h-3 text-[#46BDC6]" />
                              <span>Link</span>
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(gallery)}
                              className="flex items-center gap-1 text-[11px] text-[#46BDC6] hover:text-[#46BDC6]/80 transition-colors p-1 font-medium"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setWatermarkGallery(gallery)}
                              className="p-1.5 text-zinc-400 hover:text-[#8300E9] hover:bg-[#8300E9]/10 rounded transition-colors"
                              title="Marca d'Água"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditGallery(gallery)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                              title="Editar galeria"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setGalleryToDelete(gallery)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Excluir galeria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FINANCIAL & QUOTA AUDIT */}
      {dashboardTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl p-5">
              <span className="text-xs text-zinc-400">Total Faturado em Extras</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-2">
                R$ {totalExtrasBilled.toFixed(2)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">Geração de receita em ensaios com cotas</p>
            </Card>

            <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl p-5">
              <span className="text-xs text-zinc-400">Taxa de Conclusão</span>
              <div className="text-3xl font-mono font-bold text-[#46BDC6] mt-2">
                {totalGalleries > 0 ? Math.round((completedCount / totalGalleries) * 100) : 0}%
              </div>
              <p className="text-xs text-zinc-400 mt-1">{completedCount} de {totalGalleries} aprovadas</p>
            </Card>

            <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl p-5">
              <span className="text-xs text-zinc-400">Fotos Aprovadas no Total</span>
              <div className="text-3xl font-mono font-bold text-white mt-2">
                {totalPhotosSelected}
              </div>
              <p className="text-xs text-zinc-400 mt-1">De {totalPhotosCataloged} fotos publicadas</p>
            </Card>
          </div>

          <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Relatório de Faturamento por Cliente</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Detalhamento de fotos contratadas vs selecionadas e total a receber.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0714] text-zinc-400 uppercase tracking-wider font-mono border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Projeto / Cliente</th>
                    <th className="py-3 px-4">Data Ensaio</th>
                    <th className="py-3 px-4">Política de Excedente</th>
                    <th className="py-3 px-4 text-center">Cota / Selecionadas</th>
                    <th className="py-3 px-4 text-center">Fotos Extras</th>
                    <th className="py-3 px-4 text-right">Valor Extra (R$)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {galleries.map((g) => {
                    const selCount = g.clientSelection.selectedPhotoIds.length;
                    const extras = Math.max(0, selCount - g.quotaIncluded);
                    const billed = g.excessPolicy === 'charge' ? extras * g.extraPhotoPrice : 0;

                    return (
                      <tr key={g.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{g.title}</div>
                          <div className="text-[11px] text-zinc-400">{g.clientName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {new Date(g.eventDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4">
                          {getPolicyBadge(g)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-white font-bold">{selCount}</span> / {g.quotaIncluded}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {extras > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-[#FDBD00]/20 text-[#FDBD00] font-bold">
                              +{extras}
                            </span>
                          ) : (
                            <span className="text-zinc-500">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {billed > 0 ? `R$ ${billed.toFixed(2)}` : 'R$ 0,00'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={g.status === 'completed' ? 'success' : g.status === 'awaiting_client' ? 'warning' : 'default'}
                            size="sm"
                          >
                            {g.status === 'completed' ? 'Finalizado' : g.status === 'awaiting_client' ? 'Em Seleção' : 'Rascunho'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: CLIENT DIRECTORY & WHATSAPP */}
      {dashboardTab === 'clients' && (
        <div className="space-y-4">
          <Card className="bg-[#140F24]/80 border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Diretório de Clientes & Envio em 1 Clique</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Dispare acessos com PIN direto pelo WhatsApp ou copie os links formatados.</p>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {galleries.map((g) => (
                <div key={g.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{g.clientName}</span>
                      <span className="text-xs text-zinc-400 font-sans">({g.title})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      {g.clientEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{g.clientEmail}</span>
                        </span>
                      )}
                      {g.clientPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{g.clientPhone}</span>
                        </span>
                      )}
                      {g.privacy === 'private' && (
                        <span className="font-mono text-[#FDBD00] font-semibold px-2 py-0.5 rounded bg-[#FDBD00]/10 border border-[#FDBD00]/20">
                          PIN: {g.pinCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyClientLink(g)}
                      className="text-xs border-white/10 text-zinc-200"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1 text-[#46BDC6]" />
                      <span>Copiar Link</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWhatsAppShare(g)}
                      className="text-xs bg-[#46BDC6]/15 border-[#46BDC6]/30 text-[#46BDC6] hover:bg-[#46BDC6]/25 font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      <span>WhatsApp</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenClientView(g.id)}
                      className="text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Ver Portal</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: User Management (Admin RBAC) */}
      {dashboardTab === 'users' && (
        <UserManagementView onShowToast={onShowToast} />
      )}

      {/* Settings & Password Modal */}
      <PhotographerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={photographerProfile}
        onProfileUpdated={onUpdateProfile}
        onShowToast={onShowToast}
      />

      {/* Delete Gallery Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!galleryToDelete}
        onClose={() => setGalleryToDelete(null)}
        onConfirm={() => {
          if (galleryToDelete) {
            onDeleteGallery(galleryToDelete.id);
            setGalleryToDelete(null);
          }
        }}
        galleryTitle={galleryToDelete?.title || ''}
      />

      {/* Watermark Settings Modal */}
      {watermarkGallery && (
        <WatermarkSettingsModal
          isOpen={!!watermarkGallery}
          onClose={() => setWatermarkGallery(null)}
          gallery={watermarkGallery}
          onSave={onEditGallery}
          onShowToast={onShowToast}
        />
      )}

      {/* Adobe Lightroom Import Modal */}
      {isAdobeImportOpen && (
        <AdobeImportModal
          userId={user?.id || ''}
          isOpen={isAdobeImportOpen}
          onClose={() => setIsAdobeImportOpen(false)}
          onGalleryCreated={(newGallery) => {
            onViewGalleryDetails(newGallery);
          }}
          onShowToast={(type, title, description) => {
            onShowToast(title, description, type);
          }}
        />
      )}
    </div>
  );
};
