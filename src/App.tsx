import React, { useState, useEffect } from 'react';
import { Gallery, ToastMessage, PhotographerSession, PhotographerProfile } from './types';
import {
  getGalleries,
  getGalleriesAsync,
  getTrashGalleriesAsync,
  saveGalleryAsync,
  deleteGalleryAsync,
  restoreGalleryAsync,
  permanentlyDeleteGalleryAsync,
  emptyTrashAsync,
  getGalleryByPinAsync
} from './lib/storage';
import { getPhotographerSession, logoutPhotographer, savePhotographerProfile } from './lib/auth';
import { AppLayout } from './components/common/AppLayout';
import { TopNavigation } from './components/common/TopNavigation';
import { ToastContainer } from './components/ui/Toast';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GalleryDetailView } from './components/admin/GalleryDetailView';
import { GalleryFormModal } from './components/admin/GalleryFormModal';
import { PhotographerLogin } from './components/admin/PhotographerLogin';
import { ClientPortalView } from './components/client/ClientPortalView';
import { AdobeOAuthCallbackView } from './components/admin/AdobeOAuthCallbackView';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute, StaffRoute } from './components/auth/ProtectedRoute';
import { PosProductionView } from './components/admin/PosProductionView';
import { FinancialExtrasView } from './components/admin/FinancialExtrasView';
import { FiltersMetadataView } from './components/admin/FiltersMetadataView';
import { PresentationModeView } from './components/client/PresentationModeView';
import { StudioSettingsView } from './components/settings/StudioSettingsView';
import { TrashBinView } from './components/admin/TrashBinView';


