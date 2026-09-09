import React, { useState, useEffect } from 'react';
import { Gallery, ToastMessage, PhotographerSession, PhotographerProfile } from './types';
import {
  getGalleries,
  getGalleriesAsync,
  saveGalleryAsync,
  deleteGalleryAsync,
  getGalleryByPinAsync
} from './lib/storage';
import { getPhotographerSession, logoutPhotographer, savePhotographerProfile } from './lib/auth';
import { TopNavigation } from './components/common/TopNavigation';
import { ToastContainer } from './components/ui/Toast';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GalleryDetailView } from './components/admin/GalleryDetailView';
import { GalleryFormModal } from './components/admin/GalleryFormModal';
import { PhotographerLogin } from './components/admin/PhotographerLogin';
import { ClientPortalView } from './components/client/ClientPortalView';

export default function App() {
  const [galleries, setGalleries] = useState<Gallery[]>(() => getGalleries());
  const [photographerSession, setPhotographerSession] = useState<PhotographerSession>(() => getPhotographerSession());
  const [currentRole, setCurrentRole] = useState<'admin' | 'client'>('admin');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(() => {
    const list = getGalleries();
    return list[0]?.id || '';
  });
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // Admin view sub-navigation: 'list' or 'detail'
  const [adminSubView, setAdminSubView] = useState<'list' | 'detail'>('list');
  const [detailGalleryId, setDetailGalleryId] = useState<string | null>(null);

  // Modal for creating/editing galleries
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [galleryToEdit, setGalleryToEdit] = useState<Gallery | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch initial data from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingSupabase(true);
      try {
        const fetched = await getGalleriesAsync();
        if (isMounted) {
          setGalleries(fetched);
          if (fetched.length > 0 && !selectedGalleryId) {
            setSelectedGalleryId(fetched[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to sync with Supabase:', err);
      } finally {
        if (isMounted) setIsLoadingSupabase(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check URL params on load (support ?pin=1234 or ?gallery=id or ?role=client)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pinParam = params.get('pin');
      const galleryParam = params.get('gallery');
      const roleParam = params.get('role');

      if (pinParam) {
        // Direct PIN lookup from URL
        getGalleryByPinAsync(pinParam).then((g) => {
          if (g) {
            setSelectedGalleryId(g.id);
            setCurrentRole('client');
          }
        });
      } else if (galleryParam) {
        if (galleries.some((g) => g.id === galleryParam)) {
          setSelectedGalleryId(galleryParam);
        }
      }

      if (roleParam === 'client') {
        setCurrentRole('client');
      } else if (roleParam === 'admin') {
        setCurrentRole('admin');
      }
    } catch (e) {
      console.warn('Error parsing URL params:', e);
    }
  }, [galleries]);

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newToast: ToastMessage = { id, title, description, type, duration: 4000 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handlers
  const handleLoginSuccess = () => {
    const current = getPhotographerSession();
    setPhotographerSession(current);
  };

  const handleLogout = () => {
    logoutPhotographer();
    setPhotographerSession({
      isAuthenticated: false,
      profile: photographerSession.profile
    });
    showToast('Sessão Encerrada', 'Você saiu do Painel do Fotógrafo.', 'info');
  };

  const handleUpdateProfile = (updated: PhotographerProfile) => {
    savePhotographerProfile(updated);
    setPhotographerSession((prev) => ({
      ...prev,
      profile: updated
    }));
  };

  // CRUD handlers via Supabase with automatic local fallback
  const handleSaveGallery = async (gallery: Gallery) => {
    try {
      const saved = await saveGalleryAsync(gallery);
      const updatedList = await getGalleriesAsync();

      const finalGalleries = updatedList.some((g) => g.id === saved.id)
        ? updatedList
        : [saved, ...updatedList];

      setGalleries(finalGalleries);
      setSelectedGalleryId(saved.id);

      showToast(
        galleryToEdit ? 'Galeria Atualizada!' : 'Galeria Publicada com Sucesso!',
        `O ensaio "${saved.title}" (PIN: ${saved.pinCode}) está pronto para acesso.`,
        'success'
      );
    } catch (e) {
      console.error('Error in handleSaveGallery:', e);
      showToast('Galeria Salva Localmente', 'Salvo no navegador (modo offline/fallback).', 'info');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      await deleteGalleryAsync(id);
      const updatedList = await getGalleriesAsync();
      const finalGalleries = updatedList.filter((g) => g.id !== id);
      setGalleries(finalGalleries);

      if (selectedGalleryId === id) {
        setSelectedGalleryId(finalGalleries[0]?.id || '');
      }
      if (detailGalleryId === id) {
        setAdminSubView('list');
        setDetailGalleryId(null);
      }
      showToast('Galeria Excluída', 'A galeria e seus registros foram removidos.', 'info');
    } catch (e) {
      console.error('Error deleting gallery:', e);
      showToast('Erro ao Excluir', 'Falha ao remover a galeria.', 'error');
    }
  };

  const handleUpdateGalleryFromClient = async (updated: Gallery) => {
    try {
      const saved = await saveGalleryAsync(updated);
      const updatedList = await getGalleriesAsync();
      const finalGalleries = updatedList.some((g) => g.id === saved.id)
        ? updatedList
        : updatedList.map((g) => (g.id === saved.id ? saved : g));
      setGalleries(finalGalleries);
    } catch (e) {
      console.warn('Fallback update from client:', e);
    }
  };

  // Open client view for a specific gallery
  const handleOpenClientView = (galleryId: string) => {
    setSelectedGalleryId(galleryId);
    setCurrentRole('client');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View results/lightroom details
  const handleViewGalleryDetails = (gallery: Gallery) => {
    setDetailGalleryId(gallery.id);
    setAdminSubView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active gallery for client portal
  const activeGallery = galleries.find((g) => g.id === selectedGalleryId) || galleries[0];

  // Active gallery for admin detail view
  const detailGallery = galleries.find((g) => g.id === detailGalleryId);

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Application Header */}
      <TopNavigation
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeGalleryId={selectedGalleryId}
        galleries={galleries}
        onSelectGallery={(id) => setSelectedGalleryId(id)}
        onResetData={() => {
          showToast('Banco de Dados Supabase Ativo', 'Todas as alterações são sincronizadas ao vivo com o Supabase.', 'info');
        }}
        isPhotographerAuthenticated={photographerSession.isAuthenticated}
        photographerProfile={photographerSession.profile}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1">
        {currentRole === 'admin' ? (
          !photographerSession.isAuthenticated ? (
            <PhotographerLogin
              onLoginSuccess={handleLoginSuccess}
              onReturnToClient={() => setCurrentRole('client')}
              onShowToast={showToast}
            />
          ) : (
            <div className="px-4 sm:px-6 lg:px-8 pt-6">
              {adminSubView === 'detail' && detailGallery ? (
                <GalleryDetailView
                  gallery={detailGallery}
                  onBack={() => setAdminSubView('list')}
                  onOpenClientView={handleOpenClientView}
                  onEditGallery={(g) => {
                    setGalleryToEdit(g);
                    setIsFormModalOpen(true);
                  }}
                  onShowToast={showToast}
                />
              ) : (
                <AdminDashboard
                  galleries={galleries}
                  photographerProfile={photographerSession.profile}
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
              )}
            </div>
          )
        ) : activeGallery ? (
          <ClientPortalView
            key={activeGallery.id}
            gallery={activeGallery}
            allGalleries={galleries}
            onSelectGallery={(id) => setSelectedGalleryId(id)}
            onUpdateGallery={handleUpdateGalleryFromClient}
            onShowToast={showToast}
            onSwitchToAdmin={() => setCurrentRole('admin')}
          />
        ) : (
          <div className="text-center py-24">
            <h3 className="text-lg font-semibold text-zinc-300">
              {isLoadingSupabase ? 'Carregando dados do Supabase...' : 'Nenhuma galeria encontrada'}
            </h3>
            <button
              onClick={() => setCurrentRole('admin')}
              className="text-amber-400 underline text-sm mt-2 inline-block"
            >
              Ir ao Painel do Fotógrafo
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Gallery Dialog */}
      <GalleryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setGalleryToEdit(null);
        }}
        onSave={handleSaveGallery}
        galleryToEdit={galleryToEdit}
      />

      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
