import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Trash2, AlertTriangle, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  galleryTitle?: string;
  photoCount?: number;
  title?: string;
  description?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  galleryTitle = 'Galeria',
  photoCount,
  title,
  description
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');

  // Reset modal state when closed or opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmText('');
    }
  }, [isOpen]);

  const targetTitle = galleryTitle || title || 'esta galeria';
  const cleanTargetTitle = targetTitle.trim();
  const cleanConfirmText = confirmText.trim();

  // Step 2 Validation: matches gallery title OR "DELETAR" (case-insensitive)
  const isValidConfirmation =
    cleanConfirmText.toLowerCase() === cleanTargetTitle.toLowerCase() ||
    cleanConfirmText.toUpperCase() === 'DELETAR';

  const handleFinalConfirm = () => {
    if (!isValidConfirmation) return;
    onConfirm();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-5 py-2">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs">
              {step}/2
            </div>
            <h2 className="text-base font-bold text-zinc-100">
              {step === 1 ? 'Excluir Galeria (Etapa 1 de 2)' : 'Confirmação Definitiva (Etapa 2 de 2)'}
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
            Confirmação Dupla
          </span>
        </div>

        {step === 1 ? (
          /* STEP 1: Primary Warning */
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs">
                <h3 className="font-bold text-red-200 text-sm">Atenção: Ação Irreversível</h3>
                <p className="leading-relaxed text-zinc-300">
                  {description || (
                    <>
                      Você está solicitando a exclusão permanente do ensaio{' '}
                      <strong className="text-white">&ldquo;{targetTitle}&rdquo;</strong>.
                    </>
                  )}
                </p>
                {typeof photoCount === 'number' && photoCount > 0 && (
                  <p className="font-mono text-[11px] text-red-300 font-medium">
                    • {photoCount} foto(s) cadastradas nesta galeria serão excluídas.
                  </p>
                )}
                <p className="text-[11px] text-zinc-400 pt-1">
                  Todos os votos dos clientes, comentários, seleções e registros no Supabase serão apagados sem possibilidade de recuperação.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(2)}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold border-none shadow-md shadow-red-900/30"
              >
                <span>Avançar para Confirmação Final</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          /* STEP 2: Secondary Double Confirmation with Text Match */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Para evitar a exclusão por engano, digite o nome exato da galeria{' '}
                <strong className="text-amber-400">&ldquo;{targetTitle}&rdquo;</strong> ou a palavra{' '}
                <strong className="text-red-400">DELETAR</strong> no campo abaixo:
              </p>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Digite "${targetTitle}" ou DELETAR`}
                  autoFocus
                  className="w-full py-2.5 px-3.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />

                {cleanConfirmText && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isValidConfirmation ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Confirmação validada! Pronto para excluir.
                      </span>
                    ) : (
                      <span className="text-red-400 font-medium">
                        O texto digitado não é igual a &ldquo;{targetTitle}&rdquo; ou &ldquo;DELETAR&rdquo;.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-zinc-400">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Voltar ao Passo 1</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!isValidConfirmation}
                  onClick={handleFinalConfirm}
                  className={`font-semibold border-none ${
                    isValidConfirmation
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span>Excluir Definitivamente</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

