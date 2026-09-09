import React, { useState } from 'react';
import { Gallery } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, KeyRound, ArrowRight, ShieldCheck, Camera } from 'lucide-react';

export interface ClientAuthPinProps {
  gallery: Gallery;
  onUnlock: () => void;
}

export const ClientAuthPin: React.FC<ClientAuthPinProps> = ({ gallery, onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === gallery.pinCode) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPinInput('');
    }
  };

  const handleAutoFill = () => {
    if (gallery.pinCode) {
      setPinInput(gallery.pinCode);
      setError(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-zinc-800 bg-zinc-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <CardContent className="p-8 sm:p-10 text-center space-y-6">
          {/* Lock Icon Emblem */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-mono text-amber-400/90 font-semibold">
              Galeria Protegida
            </span>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              {gallery.title}
            </h2>
            <p className="text-xs text-zinc-400">
              Olá, <strong className="text-zinc-200">{gallery.clientName}</strong>! Insira o PIN fornecido pelo seu fotógrafo para destravar as fotos da sua sessão.
            </p>
          </div>

          {/* PIN Input Form */}
          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div className="flex justify-center">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setError(false);
                  setPinInput(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="••••"
                className={`w-44 text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-xl bg-zinc-950 border ${
                  error
                    ? 'border-red-500/80 focus:ring-red-500/30'
                    : 'border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/20'
                } text-zinc-100 placeholder-zinc-700 transition-all focus:outline-none focus:ring-2`}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium animate-shake">
                PIN incorreto. Verifique o código e tente novamente.
              </p>
            )}

            <Button
              type="submit"
              variant="amber"
              size="lg"
              className="w-full text-sm font-semibold"
              disabled={pinInput.length < 4}
            >
              <span>Acessar Meu Ensaio</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Assist */}
          {gallery.pinCode && (
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span>Modo Demonstração:</span>
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-amber-400 hover:text-amber-300 underline font-mono text-[11px]"
              >
                Preencher PIN ({gallery.pinCode})
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
