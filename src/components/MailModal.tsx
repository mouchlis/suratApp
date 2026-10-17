import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Inbox, 
  Send, 
  Paperclip, 
  Building, 
  FileCheck,
  ClipboardList,
  Sparkles,
  Wand2,
  Loader2,
  Bot
} from 'lucide-react';
import { MailItem, MailType, MailCategory, MailAttachment } from '../types';
import { getNextAgendaNumber } from '../lib/db';
import { extractLetterDataFromDoc, ExtractedLetterData } from '../lib/aiExtractor';

interface MailModalProps {
  isOpen: boolean;
  type: MailType;
  initialMail?: MailItem | null;
  onClose: () => void;
  onSave: (mailData: MailItem) => Promise<void>;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

export const MailModal: React.FC<MailModalProps> = ({
  isOpen,
  type,
  initialMail,
  onClose,
  onSave,
}) => {
  const isMasuk = type === 'masuk';
  const isEditing = Boolean(initialMail);

  // Form states
  const [nomorAgenda, setNomorAgenda] = useState('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tanggalDiterima, setTanggalDiterima] = useState('');
  const [tanggalKirim, setTanggalKirim] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [perihal, setPerihal] = useState('');
  const [sifat, setSifat] = useState<MailCategory>('Biasa');
  const [keterangan, setKeterangan] = useState('');
  
  // Disposisi states (for surat masuk)
  const [showDisposisi, setShowDisposisi] = useState(false);
  const [tujuanDisposisi, setTujuanDisposisi] = useState('');
  const [isiDisposisi, setIsiDisposisi] = useState('');
  const [sifatDisposisi, setSifatDisposisi] = useState<'Biasa' | 'Segera' | 'Sangat Segera'>('Biasa');
  const [batasWaktu, setBatasWaktu] = useState('');

  // File states
  const [fileAttachment, setFileAttachment] = useState<MailAttachment | undefined>(undefined);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // AI Auto-Detection states
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<{
    message: string;
    source: 'ai' | 'fallback';
    fields: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate or generate defaults on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialMail) {
      setNomorAgenda(initialMail.nomorAgenda || '');
      setNomorSurat(initialMail.nomorSurat || '');
      setTanggalSurat(initialMail.tanggalSurat || '');
      setTanggalDiterima(initialMail.tanggalDiterima || '');
      setTanggalKirim(initialMail.tanggalKirim || '');
      setPengirim(initialMail.pengirim || '');
      setTujuan(initialMail.tujuan || '');
      setPerihal(initialMail.perihal || '');
      setSifat(initialMail.sifat || 'Biasa');
      setKeterangan(initialMail.keterangan || '');
      setFileAttachment(initialMail.file);

      if (initialMail.disposisi) {
        setShowDisposisi(true);
        setTujuanDisposisi(initialMail.disposisi.tujuanDisposisi || '');
        setIsiDisposisi(initialMail.disposisi.isiDisposisi || '');
        setSifatDisposisi(initialMail.disposisi.sifatDisposisi || 'Biasa');
        setBatasWaktu(initialMail.disposisi.batasWaktu || '');
      } else {
        setShowDisposisi(false);
        setTujuanDisposisi('');
        setIsiDisposisi('');
        setSifatDisposisi('Biasa');
        setBatasWaktu('');
      }
    } else {
      // New record defaults
      const today = new Date().toISOString().slice(0, 10);
      setTanggalSurat(today);
      if (isMasuk) {
        setTanggalDiterima(today);
        setTanggalKirim('');
      } else {
        setTanggalKirim(today);
        setTanggalDiterima('');
      }
      setNomorSurat('');
      setPengirim('');
      setTujuan('');
      setPerihal('');
      setSifat('Biasa');
      setKeterangan('');
      setFileAttachment(undefined);
      setShowDisposisi(false);
      setTujuanDisposisi('');
      setIsiDisposisi('');
      setSifatDisposisi('Biasa');
      setBatasWaktu('');

      // Auto-compute next consecutive agenda number!
      getNextAgendaNumber(type)
        .then((nextNum) => setNomorAgenda(nextNum))
        .catch(() => setNomorAgenda(`001/${isMasuk ? 'SM' : 'SK'}/${new Date().getFullYear()}`));
    }

    setFileError(null);
    setFormErrors({});
    setIsExtracting(false);
    setExtractionNotice(null);
  }, [isOpen, initialMail, type, isMasuk]);

  if (!isOpen) return null;

