import React, { useState } from 'react';
import { ProfileSettingsView } from './ProfileSettingsView';
import { UserManagementView } from '../admin/UserManagementView';
import { PhotographerIntegrationsTab } from '../admin/PhotographerIntegrationsTab';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  SlidersHorizontal,
  User,
  Users,
  Cloud,
  QrCode,
  DollarSign,
  Save,
  CheckCircle2,
  ShieldCheck,
  Building,
  KeyRound
} from 'lucide-react';

export interface StudioSettingsViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  initialTab?: 'perfil' | 'team' | 'adobe' | 'pix';
}

export const StudioSettingsView: React.FC<StudioSettingsViewProps> = ({
  onShowToast,
  initialTab = 'perfil'
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'team' | 'adobe' | 'pix'>(initialTab);

  // PIX Settings local state
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cnpj');
  const [pixKey, setPixKey] = useState('12.345.678/0001-90');
  const [extraPhotoPrice, setExtraPhotoPrice] = useState('30.00');
  const [isSavingPix, setIsSavingPix] = useState(false);

  const handleSavePix = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPix(true);
    setTimeout(() => {
      setIsSavingPix(false);
      onShowToast('Ajustes Salvos!', 'Configurações de PIX e valor por foto extra atualizados com sucesso.', 'success');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-400">
              PAINEL DE CONFIGURAÇÕES GERAIS
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ajustes do Estúdio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Gerencie o perfil do fotógrafo, membros da equipe, integração Adobe Lightroom Cloud e dados bancários para recebimento via PIX.
          </p>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="p-1.5 rounded-2xl bg-[#120E22] border border-white/10 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'perfil'
              ? 'bg-[#8300E9] text-white shadow-lg shadow-purple-900/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-[#8300E9] text-white shadow-lg shadow-purple-900/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Equipe (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('adobe')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'adobe'
              ? 'bg-[#8300E9] text-white shadow-lg shadow-purple-900/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cloud className="w-4 h-4 text-[#46BDC6]" />
          <span>Adobe Lightroom Cloud</span>
        </button>

        <button
          onClick={() => setActiveTab('pix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pix'
              ? 'bg-[#8300E9] text-white shadow-lg shadow-purple-900/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#FDBD00]" />
          <span>Pagamentos & PIX</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      <div>
        {activeTab === 'perfil' && (
          <div className="bg-[#120E22] p-6 rounded-2xl border border-white/10">
            <ProfileSettingsView onShowToast={onShowToast} />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-[#120E22] p-6 rounded-2xl border border-white/10">
            <UserManagementView onShowToast={onShowToast} />
          </div>
        )}

        {activeTab === 'adobe' && (
          <div className="bg-[#120E22] p-6 rounded-2xl border border-white/10">
            <PhotographerIntegrationsTab onShowToast={onShowToast} />
          </div>
        )}

        {activeTab === 'pix' && (
          <div className="bg-[#120E22] p-6 rounded-2xl border border-white/10 space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#FDBD00]" />
                <span>Configuração de Chave PIX & Cobrança de Fotos Extras</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Defina os dados bancários exibidos para os clientes na hora de confirmar a seleção de fotos além da cota contratada.
              </p>
            </div>

            <form onSubmit={handleSavePix} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Tipo de Chave PIX</label>
                  <select
                    value={pixKeyType}
                    onChange={(e: any) => setPixKeyType(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone Celular</option>
                    <option value="random">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Chave PIX do Estúdio</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Informe a chave PIX..."
                    className="w-full py-2 px-3 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  Valor Padrão por Foto Extra (R$)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">R$</span>
                  <input
                    type="text"
                    value={extraPhotoPrice}
                    onChange={(e) => setExtraPhotoPrice(e.target.value)}
                    className="w-full py-2 px-3 pl-9 rounded-xl bg-[#0A0714] border border-white/10 text-[#FDBD00] font-mono font-bold text-sm focus:outline-none focus:border-[#FDBD00]"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Este valor é aplicado por padrão a novas galerias criadas, podendo ser customizado em cada ensaio.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <Button variant="amber" size="sm" type="submit" disabled={isSavingPix} className="font-bold text-xs">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isSavingPix ? 'Salvando...' : 'Salvar Alterações PIX'}</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
