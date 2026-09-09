import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Trash2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  galleryTitle: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  galleryTitle
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="text-center space-y-5 py-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Trash2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">Excluir Ensaio / Galeria</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Tem certeza que deseja excluir a galeria <strong className="text-zinc-200">&ldquo;{galleryTitle}&rdquo;</strong>?
            Todos os registros, seleções de fotos do cliente e relatórios serão permanentemente removidos.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-500 font-semibold border-none"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span>Sim, Excluir Galeria</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
