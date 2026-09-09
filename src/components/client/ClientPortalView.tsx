import React, { useState, useEffect } from 'react';
import { Gallery, Photo } from '../../types';
import { ClientAuthPin } from './ClientAuthPin';
import { ClientStickyHeader } from './ClientStickyHeader';
import { ClientPhotoGrid } from './ClientPhotoGrid';
import { ClientLightbox } from './ClientLightbox';
import { ClientCommentModal } from './ClientCommentModal';
import { ClientFinalizeModal } from './ClientFinalizeModal';
import { ClientCompletedView } from './ClientCompletedView';
import { updateClientSelection } from '../../lib/storage';

export interface ClientPortalViewProps {
  gallery: Gallery;
  onUpdateGallery: (updated: Gallery) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onSwitchToAdmin: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  gallery,
  onUpdateGallery,
  onShowToast,
  onSwitchToAdmin
}) => {
  // Session unlock for private galleries
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (gallery.privacy === 'public') return true;
    const sessionKey = `lumina_unlocked_${gallery.id}`;
    return sessionStorage.getItem(sessionKey) === 'true';
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'selected' | 'commented'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [commentPhoto, setCommentPhoto] = useState<Photo | null>(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [forceReviewMode, setForceReviewMode] = useState(false);

  // Sync unlocked state if gallery changes
  useEffect(() => {
    if (gallery.privacy === 'public') {
      setIsUnlocked(true);
    } else {
      const sessionKey = `lumina_unlocked_${gallery.id}`;
      setIsUnlocked(sessionStorage.getItem(sessionKey) === 'true');
    }
    setForceReviewMode(false);
  }, [gallery.id, gallery.privacy]);

  const handleUnlock = () => {
    const sessionKey = `lumina_unlocked_${gallery.id}`;
    sessionStorage.setItem(sessionKey, 'true');
    setIsUnlocked(true);
    onShowToast('Galeria Desbloqueada!', `Bem-vindo à seleção do ensaio ${gallery.title}`, 'success');
  };

  const selectedIds = gallery.clientSelection.selectedPhotoIds || [];
  const comments = gallery.clientSelection.comments || {};
  const isSubmitted = gallery.clientSelection.status === 'submitted' && !forceReviewMode;
  const quota = gallery.quotaIncluded;

  // Toggle photo selection with strict policy enforcement
  const handleToggleSelect = (photo: Photo) => {
    if (isSubmitted) return;

    const isAlreadySelected = selectedIds.includes(photo.id);

    if (isAlreadySelected) {
      // Unselect photo
      const newSelected = selectedIds.filter((id) => id !== photo.id);
      const updated = updateClientSelection(gallery.id, {
        ...gallery.clientSelection,
        selectedPhotoIds: newSelected
      });
      if (updated) onUpdateGallery(updated);
      return;
    }

    // New selection: check quota and policy
    const currentCount = selectedIds.length;

    // Policy 1: BLOCK
    if (gallery.excessPolicy === 'block' && currentCount >= quota) {
      onShowToast(
        'Limite de Fotos Atingido!',
        `Você atingiu o limite de ${quota} fotos contratadas no seu pacote. Desmarque uma foto para poder escolher outra.`,
        'warning'
      );
      return;
    }

    // Policy 2: CHARGE
    if (gallery.excessPolicy === 'charge' && currentCount >= quota) {
      const extraIndex = currentCount - quota + 1;
      onShowToast(
        'Foto Excedente Selecionada',
        `Foto extra #${extraIndex} adicionada (+ R$ ${gallery.extraPhotoPrice.toFixed(2)} adicionados ao seu subtotal).`,
        'info'
      );
    }

    // Policy 3: FREE APPROVAL
    if (gallery.excessPolicy === 'free_approval' && currentCount >= quota) {
      onShowToast(
        'Foto Extra Adicionada',
        'Foto extra adicionada à sua seleção para tratamento e envio em alta resolução (sem custo adicional).',
        'info'
      );
    }

    // Add photo
    const newSelected = [...selectedIds, photo.id];
    const updated = updateClientSelection(gallery.id, {
      ...gallery.clientSelection,
      selectedPhotoIds: newSelected
    });
    if (updated) onUpdateGallery(updated);
  };

  // Comments handler
  const handleSaveComment = (photoId: string, commentText: string) => {
    const newComments = { ...comments, [photoId]: commentText };
    const updated = updateClientSelection(gallery.id, {
      ...gallery.clientSelection,
      comments: newComments
    });
    if (updated) onUpdateGallery(updated);
    onShowToast('Observação Salva', 'Sua orientação de tratamento foi salva com sucesso nesta foto.', 'success');
  };

  const handleRemoveComment = (photoId: string) => {
    const newComments = { ...comments };
    delete newComments[photoId];
    const updated = updateClientSelection(gallery.id, {
      ...gallery.clientSelection,
      comments: newComments
    });
    if (updated) onUpdateGallery(updated);
    onShowToast('Observação Removida', 'Observação excluída da foto.', 'info');
  };

  // Submit Final Approval
  const handleConfirmSubmit = (clientNotes: string) => {
    const extraCount = Math.max(0, selectedIds.length - quota);
    const extraTotal = gallery.excessPolicy === 'charge' ? extraCount * gallery.extraPhotoPrice : 0;

    const updated = updateClientSelection(gallery.id, {
      ...gallery.clientSelection,
      status: 'submitted',
      completedAt: new Date().toISOString(),
      clientNotes,
      totalExtraAmount: extraTotal
    });

    if (updated) {
      onUpdateGallery(updated);
      setForceReviewMode(false);
      onShowToast('Aprovação Concluída!', 'Sua seleção foi enviada com sucesso para o fotógrafo.', 'success');
    }
  };

  // Reopen for testing
  const handleReopenSelection = () => {
    const updated = updateClientSelection(gallery.id, {
      ...gallery.clientSelection,
      status: 'pending'
    });
    if (updated) {
      onUpdateGallery(updated);
      setForceReviewMode(true);
      onShowToast('Seleção Reaberta', 'A galeria está liberada novamente para teste de seleção.', 'info');
    }
  };

  // Filter photos
  const filteredPhotos = gallery.photos.filter((photo) => {
    if (activeFilter === 'selected') return selectedIds.includes(photo.id);
    if (activeFilter === 'commented') return !!comments[photo.id];
    return true;
  });

  const selectedPhotos = gallery.photos.filter((p) => selectedIds.includes(p.id));

  // If private and locked, show PIN card
  if (!isUnlocked) {
    return <ClientAuthPin gallery={gallery} onUnlock={handleUnlock} />;
  }

  // If already submitted and user didn't request reviewing, show completion view
  if (isSubmitted) {
    return (
      <ClientCompletedView
        gallery={gallery}
        onReviewSelection={() => setForceReviewMode(true)}
        onReopenSelectionForTesting={handleReopenSelection}
        onSwitchToAdmin={onSwitchToAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Top Progress and Filters Header */}
      <ClientStickyHeader
        gallery={gallery}
        selectedIds={selectedIds}
        commentsCount={Object.keys(comments).length}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenFinalizeModal={() => setIsFinalizeModalOpen(true)}
        isSubmitted={isSubmitted}
      />

      {/* Intro Description Banner */}
      {gallery.description && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 backdrop-blur-sm text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <span className="font-semibold text-amber-400 block text-xs uppercase tracking-wider mb-1">
              Mensagem do Fotógrafo:
            </span>
            {gallery.description}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      <ClientPhotoGrid
        gallery={gallery}
        photos={filteredPhotos}
        selectedIds={selectedIds}
        comments={comments}
        isSubmitted={isSubmitted}
        onToggleSelect={handleToggleSelect}
        onOpenLightbox={(idx) => {
          const photo = filteredPhotos[idx];
          const overallIndex = gallery.photos.findIndex((p) => p.id === photo.id);
          setLightboxIndex(overallIndex >= 0 ? overallIndex : 0);
        }}
        onOpenCommentModal={(photo) => setCommentPhoto(photo)}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ClientLightbox
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          currentIndex={lightboxIndex}
          photos={gallery.photos}
          gallery={gallery}
          selectedIds={selectedIds}
          comments={comments}
          isSubmitted={isSubmitted}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onToggleSelect={handleToggleSelect}
          onOpenCommentModal={(photo) => setCommentPhoto(photo)}
        />
      )}

      {/* Comment Modal */}
      {commentPhoto && (
        <ClientCommentModal
          isOpen={!!commentPhoto}
          onClose={() => setCommentPhoto(null)}
          photo={commentPhoto}
          existingComment={comments[commentPhoto.id]}
          onSaveComment={handleSaveComment}
          onRemoveComment={handleRemoveComment}
        />
      )}

      {/* Finalize Approval Modal */}
      <ClientFinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        gallery={gallery}
        selectedPhotos={selectedPhotos}
        comments={comments}
        isSubmitted={isSubmitted}
        onConfirmSubmit={handleConfirmSubmit}
      />
    </div>
  );
};
