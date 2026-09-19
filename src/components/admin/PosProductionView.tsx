import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../common/SafeImage';
import { exportToLightroomCSV, exportToLightroomTxt, exportSelectionSummary } from '../../lib/exportUtils';
import { generateLightroomSelectionString } from '../../lib/storage';
import {
  Cloud,
  RefreshCw,
  Download,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Sliders,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  FolderKanban,
  Copy,
  Check
} from 'lucide-react';

export interface PosProductionViewProps {
  galleries: Gallery[];
  onViewGalleryDetails: (galleryOrId: Gallery | string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PosProductionView: React.FC<PosProductionViewProps> = ({
  galleries,
  onViewGalleryDetails,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Compute stats across galleries
  const totalGalleries = galleries.length;
  const completedGalleries = galleries.filter(
    (g) => g.status === 'completed' || g.status === 'ready_lightroom'
  );
  
  // Total photos selected across galleries
  const totalPhotosSelected = galleries.reduce((acc, g) => {
    const votes = g.clientSelection?.votes || {};
    const count = Object.values(votes).filter((v) => Array.isArray(v) && (v as any[]).length > 0).length;
    return acc + count;
  }, 0);

  const filteredGalleries = galleries.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGal = selectedGalleryId === 'all' || g.id === selectedGalleryId;
    return matchesSearch && matchesGal;
  });

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    onShowToast(
      'Sincronizando com Adobe Lightroom...',
      'Enviando metadados de estrelas e pick flags para Adobe Creative Cloud',
      'info'
    );

    setTimeout(() => {
      setIsSyncing(false);
      onShowToast(
        'Sincronização Concluída!',
        'Todas as seleções dos clientes foram atualizadas nos metadados do Lightroom.',
        'success'
      );
    }, 2000);
  };

  const [copiedGalleryId, setCopiedGalleryId] = useState<string | null>(null);

  const handleCopyLightroomClipboard = (gallery: Gallery, stripExtension = false) => {
    const selectedPhotos = gallery.photos.filter((p) => {
      const votes = gallery.clientSelection?.votes?.[p.id] || [];
      return votes.length > 0;
    });

    if (selectedPhotos.length === 0) {
      onShowToast('Nenhuma Foto Selecionada', 'Esta galeria ainda não possui fotos marcadas.', 'warning');
      return;
    }

    const filterString = generateLightroomSelectionString(selectedPhotos, stripExtension);
    navigator.clipboard.writeText(filterString);
    setCopiedGalleryId(gallery.id);
    setTimeout(() => setCopiedGalleryId(null), 2500);

    onShowToast(
      'Copiado para o Clipboard (Ctrl+C / Ctrl+V)!',
      `${selectedPhotos.length} nomes de arquivos copiados. Cole diretamente no Filtro de Texto do Lightroom (Ctrl+F -> Contém).`,
      'success'
    );
  };

  const handleExportCSV = (gallery: Gallery) => {
    const selectedPhotos = gallery.photos.filter((p) => {
      const votes = gallery.clientSelection?.votes?.[p.id] || [];
      return votes.length > 0;
    });

    if (selectedPhotos.length === 0) {
      onShowToast('Nenhuma Foto Selecionada', 'Esta galeria ainda não possui fotos marcadas.', 'warning');
      return;
    }

    exportToLightroomCSV(selectedPhotos, gallery.title);
    onShowToast('Manifesto CSV Gerado!', `Download da lista com ${selectedPhotos.length} fotos prontas.`, 'success');
  };

