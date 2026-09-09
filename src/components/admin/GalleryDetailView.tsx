import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { generateLightroomSelectionString, downloadApprovalManifest } from '../../lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  MessageSquare,
  Sparkles,
  DollarSign,
  Calendar,
  User,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Ban,
  Clock
} from 'lucide-react';

export interface GalleryDetailViewProps {
  gallery: Gallery;
  onBack: () => void;
  onOpenClientView: (galleryId: string) => void;
  onEditGallery: (gallery: Gallery) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const GalleryDetailView: React.FC<GalleryDetailViewProps> = ({
  gallery,
  onBack,
  onOpenClientView,
  onEditGallery,
  onShowToast
}) => {
  const [copiedWithExt, setCopiedWithExt] = useState(false);
  const [copiedNoExt, setCopiedNoExt] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'package' | 'extra' | 'commented'>('all');

  const selectedMap = new Set(gallery.clientSelection.selectedPhotoIds || []);
  const selectedPhotos = gallery.photos.filter((p) => selectedMap.has(p.id));

  const quota = gallery.quotaIncluded;
  const packagePhotos = selectedPhotos.slice(0, quota);
  const extraPhotos = selectedPhotos.slice(quota);

  const commentsCount = Object.keys(gallery.clientSelection.comments || {}).length;

  const handleCopyLightroom = (stripExt: boolean) => {
    if (selectedPhotos.length === 0) {
      onShowToast('Nenhuma foto selecionada', 'O cliente ainda não selecionou nenhuma foto.', 'warning');
      return;
    }
    const filterString = generateLightroomSelectionString(selectedPhotos, stripExt);
    navigator.clipboard.writeText(filterString);

    if (stripExt) {
      setCopiedNoExt(true);
      setTimeout(() => setCopiedNoExt(false), 2500);
    } else {
      setCopiedWithExt(true);
      setTimeout(() => setCopiedWithExt(false), 2500);
    }

    onShowToast(
      'Copiado para o Lightroom!',
      `${selectedPhotos.length} nomes de arquivos copiados para o filtro do Lightroom.`,
      'success'
    );
  };

  const handleDownloadTxt = () => {
    if (selectedPhotos.length === 0) {
      onShowToast('Nenhuma foto selecionada', 'Não há fotos para exportar no momento.', 'warning');
      return;
    }
    downloadApprovalManifest(gallery);
    onShowToast('Download iniciado', 'Arquivo .txt gerado com o relatório completo da seleção.', 'success');
  };

  // Filtered photos to display
  const displayedPhotos = selectedPhotos.filter((p, index) => {
    if (activeFilter === 'package') return index < quota;
    if (activeFilter === 'extra') return index >= quota;
    if (activeFilter === 'commented') return !!gallery.clientSelection.comments[p.id];
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar with back button and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Voltar às Galerias</span>
          </Button>
          <div className="h-4 w-px bg-zinc-800" />
          <Badge
            variant={
              gallery.status === 'completed'
                ? 'success'
                : gallery.status === 'awaiting_client'
                ? 'warning'
                : 'default'
            }
          >
            {gallery.status === 'completed'
              ? 'Seleção Concluída pelo Cliente'
              : gallery.status === 'awaiting_client'
              ? 'Aguardando Cliente'
              : 'Rascunho'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEditGallery(gallery)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Editar Configurações</span>
          </Button>
          <Button variant="amber" size="sm" onClick={() => onOpenClientView(gallery.id)}>
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Visão do Cliente</span>
          </Button>
        </div>
      </div>

      {/* Gallery Header Info Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {gallery.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <User className="w-4 h-4 text-amber-400" />
                <span>{gallery.clientName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>{new Date(gallery.eventDate).toLocaleDateString('pt-BR')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>{gallery.photos.length} fotos carregadas</span>
              </span>
              <span className="flex items-center gap-1.5">
                {gallery.privacy === 'private' ? (
                  <span className="text-amber-400/90 font-mono">PIN: {gallery.pinCode}</span>
                ) : (
                  <span className="text-zinc-400">Pública</span>
                )}
              </span>
            </div>
            {gallery.clientSelection.completedAt && (
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <Check className="w-3.5 h-3.5" />
                <span>Submetida pelo cliente em {new Date(gallery.clientSelection.completedAt).toLocaleString('pt-BR')}</span>
              </p>
            )}
          </div>

          {/* Core Export Actions: Lightroom & TXT */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 shrink-0">
            <div className="text-left sm:text-right pr-2 hidden sm:block">
              <span className="block text-[11px] uppercase font-mono tracking-wider text-zinc-400">
                Filtro Lightroom
              </span>
              <span className="text-xs font-semibold text-zinc-200">
                {selectedPhotos.length} fotos prontas
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopyLightroom(false)}
              className="font-mono text-xs"
              title="Copiar lista de arquivos com extensão para o catálogo do Lightroom"
            >
              {copiedWithExt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar p/ Lightroom</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyLightroom(true)}
              className="font-mono text-xs hidden md:inline-flex"
              title="Copiar apenas nomes dos arquivos sem extensão"
            >
              {copiedNoExt ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>Sem .ext</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTxt}
              title="Baixar relatório de aprovação em texto (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar .TXT</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Numerical Stats & Quota Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/40">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Total Selecionadas</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-zinc-100">
                {selectedPhotos.length}
              </span>
              <span className="text-xs text-zinc-500">de {gallery.photos.length} fotos</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {Math.round((selectedPhotos.length / (gallery.photos.length || 1)) * 100)}% do acervo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Dentro da Cota Contratada</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {packagePhotos.length}
              </span>
              <span className="text-xs text-zinc-500">/ {quota} no pacote</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {packagePhotos.length >= quota ? 'Cota 100% preenchida' : `Restam ${quota - packagePhotos.length} fotos`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Fotos Excedentes</span>
              <Badge
                variant={
                  gallery.excessPolicy === 'charge'
                    ? 'warning'
                    : gallery.excessPolicy === 'free_approval'
                    ? 'info'
                    : 'default'
                }
                size="sm"
              >
                {gallery.excessPolicy === 'charge'
                  ? 'Com Cobrança'
                  : gallery.excessPolicy === 'free_approval'
                  ? 'Aprovação Pura'
                  : 'Bloqueio'}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-400">
                {extraPhotos.length}
              </span>
              <span className="text-xs text-zinc-500">além da cota</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {gallery.excessPolicy === 'charge'
                ? `R$ ${gallery.extraPhotoPrice.toFixed(2)} por foto extra`
                : gallery.excessPolicy === 'free_approval'
                ? 'Extras autorizadas sem custo'
                : 'Bloqueio de novas adições'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Subtotal a Receber (Extras)</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-emerald-300">
                {gallery.excessPolicy === 'charge'
                  ? `R$ ${(extraPhotos.length * gallery.extraPhotoPrice).toFixed(2)}`
                  : 'R$ 0,00'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {commentsCount} comentários deixados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Message / Observation Box */}
      {gallery.clientSelection.clientNotes && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-300">
              <MessageSquare className="w-4 h-4" />
              <span>Mensagem Final do Cliente:</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-200 italic leading-relaxed">
              &ldquo;{gallery.clientSelection.clientNotes}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs for Selected Photos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas Selecionadas ({selectedPhotos.length})
          </button>
          <button
            onClick={() => setActiveFilter('package')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'package'
                ? 'bg-zinc-800 text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            No Pacote ({packagePhotos.length})
          </button>
          {extraPhotos.length > 0 && (
            <button
              onClick={() => setActiveFilter('extra')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'extra'
                  ? 'bg-zinc-800 text-amber-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Excedentes / Extras (+{extraPhotos.length})
            </button>
          )}
          {commentsCount > 0 && (
            <button
              onClick={() => setActiveFilter('commented')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'commented'
                  ? 'bg-zinc-800 text-sky-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Com Comentários ({commentsCount})
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-400">
          Mostrando <span className="text-zinc-200 font-semibold">{displayedPhotos.length}</span> fotos
        </div>
      </div>

      {/* Selected Photos Grid */}
      {displayedPhotos.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-zinc-850 bg-zinc-900/30">
          <p className="text-sm text-zinc-400">Nenhuma foto encontrada para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedPhotos.map((photo) => {
            const overallIndex = selectedPhotos.findIndex((p) => p.id === photo.id);
            const isExtra = overallIndex >= quota;
            const comment = gallery.clientSelection.comments[photo.id];

            return (
              <Card
                key={photo.id}
                className={`transition-all hover:border-zinc-700 overflow-hidden ${
                  isExtra ? 'border-amber-500/40 bg-zinc-900/70' : 'border-zinc-800/80 bg-zinc-900/50'
                }`}
              >
                <div className="relative aspect-3/2 bg-zinc-950 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.originalFileName}
                    className="w-full h-full object-cover protected-photo"
                  />

                  {/* Order badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant={isExtra ? 'amber' : 'default'} size="sm" className="font-mono font-bold">
                      {isExtra ? `+ EXTRA #${overallIndex + 1}` : `#${overallIndex + 1}`}
                    </Badge>
                  </div>

                  {/* Comment indicator badge */}
                  {comment && (
                    <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-sky-500 text-zinc-950 shadow">
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                      {photo.originalFileName}
                    </span>
                    {isExtra && gallery.excessPolicy === 'charge' && (
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">
                        +R$ {gallery.extraPhotoPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {photo.caption && (
                    <p className="text-xs text-zinc-400 truncate">{photo.caption}</p>
                  )}

                  {/* Comment box if customer left notes for this photo */}
                  {comment && (
                    <div className="mt-2 p-2 rounded-lg bg-zinc-950/80 border border-sky-500/30 text-xs text-sky-200">
                      <span className="font-semibold text-sky-400 block text-[10px] uppercase tracking-wider mb-0.5">
                        Observação do Cliente:
                      </span>
                      &ldquo;{comment}&rdquo;
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
