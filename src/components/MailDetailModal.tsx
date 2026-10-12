import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Edit3, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  Inbox, 
  Send, 
  Maximize2, 
  Minimize2, 
  ClipboardList,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { MailItem, SchoolProfile } from '../types';

interface MailDetailModalProps {
  isOpen: boolean;
  mail?: MailItem | null;
  schoolProfile: SchoolProfile;
  onClose: () => void;
  onEdit: (mail: MailItem) => void;
  onPrintDisposisi: (mail: MailItem) => void;
  onDownloadFile: (mail: MailItem) => void;
}

export const MailDetailModal: React.FC<MailDetailModalProps> = ({
  isOpen,
  mail,
  schoolProfile,
  onClose,
  onEdit,
  onPrintDisposisi,
  onDownloadFile,
}) => {
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  if (!isOpen || !mail) return null;

  const isMasuk = mail.type === 'masuk';

  const getSifatBadge = (sifat: string) => {
    switch (sifat) {
      case 'Penting':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Segera':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rahasia':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Edaran':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Undangan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isPdf = mail.file?.fileType.includes('pdf');
  const isImage = mail.file?.fileType.includes('image');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className={`relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/80 w-full flex flex-col overflow-hidden transition-all duration-200 ${
        fullscreenPreview ? 'max-w-6xl h-[95vh]' : 'max-w-4xl max-h-[92vh]'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/20 text-white flex items-center justify-between ${
          isMasuk ? 'bg-gradient-to-r from-blue-700/95 via-indigo-700/95 to-blue-800/95' : 'bg-gradient-to-r from-emerald-700/95 via-teal-700/95 to-emerald-800/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15">
              {isMasuk ? <Inbox className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Detail {isMasuk ? 'Surat Masuk' : 'Surat Keluar'}
                </h2>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded font-bold">
                  {mail.nomorAgenda}
                </span>
              </div>
              <p className="text-xs text-white/80">{mail.nomorSurat}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreenPreview(!fullscreenPreview)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              title={fullscreenPreview ? 'Perkecil' : 'Perbesar Layar'}
            >
              {fullscreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split into metadata and document viewer */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Metadata Info (Left side on desktop) */}
          <div className={`space-y-4 ${mail.file ? 'md:col-span-5' : 'md:col-span-12'}`}>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Perihal Surat
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">{mail.perihal}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Sifat Surat</span>
                  <span className={`inline-block mt-0.5 font-bold px-2 py-0.5 rounded-full border text-[11px] ${getSifatBadge(mail.sifat)}`}>
                    {mail.sifat}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">No. Agenda</span>
                  <span className="font-mono font-bold text-blue-900">{mail.nomorAgenda}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1.5">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {isMasuk ? 'Asal / Pengirim' : 'Tujuan Penerima'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {isMasuk ? mail.pengirim : mail.tujuan}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Surat</span>
                    <span className="font-medium text-slate-700">{mail.tanggalSurat}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      {isMasuk ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                    </span>
                    <span className="font-medium text-slate-700">
                      {isMasuk ? mail.tanggalDiterima || '-' : mail.tanggalKirim || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {mail.keterangan && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 block text-[11px]">Keterangan / Catatan</span>
                  <p className="text-slate-700 italic mt-0.5">{mail.keterangan}</p>
                </div>
              )}
            </div>

            {/* Disposisi Block for Surat Masuk */}
            {isMasuk && mail.disposisi && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                    <span>Lembar Disposisi Kepala Sekolah</span>
                  </span>
                  <span className="font-bold text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                    {mail.disposisi.sifatDisposisi}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Diteruskan Kepada:</span>
                  <span className="font-bold text-purple-950">{mail.disposisi.tujuanDisposisi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Instruksi:</span>
                  <p className="text-slate-800">{mail.disposisi.isiDisposisi}</p>
                </div>
                {mail.disposisi.batasWaktu && (
                  <p className="text-[11px] text-rose-600 font-semibold">
                    Batas Waktu: {mail.disposisi.batasWaktu}
                  </p>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => onPrintDisposisi(mail)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Lembar Disposisi Resmi</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Document Viewer (Right side on desktop) */}
          {mail.file ? (
            <div className="md:col-span-7 flex flex-col rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5">
              {/* Document Header Bar */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  {isPdf ? (
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800 truncate">{mail.file.fileName}</span>
                  <span className="text-slate-400 shrink-0">
                    ({(mail.file.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => onDownloadFile(mail)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas</span>
                </button>
              </div>

              {/* Viewer Container */}
              <div className="flex-1 min-h-[350px] max-h-[550px] overflow-auto flex items-center justify-center bg-slate-100 p-2">
                {isPdf ? (
                  <object
                    data={mail.file.dataUrl}
                    type="application/pdf"
                    className="w-full h-full min-h-[420px] rounded-lg shadow-sm"
                  >
                    <div className="p-8 text-center text-slate-500">
                      <p className="font-semibold">Pratinjau PDF tidak didukung di peramban ini.</p>
                      <button
                        onClick={() => onDownloadFile(mail)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        Download PDF untuk Membaca
                      </button>
                    </div>
                  </object>
                ) : (
                  <img
                    src={mail.file.dataUrl}
                    alt={mail.file.fileName}
                    className="max-h-[500px] max-w-full object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="md:col-span-12 p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada berkas yang dilampirkan</p>
              <p className="text-xs text-slate-400 mt-1">
                Anda dapat menambahkan file scan surat dengan menekan tombol Edit Surat di bawah.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tersimpan permanen di database kearsipan sekolah</span>
          </div>

          <div className="flex items-center gap-2">
            {mail.file && (
              <button
                onClick={() => onDownloadFile(mail)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(mail);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Surat</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
