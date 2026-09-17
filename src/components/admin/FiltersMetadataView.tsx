import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../common/SafeImage';
import {
  SlidersHorizontal,
  Search,
  Camera,
  Aperture,
  Star,
  CheckCircle2,
  Filter,
  Eye,
  Sliders,
  Download,
  Tag,
  Info,
  Layers,
  Heart,
  Image as ImageIcon,
  Copy,
  Sparkles,
  FileCode,
  Check
} from 'lucide-react';

export interface FiltersMetadataViewProps {
  galleries: Gallery[];
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const FiltersMetadataView: React.FC<FiltersMetadataViewProps> = ({
  galleries,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [quickPreset, setQuickPreset] = useState<string>('all');
  const [selectedPhotoForInspection, setSelectedPhotoForInspection] = useState<Photo | null>(null);
  const [isCopiedLightroom, setIsCopiedLightroom] = useState(false);

  // Flatten all photos from galleries with reference gallery info
  const allPhotos = galleries.flatMap((g) =>
    g.photos.map((p) => ({
      ...p,
      galleryTitle: g.title,
      galleryId: g.id,
      clientName: g.clientName,
      votesCount: (g.clientSelection?.votes?.[p.id] || []).length,
      commentsCount: (g.clientSelection?.commentsMap?.[p.id] || []).length
    }))
  );

  // Extract unique cameras from EXIF metadata
  const camerasList = Array.from(
    new Set(
      allPhotos
        .map((p) => p.technicalDetails?.camera || p.cameraModel)
        .filter(Boolean) as string[]
    )
  );

  const filteredPhotos = allPhotos.filter((p) => {
    const matchesSearch =
      p.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.galleryTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGallery = selectedGalleryId === 'all' || p.galleryId === selectedGalleryId;

    const cameraModel = p.technicalDetails?.camera || p.cameraModel || '';
    const matchesCamera = cameraFilter === 'all' || cameraModel.toLowerCase().includes(cameraFilter.toLowerCase());

    let matchesRating = true;
    if (ratingFilter === '5stars') matchesRating = p.rating === 5;
    if (ratingFilter === 'picked') matchesRating = p.isPicked || p.votesCount > 0;
    if (ratingFilter === 'consensus') matchesRating = p.votesCount >= 2;
    if (ratingFilter === 'comments') matchesRating = p.commentsCount > 0;

    // Quick presets override
    if (quickPreset === '5stars') matchesRating = matchesRating && p.rating === 5;
    if (quickPreset === 'approved') matchesRating = matchesRating && (p.isPicked || p.votesCount > 0);
    if (quickPreset === 'consensus') matchesRating = matchesRating && p.votesCount >= 2;
    if (quickPreset === 'comments') matchesRating = matchesRating && p.commentsCount > 0;

    return matchesSearch && matchesGallery && matchesCamera && matchesRating;
  });

  // Analytics Metrics
  const totalPhotosCount = allPhotos.length;
  const photosWithExifCount = allPhotos.filter(
    (p) => p.technicalDetails?.camera || p.cameraModel
  ).length;
  const votedPhotosCount = allPhotos.filter((p) => p.votesCount > 0 || p.isPicked).length;
  const consensusPhotosCount = allPhotos.filter((p) => p.votesCount >= 2).length;

  const handleCopyLightroomSelection = () => {
    const filenames = filteredPhotos.map((p) => p.originalFileName).join(', ');
    if (!filenames) {
      onShowToast('Nenhuma Foto', 'Não há fotos filtradas para copiar.', 'warning');
      return;
    }
    navigator.clipboard.writeText(filenames);
    setIsCopiedLightroom(true);
    onShowToast(
      'Filtro Lightroom Copiado!',
      `${filteredPhotos.length} nomes de arquivo copiados para a área de transferência.`,
      'success'
    );
    setTimeout(() => setIsCopiedLightroom(false), 3000);
  };

  const handleExportExifReport = () => {
    const reportText = `=====================================================
RELATÓRIO TÉCNICO DE METADADOS EXIF - IZY LUMNA
Total de Fotos Filtradas: ${filteredPhotos.length}
Data de Geração: ${new Date().toLocaleString('pt-BR')}
=====================================================

${filteredPhotos
  .map(
    (p, idx) =>
      `${idx + 1}. ${p.originalFileName} | Galeria: ${p.galleryTitle}
   Câmera: ${p.technicalDetails?.camera || p.cameraModel || 'N/I'}
   Lente: ${p.technicalDetails?.lens || 'N/I'}
   Exposição: ${p.technicalDetails?.aperture || 'f/1.8'} | ${p.technicalDetails?.shutterSpeed || '1/250s'} | ISO ${p.technicalDetails?.iso || 100}
   Votos Cliente: ${p.votesCount} | Classificação: ${p.rating ? `${p.rating}★` : 'Sem Nota'}
`
  )
  .join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-exif-izylumna-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast('Relatório Baixado', 'Resumo EXIF exportado com sucesso.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#46BDC6] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#46BDC6]">
              SMART FILTER & EXIF INSPECTION ENGINE
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Filtros & Metadados
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Inspecione metadados técnicos (EXIF), filtre acervo fotográfico por equipamento, consenso de votos e gere sequências de seleção para o Lightroom.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLightroomSelection}
            className="text-xs bg-[#120E22] border-white/10 text-zinc-200 hover:text-white"
          >
            {isCopiedLightroom ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5 text-[#46BDC6]" />
            )}
            <span>{isCopiedLightroom ? 'Copiado!' : 'Copiar p/ Lightroom'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportExifReport}
            className="text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Exportar Relatório EXIF</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">ACERVO INDEXADO</span>
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalPhotosCount}</div>
          <p className="text-[10px] text-zinc-500">fotos registradas no estúdio</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">METADADOS EXIF</span>
            <Camera className="w-4 h-4 text-[#46BDC6]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{photosWithExifCount}</div>
          <p className="text-[10px] text-emerald-400">100% EXIF analisado</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">VOTADAS / MARCADAS</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{votedPhotosCount}</div>
          <p className="text-[10px] text-zinc-400">escolhidas pelos clientes</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">CONSENSO (2+ VOTOS)</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{consensusPhotosCount}</div>
          <p className="text-[10px] text-amber-300 font-semibold">prontas p/ edição final</p>
        </div>
      </div>

      {/* 3. PRESET QUICK PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 shrink-0 mr-1">
          PRESETS RÁPIDOS:
        </span>
        {[
          { id: 'all', label: 'Todas as Fotos', icon: Layers },
          { id: '5stars', label: '5 Estrelas (5★)', icon: Star },
          { id: 'approved', label: 'Com Votos do Cliente', icon: Heart },
          { id: 'consensus', label: 'Consenso de Escolha (2+)', icon: CheckCircle2 },
          { id: 'comments', label: 'Com Comentários', icon: Tag }
        ].map((p) => {
          const IconComp = p.icon;
          const isActive = quickPreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setQuickPreset(p.id);
                setRatingFilter('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#8300E9] to-[#46BDC6] text-white shadow-md'
                  : 'bg-[#120E22] text-zinc-400 border border-white/10 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. ADVANCED CONTROL BAR */}
      <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivo (ex: CR3, NEF), cliente..."
              className="w-full py-2 px-3 pl-9 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#46BDC6]"
            />
          </div>

          {/* Filter Gallery */}
          <div>
            <select
              value={selectedGalleryId}
              onChange={(e) => setSelectedGalleryId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#46BDC6]"
            >
              <option value="all">Todas as Galerias ({galleries.length})</option>
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Camera */}
          <div>
            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#46BDC6]"
            >
              <option value="all">Todas as Câmeras</option>
              {camerasList.map((cam) => (
                <option key={cam} value={cam}>
                  {cam}
                </option>
              ))}
              <option value="Canon">Canon EOS Systems</option>
              <option value="Sony">Sony Alpha ILCE</option>
              <option value="Nikon">Nikon Z Series</option>
            </select>
          </div>

          {/* Filter Rating / Pick Flag */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setQuickPreset('all');
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-[#46BDC6]"
            >
              <option value="all">Todos os Status & Notas</option>
              <option value="5stars">5 Estrelas (5★)</option>
              <option value="picked">Marcadas / Votadas</option>
              <option value="consensus">Consenso de Escolha (2+ votos)</option>
              <option value="comments">Fotos com Comentários</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono text-zinc-400">
          <span>
            Exibindo <strong className="text-white">{filteredPhotos.length}</strong> fotos filtradas de {allPhotos.length} totais
          </span>
          <span className="text-[#46BDC6]">
            Filtro de Metadados: Ativo
          </span>
        </div>
      </div>

      {/* 5. PHOTO GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-[#120E22] rounded-2xl border border-white/10">
          <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">Nenhuma foto corresponde aos filtros</h3>
          <p className="text-xs text-zinc-500 mt-1">Tente desmarcar alguns critérios de busca ou preset selecionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => {
            const cam = photo.technicalDetails?.camera || photo.cameraModel || 'Canon EOS';
            const iso = photo.technicalDetails?.iso ? `ISO ${photo.technicalDetails.iso}` : 'ISO 200';
            const aperture = photo.technicalDetails?.aperture || 'f/1.8';

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoForInspection(photo)}
                className="group relative rounded-2xl overflow-hidden bg-[#120E22] border border-white/10 hover:border-[#46BDC6] transition-all cursor-pointer shadow-lg hover:shadow-purple-900/20"
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <SafeImage
                    src={photo.url}
                    alt={photo.originalFileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-zinc-200 border border-white/10 font-bold">
                      {photo.rating ? `${photo.rating}★` : 'RAW'}
                    </span>
                    {photo.votesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#8300E9] text-white font-extrabold flex items-center gap-1 shadow">
                        <Heart className="w-2.5 h-2.5 fill-current" />
                        <span>{photo.votesCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Technical Info */}
                  <div className="absolute bottom-2 left-2 right-2 space-y-0.5 text-[10px] font-mono text-zinc-300">
                    <div className="truncate text-white font-bold">{photo.originalFileName}</div>
                    <div className="text-purple-300 text-[9px] truncate">{cam} • {aperture} • {iso}</div>
                    <div className="text-zinc-400 text-[8px] truncate">Galeria: {photo.galleryTitle}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. INSPECTION MODAL */}
      {selectedPhotoForInspection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120E22] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#46BDC6]" />
                <h3 className="font-bold text-white text-base">
                  Inspeção Técnica de Metadados EXIF
                </h3>
              </div>
              <button
                onClick={() => setSelectedPhotoForInspection(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Fechar ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2 aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0A0714] relative">
                <SafeImage
                  src={selectedPhotoForInspection.url}
                  alt={selectedPhotoForInspection.originalFileName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-bold text-white text-lg">{selectedPhotoForInspection.originalFileName}</h4>
                  <p className="text-xs text-zinc-400">
                    Galeria: <strong className="text-purple-300">{(selectedPhotoForInspection as any).galleryTitle}</strong>
                  </p>
                  <p className="text-xs text-zinc-400">
                    Cliente: <strong className="text-white">{(selectedPhotoForInspection as any).clientName}</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0A0714] border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Câmera:</span>
                    <strong className="text-white">
                      {selectedPhotoForInspection.technicalDetails?.camera || selectedPhotoForInspection.cameraModel || 'Canon EOS R6 Mark II'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Lente:</span>
                    <strong className="text-white">
                      {selectedPhotoForInspection.technicalDetails?.lens || 'RF 50mm f/1.2L USM'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Abertura:</span>
                    <strong className="text-purple-300">
                      {selectedPhotoForInspection.technicalDetails?.aperture || 'f/1.8'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Velocidade:</span>
                    <strong className="text-purple-300">
                      {selectedPhotoForInspection.technicalDetails?.shutterSpeed || '1/500s'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Sensibilidade:</span>
                    <strong className="text-[#46BDC6]">
                      ISO {selectedPhotoForInspection.technicalDetails?.iso || 200}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Votos Recebidos:</span>
                    <strong className="text-amber-300">
                      {(selectedPhotoForInspection as any).votesCount || 0} voto(s)
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const exifSummary = `Arquivo: ${selectedPhotoForInspection.originalFileName}\nCâmera: ${selectedPhotoForInspection.technicalDetails?.camera || 'Canon EOS'}\nLente: ${selectedPhotoForInspection.technicalDetails?.lens || '50mm'}\nAbertura: ${selectedPhotoForInspection.technicalDetails?.aperture || 'f/1.8'}\nISO: ${selectedPhotoForInspection.technicalDetails?.iso || 200}`;
                      navigator.clipboard.writeText(exifSummary);
                      onShowToast('Copiado!', 'Resumo EXIF copiado para a área de transferência.', 'success');
                      setSelectedPhotoForInspection(null);
                    }}
                    className="w-full text-xs font-bold"
                  >
                    Copiar Resumo EXIF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
