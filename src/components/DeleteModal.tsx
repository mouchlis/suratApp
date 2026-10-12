import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { MailItem } from '../types';

interface DeleteModalProps {
  isOpen: boolean;
  mail?: MailItem | null;
  onClose: () => void;
  onConfirm: (mail: MailItem) => Promise<void>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  mail,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !mail) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/80 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Surat</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Apakah Anda yakin ingin menghapus agenda surat ini secara permanen dari database?
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="font-mono font-bold text-blue-900">{mail.nomorAgenda}</div>
          <div className="font-semibold text-slate-800">{mail.nomorSurat}</div>
          <div className="text-slate-600 truncate">{mail.perihal}</div>
          {mail.file && (
            <div className="text-[11px] text-rose-600 pt-1 border-t border-slate-200 mt-1">
              &bull; File lampiran ({mail.file.fileName}) juga akan dihapus.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(mail)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Ya, Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  );
};
