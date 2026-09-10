import React, { useState } from 'react';
import { Gallery, Photo, GalleryVoter } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Input';
import { SafeImage } from '../common/SafeImage';
import { CheckCheck, Sparkles, Lock, MessageSquare, Users, Heart } from 'lucide-react';

export interface ClientFinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  currentVoter: GalleryVoter | null;
  myVotedPhotos: Photo[];
  consensusCount: number;
  onConfirmSubmit: (clientNotes: string) => void;
}

export const ClientFinalizeModal: React.FC<ClientFinalizeModalProps> = ({
  isOpen,
  onClose,
  gallery,
  currentVoter,
  myVotedPhotos,
  consensusCount,
  onConfirmSubmit
}) => {
  const [clientNotes, setClientNotes] = useState(gallery.clientSelection.clientNotes || '');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const threshold = gallery.consensusThreshold || 2;
  const isFinalized = Boolean(currentVoter?.hasFinalized);

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
          <span>
            {isFinalized
              ? `Seleção de ${currentVoter?.name || 'Votante'} Concluída`
              : `Finalizar Votação de ${currentVoter?.name || 'Votante'}`}
          </span>
        </div>
      }
      description={
        isFinalized
          ? 'Sua escolha pessoal de fotos foi registrada e somada ao consenso do ensaio.'
          : 'Revise suas escolhas antes de concluir a sua parte na votação.'
      }
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-mono">
              Seus Votos Pessoais
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-zinc-100">
                {myVotedPhotos.length}
              </span>
              <span className="text-xs text-zinc-500">fotos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono">
              Fotos em Consenso
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {consensusCount}
              </span>
              <span className="text-xs text-zinc-500">/ {threshold}+ votos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] uppercase tracking-wider text-sky-400 font-mono">
              Participantes Ativos
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-300">
                {(gallery.voters || []).length || 1}
              </span>
              <span className="text-xs text-zinc-500">pessoas</span>
            </div>
          </div>
        </div>

        {/* Quota Policy Banner */}
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Regra de Seleção da Galeria:</span>
          {gallery.excessPolicy === 'block' && (
            <Badge variant="warning" className="font-semibold">
              Cota Fixa ({gallery.quotaIncluded} fotos max - Bloqueado)
            </Badge>
          )}
          {gallery.excessPolicy === 'charge' && (
            <Badge variant="amber" className="font-semibold">
              Cota Inclusa ({gallery.quotaIncluded} fotos + R$ {gallery.extraPhotoPrice}/extra)
            </Badge>
          )}
          {gallery.excessPolicy === 'free_approval' && (
            <Badge variant="success" className="font-semibold">
              Seleção Livre (Aprovação Sujeita a Ajustes)
            </Badge>
          )}
        </div>

        {/* Selected Photos Thumbnails Strip */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-300 block">
            Fotos Votadas por {currentVoter?.name} ({myVotedPhotos.length} fotos):
          </span>
          <div className="flex gap-2 overflow-x-auto p-2 bg-zinc-950/60 rounded-xl border border-zinc-850">
            {myVotedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-amber-500/50"
              >
                <SafeImage
                  src={photo.url}
                  alt={photo.originalFileName}
                  fallbackText={photo.originalFileName}
                  className="w-full h-full object-cover protected-photo"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-mono text-center text-amber-300 truncate px-0.5">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voter Confirmation & Notes */}
        {!isFinalized ? (
          <div className="space-y-3">
            <Textarea
              label="Mensagem ou orientações gerais para o fotógrafo (opcional)"
              placeholder="ex: Gostamos muito das fotos espontâneas! Na diagramação, preferimos dar destaque às fotos de consenso..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={2}
            />

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 text-amber-500 rounded border-zinc-700 focus:ring-amber-500"
              />
              <span className="text-xs text-zinc-300 leading-snug">
                Estou ciente de que ao confirmar, minha votação como <strong>{currentVoter?.name}</strong> será finalizada e enviada para apuração no relatório de consenso.
              </span>
            </label>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Votação de {currentVoter?.name} Finalizada</span>
            </div>
            <p className="text-zinc-300">
              Sua lista de preferências já foi enviada com sucesso!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="ghost" size="md" onClick={onClose}>
            {isFinalized ? 'Fechar' : 'Voltar e Revisar'}
          </Button>

          {!isFinalized && (
            <Button
              variant="amber"
              size="md"
              disabled={!agreeTerms}
              onClick={handleConfirm}
              className="font-semibold shadow-lg shadow-amber-500/20"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              <span>Finalizar Votação de {currentVoter?.name}</span>
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