  // Trigger Automatic Field Extraction (AI / OCR)
  const triggerAutoExtraction = async (dataUrl: string, fileName: string, fileType: string) => {
    setIsExtracting(true);
    setExtractionNotice(null);

    try {
      const extracted = await extractLetterDataFromDoc(dataUrl, fileName, fileType);
      const filledFields: string[] = [];

      if (extracted.nomorSurat) {
        setNomorSurat(extracted.nomorSurat);
        filledFields.push('Nomor Surat');
      }
      if (extracted.tanggalSurat) {
        setTanggalSurat(extracted.tanggalSurat);
        filledFields.push('Tanggal');
      }
      if (extracted.pengirim) {
        if (isMasuk) {
          setPengirim(extracted.pengirim);
          filledFields.push('Pengirim');
        } else {
          setTujuan(extracted.pengirim);
          filledFields.push('Tujuan');
        }
      }
      if (extracted.perihal) {
        setPerihal(extracted.perihal);
        filledFields.push('Perihal');
      }
      if (extracted.sifat) {
        setSifat(extracted.sifat);
        filledFields.push('Sifat');
      }
      if (extracted.keterangan && !keterangan) {
        setKeterangan(extracted.keterangan);
      }

      // Clear any validation errors for auto-filled fields
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.nomorSurat;
        delete next.tanggalSurat;
        delete next.pengirim;
        delete next.tujuan;
        delete next.perihal;
        return next;
      });

      setExtractionNotice({
        message: `Otomatis mengisi: ${filledFields.join(', ')}`,
        source: extracted.source,
        fields: filledFields,
      });
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // File processing and validation
  const handleProcessFile = (file: File) => {
    setFileError(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file melebihi batas maksimum 15MB. Silakan kompres atau pilih file lain.');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Format file tidak didukung. Harap unggah berkas PDF, JPG, JPEG, atau PNG.');
      return;
    }

    const calculatedMime = file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileAttachment({
        fileName: file.name,
        fileSize: file.size,
        fileType: calculatedMime,
        dataUrl: result,
        uploadedAt: new Date().toISOString(),
      });

