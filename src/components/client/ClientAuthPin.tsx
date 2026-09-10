import React, { useState } from 'react';
import { Gallery } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getGalleryByPinAsync } from '../../lib/storage';

export interface ClientAuthPinProps {
  gallery: Gallery;
  allGalleries?: Gallery[];
  onUnlock: (matchedGallery?: Gallery) => void;
}

export const ClientAuthPin: React.FC<ClientAuthPinProps> = ({ gallery, allGalleries = [], onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) return;

    setIsVerifying(true);
    setError(false);

    try {
      // 1. Direct match with currently focused gallery
      if (cleanPin === gallery.pinCode) {
        setIsVerifying(false);
        onUnlock(gallery);
        return;
      }

      // 2. Check local memory array of galleries
      const localMatch = allGalleries.find((g) => g.pinCode === cleanPin);
      if (localMatch) {
        setIsVerifying(false);
        onUnlock(localMatch);
        return;
      }

      // 3. Query Supabase database by unique PIN
      const dbMatch = await getGalleryByPinAsync(cleanPin);
      if (dbMatch) {
        setIsVerifying(false);
        onUnlock(dbMatch);
        return;
      }

      // PIN not found
      setError(true);
      setErrorMessage(`Nenhuma galeria encontrada com o PIN "${cleanPin}". Verifique com seu fotógrafo.`);
      setPinInput('');
    } catch (err) {
      setError(true);
      setErrorMessage('Erro ao validar o PIN. Tente novamente.');
    } finally {
      setIsVerifying(false);
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
      <Card className="max-w-md w-full border-brand-dark/50 bg-walnut-900 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <CardContent className="p-8 sm:p-10 text-center space-y-6">
          {/* Lock Icon Emblem */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-mono bg-brand-accent text-brand-dark font-extrabold px-2.5 py-0.5 rounded border border-[#4F3926]/30 inline-block">
              Acesso Exclusivo Por PIN
            </span>
            <h2 className="font-serif text-2xl font-bold text-walnut-100">
              {gallery.title}
            </h2>
            <p className="text-xs text-walnut-400 leading-relaxed">
              Olá, <strong className="text-walnut-200">{gallery.clientName}</strong>! Insira seu código PIN exclusivo de 4 dígitos para acessar e selecionar suas fotos.
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
                className={`w-44 text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-xl bg-walnut-950 border ${
                  error
                    ? 'border-red-500/80 focus:ring-red-500/30'
                    : 'border-brand-dark/50 focus:border-brand-primary focus:ring-brand-primary/20'
                } text-walnut-100 placeholder-walnut-500 transition-all focus:outline-none focus:ring-2`}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium animate-shake px-2">
                {errorMessage || 'PIN incorreto. Verifique o código e tente novamente.'}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold shadow-lg shadow-[#01743F]/25"
              disabled={pinInput.length < 4 || isVerifying}
            >
              <span>{isVerifying ? 'Verificando...' : 'Acessar Meu Ensaio'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* PIN Info & Quick Fill */}
          {gallery.pinCode && (
            <div className="pt-4 border-t border-brand-dark/50 space-y-3">
              <div className="flex items-center justify-between text-xs text-walnut-400">
                <span className="flex items-center text-walnut-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-brand-emerald" />
                  PIN Exclusivo desta Galeria:
                </span>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-brand-emerald hover:text-brand-emerald/80 underline font-mono font-bold text-[12px]"
                >
                  Usar PIN ({gallery.pinCode})
                </button>
              </div>

              {allGalleries.length > 1 && (
                <div className="text-[11px] text-walnut-400 bg-walnut-950/60 p-2.5 rounded-lg border border-brand-dark/40 text-left space-y-1">
                  <span className="font-semibold text-walnut-300 block">Outros PINs disponíveis no sistema:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allGalleries.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          if (g.pinCode) {
                            setPinInput(g.pinCode);
                            setError(false);
                          }
                        }}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          g.id === gallery.id
                            ? 'bg-brand-primary/20 border-brand-emerald/40 text-brand-emerald font-bold'
                            : 'bg-walnut-900 border-brand-dark/50 text-walnut-400 hover:text-walnut-200'
                        }`}
                        title={`Galeria: ${g.title}`}
                      >
                        {g.pinCode || 'Sem PIN'} ({g.clientName.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
