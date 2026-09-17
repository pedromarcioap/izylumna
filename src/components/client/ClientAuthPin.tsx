import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, ArrowRight, Eye, EyeOff, Delete, KeyRound } from 'lucide-react';
import { getGalleryByPinAsync } from '../../lib/storage';

export interface ClientAuthPinProps {
  gallery: Gallery;
  allGalleries?: Gallery[];
  onUnlock: (matchedGallery?: Gallery) => void;
}

export const ClientAuthPin: React.FC<ClientAuthPinProps> = ({ gallery, allGalleries = [], onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      focusInput();
    } catch (err) {
      setError(true);
      setErrorMessage('Erro ao validar o PIN. Tente novamente.');
    }
  };

  const handleNumPadPress = (num: string) => {
    setError(false);
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + num);
    }
  };

  const handleNumPadBackspace = () => {
    setError(false);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleNumPadClear = () => {
    setError(false);
    setPinInput('');
  };

  const pinLength = Math.max(4, Math.min(6, gallery.pinCode?.length || 4));
  const pinDigits = pinInput.split('');

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-brand-dark/50 bg-walnut-900 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8 text-center space-y-6">
          {/* Lock Icon Emblem */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shadow-inner">
            <Lock className="w-8 h-8 text-brand-primary" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-mono bg-brand-accent text-brand-dark font-extrabold px-2.5 py-0.5 rounded border border-[#160F29]/30 inline-block">
              Acesso Exclusivo Por PIN
            </span>
            <h2 className="font-serif text-2xl font-bold text-walnut-100">
              {gallery.title}
            </h2>
            <p className="text-xs text-walnut-400 leading-relaxed">
              Olá, <strong className="text-walnut-200">{gallery.clientName}</strong>! Digite seu código PIN exclusivo de 4 dígitos para acessar e selecionar suas fotos.
            </p>
          </div>

          {/* PIN Input Form */}
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
            {/* Real HTML Input: type="tel" + inputMode="numeric" + autoComplete="one-time-code" for iOS Safari compatibility */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setError(false);
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 6) {
                  setPinInput(val);
                }
              }}
              className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden"
              tabIndex={0}
              aria-label="Código PIN de acesso"
            />

            {/* Stylized Visual Digit Slots */}
            <div
              onClick={focusInput}
              className="cursor-pointer group flex items-center justify-center gap-2 sm:gap-3 py-3 px-3 rounded-2xl bg-walnut-950/90 border border-brand-dark/50 hover:border-brand-cyan/40 transition-all select-none"
            >
              {Array.from({ length: pinLength }).map((_, idx) => {
                const digit = pinDigits[idx];
                const isFocused = pinInput.length === idx;
                const isFilled = digit !== undefined;

                return (
                  <div
                    key={idx}
                    className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center font-mono text-2xl font-extrabold transition-all border ${
                      error
                        ? 'border-red-500/80 bg-red-500/10 text-red-400'
                        : isFocused
                        ? 'border-brand-cyan bg-brand-cyan/15 text-brand-cyan ring-2 ring-brand-cyan/30 animate-pulse'
                        : isFilled
                        ? 'border-brand-cyan/50 bg-walnut-900 text-walnut-100'
                        : 'border-walnut-800 bg-walnut-900/40 text-walnut-600'
                    }`}
                  >
                    {isFilled ? (showPin ? digit : '•') : ''}
                  </div>
                );
              })}

              {/* Show/Hide PIN Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPin(!showPin);
                }}
                className="ml-1 p-2 text-walnut-400 hover:text-walnut-200 transition-colors rounded-lg focus:outline-none"
                title={showPin ? 'Ocultar dígitos' : 'Mostrar dígitos'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Hint to tap for native keyboard */}
            <button
              type="button"
              onClick={focusInput}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] text-brand-cyan hover:underline font-medium focus:outline-none"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Toque aqui para abrir o teclado do iPhone/Celular</span>
            </button>

            {error && (
              <p className="text-xs text-red-400 font-medium animate-shake px-2">
                {errorMessage || 'PIN incorreto. Verifique o código e tente novamente.'}
              </p>
            )}

            {/* Touch-Friendly On-Screen NumPad for Mobile / iPhone */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumPadPress(num)}
                  className="py-3 text-xl font-bold font-mono rounded-xl bg-walnut-950/90 border border-brand-dark/40 text-walnut-100 hover:bg-brand-primary/20 hover:border-brand-cyan/50 active:scale-95 transition-all shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumPadClear}
                className="py-3 text-xs font-semibold rounded-xl bg-walnut-950/60 border border-brand-dark/40 text-walnut-400 hover:text-walnut-200 hover:bg-walnut-900 active:scale-95 transition-all"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleNumPadPress('0')}
                className="py-3 text-xl font-bold font-mono rounded-xl bg-walnut-950/90 border border-brand-dark/40 text-walnut-100 hover:bg-brand-primary/20 hover:border-brand-cyan/50 active:scale-95 transition-all shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleNumPadBackspace}
                className="py-3 flex items-center justify-center rounded-xl bg-walnut-950/60 border border-brand-dark/40 text-walnut-400 hover:text-walnut-200 hover:bg-walnut-900 active:scale-95 transition-all"
                title="Apagar último dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold shadow-lg shadow-[#8300E9]/25 mt-4"
              disabled={pinInput.length < 4 || isVerifying}
            >
              <span>{isVerifying ? 'Verificando...' : 'Acessar Meu Ensaio'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