      // Trigger automatic field extraction
      triggerAutoExtraction(result, file.name, calculatedMime);
    };
    reader.onerror = () => {
      setFileError('Gagal membaca file dari perangkat Anda.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualReExtract = () => {
    if (fileAttachment) {
      triggerAutoExtraction(fileAttachment.dataUrl, fileAttachment.fileName, fileAttachment.fileType);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!nomorSurat.trim()) {
      errors.nomorSurat = 'Nomor surat wajib diisi';
    }
    if (!tanggalSurat) {
      errors.tanggalSurat = 'Tanggal surat wajib diisi';
    }
    if (isMasuk && !pengirim.trim()) {
      errors.pengirim = 'Pengirim / Asal surat wajib diisi';
    }
    if (!isMasuk && !tujuan.trim()) {
      errors.tujuan = 'Tujuan / Penerima surat wajib diisi';
    }
    if (!perihal.trim()) {
      errors.perihal = 'Perihal surat wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const mailData: MailItem = {
        id: initialMail?.id || `${isMasuk ? 'sm' : 'sk'}-${Date.now()}`,
        type,
        nomorAgenda: nomorAgenda.trim() || `001/${isMasuk ? 'SM' : 'SK'}/${new Date().getFullYear()}`,
        nomorSurat: nomorSurat.trim(),
        tanggalSurat,
        tanggalDiterima: isMasuk ? tanggalDiterima : undefined,
        tanggalKirim: !isMasuk ? tanggalKirim : undefined,
        pengirim: isMasuk ? pengirim.trim() : undefined,
        tujuan: !isMasuk ? tujuan.trim() : undefined,
        perihal: perihal.trim(),
        sifat,
        keterangan: keterangan.trim(),
        lampiranAda: Boolean(fileAttachment),
        file: fileAttachment,
        disposisi: isMasuk && (tujuanDisposisi.trim() || isiDisposisi.trim())
          ? {
              tujuanDisposisi: tujuanDisposisi.trim(),
              isiDisposisi: isiDisposisi.trim(),
              sifatDisposisi: sifatDisposisi,
              batasWaktu: batasWaktu || undefined,
              status: initialMail?.disposisi?.status || 'Diteruskan',
            }
          : undefined,
        createdAt: initialMail?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(mailData);
      onClose();
    } catch (err) {
      console.error(err);
      setFileError('Terjadi kesalahan saat menyimpan data ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/80 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className={`px-6 py-4.5 border-b border-white/20 text-white flex items-center justify-between ${
          isMasuk ? 'bg-gradient-to-r from-blue-700/95 via-indigo-700/95 to-blue-800/95' : 'bg-gradient-to-r from-emerald-700/95 via-teal-700/95 to-emerald-800/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              {isMasuk ? <Inbox className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {isEditing ? 'Edit Agenda ' : 'Catat Agenda '}
                  {isMasuk ? 'Surat Masuk' : 'Surat Keluar'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Auto-Detect</span>
                </span>
              </div>
              <p className="text-xs text-white/80">
                Lengkapi formulir registrasi kearsipan surat resmi sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Auto-Extraction Status Notification */}
          {isExtracting && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs animate-pulse shadow-xs">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">Sedang Menganalisis Berkas Surat...</span>
                <span className="text-blue-700 text-[11px]">
                  Mendeteksi nomor surat, tanggal, pengirim, dan perihal secara otomatis.
                </span>
              </div>
            </div>
          )}

          {extractionNotice && !isExtracting && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block">
                    {extractionNotice.source === 'ai' ? '🤖 Berhasil Dideteksi Otomatis oleh AI!' : '✨ Berhasil Dideteksi Otomatis dari Berkas!'}
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    {extractionNotice.message}. Anda tetap dapat menyesuaikan kolom bila diperlukan.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtractionNotice(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: File Upload (PDF, JPG, PNG) Permanen di Database */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 backdrop-blur-md">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>Upload Berkas Surat (PDF / JPG / PNG)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <Wand2 className="w-3 h-3 text-blue-600" />
                  Auto-Detect Kolom Aktif
                </span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Maks. 15MB &bull; Tersimpan Permanen</span>
            </div>

            {/* File display if already attached */}
            {fileAttachment ? (
              <div className="flex items-center justify-between p-3.5 bg-white border border-blue-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    {fileAttachment.fileType.includes('pdf') ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {fileAttachment.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(fileAttachment.fileSize / 1024).toFixed(1)} KB &bull; Tersimpan di Database
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualReExtract}
                    disabled={isExtracting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                    title="Mendeteksi ulang nomor surat, tanggal, pengirim, dan perihal dari file ini"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Deteksi Ulang AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileAttachment(undefined)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Box */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-white'
                }`}
              >
                <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Unggah Berkas Surat & Deteksi Kolom Otomatis
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tarik atau pilih scan surat <span className="font-semibold text-slate-700">PDF, JPG, JPEG, PNG</span>. Sistem akan otomatis mengisi nomor surat, tanggal, asal pengirim, dan perihal!
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {fileError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Section 2: Informasi Pokok Surat */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Informasi Pokok Surat</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nomor Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Agenda <span className="text-slate-400 font-normal">(Otomatis/Bisa diubah)</span>
                </label>
                <input
                  type="text"
                  value={nomorAgenda}
                  onChange={(e) => setNomorAgenda(e.target.value)}
                  placeholder="Contoh: 001/SM/2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Nomor Surat Asli (Auto-detected) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Nomor Surat Asli <span className="text-rose-500">*</span>
                  </span>
                  {nomorSurat && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      ✓ Terdeteksi dari Surat
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => {
                    setNomorSurat(e.target.value);
                    if (formErrors.nomorSurat) setFormErrors((prev) => ({ ...prev, nomorSurat: '' }));
                  }}
                  placeholder="Contoh: 421.3/145/Disdik/2026 atau SE/045/Disdikpora/2026"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.nomorSurat ? 'border-rose-400 bg-rose-50' : 'bg-slate-50 border-slate-300 focus:bg-white'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nomor resmi yang tercetak pada dokumen surat (terletak di bawah kop surat sebelah kiri).
                </p>
                {formErrors.nomorSurat && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.nomorSurat}</p>
                )}
              </div>

              {/* Tanggal Surat (Auto-detected) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Tanggal Surat <span className="text-rose-500">*</span>
                  </span>
                  {tanggalSurat && (
                    <span className="text-[10px] font-semibold text-blue-600">✓ Terisi</span>
                  )}
                </label>
                <input
                  type="date"
                  value={tanggalSurat}
                  onChange={(e) => {
                    setTanggalSurat(e.target.value);
                    if (formErrors.tanggalSurat) setFormErrors((prev) => ({ ...prev, tanggalSurat: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.tanggalSurat ? 'border-rose-400 bg-rose-50' : 'bg-slate-50 border-slate-300 focus:bg-white'
                  }`}
                />
                {formErrors.tanggalSurat && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.tanggalSurat}</p>
                )}
              </div>

              {/* Tanggal Diterima (Masuk) / Tanggal Kirim (Keluar) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isMasuk ? 'Tanggal Diterima Sekolah' : 'Tanggal Pengiriman Surat'}
                </label>
                <input
                  type="date"
                  value={isMasuk ? tanggalDiterima : tanggalKirim}
                  onChange={(e) => {
                    if (isMasuk) setTanggalDiterima(e.target.value);
                    else setTanggalKirim(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pihak Terkait, Perihal, & Sifat */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Pengirim atau Tujuan (Auto-detected) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    {isMasuk ? 'Asal / Pengirim Surat' : 'Tujuan / Penerima Surat'}{' '}
                    <span className="text-rose-500">*</span>
                  </span>
                  {(isMasuk ? pengirim : tujuan) && (
                    <span className="text-[10px] font-semibold text-blue-600">✓ Terisi</span>
                  )}
                </label>
                <input
                  type="text"
                  value={isMasuk ? pengirim : tujuan}
                  onChange={(e) => {
                    if (isMasuk) {
                      setPengirim(e.target.value);
                      if (formErrors.pengirim) setFormErrors((prev) => ({ ...prev, pengirim: '' }));
                    } else {
                      setTujuan(e.target.value);
                      if (formErrors.tujuan) setFormErrors((prev) => ({ ...prev, tujuan: '' }));
                    }
                  }}
                  placeholder={
                    isMasuk
                      ? 'Contoh: Dinas Pendidikan Provinsi / BKD / Komite Sekolah'
                      : 'Contoh: Kepala Balai Guru Penggerak / Orang Tua Murid'
                  }
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    (isMasuk ? formErrors.pengirim : formErrors.tujuan)
                      ? 'border-rose-400 bg-rose-50'
                      : 'bg-slate-50 border-slate-300 focus:bg-white'
                  }`}
                />
                {(isMasuk ? formErrors.pengirim : formErrors.tujuan) && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {isMasuk ? formErrors.pengirim : formErrors.tujuan}
                  </p>
                )}
              </div>

              {/* Sifat Surat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sifat Surat</label>
                <select
                  value={sifat}
                  onChange={(e) => setSifat(e.target.value as MailCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Biasa">Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Segera">Segera</option>
                  <option value="Rahasia">Rahasia</option>
                  <option value="Edaran">Edaran</option>
                  <option value="Undangan">Undangan</option>
                  <option value="Pemberitahuan">Pemberitahuan</option>
                </select>
              </div>
            </div>

            {/* Perihal (Auto-detected) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  Perihal / Pokok Isi Surat <span className="text-rose-500">*</span>
                </span>
                {perihal && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    ✓ Pokok Isi Surat Terdeteksi
                  </span>
                )}
              </label>
              <textarea
                rows={2}
                value={perihal}
                onChange={(e) => {
                  setPerihal(e.target.value);
                  if (formErrors.perihal) setFormErrors((prev) => ({ ...prev, perihal: '' }));
                }}
                placeholder="Tuliskan pokok permasalahan atau perihal resmi surat secara lengkap..."
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.perihal ? 'border-rose-400 bg-rose-50' : 'bg-slate-50 border-slate-300 focus:bg-white'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pokok isi atau perihal resmi surat yang diunggah (bukan nama file).
              </p>
              {formErrors.perihal && (
                <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.perihal}</p>
              )}
            </div>

            {/* Keterangan / Ringkasan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan Tambahan / Ringkasan Arsip
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan berkas, nomor rak arsip, tindak lanjut, dll."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 4: Lembar Disposisi (Khusus Surat Masuk) */}
          {isMasuk && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowDisposisi(!showDisposisi)}
                className="flex items-center justify-between w-full text-left p-3 rounded-2xl bg-purple-50/80 hover:bg-purple-100/70 text-purple-900 border border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold">
                    {showDisposisi ? 'Tutup Catatan Disposisi Kepala Sekolah' : '+ Tambah / Atur Lembar Disposisi Kepala Sekolah'}
                  </span>
                </div>
                <span className="text-xs text-purple-600 font-semibold">
                  {showDisposisi ? 'Tutup' : 'Buka'}
                </span>
              </button>

              {showDisposisi && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Diteruskan Kepada
                      </label>
                      <input
                        type="text"
                        value={tujuanDisposisi}
                        onChange={(e) => setTujuanDisposisi(e.target.value)}
                        placeholder="Contoh: Waka Kurikulum, Waka Sarpras, Bendahara"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sifat Instruksi
                      </label>
                      <select
                        value={sifatDisposisi}
                        onChange={(e) => setSifatDisposisi(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Segera">Segera</option>
                        <option value="Sangat Segera">Sangat Segera</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Isi Instruksi / Catatan Kepala Sekolah
                    </label>
                    <textarea
                      rows={2}
                      value={isiDisposisi}
                      onChange={(e) => setIsiDisposisi(e.target.value)}
                      placeholder="Contoh: Pelajari dan tindaklanjuti, buatkan surat balasan sebelum tanggal 15."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batas Waktu Penyelesaian
                    </label>
                    <input
                      type="date"
                      value={batasWaktu}
                      onChange={(e) => setBatasWaktu(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Unggah berkas untuk mengisi otomatis kolom pokok</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isExtracting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                isMasuk ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Surat ke Database'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
