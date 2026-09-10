import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  User,
  Upload,
  Save,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  KeyRound
} from 'lucide-react';

export interface ProfileSettingsViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onClose?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ onShowToast, onClose }) => {
  const { user, profile, updateProfile, isAdmin, isPhotographer } = useAuth();

  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true, cacheControl: '3600' });

        if (error) {
          console.warn('Upload bucket fallback warning:', error.message);
          // If bucket doesn't exist yet, convert to Base64 data URL
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setAvatarUrl(base64);
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;
        setAvatarUrl(publicUrl);
        onShowToast('Avatar Carregado!', 'Sua nova foto de perfil foi salva no Supabase Storage.', 'success');
      } else {
        // Local Base64 preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setAvatarUrl(base64);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao carregar imagem de avatar.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const res = await updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim()
    });

    setIsSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      onShowToast('Perfil Atualizado', 'Seus dados foram atualizados no banco de dados.', 'success');
      if (onClose) onClose();
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao atualizar perfil.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-zinc-100">
                  Meu Perfil & Permissões
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Gerencie seus dados pessoais, foto de exibição e visualize sua cota e privilégios.
                </p>
              </div>
            </div>

            {/* Current Role badge */}
            <div>
              {isAdmin ? (
                <Badge variant="warning" className="gap-1 font-mono text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrador</span>
                </Badge>
              ) : isPhotographer ? (
                <Badge variant="info" className="gap-1 font-mono text-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Fotógrafo</span>
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1 font-mono text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Usuário Comum</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={sanitizeImageUrl(avatarUrl)}
                    alt={fullName || 'Avatar'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-2xl">
                    {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-amber-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-xs font-semibold text-zinc-200">Foto de Perfil / Avatar</h4>
                <p className="text-[11px] text-zinc-400">
                  Carregue uma imagem para seu avatar. O arquivo será armazenado com segurança no Supabase Storage.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 text-xs font-medium transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Enviando...' : 'Carregar do Computador'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Completo *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />

              <Input
                label="Endereço de E-mail"
                value={user?.email || profile?.email || ''}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>

            <Input
              label="URL da Imagem do Avatar (opcional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />

            {/* Quota & Permissions Summary */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-zinc-850 pb-2">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Cotas & Nível de Permissão</span>
                </span>
                <span className="font-mono text-zinc-400 text-[11px]">ID: {profile?.id?.slice(0, 8)}...</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-400 text-[11px]">Função no Sistema</span>
                  <p className="font-semibold text-zinc-200 mt-0.5 capitalize">
                    {profile?.role === 'admin' ? 'Administrador do Sistema' : profile?.role === 'photographer' ? 'Fotógrafo Profissional' : 'Usuário / Cliente'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-400 text-[11px]">Capacidade de Galerias</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">
                    {isAdmin || isPhotographer ? 'Ilimitado (Painel Ativo)' : 'Restrito a galerias vinculadas'}
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              {onClose && (
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" variant="amber" disabled={isSaving}>
                <Save className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
