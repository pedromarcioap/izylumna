import React, { useState } from 'react';
import { Gallery, GalleryVoter } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Users, User, Plus, Heart, Sparkles, UserCheck } from 'lucide-react';

export interface ClientVoterModalProps {
  isOpen: boolean;
  gallery: Gallery;
  onSelectVoter: (voter: GalleryVoter) => void;
  onClose?: () => void;
}

const AVATAR_COLORS = [
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600'
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

    // Check if name already exists in active voters
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <Card className="max-w-lg w-full border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/90">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-mono text-amber-400 font-semibold block">
              Identificação do Votante
            </span>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              Quem está escolhendo as fotos?
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Informe seu nome ou selecione seu perfil para registrar seus votos e formar o consenso da galeria <strong className="text-zinc-200">{gallery.title}</strong>.
            </p>
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
                      className="group relative flex items-center p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-850 transition-all text-left space-x-3.5 shadow-md active:scale-98"
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-zinc-100 text-sm truncate group-hover:text-amber-300">
                            {p.name}
                          </span>
                          {p.isDecisionMaker && (
                            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded font-mono font-medium">
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
                    className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-medium py-2 px-4 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
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
                  Seu Nome Completo ou Papel (Ex: Noiva, Noivo, Mãe):
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
                    className="w-full py-3 px-4 pl-10 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none transition-all"
                    autoFocus
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                </div>
                {error && <p className="text-xs text-red-400 font-medium pt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="amber"
                size="lg"
                className="w-full text-sm font-semibold shadow-lg shadow-amber-500/20 py-3"
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
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
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
