import React, { useState, useEffect } from 'react';
import { Photo, GalleryVoter, PhotoCommentItem } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { MessageSquare, Trash2, Send, User, Clock } from 'lucide-react';

export interface ClientCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
  currentVoter: GalleryVoter | null;
  commentsList: PhotoCommentItem[];
  onAddComment: (photoId: string, text: string) => void;
  onDeleteComment: (photoId: string, commentId: string) => void;
}

export const ClientCommentModal: React.FC<ClientCommentModalProps> = ({
  isOpen,
  onClose,
  photo,
  currentVoter,
  commentsList,
  onAddComment,
  onDeleteComment
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
  }, [isOpen, photo?.id]);

  if (!photo) return null;

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onAddComment(photo.id, clean);
    setText('');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <span>Mural de Observações do Ensaio</span>
        </div>
      }
      description={`Foto: ${photo.originalFileName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Photo thumbnail preview */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <img
            src={photo.url}
            alt={photo.originalFileName}
            className="w-16 h-16 object-cover rounded-lg protected-photo shadow"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-mono text-xs font-semibold text-zinc-200 truncate">
              {photo.originalFileName}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Instruções de edição, retoques ou preferências compartilhadas pelos participantes.
            </p>
          </div>
        </div>

        {/* Existing Comments Timeline */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {commentsList.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              Nenhum comentário adicionado nesta foto ainda. Seja o primeiro!
            </div>
          ) : (
            commentsList.map((c) => {
              const isMine = c.voterId === currentVoter?.id;
              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    isMine
                      ? 'bg-sky-950/20 border-sky-500/30'
                      : 'bg-zinc-950/60 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                        {c.voterName.slice(0, 1).toUpperCase()}
                      </div>
                      <strong className="text-zinc-200 font-medium">{c.voterName}</strong>
                      {isMine && <span className="text-[10px] text-sky-400 font-mono">(Você)</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {(isMine || currentVoter?.isDecisionMaker) && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(photo.id, c.id)}
                          className="text-zinc-500 hover:text-red-400 p-0.5 transition-colors"
                          title="Remover este comentário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-300 italic pl-1">&ldquo;{c.text}&rdquo;</p>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="block text-[11px] text-zinc-400 mb-1.5 font-medium">Sugestões rápidas:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Versão em Preto e Branco',
              'Clarear sombra no rosto',
              'Remover pessoa de fundo',
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

        {/* Add comment form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-zinc-800">
          <Textarea
            label={`Comentar como ${currentVoter?.name || 'Votante'}`}
            placeholder="Digite aqui suas observações de edição..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button
              type="submit"
              variant="amber"
              size="sm"
              disabled={!text.trim()}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Enviar Comentário</span>
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
