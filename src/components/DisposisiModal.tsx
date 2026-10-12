import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { MailItem, SchoolProfile } from '../types';
import { printLembarDisposisi } from '../lib/export';

interface DisposisiModalProps {
  isOpen: boolean;
  mail?: MailItem | null;
  schoolProfile: SchoolProfile;
  onClose: () => void;
}

export const DisposisiModal: React.FC<DisposisiModalProps> = ({
  isOpen,
  mail,
  schoolProfile,
  onClose,
}) => {
  if (!isOpen || !mail) return null;

  const disposisi = mail.disposisi;

  const handlePrint = () => {
    printLembarDisposisi(mail, schoolProfile);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-800/95 to-indigo-900/95 border-b border-white/20 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15">
              <FileText className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Lembar Disposisi Surat</h2>
              <p className="text-xs text-purple-200">Format Resmi Disposisi Kepala Sekolah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 max-w-xl w-full text-slate-800 text-xs space-y-4">
            {/* Kop Surat Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-bold text-sm tracking-wide uppercase text-slate-900">
                {schoolProfile.namaSekolah}
              </h3>
              <h4 className="font-extrabold text-base tracking-wider uppercase text-blue-900 my-0.5">
                LEMBAR DISPOSISI
              </h4>
              <p className="text-[10px] text-slate-600">
                {schoolProfile.alamat} | NPSN: {schoolProfile.npsn} | Telp: {schoolProfile.telepon}
              </p>
            </div>

            {/* Table Detail Surat */}
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-28">Surat Dari</td>
                  <td colSpan={3} className="border border-slate-400 p-2 font-semibold text-slate-900">
                    {mail.pengirim || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Nomor Surat</td>
                  <td className="border border-slate-400 p-2">{mail.nomorSurat}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-24">No. Agenda</td>
                  <td className="border border-slate-400 p-2 font-mono font-bold text-blue-900">
                    {mail.nomorAgenda}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Tanggal Surat</td>
                  <td className="border border-slate-400 p-2">{mail.tanggalSurat}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Tgl Diterima</td>
                  <td className="border border-slate-400 p-2">{mail.tanggalDiterima || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Perihal</td>
                  <td colSpan={3} className="border border-slate-400 p-2 font-semibold">
                    {mail.perihal}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Sifat Surat</td>
                  <td colSpan={3} className="border border-slate-400 p-2">
                    <span className="font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                      {mail.sifat}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Kotak Diteruskan */}
            <div className="border border-slate-400 p-3 rounded bg-slate-50/50">
              <span className="font-bold text-[11px] uppercase tracking-wider block text-slate-700">
                DITERUSKAN KEPADA :
              </span>
              <p className="font-bold text-sm text-blue-950 mt-1">
                {disposisi?.tujuanDisposisi || 'Waka Kurikulum / Kesiswaan / Tim Terkait'}
              </p>
            </div>

            {/* Kotak Instruksi */}
            <div className="border border-slate-400 p-3 rounded min-h-[90px]">
              <span className="font-bold text-[11px] uppercase tracking-wider block text-slate-700">
                PETUNJUK / INSTRUKSI KEPALA SEKOLAH :
              </span>
              <p className="mt-1 text-slate-800 leading-relaxed">
                {disposisi?.isiDisposisi || 'Harap dipelajari, dikoordinasikan, dan ditindaklanjuti sesuai jadwal.'}
              </p>
              {disposisi?.batasWaktu && (
                <p className="text-rose-600 font-bold mt-2 text-[11px]">
                  Batas Waktu: {disposisi.batasWaktu}
                </p>
              )}
            </div>

            {/* Tanda Tangan */}
            <div className="flex justify-end pt-2">
              <div className="text-center w-52">
                <p className="text-[11px] text-slate-600">Kepala Sekolah,</p>
                <div className="h-14"></div>
                <p className="font-bold underline text-slate-900">{schoolProfile.kepalaSekolah}</p>
                <p className="text-[10px] text-slate-500">NIP. {schoolProfile.nipKepalaSekolah}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar Disposisi (PDF / Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
