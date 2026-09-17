import React, { useState, useEffect } from 'react';
import { Gallery, Photo } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getValidAdobeAccessToken, syncClientVotesToAdobe } from '../../lib/adobeLightroom';
import {
  generateLightroomSelectionString,
  resetGalleryVotesAsync,
  resetVoterVotesAsync,
  clearPhotoVotesAsync,
  deleteVoteAsync,
  setPhotoRatingAsync
} from '../../lib/storage';
import { StarRating } from '../common/StarRating';
import { downloadApprovalManifest, generateFilenamesList } from '../../lib/exportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { SafeImage } from '../common/SafeImage';
import { uploadPhotoFile, uploadPhotosInBatches } from '../../lib/photoUpload';
import { extractExif } from '../../lib/exif';
import { PhotoTechnicalDetails } from '../common/PhotoTechnicalDetails';
import { WatermarkSettingsModal } from './WatermarkSettingsModal';
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
  Upload,
  ShieldCheck,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Cloud,
  Loader2
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
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [copiedWithExt, setCopiedWithExt] = useState(false);
  const [copiedNoExt, setCopiedNoExt] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'consensus' | 'all_voted' | 'voter' | 'package' | 'extra' | 'commented'>('consensus');
  const [selectedVoterIdFilter, setSelectedVoterIdFilter] = useState<string>('');
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isSyncingAdobe, setIsSyncingAdobe] = useState(false);

  // Voting reset modal states
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [voterToReset, setVoterToReset] = useState<any | null>(null);
  const [photoToClear, setPhotoToClear] = useState<Photo | null>(null);

  // Closure fee payment modal states
  const [isClosureFeeModalOpen, setIsClosureFeeModalOpen] = useState(false);
  const [isGeneratingClosurePix, setIsGeneratingClosurePix] = useState(false);
  const [copiedClosurePix, setCopiedClosurePix] = useState(false);
  const [closurePixData, setClosurePixData] = useState<{
    orderId?: string;
    copyPaste: string;
    qrCodeBase64: string;
    amount: number;
    isMock?: boolean;
  } | null>(null);

  const isExportUnlocked = gallery.paymentStatus === 'paid' || gallery.paymentStatus === 'waived';
  const closureFee = gallery.galleryClosureFee ?? 6.90;

  // Supabase Realtime listener for Gallery & Order Payment Unlocks
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !gallery?.id) return;

    let galleryChannel: any = null;

    galleryChannel = supabase
      .channel(`gallery-payment-${gallery.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'galleries',
          filter: `id=eq.${gallery.id}`
        },
        (payload: any) => {
          if (payload?.new && payload.new.payment_status === 'paid' && gallery.paymentStatus !== 'paid') {
            console.log('[Realtime Admin] Pagamento da Galeria Quitado com Sucesso!');
            onEditGallery({
              ...gallery,
              paymentStatus: 'paid',
              updatedAt: new Date().toISOString()
            });
            onShowToast(
              'Exportação Liberada em Tempo Real!',
              'O pagamento da galeria foi confirmado. Todas as opções de exportação estão liberadas.',
              'success'
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (galleryChannel && supabase) {
        supabase.removeChannel(galleryChannel);
      }
    };
  }, [gallery.id, gallery.paymentStatus]);

  const handleSyncToAdobeCloud = async () => {
    if (!user) {
      onShowToast('Autenticação Necessária', 'Faça login para sincronizar com o Adobe Lightroom.', 'warning');
      return;
    }

    if (!isExportUnlocked) {
      setIsClosureFeeModalOpen(true);
      return;
    }

    setIsSyncingAdobe(true);
    try {
      const validCreds = await getValidAdobeAccessToken(user.id);
      if (!validCreds || !validCreds.accessToken) {
        onShowToast('Adobe Não Conectado', 'Conecte sua conta do Adobe Lightroom nas Configurações.', 'warning');
        setIsSyncingAdobe(false);
        return;
      }

      const catalogId = gallery.adobeCatalogId || validCreds.catalogId || 'default';
      const exportPhotos = getExportPhotos();
      const exportPhotoIds = exportPhotos.map(p => p.id);

      const result = await syncClientVotesToAdobe(
        validCreds.accessToken,
        catalogId,
        gallery.photos,
        exportPhotoIds
      );

      if (result.successCount > 0) {
        onShowToast(
          'Sincronização Concluída!',
          `${result.successCount} fotos marcadas com Pick / 5 Estrelas no Adobe Lightroom Cloud.`,
          'success'
        );
      } else {
        onShowToast(
          'Nenhuma foto sincronizada',
          'Certifique-se de que as fotos desta galeria foram importadas da Adobe ou possuem IDs válidos.',
          'info'
        );
      }
    } catch (err: any) {
      console.error('Adobe Sync Error:', err);
      onShowToast('Falha na Sincronização', err.message || 'Erro ao sincronizar votos com a Adobe.', 'error');
    } finally {
      setIsSyncingAdobe(false);
    }
  };

  const handleResetAllVotes = async () => {
    try {
      const updated = await resetGalleryVotesAsync(gallery);
      onEditGallery(updated);
      setIsResetAllModalOpen(false);
      onShowToast(
        'Votação Zerada!',
        'Todos os votos registrados na galeria foram limpos com sucesso.',
        'success'
      );
    } catch (e) {
      onShowToast('Erro ao Zerar Votação', 'Falha ao redefinir a votação.', 'error');
    }
  };

  const handleResetVoterVotes = async () => {
    if (!voterToReset) return;
    try {
      const updated = await resetVoterVotesAsync(gallery, voterToReset.id);
      onEditGallery(updated);
      onShowToast(
        'Votos do Votante Zerados!',
        `Todos os votos de ${voterToReset.name} foram removidos.`,
        'success'
      );
      setVoterToReset(null);
    } catch (e) {
      onShowToast('Erro ao Zerar Votos', 'Falha ao remover votos do participante.', 'error');
    }
  };

  const handleClearPhotoVotes = async () => {
    if (!photoToClear) return;
    try {
      const updated = await clearPhotoVotesAsync(gallery, photoToClear.id);
      onEditGallery(updated);
      onShowToast(
        'Votos da Foto Limpos!',
        `Votos da foto ${photoToClear.originalFileName} foram zerados.`,
        'info'
      );
      setPhotoToClear(null);
    } catch (e) {
      onShowToast('Erro ao Limpar Votos', 'Falha ao remover votos da foto.', 'error');
    }
  };

  const handleDetailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];

    // Create temporary entries with blob URLs & extracted EXIF for immediate visual preview
    const tempItems = await Promise.all(
      fileList.map(async (file, idx) => {
        const blobUrl = URL.createObjectURL(file);
        const metadata = await extractExif(file);
        return {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
          file,
          blobUrl,
          photo: {
            id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
            originalFileName: file.name,
            url: blobUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            metadata
          }
        };
      })
    );

    let currentPhotos: Photo[] = [...gallery.photos, ...tempItems.map((t) => t.photo)];

    onShowToast(
      'Processando fotos...',
      `Enviando 1 de ${fileList.length} foto(s)...`,
      'info'
    );

    // Process files in batches with controlled concurrency (3 at a time)
    const batchResults = await uploadPhotosInBatches(
      tempItems,
      gallery.id,
      (completedCount, totalCount, item, permanentUrl) => {
        onShowToast(
          'Processando fotos...',
          `Enviando foto ${completedCount} de ${totalCount}...`,
          'info'
        );

        URL.revokeObjectURL(item.blobUrl);
        if (permanentUrl) {
          currentPhotos = currentPhotos.map((p) =>
            p.id === item.photo.id ? { ...p, url: permanentUrl } : p
          );
        } else {
          currentPhotos = currentPhotos.filter((p) => p.id !== item.photo.id);
        }
      },
      3
    );

    // Filter out any temporary blob: URLs to ensure data integrity
    const finalPhotos = currentPhotos.filter((p) => p.url && !p.url.startsWith('blob:'));

    // Perform ONE SINGLE CONSOLIDATED SAVE to Supabase after all batch uploads finish
    onEditGallery({
      ...gallery,
      photos: finalPhotos,
      updatedAt: new Date().toISOString()
    });

    const failedCount = batchResults.filter((r) => !r.success).length;
    if (failedCount > 0) {
      onShowToast(
        'Upload Parcial',
        `${batchResults.length - failedCount} fotos enviadas. ${failedCount} foto(s) falharam e foram descartadas.`,
        'error'
      );
    } else {
      onShowToast(
        'Upload Concluído!',
        `${finalPhotos.length} fotos salvas e sincronizadas com sucesso.`,
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
    if (!isExportUnlocked) {
      setIsClosureFeeModalOpen(true);
      return;
    }

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
    if (!isExportUnlocked) {
      setIsClosureFeeModalOpen(true);
      return;
    }

    const exportType = activeFilter === 'voter' ? 'voter' : activeFilter === 'consensus' ? 'consensus' : 'all';
    downloadApprovalManifest(gallery, exportType as any, selectedVoterIdFilter || undefined);
    onShowToast('Download iniciado', 'Relatório completo de aprovação gerado em arquivo .txt', 'success');
  };

  const handleGenerateClosurePix = async () => {
    setIsGeneratingClosurePix(true);
    try {
      const mockOrderId = `closure_order_${Date.now()}`;
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136izylumna-closure-${mockOrderId}5204000053039865405${closureFee.toFixed(2)}5802BR5910IZY LUMNA6009SAO PAULO62070503***6304`;
      
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#030712"/>
        <rect x="15" y="15" width="170" height="170" rx="16" fill="#111827" stroke="#f59e0b" stroke-width="3"/>
        <path d="M 40 40 h 40 v 40 h -40 z M 120 40 h 40 v 40 h -40 z M 40 120 h 40 v 40 h -40 z" fill="#f59e0b"/>
        <path d="M 50 50 h 20 v 20 h -20 z M 130 50 h 20 v 20 h -20 z M 50 130 h 20 v 20 h -20 z" fill="#030712"/>
        <circle cx="100" cy="100" r="16" fill="#10b981"/>
        <text x="100" y="180" font-size="10" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">Taxa Encerramento Izy Lumna</text>
      </svg>`;

      setClosurePixData({
        orderId: mockOrderId,
        copyPaste: mockCopyPaste,
        qrCodeBase64: `data:image/svg+xml;base64,${btoa(svgString)}`,
        amount: closureFee,
        isMock: true
      });
    } finally {
      setIsGeneratingClosurePix(false);
    }
  };

  const handleSimulateClosurePaid = () => {
    onEditGallery({
      ...gallery,
      paymentStatus: 'paid',
      updatedAt: new Date().toISOString()
    });
    setIsClosureFeeModalOpen(false);
    onShowToast(
      'Taxa de Encerramento Quitada!',
      'Exportação liberada com sucesso! Você já pode copiar para o Lightroom ou sincronizar na nuvem.',
      'success'
    );
  };

  const handleSetPhotoRating = async (photo: Photo, rating: number) => {
    try {
      const updated = await setPhotoRatingAsync(gallery, photo.id, rating);
      onEditGallery(updated);
      onShowToast(
        rating > 0 ? 'Avaliação Atualizada' : 'Avaliação Limpa',
        `Foto ${photo.originalFileName} classificada com ${rating}★`,
        'success'
      );
    } catch (e) {
      onShowToast('Erro ao Avaliar', 'Não foi possível atualizar a classificação.', 'error');
    }
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
          <Button variant="outline" size="sm" onClick={() => setIsWatermarkModalOpen(true)}>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Marca d'Água</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditGallery(gallery)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurações & Regras</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetAllModalOpen(true)}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            title="Zerar todos os votos da galeria e reiniciar a votação"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zerar Votação Total</span>
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
              <button
                type="button"
                onClick={() => setIsWatermarkModalOpen(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 transition-colors"
                title="Clique para editar as configurações da marca d'água"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${gallery.watermarkEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span>Marca d'Água: <strong className={gallery.watermarkEnabled ? 'text-amber-300' : 'text-zinc-400'}>{gallery.watermarkEnabled ? 'Ativa' : 'Desativada'}</strong></span>
              </button>
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

            <Button 
              variant="amber" 
              size="sm" 
              onClick={handleSyncToAdobeCloud}
              disabled={isSyncingAdobe}
              title="Sincronizar as fotos aprovadas/selecionadas com a conta Adobe Lightroom Cloud (Rating 5 estrelas / Pick)"
            >
              {isSyncingAdobe ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizando Adobe...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Exportar p/ Lightroom Cloud</span>
                </>
              )}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVoterIdFilter(voter.id);
                            setActiveFilter('voter');
                          }}
                          className="text-amber-400 hover:underline text-[11px] font-medium flex items-center gap-1"
                        >
                          <Filter className="w-3 h-3" /> Ver
                        </button>
                        {votesCount > 0 && (
                          <button
                            onClick={() => setVoterToReset(voter)}
                            className="text-red-400/80 hover:text-red-400 hover:underline text-[11px] font-medium flex items-center gap-1"
                            title="Zerar todos os votos deste participante"
                          >
                            <RotateCcw className="w-3 h-3" /> Zerar
                          </button>
                        )}
                      </div>
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

                  {/* EXIF Metadata Badge */}
                  <div className="absolute bottom-2.5 left-2.5 z-20" onClick={(e) => e.stopPropagation()}>
                    <PhotoTechnicalDetails
                      metadata={photo.metadata}
                      photoSeed={photo.originalFileName || photo.id}
                      variant="badge"
                    />
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-semibold text-zinc-200 truncate" title={photo.originalFileName}>
                      {photo.originalFileName}
                    </span>
                    {votesList.length > 0 && (
                      <button
                        onClick={() => setPhotoToClear(photo)}
                        className="text-[10px] text-red-400/80 hover:text-red-300 hover:underline flex items-center gap-0.5 shrink-0 font-medium"
                        title="Limpar todos os votos desta foto"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Limpar
                      </button>
                    )}
                  </div>

                  {/* Photographer Star Rating Selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Estrelas:</span>
                    <StarRating
                      rating={photo.rating || 0}
                      size="sm"
                      onChange={(newRating) => handleSetPhotoRating(photo, newRating)}
                      showLabel
                    />
                  </div>

                  {/* Voter Chips */}
                  {votesList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {votesList.map((v) => (
                        <span
                          key={v.voterId}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-medium border border-zinc-700/50"
                        >
                          <span>✓ {v.voterName}</span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const updated = await deleteVoteAsync(gallery, photo.id, v.voterId);
                              onEditGallery(updated);
                              onShowToast(
                                'Voto Removido',
                                `Voto de ${v.voterName} removido da foto ${photo.originalFileName}`,
                                'info'
                              );
                            }}
                            className="text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded p-0.5 font-bold transition-colors"
                            title={`Remover voto de ${v.voterName}`}
                          >
                            ✕
                          </button>
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

      {/* Watermark Settings Modal */}
      {isWatermarkModalOpen && (
        <WatermarkSettingsModal
          isOpen={isWatermarkModalOpen}
          onClose={() => setIsWatermarkModalOpen(false)}
          gallery={gallery}
          onSave={onEditGallery}
          onShowToast={onShowToast}
        />
      )}

      {/* Confirmation Dialog: Zerar Votação Total */}
      <Dialog
        isOpen={isResetAllModalOpen}
        onClose={() => setIsResetAllModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Zerar Toda a Votação?</span>
          </div>
        }
        description="Atenção: esta ação irá resetar completamente a seleção de fotos."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-walnut-300">
            Você está prestes a remover <strong className="text-red-400">TODOS os votos</strong> de todos os participantes cadastrados nesta galeria (<strong>{gallery.title}</strong>).
          </p>
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300 space-y-1">
            <p className="font-semibold">• O status da galeria retornará para em andamento.</p>
            <p className="font-semibold">• As finalizações dos clientes serão canceladas.</p>
            <p className="font-semibold">• Essa ação é irreversível.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-walnut-700">
            <Button variant="ghost" size="sm" onClick={() => setIsResetAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllVotes}
              className="bg-red-600/20 text-red-300 border-red-500/50 hover:bg-red-600 hover:text-white"
            >
              Sim, Zerar Toda a Votação
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog: Zerar Votos do Votante */}
      <Dialog
        isOpen={!!voterToReset}
        onClose={() => setVoterToReset(null)}
        title={
          <div className="flex items-center gap-2 text-amber-400">
            <RotateCcw className="w-5 h-5" />
            <span>Zerar votos de {voterToReset?.name}?</span>
          </div>
        }
        description="Reiniciar a participação deste cliente."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-walnut-300">
            Todos os votos marcados por <strong className="text-walnut-100">{voterToReset?.name}</strong> serão apagados da galeria. Se o cliente tiver finalizado, a sua finalização será desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-walnut-700">
            <Button variant="ghost" size="sm" onClick={() => setVoterToReset(null)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetVoterVotes}
              className="bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600 hover:text-white"
            >
              Confirmar e Zerar Votos
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog: Limpar Votos da Foto */}
      <Dialog
        isOpen={!!photoToClear}
        onClose={() => setPhotoToClear(null)}
        title={
          <div className="flex items-center gap-2 text-zinc-300">
            <Trash2 className="w-5 h-5 text-red-400" />
            <span>Limpar Votos da Foto</span>
          </div>
        }
        description={photoToClear?.originalFileName}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-walnut-300">
            Deseja remover todos os votos registrados para a foto <strong className="text-walnut-100">{photoToClear?.originalFileName}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-walnut-700">
            <Button variant="ghost" size="sm" onClick={() => setPhotoToClear(null)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearPhotoVotes}
              className="bg-red-600/20 text-red-300 border-red-500/50 hover:bg-red-600 hover:text-white"
            >
              Limpar Votos
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Closure Fee Payment Modal */}
      <Dialog
        isOpen={isClosureFeeModalOpen}
        onClose={() => setIsClosureFeeModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <span>Desbloquear Exportação de Fotos</span>
          </div>
        }
        description="Como o cliente não comprou fotos extras, efetue o pagamento da microtaxa de encerramento da galeria para liberar o download e a cópia para o Lightroom."
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-400">
              <span>Taxa Fixa de Encerramento:</span>
              <span className="font-mono text-base">R$ {closureFee.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Esta taxa cobre os custos de infraestrutura e processamento da galeria quando não há comissão gerada por fotos extras.
            </p>
          </div>

          {!closurePixData ? (
            <div className="text-center py-4">
              <Button
                variant="amber"
                size="md"
                disabled={isGeneratingClosurePix}
                onClick={handleGenerateClosurePix}
                className="font-bold shadow-lg shadow-amber-500/20 w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Gerar QR Code PIX (R$ {closureFee.toFixed(2)})</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-white rounded-2xl border-4 border-zinc-800 shadow-xl inline-block mx-auto">
                <img
                  src={closurePixData.qrCodeBase64}
                  alt="QR Code PIX Encerramento"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={closurePixData.copyPaste}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 truncate"
                />
                <Button
                  type="button"
                  variant={copiedClosurePix ? 'emerald' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(closurePixData.copyPaste);
                    setCopiedClosurePix(true);
                    setTimeout(() => setCopiedClosurePix(false), 2500);
                  }}
                >
                  {copiedClosurePix ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>

              {closurePixData.isMock && (
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSimulateClosurePaid}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Simular Taxa Paga (Modo de Teste)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsClosureFeeModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
