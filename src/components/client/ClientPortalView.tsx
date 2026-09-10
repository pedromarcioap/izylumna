import React, { useState, useEffect } from 'react';
import { Gallery, Photo, GalleryVoter } from '../../types';
import { ClientAuthPin } from './ClientAuthPin';
import { ClientStickyHeader } from './ClientStickyHeader';
import { ClientPhotoGrid } from './ClientPhotoGrid';
import { ClientLightbox } from './ClientLightbox';
import { ClientCommentModal } from './ClientCommentModal';
import { ClientFinalizeModal } from './ClientFinalizeModal';
import { ClientVoterModal } from './ClientVoterModal';
import {
  togglePhotoVoteAsync,
  addPhotoCommentAsync,
  deletePhotoCommentAsync,
  finalizeVoterSelectionAsync
} from '../../lib/storage';

export interface ClientPortalViewProps {
  gallery: Gallery;
  allGalleries?: Gallery[];
  onSelectGallery?: (galleryId: string) => void;
  onUpdateGallery: (updated: Gallery) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onSwitchToAdmin: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  gallery,
  allGalleries = [],
  onUpdateGallery,
  onShowToast
}) => {
  // Session unlock for private galleries (PIN access)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (gallery.privacy === 'public') return true;
    const sessionKey = `lumina_unlocked_${gallery.id}`;
    return sessionStorage.getItem(sessionKey) === 'true';
  });

  // Current logged in voter identity (check both global and gallery-specific keys)
  const [currentVoter, setCurrentVoter] = useState<GalleryVoter | null>(() => {
    try {
      const storedGal = localStorage.getItem(`izylumna_voter_${gallery.id}`);
      if (storedGal) return JSON.parse(storedGal);

      const storedGlobal = localStorage.getItem('izylumna_current_voter');
      if (storedGlobal) return JSON.parse(storedGlobal);

      return null;
    } catch (e) {
      return null;
    }
  });

  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_choices' | 'consensus' | 'commented'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [commentPhoto, setCommentPhoto] = useState<Photo | null>(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [forceReviewMode, setForceReviewMode] = useState(false);

  // Open voter identity modal if unlocked but no voter is selected
  useEffect(() => {
    if (isUnlocked && !currentVoter) {
      setIsIdentityModalOpen(true);
    }
  }, [isUnlocked, currentVoter, gallery.id]);

  const handleUnlock = (matchedGallery?: Gallery) => {
    const targetGal = matchedGallery || gallery;
    const sessionKey = `lumina_unlocked_${targetGal.id}`;
    sessionStorage.setItem(sessionKey, 'true');
    setIsUnlocked(true);

    // If PIN matches another gallery, prompt selection
    if (matchedGallery && matchedGallery.id !== gallery.id) {
      onShowToast('Galeria Encontrada!', `Carregando ensaio de ${matchedGallery.clientName}`, 'success');
    } else {
      onShowToast('Acesso Liberado!', `PIN correto. Por favor, identifique-se para votar.`, 'success');
    }
  };

  const handleSelectVoter = (voter: GalleryVoter) => {
    try {
      localStorage.setItem('izylumna_current_voter', JSON.stringify(voter));
      localStorage.setItem(`izylumna_voter_${gallery.id}`, JSON.stringify(voter));
    } catch (e) {
      console.warn('Failed to save voter identity to localStorage:', e);
    }
    setCurrentVoter(voter);
    setIsIdentityModalOpen(false);
    onShowToast('Votante Ativo', `Bem-vindo(a), ${voter.name}! Suas escolhas serão gravadas sob seu nome.`, 'info');
  };

  const threshold = gallery.consensusThreshold || 2;
  const votesMap = gallery.clientSelection?.votes || {};
  const commentsMap = gallery.clientSelection?.commentsMap || {};

  // Count my votes
  const myVotesCount = gallery.photos.filter((p) =>
    (votesMap[p.id] || []).some((v) => v.voterId === currentVoter?.id)
  ).length;

  // Count consensus photos
  const consensusPhotos = gallery.photos.filter(
    (p) => (votesMap[p.id] || []).length >= threshold
  );
  const consensusCount = consensusPhotos.length;

  // Count photos with comments
  const commentsCount = gallery.photos.filter(
    (p) => (commentsMap[p.id] || []).length > 0
  ).length;

  const isSubmitted = currentVoter?.hasFinalized && !forceReviewMode;

  // Handle vote toggle for current voter
  const handleToggleSelect = async (photo: Photo) => {
    if (!currentVoter) {
      setIsIdentityModalOpen(true);
      return;
    }

    const hasVoted = (votesMap[photo.id] || []).some(
      (v) => v.voterId === currentVoter.id
    );

    // Block extra selections if gallery policy is strictly set to 'block'
    if (!hasVoted && gallery.excessPolicy === 'block') {
      if (myVotesCount >= gallery.quotaIncluded) {
        onShowToast(
          'Cota Máxima Atingida!',
          `O fotógrafo limitou esta galeria ao máximo de ${gallery.quotaIncluded} foto(s) inclusas. Desmarque uma foto selecionada anteriormente para adicionar esta.`,
          'warning'
        );
        return;
      }
    }

    const updated = await togglePhotoVoteAsync(gallery, photo.id, currentVoter);
    onUpdateGallery(updated);

    const hasVotedNow = (updated.clientSelection?.votes?.[photo.id] || []).some(
      (v) => v.voterId === currentVoter.id
    );

    if (hasVotedNow) {
      onShowToast('Voto Registrado!', `Voto em ${photo.originalFileName} adicionado por ${currentVoter.name}`, 'success');
    } else {
      onShowToast('Voto Removido', `Voto removido de ${photo.originalFileName}`, 'info');
    }
  };

  // Add Comment
  const handleAddComment = async (photoId: string, text: string) => {
    if (!currentVoter) {
      setIsIdentityModalOpen(true);
      return;
    }
    const updated = await addPhotoCommentAsync(gallery, photoId, currentVoter, text);
    onUpdateGallery(updated);
    onShowToast('Comentário Adicionado', 'Sua orientação foi registrada no mural da foto.', 'success');
  };

  // Delete Comment
  const handleDeleteComment = async (photoId: string, commentId: string) => {
    const updated = await deletePhotoCommentAsync(gallery, photoId, commentId);
    onUpdateGallery(updated);
    onShowToast('Comentário Excluído', 'Comentário removido.', 'info');
  };

  // Submit Finalization for Voter
  const handleConfirmSubmit = async () => {
    if (!currentVoter) return;
    const updated = await finalizeVoterSelectionAsync(gallery, currentVoter.id);
    const voterUpdated = { ...currentVoter, hasFinalized: true };
    setCurrentVoter(voterUpdated);
    localStorage.setItem(`izylumna_voter_${gallery.id}`, JSON.stringify(voterUpdated));
    localStorage.setItem('izylumna_current_voter', JSON.stringify(voterUpdated));
    onUpdateGallery(updated);
    setForceReviewMode(false);
    onShowToast('Seleção Finalizada!', `A escolha de ${currentVoter.name} foi gravada com sucesso.`, 'success');
  };

  // Filter photos logic
  const filteredPhotos = gallery.photos
    .filter((photo) => {
      if (activeFilter === 'my_choices') {
        return (votesMap[photo.id] || []).some((v) => v.voterId === currentVoter?.id);
      }
      if (activeFilter === 'consensus') {
        return (votesMap[photo.id] || []).length >= threshold;
      }
      if (activeFilter === 'commented') {
        return (commentsMap[photo.id] || []).length > 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'consensus') {
        const countA = (votesMap[a.id] || []).length;
        const countB = (votesMap[b.id] || []).length;
        return countB - countA; // Sort most voted first
      }
      return 0;
    });

  const myVotedPhotos = gallery.photos.filter((p) =>
    (votesMap[p.id] || []).some((v) => v.voterId === currentVoter?.id)
  );

  // Step 1: If private and locked, show PIN prompt
  if (!isUnlocked) {
    return <ClientAuthPin gallery={gallery} allGalleries={allGalleries} onUnlock={handleUnlock} />;
  }

  // Step 2: If unlocked but voter identity has not been confirmed, block grid and require name
  if (!currentVoter || isIdentityModalOpen) {
    return (
      <div className="min-h-screen bg-[#0c0d0e]">
        <ClientVoterModal
          isOpen={true}
          gallery={gallery}
          onSelectVoter={handleSelectVoter}
        />
      </div>
    );
  }

  // Step 3: Render collaborative gallery
  return (
    <div className="min-h-screen pb-20 bg-[#0c0d0e]">
      {/* Sticky Top Header */}
      <ClientStickyHeader
        gallery={gallery}
        currentVoter={currentVoter}
        onChangeVoter={() => setIsIdentityModalOpen(true)}
        myVotesCount={myVotesCount}
        consensusCount={consensusCount}
        commentsCount={commentsCount}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenFinalizeModal={() => setIsFinalizeModalOpen(true)}
        isSubmitted={Boolean(isSubmitted)}
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
        currentVoter={currentVoter}
        isSubmitted={Boolean(isSubmitted)}
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
          currentVoter={currentVoter}
          isSubmitted={Boolean(isSubmitted)}
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
          currentVoter={currentVoter}
          commentsList={commentsMap[commentPhoto.id] || []}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {/* Finalize Approval Modal */}
      <ClientFinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        gallery={gallery}
        currentVoter={currentVoter}
        myVotedPhotos={myVotedPhotos}
        consensusCount={consensusCount}
        onConfirmSubmit={handleConfirmSubmit}
      />
    </div>
  );
};
