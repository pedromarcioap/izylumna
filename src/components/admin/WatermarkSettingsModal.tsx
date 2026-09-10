import React, { useState, useEffect } from 'react';
import { Gallery } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Watermark } from '../common/Watermark';
import { SafeImage } from '../common/SafeImage';
import { saveGalleryAsync } from '../../lib/storage';
import { ShieldCheck, Sparkles, LayoutGrid, Target, MoveUpRight, Sliders, Type } from 'lucide-react';

export interface WatermarkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  onSave: (updatedGallery: Gallery) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const WatermarkSettingsModal: React.FC<WatermarkSettingsModalProps> = ({
  isOpen,
  onClose,
  gallery,
  onSave,
  onShowToast
}) => {
  const [enabled, setEnabled] = useState(gallery.watermarkEnabled);
  const [text, setText] = useState(gallery.watermarkText || 'PROVA • LUMINA STUDIO • PROVA');
  const [position, setPosition] = useState<'grid' | 'center' | 'both' | 'bottom-right'>(
    gallery.watermarkPosition || 'both'
  );
  const [opacity, setOpacity] = useState<number>(gallery.watermarkOpacity ?? 0.25);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && gallery) {
      setEnabled(gallery.watermarkEnabled);
      setText(gallery.watermarkText || `PROVA • ${gallery.clientName.toUpperCase()} • PROVA`);
      setPosition(gallery.watermarkPosition || 'both');
      setOpacity(gallery.watermarkOpacity ?? 0.25);
    }
  }, [isOpen, gallery]);

  const previewPhotoUrl = gallery.coverPhotoUrl || gallery.photos[0]?.url || '';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: Gallery = {
        ...gallery,
        watermarkEnabled: enabled,
        watermarkText: enabled ? text.trim() : undefined,
        watermarkPosition: enabled ? position : undefined,
        watermarkOpacity: enabled ? opacity : undefined,
        updatedAt: new Date().toISOString()
      };

      const saved = await saveGalleryAsync(updated);
      onSave(saved);
      onShowToast(
        'Marca d\'Água Atualizada!',
        `A proteção da galeria "${gallery.title}" foi salva com sucesso.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      onShowToast('Erro ao salvar', err?.message || 'Não foi possível salvar as alterações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const quickPresets = [
    `PROVA • ${gallery.clientName.toUpperCase()}`,
    'PROVA • LUMINA STUDIO',
    'AMOSTRA CONFIDENCIAL • DIREITOS RESERVADOS',
    'EXEMPLAR DE SELEÇÃO'
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Configurar Marca d'Água — {gallery.title}</span>
        </div>
      }
      description="Personalize o texto, a posição e a opacidade da marca d'água de proteção contra cópias."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Toggle Enable Watermark */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-zinc-100 block">
              Ativar Marca d'Água nas Fotografias
            </span>
            <p className="text-xs text-zinc-400">
              Sobrepõe texto de segurança sobre as imagens no portal do cliente e no lightbox.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {enabled && (
          <>
            {/* Live Interactive Preview Card */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pré-visualização em Tempo Real</span>
              </span>
              <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center select-none">
                {previewPhotoUrl ? (
                  <SafeImage
                    src={previewPhotoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 text-xs">
                    <ShieldCheck className="w-10 h-10 mb-2 opacity-50" />
                    <span>Sem foto de capa para prévia</span>
                  </div>
                )}
                <Watermark
                  enabled={enabled}
                  text={text || 'PROVA • LUMINA STUDIO'}
                  position={position}
                  opacity={opacity}
                />
              </div>
            </div>

            {/* Custom Text & Quick Suggestions */}
            <div className="space-y-3">
              <Input
                label="Texto da Marca d'Água"
                placeholder="Ex: PROVA • NOME DO CLIENTE • PROVA"
                value={text}
                onChange={(e) => setText(e.target.value)}
                leftIcon={<Type className="w-4 h-4 text-zinc-400" />}
              />

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-zinc-500 self-center mr-1">Sugestões:</span>
                {quickPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-300 text-xs transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Posição e Padrão Visual
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('both')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                    position === 'both'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span className="text-xs font-semibold">Grade + Centro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('grid')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                    position === 'grid'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                  <span className="text-xs font-semibold">Grade Diagonal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('center')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                    position === 'center'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span className="text-xs font-semibold">Selo Central</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                    position === 'bottom-right'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <MoveUpRight className="w-5 h-5" />
                  <span className="text-xs font-semibold">Canto Inferior</span>
                </button>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Intensidade da Opacidade</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>10% (Muito Discreta)</span>
                <span>25% (Recomendado)</span>
                <span>70% (Alta Visibilidade)</span>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="amber"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            className="font-semibold shadow-lg shadow-amber-500/20"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            <span>Salvar Configuração</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
