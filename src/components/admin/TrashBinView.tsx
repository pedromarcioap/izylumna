import React, { useState } from 'react';
import { Gallery } from '../../types';
import { Button } from '../ui/Button';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Calendar,
  User,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { getDaysUntilPermanentDeletion, TRASH_RETENTION_DAYS } from '../../lib/storage';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { Dialog } from '../ui/Dialog';

export interface TrashBinViewProps {
  trashGalleries: Gallery[];
  onRestoreGallery: (id: string) => void | Promise<void>;
  onPermanentDeleteGallery: (id: string) => void | Promise<void>;
  onEmptyTrash: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
}

export const TrashBinView: React.FC<TrashBinViewProps> = ({
  trashGalleries,
  onRestoreGallery,
  onPermanentDeleteGallery,
  onEmptyTrash,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGalleryForDelete, setSelectedGalleryForDelete] = useState<Gallery | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleRestore = async (gallery: Gallery) => {
    await onRestoreGallery(gallery.id);
    showToast(`O ensaio "${gallery.title}" foi restaurado com sucesso!`);
  };

  const handleConfirmPermanentDelete = async () => {
    if (selectedGalleryForDelete) {
      await onPermanentDeleteGallery(selectedGalleryForDelete.id);
      showToast(`O ensaio "${selectedGalleryForDelete.title}" foi removido definitivamente.`);
      setSelectedGalleryForDelete(null);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    await onEmptyTrash();
    showToast('A lixeira foi esvaziada completamente.');
    setShowEmptyConfirm(false);
  };

  const filteredGalleries = trashGalleries.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.title.toLowerCase().includes(term) ||
      g.clientName.toLowerCase().includes(term) ||
      (g.clientEmail && g.clientEmail.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Data N/A';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                Lixeira de Ensaios
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-semibold">
                  {trashGalleries.length} {trashGalleries.length === 1 ? 'item' : 'itens'}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Backup temporário. Os ensaios permanecem aqui por até {TRASH_RETENTION_DAYS} dias antes da exclusão permanente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-xs border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}

          {trashGalleries.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowEmptyConfirm(true)}
              className="text-xs bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Esvaziar Lixeira
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-200">
            Proteção e Segurança de Dados
          </p>
          <p className="text-zinc-400 leading-relaxed">
            As galerias na lixeira ficam completamente inacessíveis para os clientes (links diretos e PINs de acesso são bloqueados). Você pode restaurar qualquer ensaio a qualquer momento durante o período de 15 dias.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      {trashGalleries.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título do ensaio ou nome do cliente na lixeira..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition"
          />
        </div>
      )}

      {/* Main Content Area */}
      {trashGalleries.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
            <Trash2 className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-zinc-200">Lixeira Vazia</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Nenhum ensaio foi excluído recentemente. Quando você excluir uma galeria, ela ficará salva aqui por {TRASH_RETENTION_DAYS} dias como backup.
            </p>
          </div>
        </div>
      ) : filteredGalleries.length === 0 ? (
        /* Search Empty State */
        <div className="py-12 text-center text-xs text-zinc-500 border border-zinc-800/80 rounded-xl bg-zinc-900/40">
          Nenhum ensaio encontrado na lixeira para o termo &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        /* Trash Items List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGalleries.map((gallery) => {
            const daysLeft = getDaysUntilPermanentDeletion(gallery.deletedAt);
            const isUrgent = daysLeft <= 3;
            const photoCount = gallery.photos?.length || 0;

            return (
              <div
                key={gallery.id}
                className="group relative rounded-2xl bg-zinc-900/80 border border-zinc-800/90 overflow-hidden hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Gallery Cover / Thumbnail Header */}
                  <div className="relative h-40 bg-zinc-950 overflow-hidden">
                    {gallery.coverPhotoUrl ? (
                      <img
                        src={gallery.coverPhotoUrl}
                        alt={gallery.title}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500 filter grayscale group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                    {/* Expiration Days Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md border ${
                          isUrgent
                            ? 'bg-red-950/90 text-red-300 border-red-500/40'
                            : 'bg-zinc-900/90 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {daysLeft === 0
                          ? 'Expira hoje'
                          : daysLeft === 1
                          ? '1 dia restante'
                          : `${daysLeft} dias restantes`}
                      </span>
                    </div>

                    {/* Photo count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-300">
                      <ImageIcon className="w-3 h-3 text-zinc-400" />
                      <span>{photoCount} fotos</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition line-clamp-1">
                        {gallery.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                        <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{gallery.clientName}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Excluído em:</span>
                        <span className="text-zinc-300 font-medium">
                          {formatDate(gallery.deletedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Data do evento:</span>
                        <span className="text-zinc-400">
                          {gallery.eventDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(gallery)}
                    className="flex-1 text-xs bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800/50 text-emerald-300 hover:text-emerald-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Restaurar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGalleryForDelete(gallery)}
                    className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2.5"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal for Single Item */}
      {selectedGalleryForDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(selectedGalleryForDelete)}
          onClose={() => setSelectedGalleryForDelete(null)}
          onConfirm={handleConfirmPermanentDelete}
          galleryTitle={selectedGalleryForDelete.title}
          photoCount={selectedGalleryForDelete.photos?.length || 0}
          title={selectedGalleryForDelete.title}
          description={`Você está prestes a excluir PERMANENTEMENTE a galeria "${selectedGalleryForDelete.title}" da lixeira. Esta ação apagará definitivamente todas as fotos e dados do Supabase sem possibilidade de recuperação.`}
        />
      )}

      {/* Empty Trash Double Confirm Dialog */}
      <Dialog isOpen={showEmptyConfirm} onClose={() => setShowEmptyConfirm(false)} maxWidth="sm">
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 text-red-400">
            <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Esvaziar Lixeira?</h3>
              <p className="text-xs text-zinc-400">Ação irreversível</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            Você está prestes a excluir permanentemente <strong className="text-red-400">{trashGalleries.length} {trashGalleries.length === 1 ? 'ensaio' : 'ensaios'}</strong> da lixeira. Todos os arquivos e históricos associados serão destruídos definitivamente no Supabase.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setShowEmptyConfirm(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmEmptyTrash}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs border-none shadow-lg shadow-red-900/30"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Sim, Esvaziar Lixeira
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
