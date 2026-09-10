import React, { useState } from 'react';
import { Gallery, PhotographerProfile } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { SafeImage } from '../common/SafeImage';
import { PhotographerSettingsModal } from './PhotographerSettingsModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
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
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Ban,
  Share2,
  FileCheck,
  ShieldCheck,
  KeyRound,
  LogOut,
  BarChart3,
  Users,
  Settings,
  MessageCircle,
  Mail,
  Phone
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
  const [dashboardTab, setDashboardTab] = useState<'galleries' | 'financial' | 'clients'>('galleries');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_client' | 'completed' | 'draft'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<Gallery | null>(null);

  // Metrics computation
  const totalGalleries = galleries.length;
  const awaitingCount = galleries.filter((g) => g.status === 'awaiting_client').length;
  const completedCount = galleries.filter((g) => g.status === 'completed').length;
  
  // Total extra billed from charge policy galleries
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
      `Link direto com PIN para "${gallery.title}". Acesso exclusivo por PIN (sem necessidade de conta Google).`,
      'success'
    );
  };

  const handleWhatsAppShare = (gallery: Gallery) => {
    const url = getClientGalleryUrl(gallery.id);
    const pinInfo = gallery.privacy === 'private' ? `\n🔑 PIN de acesso exclusivo: ${gallery.pinCode}` : '';
    const message = `Olá, ${gallery.clientName}! Sua galeria de fotos "${gallery.title}" está disponível para seleção!\n\n🔗 Acesse o link: ${url}${pinInfo}\n\n(Acesso direto por PIN. Não é necessário criar conta nem fazer login no Google).`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${gallery.clientPhone ? gallery.clientPhone.replace(/\D/g, '') : ''}?text=${encoded}`, '_blank');
  };

  const getPolicyBadge = (gallery: Gallery) => {
    if (gallery.excessPolicy === 'block') {
      return (
        <Badge variant="default" size="sm" className="gap-1 bg-zinc-800/80 text-zinc-300">
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
        <span>Aprovação Pura (Sem Custo)</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Photographer Profile & Management Status Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {photographerProfile.avatarUrl ? (
              <img
                src={photographerProfile.avatarUrl}
                alt={photographerProfile.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl">
                {photographerProfile.name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow" title="Fotógrafo Conectado" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                {photographerProfile.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Autenticado</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              <strong className="text-amber-400 font-medium">{photographerProfile.studioName}</strong> • {photographerProfile.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs"
          >
            <Settings className="w-3.5 h-3.5 mr-1 text-zinc-400" />
            <span>Configurações & Senha</span>
          </Button>

          <Button
            variant="amber"
            size="sm"
            onClick={onCreateGallery}
            className="text-xs shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Criar Nova Galeria</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            title="Encerrar sessão segura do fotógrafo"
            className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setDashboardTab('galleries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'galleries'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Galerias & Ensaios ({totalGalleries})</span>
        </button>

        <button
          onClick={() => setDashboardTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'financial'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Relatório de Faturamento & Cotas</span>
        </button>

        <button
          onClick={() => setDashboardTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            dashboardTab === 'clients'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Diretório de Clientes & Links</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Total de Galerias</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-zinc-100">{totalGalleries}</span>
              <span className="text-xs text-zinc-500">ensaios</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{totalPhotosCataloged} fotos no catálogo geral</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-amber-400/90">Aguardando Cliente</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-400">{awaitingCount}</span>
              <span className="text-xs text-zinc-500">em seleção</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Clientes escolhendo fotos</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-emerald-400/90">Seleções Concluídas</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">{completedCount}</span>
              <span className="text-xs text-zinc-500">prontas</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Aprovadas para pós-produção</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-amber-300">Receita de Fotos Extras</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-emerald-300">
                R$ {totalExtrasBilled.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{totalPhotosSelected} fotos aprovadas no total</p>
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
                placeholder="Buscar por cliente ou título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todas ({totalGalleries})
              </button>
              <button
                onClick={() => setStatusFilter('awaiting_client')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'awaiting_client'
                    ? 'bg-zinc-800 text-amber-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Aguardando Cliente ({awaitingCount})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-zinc-800 text-emerald-400 font-semibold'
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
            <div className="text-center py-20 px-4 rounded-2xl border border-zinc-850 bg-zinc-900/20">
              <ImageIcon className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <h3 className="text-lg font-semibold text-zinc-300">Nenhuma galeria encontrada</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? 'Tente ajustar os termos de busca ou filtros aplicados.'
                  : 'Clique em "Criar Nova Galeria" para publicar seu primeiro ensaio.'}
              </p>
              <Button variant="outline" size="sm" onClick={onCreateGallery} className="mt-4">
                <Plus className="w-4 h-4 mr-1" />
                <span>Criar Galeria Agora</span>
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
                    className="group flex flex-col transition-all duration-300 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-amber-500/5"
                  >
                    {/* Cover Image & Badges */}
                    <div className="relative aspect-16/10 bg-zinc-950 overflow-hidden">
                      <SafeImage
                        src={gallery.coverPhotoUrl}
                        alt={gallery.title}
                        fallbackText={gallery.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 protected-photo"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      {/* Privacy Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {gallery.privacy === 'private' ? (
                          <Badge variant="default" size="sm" className="bg-black/70 backdrop-blur-md text-amber-300 border-amber-500/30 gap-1 font-mono">
                            <Lock className="w-3 h-3" />
                            <span>PIN: {gallery.pinCode}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm" className="bg-black/70 backdrop-blur-md text-zinc-300 gap-1">
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
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                          {gallery.photos.length} fotos no catálogo
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                            {gallery.title}
                          </h3>
                        </div>
                        <p className="text-xs font-medium text-zinc-400 mt-1 flex items-center gap-1">
                          <span>Cliente:</span>
                          <strong className="text-zinc-200">{gallery.clientName}</strong>
                        </p>

                        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(gallery.eventDate).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {/* Policy pill */}
                        <div className="mt-3">
                          {getPolicyBadge(gallery)}
                        </div>

                        {/* Selection Progress bar */}
                        <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Progresso da Seleção:</span>
                            <span className="font-mono font-semibold text-zinc-200">
                              {selectedCount} de {quota} contratadas
                            </span>
                          </div>

                          {/* Bar */}
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                extraCount > 0
                                  ? 'bg-amber-400'
                                  : selectedCount === quota
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-300'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((selectedCount / quota) * 100))}%`
                              }}
                            />
                          </div>

                          {extraCount > 0 && (
                            <p className="text-[11px] text-amber-300/90 font-medium">
                              +{extraCount} {extraCount === 1 ? 'foto excedente' : 'fotos excedentes'}
                              {gallery.excessPolicy === 'charge'
                                ? ` (+ R$ ${(extraCount * gallery.extraPhotoPrice).toFixed(2)})`
                                : ' (autorizadas para pós)'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions Grid */}
                      <div className="pt-2 border-t border-zinc-800/60 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => onViewGalleryDetails(gallery)}
                            className="w-full text-xs"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Ver Seleção</span>
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenClientView(gallery.id)}
                            className="w-full text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Cliente</span>
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyClientLink(gallery)}
                              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                              title="Copiar link direto do cliente"
                            >
                              <Share2 className="w-3 h-3 text-amber-400" />
                              <span>Link</span>
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(gallery)}
                              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditGallery(gallery)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
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

      {/* TAB 2: FINANCIAL & QUOTA AUDIT REPORT */}
      {dashboardTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-zinc-900/60 p-5">
              <span className="text-xs text-zinc-400">Total Faturado em Extras</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-2">
                R$ {totalExtrasBilled.toFixed(2)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Apenas ensaios com política de cobrança</p>
            </Card>

            <Card className="bg-zinc-900/60 p-5">
              <span className="text-xs text-zinc-400">Taxa de Conversão de Aprovação</span>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-2">
                {totalGalleries > 0 ? Math.round((completedCount / totalGalleries) * 100) : 0}%
              </div>
              <p className="text-xs text-zinc-500 mt-1">{completedCount} de {totalGalleries} ensaios concluídos</p>
            </Card>

            <Card className="bg-zinc-900/60 p-5">
              <span className="text-xs text-zinc-400">Total de Fotos Selecionadas</span>
              <div className="text-3xl font-mono font-bold text-zinc-100 mt-2">
                {totalPhotosSelected}
              </div>
              <p className="text-xs text-zinc-500 mt-1">De um catálogo total de {totalPhotosCataloged} fotos</p>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="bg-zinc-900/60 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-100">Demonstrativo por Ensaio & Faturamento</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Auditoria detalhada de fotos inclusas, extras e receita gerada por cliente.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
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
                <tbody className="divide-y divide-zinc-800/60">
                  {galleries.map((g) => {
                    const selCount = g.clientSelection.selectedPhotoIds.length;
                    const extras = Math.max(0, selCount - g.quotaIncluded);
                    const billed = g.excessPolicy === 'charge' ? extras * g.extraPhotoPrice : 0;

                    return (
                      <tr key={g.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-200">{g.title}</div>
                          <div className="text-[11px] text-zinc-400">{g.clientName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {new Date(g.eventDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4">
                          {getPolicyBadge(g)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-zinc-200 font-semibold">{selCount}</span> / {g.quotaIncluded}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {extras > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
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

      {/* TAB 3: CLIENT DIRECTORY & ACCESS LINKS */}
      {dashboardTab === 'clients' && (
        <div className="space-y-4">
          <Card className="bg-zinc-900/60 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-100">Diretório de Clientes & Acessos Diretos</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Envie links e PINs diretamente para os clientes pelo WhatsApp ou e-mail.</p>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {galleries.map((g) => (
                <div key={g.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">{g.clientName}</span>
                      <span className="text-xs text-zinc-400 font-serif">({g.title})</span>
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
                        <span className="font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
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
                      className="text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      <span>Copiar Link</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWhatsAppShare(g)}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      <span>WhatsApp</span>
                    </Button>

                    <Button
                      variant="amber"
                      size="sm"
                      onClick={() => onOpenClientView(g.id)}
                      className="text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Visualizar Portal</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
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
    </div>
  );
};
