import React, { useEffect } from 'react';
import { Gallery } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle2, Heart, Sparkles, MessageSquare, ArrowRight, RotateCcw, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ClientCompletedViewProps {
  gallery: Gallery;
  onReviewSelection: () => void;
  onReopenSelectionForTesting: () => void;
  onSwitchToAdmin: () => void;
}

export const ClientCompletedView: React.FC<ClientCompletedViewProps> = ({
  gallery,
  onReviewSelection,
  onReopenSelectionForTesting,
  onSwitchToAdmin
}) => {
  useEffect(() => {
    // Launch festive confetti on load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#ffffff', '#10b981']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const selectedCount = gallery.clientSelection.selectedPhotoIds.length;
  const quota = gallery.quotaIncluded;
  const extraCount = Math.max(0, selectedCount - quota);
  const extraTotal = extraCount * gallery.extraPhotoPrice;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-amber-500/40 bg-zinc-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl text-center overflow-hidden">
        {/* Top Banner accent */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400" />

        <CardContent className="p-8 sm:p-12 space-y-6">
          {/* Animated Success Badge */}
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-in zoom-in-50" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" size="md" className="gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Seleção Concluída e Enviada</span>
            </Badge>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
              Obrigado, {gallery.clientName.split(' ')[0]}!
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Suas <strong className="text-zinc-200">{selectedCount} fotos favoritas</strong> foram registradas com sucesso e enviadas para o fotógrafo iniciar o fluxo de tratamento em alta resolução.
            </p>
          </div>

          {/* Detailed Summary Card */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-400">Projeto / Ensaio:</span>
              <strong className="text-zinc-200 font-serif">{gallery.title}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-400">Total de fotos aprovadas:</span>
              <span className="font-mono text-zinc-100 font-bold">{selectedCount} fotos</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-400">Dentro da cota contratada:</span>
              <span className="font-mono text-emerald-400">{Math.min(selectedCount, quota)} fotos</span>
            </div>
            {extraCount > 0 && (
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Fotos adicionais / excedentes:</span>
                <span className="font-mono text-amber-400 font-bold">
                  +{extraCount} extras{' '}
                  {gallery.excessPolicy === 'charge' ? `(R$ ${extraTotal.toFixed(2)})` : '(Aprovação Pura)'}
                </span>
              </div>
            )}
            {gallery.clientSelection.completedAt && (
              <div className="flex justify-between py-1 text-zinc-500">
                <span>Data do envio:</span>
                <span>{new Date(gallery.clientSelection.completedAt).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onReviewSelection}
              className="w-full sm:w-auto text-xs"
            >
              <span>Ver Minhas Fotos Selecionadas</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <Button
              variant="amber"
              size="lg"
              onClick={onSwitchToAdmin}
              className="w-full sm:w-auto text-xs"
            >
              <span>Ir ao Painel do Fotógrafo</span>
            </Button>
          </div>

          {/* Testing assist */}
          <div className="pt-6 border-t border-zinc-800/80">
            <button
              onClick={onReopenSelectionForTesting}
              className="text-[11px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reabrir seleção para edição (Recurso para Testes)</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
