import React, { useState } from 'react';
import { Gallery, Photo } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Input';
import {
  CheckCheck,
  DollarSign,
  Sparkles,
  Lock,
  MessageSquare,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export interface ClientFinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  selectedPhotos: Photo[];
  comments: Record<string, string>;
  isSubmitted: boolean;
  onConfirmSubmit: (clientNotes: string) => void;
}

export const ClientFinalizeModal: React.FC<ClientFinalizeModalProps> = ({
  isOpen,
  onClose,
  gallery,
  selectedPhotos,
  comments,
  isSubmitted,
  onConfirmSubmit
}) => {
  const [clientNotes, setClientNotes] = useState(gallery.clientSelection.clientNotes || '');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const quota = gallery.quotaIncluded;
  const packagePhotos = selectedPhotos.slice(0, quota);
  const extraPhotos = selectedPhotos.slice(quota);
  const extraCount = extraPhotos.length;
  const extraTotal = extraCount * gallery.extraPhotoPrice;
  const totalComments = Object.keys(comments).length;

  const handleConfirm = () => {
    onConfirmSubmit(clientNotes.trim());
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-amber-400" />
          <span>{isSubmitted ? 'Revisão da Seleção Enviada' : 'Confirmar e Finalizar Seleção'}</span>
        </div>
      }
      description={
        isSubmitted
          ? 'Sua seleção já foi enviada e está em processamento pelo fotógrafo.'
          : 'Revise o resumo das suas escolhas antes de concluir o envio.'
      }
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Breakdown Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Fotos Escolhidas
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-zinc-100">
                {selectedPhotos.length}
              </span>
              <span className="text-xs text-zinc-500">fotos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono">
              Inclusas no Pacote
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {packagePhotos.length}
              </span>
              <span className="text-xs text-zinc-500">/ {quota} cota base</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-mono">
              Fotos Excedentes
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {extraCount}
              </span>
              <span className="text-xs text-zinc-500">extras</span>
            </div>
          </div>
        </div>

        {/* Financial Summary if Charge Policy */}
        {gallery.excessPolicy === 'charge' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Resumo Financeiro de Fotos Extras</span>
              </span>
              <Badge variant="warning" size="sm">
                R$ {gallery.extraPhotoPrice.toFixed(2)} / extra
              </Badge>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Cota inclusa no contrato ({quota} fotos):</span>
                <span className="text-zinc-200 font-mono">R$ 0,00 (incluso)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Fotos extras selecionadas ({extraCount} × R$ {gallery.extraPhotoPrice.toFixed(2)}):</span>
                <span className="text-amber-400 font-mono font-medium">
                  R$ {extraTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-zinc-100 pt-2 border-t border-zinc-800">
                <span>Subtotal adicional a pagar:</span>
                <span className="text-emerald-400 font-mono text-base">
                  R$ {extraTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Free approval notice */}
        {gallery.excessPolicy === 'free_approval' && extraCount > 0 && (
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-200 leading-relaxed">
              <strong>Aprovação Pura:</strong> Você selecionou {extraCount} fotos além da cota padrão. Conforme acordado com o fotógrafo, essas fotos serão tratadas e entregues em alta resolução sem custo financeiro adicional.
            </p>
          </div>
        )}

        {/* Selected Photos Thumbnails Strip */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-300 block">
            Pré-visualização da Seleção ({selectedPhotos.length} fotos):
          </span>
          <div className="flex gap-2 overflow-x-auto p-2 bg-zinc-950/60 rounded-xl border border-zinc-850">
            {selectedPhotos.map((photo, index) => {
              const isExtra = index >= quota;
              return (
                <div
                  key={photo.id}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border ${
                    isExtra ? 'border-amber-500' : 'border-zinc-800'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.originalFileName}
                    className="w-full h-full object-cover protected-photo"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-mono text-center text-zinc-300 truncate px-0.5">
                    #{index + 1}
                  </div>
                  {comments[photo.id] && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-black" />
                  )}
                </div>
              );
            })}
          </div>
          {totalComments > 0 && (
            <p className="text-xs text-sky-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{totalComments} observações anexadas às fotos.</span>
            </p>
          )}
        </div>

        {/* Client Final Notes */}
        {!isSubmitted ? (
          <div className="space-y-3">
            <Textarea
              label="Mensagem ou orientações gerais para o fotógrafo (opcional)"
              placeholder="ex: Muito obrigado pelo carinho! Amamos todas. Na diagramação do álbum, gostaríamos que a foto #1 ficasse na capa..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={2}
            />

            {/* Lock Warning & Agreement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 text-amber-500 rounded border-zinc-700 focus:ring-amber-500"
              />
              <span className="text-xs text-zinc-300 leading-snug">
                Estou ciente de que ao finalizar, a galeria será <strong>travada para novas alterações</strong> e enviada para o fotógrafo iniciar o tratamento das fotos.
              </span>
            </label>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Seleção Travada</span>
            </div>
            <p className="text-zinc-300">
              Esta galeria já foi finalizada. As fotos escolhidas estão com o fotógrafo para o tratamento em alta resolução.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            {isSubmitted ? 'Fechar' : 'Voltar e Revisar'}
          </Button>

          {!isSubmitted && (
            <Button
              variant="amber"
              size="md"
              disabled={!agreeTerms}
              onClick={handleConfirm}
              className="font-semibold shadow-lg shadow-amber-500/20"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              <span>Confirmar e Enviar para o Fotógrafo</span>
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