export default function App() {
  const { user, profile, signOut, isLoading: isAuthLoading } = useAuth();
  
  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<'admin' | 'client'>('admin');
  const [activeNavTab, setActiveNavTab] = useState<string>('galleries');
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('collections');
  const [settingsSubTab, setSettingsSubTab] = useState<'perfil' | 'team' | 'adobe' | 'pix'>('perfil');

  // Application Data State
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [trashGalleries, setTrashGalleries] = useState<Gallery[]>([]);
  const [activeGalleryId, setActiveGalleryId] = useState<string>('');
  const [adminSubView, setAdminSubView] = useState<'list' | 'detail'>('list');
  const [detailGalleryId, setDetailGalleryId] = useState<string | null>(null);

  // Modal & Edit State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [galleryToEdit, setGalleryToEdit] = useState<Gallery | null>(null);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Photographer Auth/Profile Session
  const [photographerSession, setPhotographerSession] = useState<PhotographerSession>(getPhotographerSession());

  // Check OAuth callback path
  const isAdobeCallback = window.location.pathname === '/adobe-callback';

  const refreshGalleriesAndTrash = async () => {
    try {
      const active = await getGalleriesAsync();
      const trash = await getTrashGalleriesAsync();
      setGalleries(active);
      setTrashGalleries(trash);
      if (active.length > 0 && (!activeGalleryId || !active.some((g) => g.id === activeGalleryId))) {
        setActiveGalleryId(active[0].id);
      }
    } catch (err) {
      console.error('Failed to load async galleries, fallback to local', err);
      const syncData = getGalleries();
      setGalleries(syncData);
      if (syncData.length > 0 && !activeGalleryId) {
        setActiveGalleryId(syncData[0].id);
      }
    }
  };

  // Load Galleries from database/local storage
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await refreshGalleriesAndTrash();
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    duration?: number
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => {
      const isDuplicate = prev.some(
        (t) => t.title === title && t.description === description && t.type === type
      );
      if (isDuplicate) return prev;
      return [...prev, { id, title, description, type, duration }];
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateProfile = (updated: PhotographerProfile) => {
    savePhotographerProfile(updated);
    setPhotographerSession(getPhotographerSession());
    showToast('Perfil Atualizado!', 'As informações do seu estúdio foram salvas.', 'success');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    logoutPhotographer();
    setPhotographerSession(getPhotographerSession());
    setCurrentRole('admin');
    showToast('Sessão Encerrada', 'Você saiu da área administrativa.', 'info');
  };

  const isUserAdmin = profile?.role === 'admin';
  const currentUserId = profile?.id || user?.id || photographerSession.profile?.id;

  const userGalleries = React.useMemo(() => {
    if (isUserAdmin) return galleries;
    if (!currentUserId) return [];
    return galleries.filter((g) => g.userId === currentUserId);
  }, [galleries, isUserAdmin, currentUserId]);

  const userTrashGalleries = React.useMemo(() => {
    if (isUserAdmin) return trashGalleries;
    if (!currentUserId) return [];
    return trashGalleries.filter((g) => g.userId === currentUserId);
  }, [trashGalleries, isUserAdmin, currentUserId]);

  // Keep activeGalleryId valid for the current user's authorized galleries
  useEffect(() => {
    if (userGalleries.length > 0) {
      if (!activeGalleryId || !userGalleries.some((g) => g.id === activeGalleryId)) {
        setActiveGalleryId(userGalleries[0].id);
      }
    } else if (activeGalleryId && !isUserAdmin) {
      setActiveGalleryId('');
    }
  }, [userGalleries, activeGalleryId, isUserAdmin]);

  const handleSaveGallery = async (galleryData: Partial<Gallery>) => {
    let updatedList: Gallery[];
    if (galleryToEdit) {
      // Editing existing gallery
      const fullUpdated: Gallery = {
        ...galleryToEdit,
        ...galleryData,
        userId: galleryToEdit.userId || currentUserId,
        updatedAt: new Date().toISOString()
      };
      await saveGalleryAsync(fullUpdated);
      updatedList = await getGalleriesAsync();
      setGalleries(updatedList);
      showToast('Ensaio Atualizado!', `As alterações em "${fullUpdated.title}" foram salvas.`, 'success');
    } else {
      // Creating new gallery
      const newGallery: Gallery = {
        id: `gal-${Date.now()}`,
        userId: currentUserId,
        title: galleryData.title || 'Novo Ensaio Lumina',
        clientName: galleryData.clientName || 'Cliente Lumina',
        clientEmail: galleryData.clientEmail || 'cliente@exemplo.com',
        clientPhone: galleryData.clientPhone || '',
        eventDate: galleryData.eventDate || new Date().toISOString().split('T')[0],
        description: galleryData.description || 'Ensaio fotográfico Lumina',
        coverPhotoUrl: galleryData.coverPhotoUrl || 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
        status: 'awaiting_client',
        privacy: galleryData.privacy || 'private',
        pinCode: galleryData.pinCode || Math.floor(1000 + Math.random() * 9000).toString(),
        quotaIncluded: galleryData.quotaIncluded || 20,
        maxContractedPhotos: galleryData.maxContractedPhotos || 50,
        excessPolicy: galleryData.excessPolicy || 'charge',
        extraPhotoPrice: galleryData.extraPhotoPrice || 30.0,
        watermarkEnabled: galleryData.watermarkEnabled ?? true,
        watermarkText: galleryData.watermarkText || 'IZY LUMNA PROOFING',
        photos: galleryData.photos || [],
        clientSelection: {
          selectedPhotoIds: [],
          comments: {},
          status: 'pending'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveGalleryAsync(newGallery);
      updatedList = await getGalleriesAsync();
      setGalleries(updatedList);
      setActiveGalleryId(newGallery.id);
      showToast('Ensaio Criado!', `A galeria "${newGallery.title}" foi publicada com PIN ${newGallery.pinCode}.`, 'success');
    }
    setIsFormModalOpen(false);
    setGalleryToEdit(null);
  };

  const handleDeleteGallery = async (galleryId: string) => {
    const target = galleries.find((g) => g.id === galleryId);
    await deleteGalleryAsync(galleryId);
    await refreshGalleriesAndTrash();

    if (activeGalleryId === galleryId) {
      const remaining = galleries.filter((g) => g.id !== galleryId);
      setActiveGalleryId(remaining.length > 0 ? remaining[0].id : '');
    }
    if (adminSubView === 'detail' && detailGalleryId === galleryId) {
      setAdminSubView('list');
      setDetailGalleryId(null);
    }
    showToast('Ensaio Movido para a Lixeira', `A galeria "${target?.title || 'selecionada'}" foi enviada para a lixeira (retenção de 15 dias).`, 'warning');
  };

  const handleRestoreGallery = async (galleryId: string) => {
    const target = trashGalleries.find((g) => g.id === galleryId);
    await restoreGalleryAsync(galleryId);
    await refreshGalleriesAndTrash();
    showToast('Ensaio Restaurado!', `A galeria "${target?.title || 'selecionada'}" foi restaurada com sucesso.`, 'success');
  };

  const handlePermanentDeleteGallery = async (galleryId: string) => {
    const target = trashGalleries.find((g) => g.id === galleryId);
    await permanentlyDeleteGalleryAsync(galleryId);
    await refreshGalleriesAndTrash();
    showToast('Exclusão Permanente', `A galeria "${target?.title || 'selecionada'}" foi removida definitivamente.`, 'info');
  };

  const handleEmptyTrash = async () => {
    await emptyTrashAsync();
    await refreshGalleriesAndTrash();
    showToast('Lixeira Esvaziada', 'Todos os ensaios da lixeira foram removidos permanentemente.', 'info');
  };

  const handleViewGalleryDetails = (galleryOrId: Gallery | string) => {
    const id = typeof galleryOrId === 'string' ? galleryOrId : galleryOrId?.id;
    if (!id) return;

    const targetGallery = userGalleries.find((g) => g.id === id);
    if (!targetGallery) {
      showToast('Acesso Negado', 'Você só possui permissão para acessar os ensaios criados pela sua conta.', 'error');
      return;
    }

    setDetailGalleryId(id);
    setAdminSubView('detail');
  };

  const handleOpenClientView = (galleryId: string) => {
    const targetGallery = userGalleries.find((g) => g.id === galleryId);
    if (!targetGallery && !isUserAdmin) {
      showToast('Acesso Negado', 'Você só possui permissão para visualizar os ensaios da sua conta.', 'error');
      return;
    }
    setActiveGalleryId(galleryId);
    setCurrentRole('client');
    showToast('Modo Cliente Ativado', 'Você está visualizando a galeria como o cliente.', 'info');
  };

  const handleUpdateGalleryFromClient = async (updatedGallery: Gallery) => {
    await saveGalleryAsync(updatedGallery);
    await refreshGalleriesAndTrash();
  };

  const activeGallery = userGalleries.find((g) => g.id === activeGalleryId);
  const detailGallery = userGalleries.find((g) => g.id === detailGalleryId);

  // If on Adobe OAuth Callback route, render dedicated handler
  if (isAdobeCallback) {
    return (
      <AdobeOAuthCallbackView
        onComplete={() => {
          window.location.href = '/';
        }}
        onShowToast={showToast}
      />
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} onDismiss={removeToast} />

      <AppLayout
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          if (role === 'admin') {
            setAdminSubView('list');
          }
        }}
        galleries={userGalleries}
        trashGalleriesCount={userTrashGalleries.length}
        activeGalleryId={activeGalleryId}
        onSelectGallery={(id) => setActiveGalleryId(id)}
        onCreateGallery={() => {
          setGalleryToEdit(null);
          setIsFormModalOpen(true);
        }}
        activeNavTab={activeNavTab}
        onNavTabChange={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'galleries') {
            setAdminSubView('list');
          }
        }}
        activeSidebarItem={activeSidebarItem}
        onSidebarItemChange={(item) => {
          setActiveSidebarItem(item);
          if (item === 'collections') {
            setActiveNavTab('galleries');
            setAdminSubView('list');
          } else if (item === 'filters') {
            setActiveNavTab('galleries');
          } else if (item === 'billing') {
            setActiveNavTab('financial');
          } else if (item === 'presentation') {
            setActiveNavTab('client_demo');
          } else if (item === 'trash') {
            setActiveNavTab('galleries');
          }
        }}
        onNavigateToSettingsTab={(tab) => setSettingsSubTab(tab)}
        photographerProfile={photographerSession.profile}
        onLogout={handleLogout}
        onShowToast={showToast}
      >
        {/* Main Content View Container */}
        {currentRole === 'admin' ? (
          <ProtectedRoute
            onReturnToClient={() => setCurrentRole('client')}
            onShowToast={showToast}
          >
            <div className="px-4 sm:px-6 lg:px-8 pt-6">
              {adminSubView === 'detail' && detailGallery ? (
                <StaffRoute onReturnToClient={() => setCurrentRole('client')}>
                  <GalleryDetailView
                    gallery={detailGallery}
                    onBack={() => setAdminSubView('list')}
                    onOpenClientView={handleOpenClientView}
                    onEditGallery={(g) => {
                      setGalleryToEdit(g);
                      setIsFormModalOpen(true);
                    }}
                    onDeleteGallery={handleDeleteGallery}
                    onUpdateGallery={handleUpdateGalleryFromClient}
                    onShowToast={showToast}
                  />
                </StaffRoute>
              ) : activeSidebarItem === 'trash' ? (
                <StaffRoute onReturnToClient={() => setCurrentRole('client')}>
                  <TrashBinView
                    trashGalleries={userTrashGalleries}
                    onRestoreGallery={handleRestoreGallery}
                    onPermanentDeleteGallery={handlePermanentDeleteGallery}
                    onEmptyTrash={handleEmptyTrash}
                    onRefresh={refreshGalleriesAndTrash}
                  />
                </StaffRoute>
              ) : activeSidebarItem === 'filters' ? (
                <StaffRoute onReturnToClient={() => setCurrentRole('client')}>
                  <FiltersMetadataView
                    galleries={userGalleries}
                    onShowToast={showToast}
                  />
                </StaffRoute>
              ) : activeSidebarItem === 'settings' ? (
                <StudioSettingsView
                  key={settingsSubTab}
                  initialTab={settingsSubTab}
                  onShowToast={showToast}
                />
              ) : activeNavTab === 'pos_production' ? (
                <StaffRoute onReturnToClient={() => setCurrentRole('client')}>
                  <PosProductionView
                    galleries={userGalleries}
                    onViewGalleryDetails={handleViewGalleryDetails}
                    onShowToast={showToast}
                  />
                </StaffRoute>
              ) : activeNavTab === 'financial' || activeSidebarItem === 'billing' ? (
                <AdminRoute onReturnToClient={() => setCurrentRole('client')}>
                  <FinancialExtrasView
                    galleries={userGalleries}
                    onShowToast={showToast}
                  />
                </AdminRoute>
              ) : (
                <StaffRoute onReturnToClient={() => setCurrentRole('client')}>
                  <AdminDashboard
                    galleries={userGalleries}
                    photographerProfile={{
                      ...photographerSession.profile,
                      name: profile?.full_name || photographerSession.profile.name || 'Usuário Lumina',
                      studioName: photographerSession.profile.studioName || 'Lumina Proofing Studio',
                      email: profile?.email || photographerSession.profile.email || 'admin@lumina.com',
                      phone: photographerSession.profile.phone || '',
                      avatarUrl: profile?.avatar_url || photographerSession.profile.avatarUrl || ''
                    }}
                    onUpdateProfile={handleUpdateProfile}
                    onLogout={handleLogout}
                    onCreateGallery={() => {
                      setGalleryToEdit(null);
                      setIsFormModalOpen(true);
                    }}
                    onEditGallery={(g) => {
                      setGalleryToEdit(g);
                      setIsFormModalOpen(true);
                    }}
                    onDeleteGallery={handleDeleteGallery}
                    onViewGalleryDetails={handleViewGalleryDetails}
                    onOpenClientView={handleOpenClientView}
                    onShowToast={showToast}
                  />
                </StaffRoute>
              )}
            </div>
          </ProtectedRoute>
        ) : activeSidebarItem === 'presentation' && activeGallery ? (
          <PresentationModeView
            gallery={activeGallery}
            onExit={() => {
              setActiveSidebarItem('collections');
              setCurrentRole('client');
            }}
            onShowToast={showToast}
          />
        ) : activeGallery ? (
          <ClientPortalView
            gallery={activeGallery}
            onUpdateGallery={handleUpdateGalleryFromClient}
            onShowToast={showToast}
          />
        ) : (
          <div className="text-center py-20 text-zinc-500 text-sm">
            Nenhuma galeria selecionada para o cliente.
          </div>
        )}
      </AppLayout>

      {/* Modal para Criação/Edição de Galeria */}
      {isFormModalOpen && (
        <GalleryFormModal
          isOpen={isFormModalOpen}
          galleryToEdit={galleryToEdit}
          onClose={() => {
            setIsFormModalOpen(false);
            setGalleryToEdit(null);
          }}
          onSave={handleSaveGallery}
          onShowToast={showToast}
        />
      )}
    </>
  );
}
