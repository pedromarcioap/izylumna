import React, { useState, useEffect } from 'react';
import { Photo } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { MessageSquare, Trash2, Check } from 'lucide-react';

export interface ClientCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
  existingComment?: string;
  onSaveComment: (photoId: string, commentText: string) => void;
  onRemoveComment: (photoId: string) => void;
}

export const ClientCommentModal: React.FC<ClientCommentModalProps> = ({
  isOpen,
  onClose,
  photo,
  existingComment = '',
  onSaveComment,
  onRemoveComment
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(existingComment || '');
  }, [existingComment, isOpen]);

  if (!photo) return null;

  const handleSave = () => {
    if (text.trim()) {
      onSaveComment(photo.id, text.trim());
    } else {
      onRemoveComment(photo.id);
    }
    onClose();
  };

  const handleRemove = () => {
    onRemoveComment(photo.id);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <span>Observação para Tratamento</span>
        </div>
      }
      description={`Foto: ${photo.originalFileName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Photo thumbnail preview */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <img
            src={photo.url}
            alt={photo.originalFileName}
            className="w-16 h-16 object-cover rounded-lg protected-photo"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-mono text-xs font-semibold text-zinc-200 truncate">
              {photo.originalFileName}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Deixe orientações específicas de pós-produção para o fotógrafo (ex: ajuste de iluminação, retoque, remoção de objeto).
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="block text-[11px] text-zinc-400 mb-1.5 font-medium">Sugestões rápidas:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Versão em Preto e Branco',
              'Clarear sombra no rosto',
              'Remover pessoa de fundo',
              'Ajustar contraste da pele',
              'Destaque para o álbum'
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setText((prev) => (prev ? `${prev}. ${suggestion}` : suggestion))}
                className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Sua Instrução para Esta Foto"
          placeholder="ex: Gostaria de pedir para remover o reflexo no vidro e dar um tom levemente mais quente na pele..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          autoFocus
        />

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          {existingComment ? (
            <Button type="button" variant="danger" size="sm" onClick={handleRemove}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Excluir</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="amber" size="sm" onClick={handleSave}>
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Salvar Observação</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
