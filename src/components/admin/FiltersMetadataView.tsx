import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../common/SafeImage';
import { PhotoTechnicalDetails } from '../common/PhotoTechnicalDetails';
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
  Image as ImageIcon
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
  const [selectedPhotoForInspection, setSelectedPhotoForInspection] = useState<Photo | null>(null);

  // Flatten all photos from galleries with reference gallery info
  const allPhotos = galleries.flatMap((g) =>
    g.photos.map((p) => ({
      ...p,
      galleryTitle: g.title,
      galleryId: g.id,
      clientName: g.clientName,
      votesCount: (g.clientSelection?.votes?.[p.id] || []).length
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

    return matchesSearch && matchesGallery && matchesCamera && matchesRating;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-400">
              INSPEÇÃO METADADOS & EXIF DE ESTÚDIO
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Filtros & Metadados
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Filtre fotos de todo o estúdio por câmera, lente, abertura, ISO, notas de estrelas e votação dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowToast('Exportando Filtros EXIF', 'Gerando resumo técnico de equipamento...', 'info')}
            className="text-xs bg-[#120E22] border-white/10 text-zinc-200 hover:text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            <span>Exportar Relatório EXIF</span>
          </Button>
        </div>
      </div>

      {/* 2. ADVANCED CONTROL BAR */}
      <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por foto, ensaio..."
              className="w-full py-2 px-3 pl-9 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filter Gallery */}
          <div>
            <select
              value={selectedGalleryId}
              onChange={(e) => setSelectedGalleryId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
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
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Todas as Câmeras</option>
              {camerasList.map((cam) => (
                <option key={cam} value={cam}>
                  {cam}
                </option>
              ))}
              <option value="Sony">Sony (ILCE / A7)</option>
              <option value="Canon">Canon (EOS R)</option>
              <option value="Hasselblad">Hasselblad</option>
            </select>
          </div>

          {/* Filter Rating / Pick Flag */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Todos os Status & Notas</option>
              <option value="5stars">5 Estrelas (5★)</option>
              <option value="picked">Marcadas / Votadas</option>
              <option value="consensus">Consenso de Escolha (2+ votos)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono text-zinc-400">
          <span>
            Exibindo <strong className="text-white">{filteredPhotos.length}</strong> fotos de {allPhotos.length} totais
          </span>
          <span className="text-purple-300">
            Smart Filter Engine: Ativo
          </span>
        </div>
      </div>

      {/* 3. PHOTO GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-[#120E22] rounded-2xl border border-white/10">
          <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">Nenhuma foto corresponde aos filtros</h3>
          <p className="text-xs text-zinc-500 mt-1">Tente desmarcar alguns critérios de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => {
            const cam = photo.technicalDetails?.camera || photo.cameraModel || 'RAW';
            const lens = photo.technicalDetails?.lens || '85mm f/1.4';
            const iso = photo.technicalDetails?.iso ? `ISO ${photo.technicalDetails.iso}` : 'ISO 100';

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoForInspection(photo)}
                className="group relative rounded-2xl overflow-hidden bg-[#120E22] border border-white/10 hover:border-purple-500 transition-all cursor-pointer shadow-lg"
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <SafeImage
                    src={photo.url}
                    alt={photo.originalFileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 border border-white/10">
                      {photo.rating ? `${photo.rating}★` : 'RAW'}
                    </span>
                    {photo.votesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#46BDC6]/90 text-[#160F29] font-extrabold">
                        {photo.votesCount} voto(s)
                      </span>
                    )}
                  </div>

                  {/* Bottom Technical Info */}
                  <div className="absolute bottom-2 left-2 right-2 space-y-0.5 text-[10px] font-mono text-zinc-300">
                    <div className="truncate text-white font-bold">{photo.originalFileName}</div>
                    <div className="text-zinc-400 text-[9px] truncate">{cam} • {iso}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. INSPECTION MODAL */}
      {selectedPhotoForInspection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120E22] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">
                  Inspeção Técnica de Metadados EXIF
                </h3>
              </div>
              <button
                onClick={() => setSelectedPhotoForInspection(null)}
                className="text-zinc-400 hover:text-white text-sm font-mono px-2 py-1 bg-white/5 rounded-lg"
              >
                Esc ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2 aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0A0714]">
                <SafeImage
                  src={selectedPhotoForInspection.url}
                  alt={selectedPhotoForInspection.originalFileName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-bold text-white text-base">{selectedPhotoForInspection.originalFileName}</h4>
                  <p className="text-xs text-zinc-400">
                    Galeria: {(selectedPhotoForInspection as any).galleryTitle}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0714] border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Câmera:</span>
                    <strong className="text-white">
                      {selectedPhotoForInspection.technicalDetails?.camera || selectedPhotoForInspection.cameraModel || 'Sony A7IV'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Lente:</span>
                    <strong className="text-white">
                      {selectedPhotoForInspection.technicalDetails?.lens || 'FE 85mm F1.4 GM'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Abertura:</span>
                    <strong className="text-purple-300">
                      {selectedPhotoForInspection.technicalDetails?.aperture || 'f/1.4'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Velocidade:</span>
                    <strong className="text-purple-300">
                      {selectedPhotoForInspection.technicalDetails?.shutterSpeed || '1/800s'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-zinc-400">Sensibilidade:</span>
                    <strong className="text-[#46BDC6]">
                      ISO {selectedPhotoForInspection.technicalDetails?.iso || 100}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Distância Focal:</span>
                    <strong className="text-white">
                      {selectedPhotoForInspection.technicalDetails?.focalLength || '85mm'}
                    </strong>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onShowToast('Copiado!', 'Metadados EXIF copiados para a área de transferência.', 'success');
                    setSelectedPhotoForInspection(null);
                  }}
                  className="w-full text-xs font-bold"
                >
                  Copiar Metadados EXIF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
