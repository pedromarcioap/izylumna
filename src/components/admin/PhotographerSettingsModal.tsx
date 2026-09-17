import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PhotographerProfile } from '../../types';
import { savePhotographerProfile } from '../../lib/auth';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSettingsView } from '../settings/ProfileSettingsView';
import { PhotographerIntegrationsTab } from './PhotographerIntegrationsTab';
import {
  ShieldCheck,
  User,
  Camera,
  DollarSign,
  Save,
  Cloud
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'studio' | 'defaults' | 'pix' | 'integrations'>('profile');

  // Studio fields
  const [studioName, setStudioName] = useState(profile.studioName);
  const [phone, setPhone] = useState(profile.phone || '');

  // PIX key fields
  const [pixKey, setPixKey] = useState(profile.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>(profile.pixKeyType || 'cpf');

  // Defaults
  const [defaultWatermark, setDefaultWatermark] = useState(
    profile.defaultWatermarkText || 'PROVA • LUMINA STUDIO • PROVA'
  );
  const [defaultPosition, setDefaultPosition] = useState<'grid' | 'center' | 'both' | 'bottom-right'>(
    profile.defaultWatermarkPosition || 'both'
  );
  const [defaultOpacity, setDefaultOpacity] = useState<number>(
    profile.defaultWatermarkOpacity ?? 0.25
  );
  const [defaultExtraPrice, setDefaultExtraPrice] = useState(
    profile.defaultExtraPrice || 25
  );

  const handleSaveStudio = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PhotographerProfile = {
      ...profile,
      studioName: studioName.trim(),
      phone: phone.trim(),
      defaultWatermarkText: defaultWatermark.trim(),
      defaultWatermarkPosition: defaultPosition,
      defaultWatermarkOpacity: defaultOpacity,
      defaultExtraPrice: Number(defaultExtraPrice),
      pixKey: pixKey.trim(),
      pixKeyType: pixKeyType
    };

    savePhotographerProfile(updated);
    onProfileUpdated(updated);
    onShowToast('Configurações Salvas!', 'As informações do perfil e recebimento PIX foram atualizadas com sucesso.', 'success');
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
      description="Gerencie seus dados pessoais, chave PIX para repasse automático, marca d'água e integrações de nuvem."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
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
            <span>Perfil</span>
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
            onClick={() => setActiveTab('pix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pix'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chave PIX (Repasse)</span>
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

          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'integrations'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrações (Adobe)</span>
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <ProfileSettingsView onShowToast={onShowToast} onClose={onClose} />
        )}

        {/* Tab 4: Integrations */}
        {activeTab === 'integrations' && (
          <PhotographerIntegrationsTab 
            userId={user?.id || profile.id} 
            onShowToast={onShowToast} 
          />
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

        {/* Tab: PIX Settings */}
        {activeTab === 'pix' && (
          <form onSubmit={handleSaveStudio} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
              Cadastre sua chave PIX para receber os splits automáticos (92% do valor de fotos extras) direto em sua conta bancária sem intermediários manuais.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Tipo de Chave PIX
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone / celular</option>
                <option value="random">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <Input
              label="Chave PIX *"
              placeholder={
                pixKeyType === 'cpf' ? '000.000.000-00' :
                pixKeyType === 'cnpj' ? '00.000.000/0001-00' :
                pixKeyType === 'email' ? 'fotografo@estudio.com.br' :
                pixKeyType === 'phone' ? '(11) 98765-4321' : 'Chave aleatória UUID'
              }
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="amber">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Salvar Dados PIX</span>
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

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Posição Padrão da Marca d'Água
              </label>
              <select
                value={defaultPosition}
                onChange={(e) => setDefaultPosition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:ring-1 focus:ring-amber-500"
              >
                <option value="both">Grade Diagonal + Centro (Máxima Segurança)</option>
                <option value="grid">Grade Diagonal Repetida</option>
                <option value="center">Selo Centralizado</option>
                <option value="bottom-right">Canto Inferior Direito</option>
              </select>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Opacidade Padrão</span>
                <span className="font-mono text-amber-400 font-bold">{Math.round(defaultOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={defaultOpacity}
                onChange={(e) => setDefaultOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

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
