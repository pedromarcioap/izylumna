import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { generateLightroomSelectionString, downloadApprovalManifest } from '../../lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../common/SafeImage';
import { uploadPhotoFile } from '../../lib/photoUpload';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  MessageSquare,
  Sparkles,
  Calendar,
  User,
  Eye,
  SlidersHorizontal,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Filter,
  Upload
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [copiedWithExt, setCopiedWithExt] = useState(false);
  const [copiedNoExt, setCopiedNoExt] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'consensus' | 'all_voted' | 'voter' | 'package' | 'extra' | 'commented'>('consensus');
  const [selectedVoterIdFilter, setSelectedVoterIdFilter] = useState<string>('');

  const handleDetailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];

    // Create temporary entries with blob URLs for immediate UI feedback
    const tempItems = fileList.map((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
        file,
        blobUrl,
        photo: {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
          originalFileName: file.name,
          url: blobUrl,
          caption: file.name.replace(/\.[^/.]+$/, '')
        }
      };
    });

    let currentPhotos = [...gallery.photos, ...tempItems.map((t) => t.photo)];

    // Instantly update gallery with temp photos for instant responsiveness
    onEditGallery({
      ...gallery,
      photos: currentPhotos,
      updatedAt: new Date().toISOString()
    });

    onShowToast(
      'Processando fotos...',
      `Enviando ${fileList.length} ${fileList.length === 1 ? 'foto' : 'fotos'}...`,
      'info'
    );

    // Process files asynchronously to generate permanent URLs (Supabase storage or Base64 Data URL)
    let uploadFailed = false;
    for (const item of tempItems) {
      try {
        const permanentUrl = await uploadPhotoFile(item.file, gallery.id);
        URL.revokeObjectURL(item.blobUrl);

        currentPhotos = currentPhotos.map((p) =>
          p.id === item.photo.id ? { ...p, url: permanentUrl } : p
        );

        onEditGallery({
          ...gallery,
          photos: currentPhotos.filter((p) => p.url && !p.url.startsWith('blob:')),
          updatedAt: new Date().toISOString()
        });
      } catch (err: any) {
        uploadFailed = true;
        console.error('[GalleryDetailView] Erro ao carregar foto:', err);
        URL.revokeObjectURL(item.blobUrl);
        currentPhotos = currentPhotos.filter((p) => p.id !== item.photo.id);
        onEditGallery({
          ...gallery,
          photos: currentPhotos.filter((p) => p.url && !p.url.startsWith('blob:')),
          updatedAt: new Date().toISOString()
        });
        onShowToast(
          'Falha no Upload',
          `Não foi possível enviar "${item.file.name}". O upload foi interrompido.`,
          'error'
        );
      }
    }

    if (!uploadFailed) {
      onShowToast(
        'Upload Concluído!',
        `Fotos salvas e sincronizadas com sucesso.`,
        'success'
      );
    }
  };

  const threshold = gallery.consensusThreshold || 2;
  const votesMap = gallery.clientSelection.votes || {};
  const commentsMap = gallery.clientSelection.commentsMap || {};
  const voters = gallery.voters || gallery.predefinedVoters || [];

  // Consensus photos (photos with votes >= threshold)
  const consensusPhotos = gallery.photos.filter(
    (p) => (votesMap[p.id] || []).length >= threshold
  );

  // All voted photos (photos with at least 1 vote)
  const allVotedPhotos = gallery.photos.filter(
    (p) => (votesMap[p.id] || []).length > 0
  );

  // Photos voted by selected voter
  const voterPhotos = gallery.photos.filter((p) =>
    (votesMap[p.id] || []).some((v) => v.voterId === selectedVoterIdFilter)
  );

  // Package / extra photos based on consensus
  const quota = gallery.quotaIncluded;
  const packagePhotos = consensusPhotos.slice(0, quota);
  const extraPhotos = consensusPhotos.slice(quota);

  const commentsCount = gallery.photos.filter((p) => (commentsMap[p.id] || []).length > 0).length;

  // Determine current working export list based on active filter
  const getExportPhotos = (): Photo[] => {
    if (activeFilter === 'consensus') return consensusPhotos;
    if (activeFilter === 'all_voted') return allVotedPhotos;
    if (activeFilter === 'voter') return voterPhotos;
    if (activeFilter === 'package') return packagePhotos;
    if (activeFilter === 'extra') return extraPhotos;
    return consensusPhotos;
  };

  const handleCopyLightroom = (stripExt: boolean) => {
    const exportList = getExportPhotos();
    if (exportList.length === 0) {
      onShowToast('Nenhuma foto encontrada', 'Não há fotos nesta categoria para exportar.', 'warning');
      return;
    }
    const filterString = generateLightroomSelectionString(exportList, stripExt);
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
      `${exportList.length} nomes de arquivos copiados para o filtro do Lightroom.`,
      'success'
    );
  };

  const handleDownloadTxt = () => {
    const exportType = activeFilter === 'voter' ? 'voter' : activeFilter === 'consensus' ? 'consensus' : 'all';
    downloadApprovalManifest(gallery, exportType as any, selectedVoterIdFilter || undefined);
    onShowToast('Download iniciado', 'Relatório completo de aprovação gerado em arquivo .txt', 'success');
  };

  // Display photos grid
  const getDisplayedPhotos = () => {
    if (activeFilter === 'consensus') return consensusPhotos;
    if (activeFilter === 'all_voted') return allVotedPhotos;
    if (activeFilter === 'voter') return voterPhotos;
    if (activeFilter === 'package') return packagePhotos;
    if (activeFilter === 'extra') return extraPhotos;
    if (activeFilter === 'commented') return gallery.photos.filter((p) => (commentsMap[p.id] || []).length > 0);
    return consensusPhotos;
  };

  const displayedPhotos = getDisplayedPhotos();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar */}
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
              ? 'Consenso Finalizado'
              : gallery.status === 'awaiting_client'
              ? 'Votação Colaborativa em Andamento'
              : 'Rascunho'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleDetailFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Upload de fotos adicionais para este ensaio (sem limite)"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Adicionar Fotos</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditGallery(gallery)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurações & Regras</span>
          </Button>
          <Button variant="amber" size="sm" onClick={() => onOpenClientView(gallery.id)}>
            <Eye className="w-3.5 h-3.5" />
            <span>Visão do Cliente (Votante)</span>
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                {gallery.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
                Consenso ≥ {threshold} Votos
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <User className="w-4 h-4 text-amber-400" />
                <span>Cliente: {gallery.clientName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>{new Date(gallery.eventDate).toLocaleDateString('pt-BR')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>{gallery.photos.length} fotos no acervo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-amber-400/90 font-mono">PIN: {gallery.pinCode || 'Sem PIN'}</span>
              </span>
            </div>
          </div>

          {/* Export Controls for Lightroom */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 shrink-0">
            <div className="text-left sm:text-right pr-2 hidden sm:block">
              <span className="block text-[11px] uppercase font-mono tracking-wider text-zinc-400">
                Filtro Lightroom
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {getExportPhotos().length} fotos no filtro
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopyLightroom(false)}
              className="font-mono text-xs"
              title="Copiar lista de fotos para colar na busca do Lightroom"
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
            >
              {copiedNoExt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>Sem .ext</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
              <Download className="w-3.5 h-3.5" />
              <span>Relatório .TXT</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Participants & Consensus Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Participants Cards */}
        <Card className="lg:col-span-2 bg-zinc-900/40">
          <CardHeader className="pb-3 border-b border-zinc-850">
            <CardTitle className="text-sm font-semibold flex items-center justify-between text-zinc-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Painel de Participantes & Votantes</span>
              </div>
              <span className="text-xs text-zinc-500 font-normal">
                {voters.filter((v) => v.hasFinalized).length}/{voters.length || 1} finalizados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voters.map((voter) => {
                const votesCount = gallery.photos.filter((p) =>
                  (votesMap[p.id] || []).some((v) => v.voterId === voter.id)
                ).length;

                return (
                  <div
                    key={voter.id}
                    className={`p-3 rounded-xl border transition-all ${
                      voter.hasFinalized
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-zinc-950/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            voter.hasFinalized
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {voter.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block">{voter.name}</span>
                          {voter.isDecisionMaker && (
                            <span className="text-[9px] text-amber-400 font-mono uppercase">
                              Tomador Principal
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant={voter.hasFinalized ? 'success' : 'warning'} size="sm">
                        {voter.hasFinalized ? 'Finalizou' : 'Votando'}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-850">
                      <span>{votesCount} fotos votadas</span>
                      <button
                        onClick={() => {
                          setSelectedVoterIdFilter(voter.id);
                          setActiveFilter('voter');
                        }}
                        className="text-amber-400 hover:underline text-[11px] font-medium flex items-center gap-1"
                      >
                        <Filter className="w-3 h-3" /> Ver votos
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Consensus Metrics */}
        <Card className="bg-zinc-900/40">
          <CardHeader className="pb-3 border-b border-zinc-850">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Resumo do Consenso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <span className="text-xs font-medium text-zinc-400 block">Fotos com Consenso (≥ {threshold} Votos)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-amber-400">
                  {consensusPhotos.length}
                </span>
                <span className="text-xs text-zinc-500">de {quota} contratadas</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-850">
              <span className="text-xs font-medium text-zinc-400 block">Status da Cota</span>
              <p className="text-xs text-zinc-300 mt-1">
                {consensusPhotos.length > quota ? (
                  <span className="text-amber-400 font-semibold">
                    +{consensusPhotos.length - quota} foto(s) excedente(s) em consenso
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    Dentro da cota contratada ({quota - consensusPhotos.length} vagas restantes)
                  </span>
                )}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-850 text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Fotos com pelo menos 1 voto:</span>
                <span className="font-mono text-zinc-200 font-semibold">{allVotedPhotos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fotos com comentários:</span>
                <span className="font-mono text-sky-400 font-semibold">{commentsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs for Photos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveFilter('consensus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'consensus'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⭐ Consenso ({consensusPhotos.length})
          </button>
          <button
            onClick={() => setActiveFilter('all_voted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'all_voted'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas Votadas ({allVotedPhotos.length})
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
              Excedentes ({extraPhotos.length})
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
              Comentadas ({commentsCount})
            </button>
          )}
        </div>

        {/* Voter Select Filter dropdown if activeFilter === 'voter' */}
        {voters.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Filtrar por Votante:</span>
            <select
              value={selectedVoterIdFilter}
              onChange={(e) => {
                setSelectedVoterIdFilter(e.target.value);
                if (e.target.value) setActiveFilter('voter');
              }}
              className="py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-zinc-200"
            >
              <option value="">Selecione um votante...</option>
              {voters.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {displayedPhotos.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-zinc-850 bg-zinc-900/30">
          <p className="text-sm text-zinc-400">Nenhuma foto encontrada para este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedPhotos.map((photo) => {
            const votesList = votesMap[photo.id] || [];
            const commentsList = commentsMap[photo.id] || [];
            const isConsensus = votesList.length >= threshold;

            return (
              <Card
                key={photo.id}
                className={`transition-all hover:border-zinc-700 overflow-hidden ${
                  isConsensus ? 'border-amber-500/40 bg-zinc-900/70' : 'border-zinc-800/80 bg-zinc-900/50'
                }`}
              >
                <div className="relative aspect-3/2 bg-zinc-950 overflow-hidden">
                  <SafeImage
                    src={photo.url}
                    alt={photo.originalFileName}
                    fallbackText={photo.originalFileName}
                    className="w-full h-full object-cover protected-photo"
                  />

                  {/* Consensus Badge */}
                  {isConsensus && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3 h-3 fill-current" />
                      <span>CONSENSO ({votesList.length})</span>
                    </div>
                  )}

                  {/* Comment indicator badge */}
                  {commentsList.length > 0 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-sky-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 fill-current" />
                      <span>{commentsList.length}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                      {photo.originalFileName}
                    </span>
                  </div>

                  {/* Voter Chips */}
                  {votesList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {votesList.map((v) => (
                        <span
                          key={v.voterId}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-medium"
                        >
                          ✓ {v.voterName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 block">Nenhum voto registrado</span>
                  )}

                  {/* Comments Timeline snippet */}
                  {commentsList.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-zinc-950/80 border border-sky-500/30 text-xs text-sky-200 space-y-1">
                      <span className="font-semibold text-sky-400 block text-[10px] uppercase tracking-wider">
                        Comentários ({commentsList.length}):
                      </span>
                      {commentsList.map((c) => (
                        <div key={c.id} className="text-[11px]">
                          <span className="font-semibold text-zinc-300">{c.voterName}:</span> &ldquo;{c.text}&rdquo;
                        </div>
                      ))}
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
