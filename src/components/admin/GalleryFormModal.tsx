import React, { useState, useEffect, useRef } from 'react';
import { Gallery, GalleryStatus, PrivacyType, ExcessPolicy, Photo, GalleryVoter } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../common/SafeImage';
import { uploadPhotoFile } from '../../lib/photoUpload';
import {
  Upload,
  Plus,
  Trash2,
  Lock,
  Eye,
  Key,
  ShieldAlert,
  Sparkles,
  DollarSign,
  HelpCircle,
  Image as ImageIcon,
  Check,
  Users,
  UserPlus
} from 'lucide-react';

export interface GalleryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryToEdit?: Gallery | null;
  onSave: (gallery: Gallery) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Retrato Noivos - Luz Natural',
    original: 'IMG_4021.CR3',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Cerimônia - Troca de Alianças',
    original: 'IMG_4022.CR3',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Entrada da Noiva - Emoção',
    original: 'IMG_4023.CR3',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Recepção - Pista de Dança',
    original: 'IMG_4024.CR3',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Detalhes - Buquê e Alianças',
    original: 'IMG_4025.CR3',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop'
  }
];

export const GalleryFormModal: React.FC<GalleryFormModalProps> = ({
  isOpen,
  onClose,
  galleryToEdit,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<GalleryStatus>('awaiting_client');
  const [privacy, setPrivacy] = useState<PrivacyType>('private');
  const [pinCode, setPinCode] = useState('1234');
  const [quotaIncluded, setQuotaIncluded] = useState(20);
  const [excessPolicy, setExcessPolicy] = useState<ExcessPolicy>('charge');
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(30);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('PROVA • LUMINA STUDIO • PROVA');
  
  // Collaborative Voting Configuration
  const [predefinedVoters, setPredefinedVoters] = useState<GalleryVoter[]>([]);
  const [newVoterName, setNewVoterName] = useState('');
  const [consensusThreshold, setConsensusThreshold] = useState(2);
  const [allowFreeVoterRegistration, setAllowFreeVoterRegistration] = useState(true);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (galleryToEdit) {
      setTitle(galleryToEdit.title);
      setClientName(galleryToEdit.clientName);
      setClientEmail(galleryToEdit.clientEmail || '');
      setClientPhone(galleryToEdit.clientPhone || '');
      setEventDate(galleryToEdit.eventDate);
      setDescription(galleryToEdit.description);
      setStatus(galleryToEdit.status);
      setPrivacy(galleryToEdit.privacy);
      setPinCode(galleryToEdit.pinCode || '1234');
      setQuotaIncluded(galleryToEdit.quotaIncluded);
      setExcessPolicy(galleryToEdit.excessPolicy);
      setExtraPhotoPrice(galleryToEdit.extraPhotoPrice || 30);
      setWatermarkEnabled(galleryToEdit.watermarkEnabled);
      setWatermarkText(galleryToEdit.watermarkText || 'PROVA • LUMINA STUDIO • PROVA');

      setPredefinedVoters(galleryToEdit.predefinedVoters || [
        { id: 'v1', name: 'Noiva', isDecisionMaker: true },
        { id: 'v2', name: 'Noivo', isDecisionMaker: true }
      ]);
      setConsensusThreshold(galleryToEdit.consensusThreshold || 2);
      setAllowFreeVoterRegistration(galleryToEdit.allowFreeVoterRegistration ?? true);

      setPhotos(galleryToEdit.photos || []);
      setCoverPhotoUrl(galleryToEdit.coverPhotoUrl);
    } else {
      setTitle('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setDescription('Sejam bem-vindos à sua galeria de seleção! Por favor, revisem as fotos com calma e votem nas suas favoritas.');
      setStatus('awaiting_client');
      setPrivacy('private');
      setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
      setQuotaIncluded(20);
      setExcessPolicy('charge');
      setExtraPhotoPrice(30);
      setWatermarkEnabled(true);
      setWatermarkText('PROVA • FOTÓGRAFO • PROVA');

      setPredefinedVoters([
        { id: 'v1', name: 'Noiva', isDecisionMaker: true },
        { id: 'v2', name: 'Noivo', isDecisionMaker: true }
      ]);
      setConsensusThreshold(2);
      setAllowFreeVoterRegistration(true);

      const initialPhotos: Photo[] = SAMPLE_PHOTO_PRESETS.map((p, idx) => ({
        id: `photo-new-${Date.now()}-${idx}`,
        originalFileName: p.original,
        url: p.url,
        caption: p.name
      }));
      setPhotos(initialPhotos);
      setCoverPhotoUrl(initialPhotos[0]?.url || '');
    }
    setFormErrors({});
  }, [galleryToEdit, isOpen]);

  const handleAddPredefinedVoter = () => {
    const clean = newVoterName.trim();
    if (!clean) return;
    setPredefinedVoters((prev) => [
      ...prev,
      {
        id: `voter-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: clean,
        isDecisionMaker: false
      }
    ]);
    setNewVoterName('');
  };

  const handleRemovePredefinedVoter = (id: string) => {
    setPredefinedVoters((prev) => prev.filter((v) => v.id !== id));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processAndAddFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    // Create temporary photos with blob URLs for instantaneous visual preview
    const tempItems = fileList.map((file, idx) => {
      const blobUrl = URL.createObjectURL(file);
      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
        file,
        blobUrl,
        photo: {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
          originalFileName: file.name,
          url: blobUrl,
          caption: file.name.replace(/\.[^/.]+$/, '')
        }
      };
    });

    // Add temp photos to UI immediately
    setPhotos((prev) => [...prev, ...tempItems.map((t) => t.photo)]);
    if (!coverPhotoUrl && tempItems.length > 0) {
      setCoverPhotoUrl(tempItems[0].photo.url);
    }

    // Process files asynchronously to get permanent URLs (Supabase storage or Base64 Data URL)
    for (const item of tempItems) {
      try {
        const permanentUrl = await uploadPhotoFile(item.file, galleryToEdit?.id || 'new');
        URL.revokeObjectURL(item.blobUrl);

        setPhotos((prevPhotos) =>
          prevPhotos.map((p) => (p.id === item.photo.id ? { ...p, url: permanentUrl } : p))
        );

        setCoverPhotoUrl((prevCover) => (prevCover === item.blobUrl ? permanentUrl : prevCover));
      } catch (err) {
        console.warn('[GalleryFormModal] Erro ao processar upload de imagem:', err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processAndAddFiles(Array.from(files) as File[]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const imageFiles = (Array.from(files) as File[]).filter((file) => file.type.startsWith('image/'));
    processAndAddFiles(imageFiles);
  };

  const handleAddSamplePhotos = () => {
    const nextIdx = photos.length + 1;
    const additional: Photo[] = [
      {
        id: `sample-${Date.now()}-1`,
        originalFileName: `IMG_${String(4100 + nextIdx).padStart(4, '0')}.CR3`,
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        caption: `Ensaio Fotográfico #${nextIdx}`
      },
      {
        id: `sample-${Date.now()}-2`,
        originalFileName: `IMG_${String(4100 + nextIdx + 1).padStart(4, '0')}.CR3`,
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
        caption: `Ensaio Fotográfico #${nextIdx + 1}`
      }
    ];
    setPhotos((prev) => [...prev, ...additional]);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (photos.find((p) => p.id === photoId)?.url === coverPhotoUrl) {
      const remaining = photos.filter((p) => p.id !== photoId);
      setCoverPhotoUrl(remaining[0]?.url || '');
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Título da galeria é obrigatório.';
    if (!clientName.trim()) errors.clientName = 'Nome do cliente é obrigatório.';
    if (quotaIncluded <= 0) errors.quotaIncluded = 'A cota inclusa deve ser maior que zero.';
    if (privacy === 'private' && (!pinCode || pinCode.length < 4)) {
      errors.pinCode = 'O PIN deve ter no mínimo 4 dígitos.';
    }
    if (photos.length === 0) {
      errors.photos = 'Adicione ao menos uma foto à galeria.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const galleryData: Gallery = {
        id: galleryToEdit ? galleryToEdit.id : `gal-${Date.now()}`,
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        description: description.trim(),
        status,
        privacy,
        pinCode: privacy === 'private' ? pinCode : undefined,
        predefinedVoters,
        consensusThreshold: Number(consensusThreshold),
        allowFreeVoterRegistration,
        voters: galleryToEdit?.voters || predefinedVoters,
        quotaIncluded: Number(quotaIncluded),
        excessPolicy,
        extraPhotoPrice: excessPolicy === 'charge' ? Number(extraPhotoPrice) : 0,
        watermarkEnabled,
        watermarkText: watermarkEnabled ? watermarkText : undefined,
        coverPhotoUrl: coverPhotoUrl || photos[0]?.url || '',
        photos,
        clientSelection: galleryToEdit?.clientSelection || {
          selectedPhotoIds: [],
          comments: {},
          votes: {},
          commentsMap: {},
          status: 'pending'
        },
        createdAt: galleryToEdit ? galleryToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(galleryData);
    } catch (err) {
      console.error('Error submitting gallery form:', err);
    } finally {
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={galleryToEdit ? 'Editar Galeria' : 'Criar Nova Galeria Colaborativa'}
      description="Configure os detalhes do ensaio, o sistema de votação colaborativa e a cota de fotos."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Informações Gerais */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span>1. Informações do Ensaio / Cliente</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Título do Projeto / Ensaio *"
              placeholder="ex: Casamento Marina & Lucas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={formErrors.title}
            />
            <Input
              label="Nome do Cliente Principal *"
              placeholder="ex: Marina Alencar"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              error={formErrors.clientName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="E-mail do Cliente"
              type="email"
              placeholder="marina@email.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <Input
              label="Telefone / WhatsApp"
              placeholder="(11) 98765-4321"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
            <Input
              label="Data do Evento / Ensaio"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Mensagem de Boas-Vindas para o Cliente"
            placeholder="Escreva orientações para a família ao acessar a galeria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* SECTION 2: Votação Colaborativa & Consenso */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>2. Votação Colaborativa & Regras de Consenso</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mínimo de Votos para Consenso *"
              type="number"
              min={1}
              max={10}
              value={consensusThreshold}
              onChange={(e) => setConsensusThreshold(Number(e.target.value))}
              helperText="Ex: 2 votos significa que a foto precisa ser votada por 2 pessoas para virar consenso."
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Cadastro Aberto de Votantes por PIN:
              </label>
              <Select
                value={allowFreeVoterRegistration ? 'true' : 'false'}
                onChange={(e) => setAllowFreeVoterRegistration(e.target.value === 'true')}
                options={[
                  { value: 'true', label: 'Sim — Qualquer pessoa com o PIN pode digitar seu nome' },
                  { value: 'false', label: 'Não — Restrito estritamente aos papéis pré-definidos' }
                ]}
              />
            </div>
          </div>

          {/* Predefined Voters Roles list */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Participantes / Papéis Pré-definidos (Ex: Noiva, Noivo, Mãe, Fotógrafo):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Pai da Noiva, Padrinho..."
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddPredefinedVoter}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {predefinedVoters.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-850 border border-zinc-750 text-xs text-zinc-200"
                >
                  <span>{v.name}</span>
                  {v.isDecisionMaker && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono">
                      Tomador
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePredefinedVoter(v.id)}
                    className="text-zinc-500 hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Quota & Acesso PIN */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Lock className="w-4 h-4" />
            <span>3. Cota de Fotos e Acesso por PIN</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Cota de Fotos Inclusas *"
              type="number"
              min={1}
              value={quotaIncluded}
              onChange={(e) => setQuotaIncluded(Number(e.target.value))}
              error={formErrors.quotaIncluded}
            />

            <Input
              label="PIN Único de Acesso *"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              error={formErrors.pinCode}
            />

            <Select
              label="Política de Excedentes"
              value={excessPolicy}
              onChange={(e) => setExcessPolicy(e.target.value as ExcessPolicy)}
              options={[
                { value: 'charge', label: 'Cobrar fotos extras (R$ por foto)' },
                { value: 'free_approval', label: 'Aprovação livre (Sem custo extra)' },
                { value: 'block', label: 'Bloquear ao atingir a cota' }
              ]}
            />
          </div>

          {excessPolicy === 'charge' && (
            <Input
              label="Preço por Foto Extra (R$) *"
              type="number"
              step="0.01"
              value={extraPhotoPrice}
              onChange={(e) => setExtraPhotoPrice(Number(e.target.value))}
              error={formErrors.extraPhotoPrice}
            />
          )}
        </div>

        {/* SECTION 4: Upload das Fotos */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-2 gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>4. Fotografias da Galeria ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="amber"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shadow-md shadow-amber-500/10"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                <span>Upload de Fotos (Múltiplas)</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSamplePhotos}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Exemplo</span>
              </Button>
              {photos.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotos([]);
                    setCoverPhotoUrl('');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Limpar</span>
                </Button>
              )}
            </div>
          </div>

          {formErrors.photos && <p className="text-xs text-red-400 font-medium">{formErrors.photos}</p>}

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/40'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Clique para escolher ou arraste e solte fotos aqui (sem limite de quantidade)
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Suporta upload múltiplo simultâneo (JPG, PNG, WEBP, HEIC e RAW)
                </p>
              </div>
            </div>
          </div>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-2 bg-zinc-950/60 rounded-xl border border-zinc-850">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 aspect-3/2">
                  <SafeImage
                    src={photo.url}
                    alt={photo.originalFileName}
                    fallbackText={photo.originalFileName}
                    className="w-full h-full object-cover"
                  />
                  
                  {coverPhotoUrl === photo.url && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold text-[9px] uppercase tracking-wider">
                      Capa
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverPhotoUrl(photo.url);
                      }}
                      className={`p-1.5 rounded-full text-xs font-bold ${coverPhotoUrl === photo.url ? 'bg-amber-500 text-black' : 'bg-black/80 text-white hover:bg-amber-500/80'}`}
                      title="Definir como Capa"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(photo.id);
                      }}
                      className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                      title="Excluir Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="amber" className="font-semibold shadow-lg shadow-amber-500/20">
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>{galleryToEdit ? 'Salvar Alterações' : 'Criar Galeria Colaborativa'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
