import React, { useEffect, useState } from 'react';
import { 
  getValidAdobeAccessToken, 
  getAdobeOAuthUrl,
  listLightroomAlbums, 
  getAlbumAssets 
} from '../../lib/adobeLightroom';
import { saveGalleryAsync } from '../../lib/storage';
import { LightroomAlbum, Gallery, Photo } from '../../types';
import { X, Cloud, Image as ImageIcon, Loader2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdobeImportModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onGalleryCreated: (gallery: Gallery) => void;
  onShowToast: (type: 'success' | 'error' | 'warning', title: string, description?: string) => void;
}

export const AdobeImportModal: React.FC<AdobeImportModalProps> = ({
  userId,
  isOpen,
  onClose,
  onGalleryCreated,
  onShowToast,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [importing, setImporting] = useState<boolean>(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<LightroomAlbum[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadAlbums() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const validCreds = await getValidAdobeAccessToken(userId);
        if (!validCreds || !validCreds.accessToken) {
          setErrorMsg('Sua conta Adobe não está conectada ou o acesso expirou. Conecte novamente nas Configurações.');
          setLoading(false);
          return;
        }

        setAccessToken(validCreds.accessToken);
        const catId = validCreds.catalogId || 'default';
        setCatalogId(catId);

        const albumList = await listLightroomAlbums(validCreds.accessToken, catId);
        setAlbums(albumList);
      } catch (err: any) {
        console.error('Error loading Lightroom albums:', err);
        setErrorMsg(err.message || 'Erro ao consultar álbuns no Adobe Lightroom.');
      } finally {
        setLoading(false);
      }
    }

    loadAlbums();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  async function handleImportAlbum(album: LightroomAlbum) {
    if (!accessToken || !catalogId) return;

    setImporting(true);
    setSelectedAlbumId(album.id);

    try {
      // 1. Fetch assets from the selected Lightroom album
      const assets = await getAlbumAssets(accessToken, catalogId, album.id);

      if (assets.length === 0) {
        onShowToast('warning', 'Álbum Vazio', 'O álbum selecionado não contém fotos para importar.');
        setImporting(false);
        return;
      }

      // 2. Map Adobe assets to Izy Lumna Photo model
      const photos: Photo[] = assets.map((asset, idx) => ({
        id: `photo_adobe_${asset.id}`,
        originalFileName: asset.payload.fileName || `Adobe_Photo_${idx + 1}.jpg`,
        url: asset.renditionUrl || '',
        adobeAssetId: asset.id,
        adobeRenditionUrl: asset.renditionUrl,
        isStarred: false,
        metadata: {
          taken_at: asset.payload.captureDate || asset.created,
        },
        votes: [],
        commentsList: [],
      }));

      // 3. Create new Gallery object
      const newGallery: Gallery = {
        id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: album.payload.name || 'Nova Galeria Lightroom',
        clientName: 'Cliente Adobe Lightroom',
        clientEmail: '',
        clientPhone: '',
        eventDate: new Date().toISOString().split('T')[0],
        description: `Galeria importada diretamente do Adobe Lightroom Cloud (${assets.length} fotos).`,
        coverPhotoUrl: photos[0]?.url || '',
        status: 'awaiting_client',
        privacy: 'public',
        adobeCatalogId: catalogId,
        adobeAlbumId: album.id,
        quotaIncluded: photos.length,
        excessPolicy: 'free_approval',
        extraPhotoPrice: 0,
        watermarkEnabled: false,
        photos: photos,
        clientSelection: {
          selectedPhotoIds: [],
          comments: {},
          status: 'pending',
          votes: {},
          commentsMap: {},
          voters: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 4. Save gallery to Supabase
      const saved = await saveGalleryAsync(newGallery);

      onShowToast('success', 'Galeria Importada!', `${photos.length} fotos foram importadas com sucesso do Adobe Lightroom.`);
      onGalleryCreated(saved);
      onClose();
    } catch (err: any) {
      console.error('Import Album Error:', err);
      onShowToast('error', 'Falha na Importação', err.message || 'Não foi possível importar o álbum.');
    } finally {
      setImporting(false);
      setSelectedAlbumId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141618] border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importar do Adobe Lightroom Cloud</h3>
              <p className="text-xs text-zinc-400">Selecione um álbum do seu catálogo para criar uma galeria automaticamente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm text-zinc-400">Carregando seus álbuns do Lightroom Cloud...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm text-red-200">{errorMsg}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const authUrl = getAdobeOAuthUrl();
                    window.location.href = authUrl;
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm inline-flex items-center gap-2 shadow-lg transition"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Conectar Conta Adobe Agora</span>
                </button>
              </div>
            </div>
          ) : albums.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-base font-medium text-zinc-300">Nenhum álbum encontrado</p>
              <p className="text-xs text-zinc-500">Crie álbuns no seu Adobe Lightroom Cloud para importá-los diretamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {albums.map((album) => {
                const isSelected = selectedAlbumId === album.id;

                return (
                  <div
                    key={album.id}
                    className="group bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between transition shadow-md hover:shadow-emerald-500/5"
                  >
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition text-base">
                          {album.payload.name}
                        </h4>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                          {album.assetCount ?? '?'} fotos
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        ID: {album.id}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImportAlbum(album)}
                      disabled={importing}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {importing && isSelected ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importando Renditions...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Importar Álbum
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
