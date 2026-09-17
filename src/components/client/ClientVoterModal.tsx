import React, { useState } from 'react';
import { Gallery, GalleryVoter } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LumnaLogo } from '../common/LumnaLogo';
import { Users, User, Plus, UserCheck } from 'lucide-react';

export interface ClientVoterModalProps {
  isOpen: boolean;
  gallery: Gallery;
  onSelectVoter: (voter: GalleryVoter) => void;
  onClose?: () => void;
}

const AVATAR_COLORS = [
  'from-[#8300E9] to-[#46BDC6]',
  'from-[#46BDC6] to-[#8300E9]',
  'from-[#8300E9] to-[#FDBD00]',
  'from-[#F94713] to-[#8300E9]',
  'from-[#46BDC6] to-[#FDBD00]',
  'from-[#8300E9] to-[#F94713]'
];

export const ClientVoterModal: React.FC<ClientVoterModalProps> = ({
  isOpen,
  gallery,
  onSelectVoter
}) => {
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const predefined = gallery.predefinedVoters || [];
  const activeVoters = gallery.voters || gallery.clientSelection?.voters || [];
  const allowFree = gallery.allowFreeVoterRegistration ?? true;

  const handleSelectPredefined = (pre: GalleryVoter) => {
    const existing = activeVoters.find(
      (v) => v.id === pre.id || v.name.toLowerCase() === pre.name.toLowerCase()
    );
    const selected: GalleryVoter = existing || {
      id: pre.id || `voter-${pre.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: pre.name,
      isDecisionMaker: pre.isDecisionMaker ?? true,
      hasFinalized: false,
      avatarColor: pre.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };
    onSelectVoter(selected);
  };

  const handleCreateCustomName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customName.trim();
    if (!clean) {
      setError('Por favor, digite seu nome para continuar.');
      return;
    }
    setError('');

    const existing = activeVoters.find((v) => v.name.toLowerCase() === clean.toLowerCase());
    const slug = clean.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newVoter: GalleryVoter = existing || {
      id: `voter-${slug}-${Date.now().toString(36)}`,
      name: clean,
      isDecisionMaker: false,
      hasFinalized: false,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    onSelectVoter(newVoter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0714]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <Card className="max-w-lg w-full border-white/10 bg-[#140F24]/90 shadow-2xl shadow-black/95">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header & Emblem */}
          <div className="text-center space-y-4 flex flex-col items-center">
            <LumnaLogo variant="dark" layout="vertical" size="md" showSubtitle={true} />

            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-widest font-mono bg-[#8300E9]/20 text-[#8300E9] dark:text-purple-300 font-bold px-3 py-1 rounded-full border border-[#8300E9]/30 inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#46BDC6]" />
                <span>Identificação do Votante</span>
              </span>
              <h2 className="font-sans text-2xl font-extrabold text-white mt-2">
                Quem está escolhendo as fotos?
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mt-1">
                Informe seu nome para gravar seus votos no ensaio <strong className="text-zinc-200">{gallery.title}</strong>.
              </p>
            </div>
          </div>

          {/* Option A: Predefined Voters */}
          {predefined.length > 0 && !isCustomMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predefined.map((p, idx) => {
                  const colorClass = p.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => handleSelectPredefined(p)}
                      className="group relative flex items-center p-4 rounded-xl bg-[#0A0714] border border-white/10 hover:border-[#8300E9] hover:bg-white/5 transition-all text-left space-x-3.5 shadow-md active:scale-98"
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-sm truncate group-hover:text-[#46BDC6]">
                            {p.name}
                          </span>
                          {p.isDecisionMaker && (
                            <span className="text-[9px] bg-[#FDBD00] text-[#160F29] px-1.5 py-0.5 rounded-full font-extrabold">
                              Tomador
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block pt-0.5">
                          Entrar como {p.name.split(' ')[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {allowFree && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className="inline-flex items-center text-xs text-[#46BDC6] hover:text-[#46BDC6]/80 font-semibold py-2 px-4 rounded-lg hover:bg-[#46BDC6]/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 text-[#46BDC6]" />
                    Entrar com outro nome
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Option B: Direct Name Input */
            <form onSubmit={handleCreateCustomName} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Seu Nome Completo (Ex: Noiva, Noivo, Mãe, Lucas):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      setError('');
                    }}
                    placeholder="Digite seu nome aqui..."
                    className="w-full py-3 px-4 pl-10 rounded-xl bg-[#0A0714] border border-white/10 focus:border-[#8300E9] focus:ring-2 focus:ring-[#8300E9]/30 text-white placeholder-zinc-500 text-sm focus:outline-none transition-all"
                    autoFocus
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                </div>
                {error && <p className="text-xs text-red-400 font-medium pt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold shadow-lg shadow-[#8300E9]/30 py-3"
                disabled={!customName.trim()}
              >
                <span>Confirmar e Acessar Galeria</span>
                <UserCheck className="w-4 h-4 ml-2" />
              </Button>

              {predefined.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="text-xs text-zinc-400 hover:text-white underline"
                  >
                    Voltar aos nomes pré-definidos
                  </button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
