import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  PhotographerProfile
} from '../../types';
import {
  savePhotographerProfile,
  changePhotographerPassword
} from '../../lib/auth';
import {
  ShieldCheck,
  KeyRound,
  User,
  Camera,
  DollarSign,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'defaults'>('profile');

  // Profile fields
  const [name, setName] = useState(profile.name);
  const [studioName, setStudioName] = useState(profile.studioName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');

  // Defaults
  const [defaultWatermark, setDefaultWatermark] = useState(
    profile.defaultWatermarkText || 'PROVA • LUMINA STUDIO • PROVA'
  );
  const [defaultExtraPrice, setDefaultExtraPrice] = useState(
    profile.defaultExtraPrice || 30
  );

  // Security / Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PhotographerProfile = {
      ...profile,
      name: name.trim(),
      studioName: studioName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim(),
      defaultWatermarkText: defaultWatermark.trim(),
      defaultExtraPrice: Number(defaultExtraPrice)
    };

    savePhotographerProfile(updated);
    onProfileUpdated(updated);
    onShowToast('Perfil Atualizado!', 'As configurações do estúdio foram salvas.', 'success');
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const res = changePhotographerPassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast('Senha Alterada com Sucesso!', 'Sua nova senha de acesso já está em vigor.', 'success');
    } else {
      setPasswordError(res.error || 'Erro ao alterar a senha.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Configurações do Fotógrafo & Segurança</span>
        </div>
      }
      description="Gerencie seus dados de estúdio, padrões de galeria e credenciais de acesso."
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
            <span>Perfil & Estúdio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Alterar Senha</span>
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
            <Camera className="w-3.5 h-3.5" />
            <span>Padrões de Prova</span>
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome do Fotógrafo *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Nome Fantasia / Estúdio *"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="E-mail de Login do Fotógrafo *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Telefone / WhatsApp"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Input
              label="URL da Foto de Perfil / Avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="amber">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Salvar Perfil</span>
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              Mantenha sua conta segura. A nova senha deve ter no mínimo 6 caracteres e será exigida em todos os próximos acessos ao Painel do Fotógrafo.
            </div>

            <Input
              label="Senha Atual *"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError(null);
              }}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nova Senha *"
                type="password"
                placeholder="Mínimo 6 dígitos"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError(null);
                }}
                required
              />

              <Input
                label="Confirmar Nova Senha *"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(null);
                }}
                required
              />
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Senha atualizada com sucesso!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Fechar
              </Button>
              <Button type="submit" variant="amber">
                <Lock className="w-4 h-4 mr-1.5" />
                <span>Atualizar Senha</span>
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Defaults */}
        {activeTab === 'defaults' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
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
