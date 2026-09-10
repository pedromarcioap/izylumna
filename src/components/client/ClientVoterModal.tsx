import React, { useState } from 'react';
import { Gallery, GalleryVoter } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Users, User, Plus, UserCheck } from 'lucide-react';

export interface ClientVoterModalProps {
  isOpen: boolean;
  gallery: Gallery;
  onSelectVoter: (voter: GalleryVoter) => void;
  onClose?: () => void;
}

const AVATAR_COLORS = [
  'from-[#01743F] to-[#4CB963]',
  'from-[#D57720] to-[#FEF600]',
  'from-[#4CB963] to-[#01743F]',
  'from-[#4F3926] to-[#D57720]',
  'from-[#01743F] to-[#4F3926]',
  'from-[#D57720] to-[#4CB963]'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-walnut-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <Card className="max-w-lg w-full border-brand-dark/50 bg-walnut-900 shadow-2xl shadow-black/90">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-mono bg-brand-accent text-brand-dark font-extrabold px-2.5 py-0.5 rounded border border-[#4F3926]/30 inline-block">
              Identificação do Votante
            </span>
            <h2 className="font-serif text-2xl font-bold text-walnut-100">
              Quem está escolhendo as fotos?
            </h2>
            <p className="text-xs text-walnut-400 max-w-sm mx-auto leading-relaxed">
              Informe seu nome ou selecione seu perfil para registrar seus votos e formar o consenso da galeria <strong className="text-walnut-200">{gallery.title}</strong>.
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
                      className="group relative flex items-center p-4 rounded-xl bg-walnut-950/80 border border-brand-dark/50 hover:border-brand-primary hover:bg-walnut-800 transition-all text-left space-x-3.5 shadow-md active:scale-98"
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-walnut-100 text-sm truncate group-hover:text-brand-emerald">
                            {p.name}
                          </span>
                          {p.isDecisionMaker && (
                            <span className="text-[10px] bg-brand-accent text-brand-dark px-1.5 py-0.5 rounded font-extrabold border border-[#4F3926]/30">
                              Tomador
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-walnut-400 block pt-0.5">
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
                    className="inline-flex items-center text-xs text-brand-emerald hover:text-brand-emerald/80 font-medium py-2 px-4 rounded-lg hover:bg-brand-emerald/10 transition-colors"
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
                <label className="block text-xs font-semibold text-walnut-300">
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
                    className="w-full py-3 px-4 pl-10 rounded-xl bg-walnut-950 border border-brand-dark/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-walnut-100 placeholder-walnut-500 text-sm focus:outline-none transition-all"
                    autoFocus
                  />
                  <User className="w-4 h-4 text-walnut-400 absolute left-3.5 top-3.5" />
                </div>
                {error && <p className="text-xs text-red-400 font-medium pt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold shadow-lg shadow-[#01743F]/25 py-3"
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
                    className="text-xs text-walnut-400 hover:text-walnut-200 underline"
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