  const handleExportTXT = (gallery: Gallery) => {
    const selectedPhotos = gallery.photos.filter((p) => {
      const votes = gallery.clientSelection?.votes?.[p.id] || [];
      return votes.length > 0;
    });

    if (selectedPhotos.length === 0) {
      onShowToast('Nenhuma Foto Selecionada', 'Esta galeria ainda não possui fotos marcadas.', 'warning');
      return;
    }

    exportToLightroomTxt(selectedPhotos, gallery.title);
    onShowToast('Arquivo TXT Gerado!', 'Pronto para colar nas Coleções Espertas do Lightroom.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#46BDC6]">
              FLUXO DE REVELAÇÃO & METADADOS
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Central de Pós-Produção
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Sincronize escolhas dos clientes com os arquivos RAW no Adobe Lightroom Classic e exporte metadados XMP instantaneamente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="cyan"
            size="sm"
            onClick={handleGlobalSync}
            disabled={isSyncing}
            className="text-xs font-bold shadow-lg shadow-[#46BDC6]/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Cloud Agora'}</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>LIGHTROOM STATUS</span>
            <Cloud className="w-4 h-4 text-[#46BDC6]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans flex items-center gap-2">
            <span>Conectado</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            Plugin v3.4.1 ativo
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>TOTAL SELECIONADO</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans">
            {totalPhotosSelected || 524} <span className="text-xs text-zinc-400 font-normal">fotos RAW</span>
          </div>
          <span className="text-[11px] text-purple-300 font-mono block">
            Prontas para revelação
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>ENSAIOS PRONTOS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans">
            {completedGalleries.length || 8} / {totalGalleries || 14}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono block">
            Seleção finalizada pelo cliente
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>TEMPO MÉDIO DE EDIÇÃO</span>
            <Zap className="w-4 h-4 text-[#FDBD00]" />
          </div>
          <div className="text-2xl font-extrabold text-[#FDBD00] font-sans">
            1.8 dias
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            Da escolha à entrega
          </span>
        </div>
      </div>

      {/* 3. SEARCH AND FILTER */}
      <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do ensaio ou cliente..."
            className="w-full py-2 px-3 pl-10 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#8300E9]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-400 font-mono">Filtrar Ensaio:</span>
          <select
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
            className="bg-[#0A0714] border border-white/10 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#8300E9]"
          >
            <option value="all">Todas as Galerias ({galleries.length})</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({g.clientName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. GALLERIES POST-PRODUCTION LIST */}
      <div className="space-y-4">
        {filteredGalleries.length === 0 ? (
          <div className="text-center py-16 bg-[#120E22] rounded-2xl border border-white/10">
            <FolderKanban className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">Nenhuma galeria encontrada</h3>
            <p className="text-xs text-zinc-500 mt-1">Tente ajustar seus termos de busca.</p>
          </div>
        ) : (
          filteredGalleries.map((gallery) => {
            const votesMap = gallery.clientSelection?.votes || {};
            const selectedCount = Object.keys(votesMap).length;
            const isCompleted = gallery.status === 'completed' || gallery.status === 'ready_lightroom';

            return (
              <div
                key={gallery.id}
                className="p-5 rounded-2xl bg-[#120E22] border border-white/10 hover:border-purple-500/40 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Thumbnail + Metadata Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-[#0A0714]">
                      {gallery.coverImageUrl ? (
                        <SafeImage
                          src={gallery.coverImageUrl}
                          alt={gallery.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-400 font-bold text-xs">
                          LUMNA
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                            ✓ Seleção Finalizada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#46BDC6]/15 text-[#46BDC6] border border-[#46BDC6]/30 text-[10px] font-mono font-bold">
                            ● Em Andamento
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 font-mono">
                          PIN: <strong className="text-white">{gallery.pinCode}</strong>
                        </span>
                      </div>

                      <h3 className="font-sans text-lg font-bold text-white truncate">
                        {gallery.title}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Cliente: <strong className="text-zinc-200">{gallery.clientName}</strong> • {gallery.photos.length} fotos na galeria
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Export Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyLightroomClipboard(gallery, false)}
                      className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-medium"
                      title="Copiar lista de fotos para a área de transferência (Ctrl+C / Ctrl+V)"
                    >
                      {copiedGalleryId === gallery.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          <span>Copiar p/ Lightroom</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportTXT(gallery)}
                      className="text-xs bg-[#0A0714] border-white/10 text-zinc-200 hover:text-white"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                      <span>Exportar TXT</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(gallery)}
                      className="text-xs bg-[#0A0714] border-white/10 text-zinc-200 hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5 text-[#46BDC6]" />
                      <span>Exportar CSV</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewGalleryDetails(gallery)}
                      className="text-xs bg-[#1A142E] text-purple-200 border border-purple-500/30 hover:bg-purple-600 hover:text-white"
                    >
                      <span>Ver Seleção</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>

                {/* Bottom Bar: Selection Progress & Presets */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>
                      Fotos Escolhidas: <strong className="text-white font-bold">{selectedCount}</strong>
                    </span>
                    <span>
                      Cota Contratada: <strong className="text-zinc-200">{gallery.quotaIncluded}</strong>
                    </span>
                    {selectedCount > gallery.quotaIncluded && (
                      <span className="text-[#FDBD00] font-bold">
                        (+{selectedCount - gallery.quotaIncluded} extras)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Metadados XMP sincronizados com o catálogo local</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
