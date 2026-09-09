import React, { useState, useEffect } from 'react';
import { Gallery, Photo, ExcessPolicy, PrivacyType, GalleryStatus } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  Lock,
  Globe,
  DollarSign,
  Ban,
  Sparkles,
  Plus,
  KeyRound
} from 'lucide-react';

export interface GalleryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gallery: Gallery) => void;
  galleryToEdit?: Gallery | null;
}

const SAMPLE_PHOTO_PRESETS: { name: string; url: string; original: string }[] = [
  { name: 'Retrato Noiva', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop', original: 'IMG_5010.CR3' },
  { name: 'Altar e Votos', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop', original: 'IMG_5018.CR3' },
  { name: 'Retrato Espontâneo', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop', original: 'IMG_5024.CR3' },
  { name: 'Casal ao Pôr do Sol', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop', original: 'IMG_5033.CR3' },
  { name: 'Dança dos Noivos', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop', original: 'IMG_5041.CR3' },
  { name: 'Detalhe Alianças', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop', original: 'IMG_5055.CR3' }
];

export const GalleryFormModal: React.FC<GalleryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  galleryToEdit
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
      setPhotos(galleryToEdit.photos || []);
      setCoverPhotoUrl(galleryToEdit.coverPhotoUrl);
    } else {
      // New gallery default values
      setTitle('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setDescription('Sejam bem-vindos à sua galeria de seleção! Por favor, revisem as fotos com calma e cliquem no coração para selecionar as suas favoritas.');
      setStatus('awaiting_client');
      setPrivacy('private');
      setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
      setQuotaIncluded(20);
      setExcessPolicy('charge');
      setExtraPhotoPrice(30);
      setWatermarkEnabled(true);
      setWatermarkText('PROVA • FOTÓGRAFO • PROVA');
      // Preload with standard photo presets so the gallery is immediately ready to test
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotosList: Photo[] = [];
    Array.from(files).forEach((file: File, idx: number) => {
      const url = URL.createObjectURL(file);
      newPhotosList.push({
        id: `upload-${Date.now()}-${idx}`,
        originalFileName: file.name,
        url,
        caption: file.name.replace(/\.[^/.]+$/, '')
      });
    });

    setPhotos((prev) => [...prev, ...newPhotosList]);
    if (!coverPhotoUrl && newPhotosList.length > 0) {
      setCoverPhotoUrl(newPhotosList[0].url);
    }
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
        originalFileName: `IMG_${String(4101 + nextIdx).padStart(4, '0')}.CR3`,
        url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=1200&auto=format&fit=crop',
        caption: `Ensaio Fotográfico #${nextIdx + 1}`
      }
    ];
    setPhotos((prev) => [...prev, ...additional]);
    if (!coverPhotoUrl) setCoverPhotoUrl(additional[0].url);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (photos.find((p) => p.id === photoId)?.url === coverPhotoUrl) {
      const remaining = photos.filter((p) => p.id !== photoId);
      setCoverPhotoUrl(remaining[0]?.url || '');
    }
  };

  const handleSetCover = (url: string) => {
    setCoverPhotoUrl(url);
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPinCode(randomPin);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Título da galeria é obrigatório.';
    if (!clientName.trim()) errors.clientName = 'Nome do cliente é obrigatório.';
    if (quotaIncluded <= 0) errors.quotaIncluded = 'A cota inclusa deve ser maior que zero.';
    if (privacy === 'private' && (!pinCode || pinCode.length < 4)) {
      errors.pinCode = 'O PIN deve ter no mínimo 4 dígitos.';
    }
    if (excessPolicy === 'charge' && extraPhotoPrice < 0) {
      errors.extraPhotoPrice = 'O valor extra não pode ser negativo.';
    }
    if (photos.length === 0) {
      errors.photos = 'Adicione ao menos uma foto à galeria.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
        status: 'pending'
      },
      createdAt: galleryToEdit ? galleryToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(galleryData);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={galleryToEdit ? 'Editar Galeria' : 'Criar Nova Galeria de Seleção'}
      description="Configure os detalhes do ensaio, a cota de fotos contratada e a política de excedentes."
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
              label="Data do Evento / Ensaio"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="E-mail do Cliente"
              type="email"
              placeholder="cliente@exemplo.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <Input
              label="WhatsApp / Telefone"
              placeholder="(11) 98765-4321"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <Textarea
            label="Instruções e Mensagem de Boas-Vindas para o Cliente"
            placeholder="Orientações sobre o prazo de seleção, quantidade de fotos e dicas para escolher..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* SECTION 2: Regra de Cota e Excedentes (Configuração Flexível) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Sparkles className="w-4 h-4" />
            <span>2. Regra de Cota & Política de Excedentes</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <Input
              label="Fotos Inclusas no Pacote Contratado (Cota Y) *"
              type="number"
              min={1}
              value={quotaIncluded}
              onChange={(e) => setQuotaIncluded(Math.max(1, parseInt(e.target.value) || 1))}
              helperText={`O pacote base do cliente dá direito a ${quotaIncluded} fotos.`}
              error={formErrors.quotaIncluded}
            />

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Comportamento para Fotos Excedentes *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {/* Policy 1: Bloqueio Rígido */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    excessPolicy === 'block'
                      ? 'bg-zinc-800/80 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-900/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="excessPolicy"
                    value="block"
                    checked={excessPolicy === 'block'}
                    onChange={() => setExcessPolicy('block')}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      <span>Bloqueio Rígido</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      O cliente fica impedido de selecionar qualquer foto além de {quotaIncluded}.
                    </p>
                  </div>
                </label>

                {/* Policy 2: Permitir com Cobrança */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    excessPolicy === 'charge'
                      ? 'bg-zinc-800/80 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-900/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="excessPolicy"
                    value="charge"
                    checked={excessPolicy === 'charge'}
                    onChange={() => setExcessPolicy('charge')}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Permitir com Cobrança</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      O cliente pode ultrapassar a cota, visualizando o subtotal em tempo real.
                    </p>
                  </div>
                </label>

                {/* Policy 3: Permitir sem Custo Adicional (Aprovação Pura) */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    excessPolicy === 'free_approval'
                      ? 'bg-zinc-800/80 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-900/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="excessPolicy"
                    value="free_approval"
                    checked={excessPolicy === 'free_approval'}
                    onChange={() => setExcessPolicy('free_approval')}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Permitir sem Custo (Aprovação Pura)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Extras liberadas sem cobrança financeira. Serve para aprovar o lote total que você deve tratar e entregar.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Conditional field when excessPolicy is 'charge' */}
          {excessPolicy === 'charge' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
              <div>
                <h4 className="text-xs font-semibold text-amber-300">Valor por Foto Excedente (R$)</h4>
                <p className="text-[11px] text-zinc-400">
                  Cobrança calculada automaticamente no resumo do cliente a cada foto extra.
                </p>
              </div>
              <div className="w-full sm:w-44">
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  leftIcon={<span className="text-xs font-bold text-zinc-400">R$</span>}
                  value={extraPhotoPrice}
                  onChange={(e) => setExtraPhotoPrice(parseFloat(e.target.value) || 0)}
                  error={formErrors.extraPhotoPrice}
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Privacidade e Proteção */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span>3. Privacidade & Proteção da Prova</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Modo de Acesso da Galeria
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    privacy === 'public'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Pública (Link Direto)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    privacy === 'private'
                      ? 'bg-zinc-800 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privada (Com PIN)</span>
                </button>
              </div>
            </div>

            {privacy === 'private' && (
              <div>
                <Input
                  label="Senha / PIN Numérico (4 a 6 dígitos)"
                  placeholder="ex: 4826"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={handleGeneratePin}
                      className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700"
                    >
                      Gerar
                    </button>
                  }
                  helperText="O cliente precisará digitar este código para destravar a galeria."
                  error={formErrors.pinCode}
                />
              </div>
            )}
          </div>

          {/* Watermark toggle */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <Switch
              checked={watermarkEnabled}
              onChange={setWatermarkEnabled}
              label="Marca d'água sutil nas fotos do preview"
              description="Aplica selo de prova e linhas diagonais para desestimular capturas não autorizadas."
            />

            {watermarkEnabled && (
              <Input
                label="Texto da Marca d'Água"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="PROVA • FOTÓGRAFO • PROVA"
              />
            )}
          </div>
        </div>

        {/* SECTION 4: Fotos da Galeria */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <span>4. Fotos Carregadas ({photos.length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Nomes originais mantidos para correspondência precisa com o catálogo RAW / Lightroom.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSamplePhotos}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Fotos de Exemplo</span>
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 h-8 px-3 text-xs gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload do PC</span>
                </span>
              </label>
            </div>
          </div>

          {formErrors.photos && (
            <p className="text-xs text-red-400 font-medium">{formErrors.photos}</p>
          )}

          {/* Photo Grid Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 bg-zinc-950/40 rounded-xl border border-zinc-850">
            {photos.map((photo) => {
              const isCover = coverPhotoUrl === photo.url;
              return (
                <div
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border transition-all ${
                    isCover
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.originalFileName}
                    className="w-full h-24 object-cover protected-photo"
                  />
                  <div className="p-1.5 bg-zinc-900/90 text-[10px] font-mono truncate text-zinc-300">
                    {photo.originalFileName}
                  </div>

                  {/* Badges and Actions overlay */}
                  {isCover && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-zinc-950 text-[9px] font-bold rounded flex items-center gap-0.5 shadow">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Capa</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(photo.url)}
                        title="Definir como foto de capa"
                        className="p-1.5 rounded bg-zinc-800 text-zinc-200 hover:text-amber-400 hover:bg-zinc-700 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Remover foto"
                      className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between gap-3 z-20 mt-6 shadow-2xl">
          <div className="text-xs text-zinc-400 hidden sm:block">
            <span className="font-mono text-zinc-200 font-semibold">{photos.length}</span> fotos carregadas • Cota:{' '}
            <span className="font-mono text-amber-400 font-semibold">{quotaIncluded}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="amber" className="shadow-lg shadow-amber-500/20">
              {galleryToEdit ? 'Salvar Alterações' : 'Publicar Galeria'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
