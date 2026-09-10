import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PhotographerProfile } from '../../types';
import { savePhotographerProfile } from '../../lib/auth';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSettingsView } from '../settings/ProfileSettingsView';
import {
  ShieldCheck,
  User,
  Camera,
  DollarSign,
  Save
} from 'lucide-react';

export interface PhotographerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PhotographerProfile;
  onProfileUpdated: (updated: PhotographerProfile) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PhotographerSettingsModal: React.FC<PhotographerSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'studio' | 'defaults'>('profile');

  // Studio fields
  const [studioName, setStudioName] = useState(profile.studioName);
  const [phone, setPhone] = useState(profile.phone || '');

  // Defaults
  const [defaultWatermark, setDefaultWatermark] = useState(
    profile.defaultWatermarkText || 'PROVA • LUMINA STUDIO • PROVA'
  );
  const [defaultExtraPrice, setDefaultExtraPrice] = useState(
    profile.defaultExtraPrice || 30
  );

  const handleSaveStudio = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PhotographerProfile = {
      ...profile,
      studioName: studioName.trim(),
      phone: phone.trim(),
      defaultWatermarkText: defaultWatermark.trim(),
      defaultExtraPrice: Number(defaultExtraPrice)
    };

    savePhotographerProfile(updated);
    onProfileUpdated(updated);
    onShowToast('Perfil do Estúdio Atualizado!', 'As configurações do estúdio foram salvas.', 'success');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Configurações do Perfil & Estúdio</span>
        </div>
      }
      description="Gerencie seus dados pessoais, avatar do Supabase Storage, marca d'água e cotas de impressão."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Storage Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Dados do Estúdio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('defaults')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'defaults'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Padrões & Cotas</span>
          </button>
        </div>

        {/* Tab 1: Profile (Supabase Auth & Storage Avatar) */}
        {activeTab === 'profile' && (
          <ProfileSettingsView onShowToast={onShowToast} onClose={onClose} />
        )}

        {/* Tab 2: Studio Information */}
        {activeTab === 'studio' && (
          <form onSubmit={handleSaveStudio} className="space-y-4">
            <Input
              label="Nome Fantasia / Estúdio *"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              required
            />

            <Input
              label="Telefone / WhatsApp de Contato"
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="amber">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Salvar Estúdio</span>
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Defaults */}
        {activeTab === 'defaults' && (
          <form onSubmit={handleSaveStudio} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
              Defina os valores padrão que serão sugeridos automaticamente toda vez que você criar uma nova galeria de fotos para um cliente.
            </div>

            <Input
              label="Texto Padrão da Marca d'Água"
              value={defaultWatermark}
              onChange={(e) => setDefaultWatermark(e.target.value)}
              placeholder="PROVA • SEU ESTÚDIO"
            />

            <Input
              label="Preço Padrão por Foto Extra (R$)"
              type="number"
              step="0.50"
              min="0"
              value={defaultExtraPrice}
              onChange={(e) => setDefaultExtraPrice(Number(e.target.value))}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="amber">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Salvar Padrões</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
