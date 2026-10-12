import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  HardDriveDownload, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Database,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { MailItem, SchoolProfile } from '../types';
import { exportToCSV, downloadFile } from '../lib/export';
import { exportDatabaseBackup, importDatabaseBackup } from '../lib/db';

interface ExportModalProps {
  isOpen: boolean;
  mails: MailItem[];
  schoolProfile: SchoolProfile;
  onClose: () => void;
  onDataRestored: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  mails,
  schoolProfile,
  onClose,
  onDataRestored,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'excel' | 'backup'>('excel');
  
  // Excel Export states
  const [exportType, setExportType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Backup states
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Excel/CSV export
  const handleExportCSV = () => {
    let toExport = mails;

    if (exportType !== 'all') {
      toExport = toExport.filter((m) => m.type === exportType);
    }
    if (startDate) {
      toExport = toExport.filter((m) => m.tanggalSurat >= startDate);
    }
    if (endDate) {
      toExport = toExport.filter((m) => m.tanggalSurat <= endDate);
    }

    exportToCSV(toExport, exportType, schoolProfile.namaSekolah);
  };

  // Handle Full JSON Backup Export
  const handleExportBackupJson = async () => {
    setIsExportingJson(true);
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(url, `Backup_Agenda_Surat_${schoolProfile.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.json`);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingJson(false);
    }
  };

  // Handle Backup JSON Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const result = await importDatabaseBackup(content);
        setImportStatus({
          type: 'success',
          message: `Berhasil memulihkan ${result.count} data surat dan profil sekolah dari berkas cadangan!`,
        });
        onDataRestored();
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err?.message || 'Gagal memproses file backup. Pastikan format JSON sesuai.',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Gagal membaca berkas dari komputer Anda.' });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/80 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-blue-950/95 border-b border-white/20 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Ekspor & Cadangan Database</h2>
              <p className="text-xs text-blue-200">Unduh data ke Excel/CSV atau buat file cadangan permanen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('excel')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'excel'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel / CSV</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'backup'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Backup & Pulihkan JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {activeSubTab === 'excel' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Unduh rekap data buku agenda surat dalam format CSV/Excel dengan pengkodean UTF-8 BOM, sehingga kolom dan teks bahasa Indonesia rapi saat dibuka di Microsoft Excel.
              </p>

              {/* Jenis Surat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Data Surat</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportType('all')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      exportType === 'all'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Semua Surat
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportType('masuk')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      exportType === 'masuk'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Surat Masuk Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportType('keluar')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      exportType === 'keluar'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Surat Keluar Saja
                  </button>
                </div>
              </div>

              {/* Date Filter */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dari Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Total <strong>{mails.length} surat</strong> siap diekspor. File hasil unduhan langsung dapat diedit di Excel.
                </span>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Excel / CSV Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Backup Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <HardDriveDownload className="w-4 h-4 text-blue-600" />
                  <span>Cadangkan Database Penuh (Termasuk Berkas)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menyimpan salinan seluruh data agenda surat, lampiran berkas surat, dan profil sekolah ke dalam sebuah berkas JSON cadangan yang aman di komputer Anda.
                </p>
                <button
                  onClick={handleExportBackupJson}
                  disabled={isExportingJson}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingJson ? 'Memproses...' : 'Unduh Cadangan JSON'}</span>
                </button>
              </div>

              {/* Restore Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Pulihkan Data dari Berkas Cadangan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unggah berkas cadangan JSON yang sebelumnya pernah diunduh untuk memulihkan seluruh agenda surat dan dokumen ke dalam database.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>{isImporting ? 'Memulihkan...' : 'Pilih Berkas Cadangan (.json)'}</span>
                </button>

                {importStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      importStatus.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {importStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{importStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
