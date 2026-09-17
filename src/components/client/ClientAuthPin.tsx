import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LumnaLogo } from '../common/LumnaLogo';
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
      if (cleanPin === gallery.pinCode) {
        setIsVerifying(false);
        onUnlock(gallery);
        return;
      }

      const localMatch = allGalleries.find((g) => g.pinCode === cleanPin);
      if (localMatch) {
        setIsVerifying(false);
        onUnlock(localMatch);
        return;
      }

      const dbMatch = await getGalleryByPinAsync(cleanPin);
      if (dbMatch) {
        setIsVerifying(false);
        onUnlock(dbMatch);
        return;
      }

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-white/10 bg-[#140F24]/90 shadow-2xl shadow-black/90 backdrop-blur-2xl">
        <CardContent className="p-6 sm:p-8 text-center space-y-6">
          {/* Logo & Emblem */}
          <div className="flex flex-col items-center space-y-4">
            <LumnaLogo variant="dark" layout="vertical" size="lg" showBadge={false} />

            <div className="space-y-1 pt-2">
              <span className="text-[10px] uppercase tracking-widest font-mono bg-[#8300E9]/20 text-[#8300E9] dark:text-purple-300 font-bold px-3 py-1 rounded-full border border-[#8300E9]/30 inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#46BDC6]" />
                <span>Portal de Seleção do Cliente</span>
              </span>
              <h2 className="font-sans text-2xl font-extrabold text-white pt-2">
                {gallery.title}
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Olá, <strong className="text-[#46BDC6]">{gallery.clientName}</strong>! Digite seu código PIN de 4 dígitos enviado pelo fotógrafo.
              </p>
            </div>
          </div>

          {/* PIN Input Form */}
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
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
              className="cursor-pointer group flex items-center justify-center gap-2 sm:gap-3 py-3 px-3 rounded-2xl bg-[#0A0714] border border-white/10 hover:border-[#8300E9]/60 transition-all select-none"
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
                        ? 'border-[#46BDC6] bg-[#46BDC6]/15 text-[#46BDC6] ring-2 ring-[#46BDC6]/30 animate-pulse'
                        : isFilled
                        ? 'border-[#8300E9]/60 bg-[#140F24] text-white'
                        : 'border-white/10 bg-[#0A0714] text-zinc-600'
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
                className="ml-1 p-2 text-zinc-400 hover:text-white transition-colors rounded-lg focus:outline-none"
                title={showPin ? 'Ocultar dígitos' : 'Mostrar dígitos'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Tap hint for mobile Safari */}
            <button
              type="button"
              onClick={focusInput}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] text-[#46BDC6] hover:underline font-medium focus:outline-none"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#46BDC6]" />
              <span>Toque aqui para abrir o teclado do celular</span>
            </button>

            {error && (
              <p className="text-xs text-red-400 font-medium px-2">
                {errorMessage || 'PIN incorreto. Verifique o código e tente novamente.'}
              </p>
            )}

            {/* Mobile NumPad */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumPadPress(num)}
                  className="py-3 text-xl font-bold font-mono rounded-xl bg-[#0A0714] border border-white/10 text-white hover:bg-[#8300E9]/30 hover:border-[#8300E9]/50 active:scale-95 transition-all shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumPadClear}
                className="py-3 text-xs font-semibold rounded-xl bg-[#0A0714] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleNumPadPress('0')}
                className="py-3 text-xl font-bold font-mono rounded-xl bg-[#0A0714] border border-white/10 text-white hover:bg-[#8300E9]/30 hover:border-[#8300E9]/50 active:scale-95 transition-all shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumPadBackspace}
                className="py-3 flex items-center justify-center rounded-xl bg-[#0A0714] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                title="Apagar último dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold shadow-lg shadow-[#8300E9]/30 mt-4"
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
