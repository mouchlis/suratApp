import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Send, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { MailItem, MailType, SchoolProfile } from '../types';

interface MailListProps {
  type: MailType;
  mails: MailItem[];
  schoolProfile: SchoolProfile;
  onOpenAddModal: () => void;
  onEditMail: (mail: MailItem) => void;
  onDeleteMail: (mail: MailItem) => void;
  onViewMail: (mail: MailItem) => void;
  onPrintDisposisi: (mail: MailItem) => void;
  onDownloadFile: (mail: MailItem) => void;
  onExportCSV: (filteredMails: MailItem[]) => void;
  onPrintAgendaBook: (filteredMails: MailItem[]) => void;
}

export const MailList: React.FC<MailListProps> = ({
  type,
  mails,
  schoolProfile,
  onOpenAddModal,
  onEditMail,
  onDeleteMail,
  onViewMail,
  onPrintDisposisi,
  onDownloadFile,
  onExportCSV,
  onPrintAgendaBook,
}) => {
  const isMasuk = type === 'masuk';
  const pageTitle = isMasuk ? 'Buku Agenda Surat Masuk' : 'Buku Agenda Surat Keluar';
  const pageDescription = isMasuk
    ? 'Daftar seluruh surat yang diterima dari dinas, yayasan, instansi, atau perseorangan.'
    : 'Daftar seluruh surat dinas resmi yang dikeluarkan dan dikirimkan oleh sekolah ke pihak luar.';

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSifat, setSelectedSifat] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract available years from mails
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    mails.forEach((m) => {
      if (m.tanggalSurat) {
        years.add(m.tanggalSurat.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [mails]);

  // Months list (Indonesian)
  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  // Filtering Logic
  const filteredMails = useMemo(() => {
    return mails.filter((mail) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAgenda = mail.nomorAgenda?.toLowerCase().includes(query);
        const matchNomor = mail.nomorSurat?.toLowerCase().includes(query);
        const matchPerihal = mail.perihal?.toLowerCase().includes(query);
        const matchPengirim = mail.pengirim?.toLowerCase().includes(query);
        const matchTujuan = mail.tujuan?.toLowerCase().includes(query);
        const matchKet = mail.keterangan?.toLowerCase().includes(query);

        if (!matchAgenda && !matchNomor && !matchPerihal && !matchPengirim && !matchTujuan && !matchKet) {
          return false;
        }
      }

      if (selectedSifat !== 'all' && mail.sifat !== selectedSifat) {
        return false;
      }

      if (selectedYear !== 'all') {
        const mailYear = mail.tanggalSurat?.substring(0, 4);
        if (mailYear !== selectedYear) return false;
      }

      if (selectedMonth !== 'all') {
        const mailMonth = mail.tanggalSurat?.substring(5, 7);
        if (mailMonth !== selectedMonth) return false;
      }

      if (startDate && mail.tanggalSurat < startDate) {
        return false;
      }
      if (endDate && mail.tanggalSurat > endDate) {
        return false;
      }

      return true;
    });
  }, [mails, searchQuery, selectedSifat, selectedYear, selectedMonth, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSifat('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredMails.length / pageSize) || 1;
  const paginatedMails = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMails.slice(start, start + pageSize);
  }, [filteredMails, currentPage, pageSize]);

  const getSifatBadge = (sifat: string) => {
    switch (sifat) {
      case 'Penting':
        return 'bg-rose-500/15 text-rose-800 border-rose-300/60';
      case 'Segera':
        return 'bg-amber-500/15 text-amber-800 border-amber-300/60';
      case 'Rahasia':
        return 'bg-purple-500/15 text-purple-800 border-purple-300/60';
      case 'Edaran':
        return 'bg-indigo-500/15 text-indigo-800 border-indigo-300/60';
      case 'Undangan':
        return 'bg-emerald-500/15 text-emerald-800 border-emerald-300/60';
      default:
        return 'bg-slate-500/15 text-slate-700 border-slate-300/60';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar (Glassmorphism) */}
      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl text-white shadow-md border border-white/30 ${
                isMasuk ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
              }`}
            >
              {isMasuk ? <Inbox className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">{pageDescription}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onPrintAgendaBook(filteredMails)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-md bg-white/60 hover:bg-white/90 border border-white/80 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Cetak Buku Agenda Format Resmi"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Buku Agenda</span>
          </button>

          <button
            onClick={() => onExportCSV(filteredMails)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Ekspor ke Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 border border-white/30 cursor-pointer ${
              isMasuk
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah {isMasuk ? 'Surat Masuk' : 'Surat Keluar'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Box (Glassmorphism) */}
      <div className="rounded-3xl p-5 backdrop-blur-xl bg-white/75 border border-white/70 shadow-[0_8px_24px_rgba(15,23,42,0.05)] space-y-4">
        {/* Row 1: Search query & Sifat filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nomor surat, ${isMasuk ? 'pengirim' : 'tujuan'}, perihal, nomor agenda...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sifat Surat Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedSifat}
              onChange={(e) => {
                setSelectedSifat(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-2xs"
            >
              <option value="all">Semua Sifat Surat</option>
              <option value="Penting">Penting</option>
              <option value="Segera">Segera</option>
              <option value="Biasa">Biasa</option>
              <option value="Rahasia">Rahasia</option>
              <option value="Edaran">Edaran</option>
              <option value="Undangan">Undangan</option>
              <option value="Pemberitahuan">Pemberitahuan</option>
            </select>
          </div>

          {/* Tahun Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-2xs"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Bulan and Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 text-xs">
          {/* Bulan Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 shadow-2xs"
            >
              <option value="all">Semua Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Rentang:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Reset button */}
          {(searchQuery || selectedSifat !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50/80 rounded-xl font-bold transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}

          <div className="ml-auto text-slate-500 font-medium">
            Ditemukan: <strong className="text-slate-900">{filteredMails.length}</strong> data
          </div>
        </div>
      </div>

      {/* Main Glass Table View */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] overflow-hidden">
        {filteredMails.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/80 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada surat ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedSifat !== 'all' || selectedMonth !== 'all'
                ? 'Tidak ada data surat yang cocok dengan kriteria filter yang Anda pilih.'
                : 'Belum ada agenda surat yang dicatat. Silakan klik tombol Tambah Surat untuk memulai.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah {isMasuk ? 'Surat Masuk' : 'Surat Keluar'} Sekarang</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/70 backdrop-blur-md border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-4 w-12 text-center">No</th>
                    <th className="py-4 px-4 w-28">No. Agenda</th>
                    <th className="py-4 px-4 w-44">Nomor & Tanggal Surat</th>
                    <th className="py-4 px-4 w-48">{isMasuk ? 'Pengirim' : 'Tujuan'}</th>
                    <th className="py-4 px-4">Perihal</th>
                    <th className="py-4 px-4 w-24 text-center">Sifat</th>
                    <th className="py-4 px-4 w-36">Berkas File</th>
                    <th className="py-4 px-4 w-40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-700">
                  {paginatedMails.map((mail, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={mail.id} className="hover:bg-white/95 transition-colors">
                        {/* No */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 font-bold">
                          {rowNumber}
                        </td>

                        {/* No. Agenda */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-500/10 border border-blue-400/30 px-2 py-1 rounded-lg block text-center shadow-2xs">
                            {mail.nomorAgenda}
                          </span>
                        </td>

                        {/* Nomor & Tanggal Surat */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{mail.nomorSurat}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Surat: {formatDate(mail.tanggalSurat)}</span>
                          </div>
                          {isMasuk && mail.tanggalDiterima && (
                            <div className="text-[11px] text-blue-600 mt-0.5 font-semibold">
                              Diterima: {formatDate(mail.tanggalDiterima)}
                            </div>
                          )}
                          {!isMasuk && mail.tanggalKirim && (
                            <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">
                              Dikirim: {formatDate(mail.tanggalKirim)}
                            </div>
                          )}
                        </td>

                        {/* Pengirim / Tujuan */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {isMasuk ? mail.pengirim : mail.tujuan}
                          </div>
                          {isMasuk && mail.disposisi && (
                            <div className="mt-1 text-[11px] flex items-center gap-1 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                              <span className="truncate max-w-[170px]" title={mail.disposisi.tujuanDisposisi}>
                                Disp: {mail.disposisi.tujuanDisposisi}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Perihal */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug max-w-md line-clamp-2" title={mail.perihal}>
                            {mail.perihal}
                          </div>
                          {mail.keterangan && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                              {mail.keterangan}
                            </p>
                          )}
                        </td>

                        {/* Sifat */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${getSifatBadge(mail.sifat)}`}>
                            {mail.sifat}
                          </span>
                        </td>

                        {/* File */}
                        <td className="py-3.5 px-4">
                          {mail.file ? (
                            <div className="flex flex-col gap-1">
                              <div
                                onClick={() => onViewMail(mail)}
                                className="group flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                title={mail.file.fileName}
                              >
                                {mail.file.fileType.includes('pdf') ? (
                                  <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                ) : (
                                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                )}
                                <span className="truncate max-w-[110px] underline decoration-blue-300">
                                  {mail.file.fileName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {formatFileSize(mail.file.fileSize)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tanpa Berkas</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Lihat Detail */}
                            <button
                              onClick={() => onViewMail(mail)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
                              title="Lihat Detail & Berkas"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Tombol Download File */}
                            {mail.file && (
                              <button
                                onClick={() => onDownloadFile(mail)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
                                title="Download File Surat"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}

                            {/* Tombol Disposisi (Surat Masuk) */}
                            {isMasuk && (
                              <button
                                onClick={() => onPrintDisposisi(mail)}
                                className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
                                title="Cetak Lembar Disposisi"
                              >
                                <ClipboardList className="w-4 h-4" />
                              </button>
                            )}

                            {/* Tombol Edit */}
                            <button
                              onClick={() => onEditMail(mail)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
                              title="Edit Surat"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => onDeleteMail(mail)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-2xs"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (HP / Small Screens) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedMails.map((mail, idx) => {
                const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <div key={mail.id} className="p-4 space-y-3 hover:bg-white/95 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold flex items-center justify-center">
                          {rowNumber}
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-500/15 border border-blue-400/30 px-2 py-0.5 rounded-lg">
                          {mail.nomorAgenda}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSifatBadge(mail.sifat)}`}>
                        {mail.sifat}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{mail.perihal}</h3>
                      <div className="text-xs text-slate-600 mt-1 font-mono">{mail.nomorSurat}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {isMasuk ? `Pengirim: ${mail.pengirim}` : `Tujuan: ${mail.tujuan}`}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tanggal: {formatDate(mail.tanggalSurat)}
                      </div>
                    </div>

                    {mail.file && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-slate-200 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          {mail.file.fileType.includes('pdf') ? (
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <span className="truncate font-semibold text-slate-700">{mail.file.fileName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(mail.file.fileSize)})</span>
                        </div>
                        <button
                          onClick={() => onDownloadFile(mail)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Unduh File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => onViewMail(mail)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/15 text-blue-800 text-xs font-bold flex items-center gap-1 border border-blue-400/30"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>

                      {isMasuk && (
                        <button
                          onClick={() => onPrintDisposisi(mail)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-800 text-xs font-bold flex items-center gap-1 border border-purple-400/30"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Disposisi</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEditMail(mail)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 text-xs font-bold flex items-center gap-1 border border-amber-400/30"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onDeleteMail(mail)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-800 text-xs font-bold flex items-center gap-1 border border-rose-400/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer */}
            <div className="p-4 bg-slate-50/60 backdrop-blur-md border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="font-medium">
                Menampilkan <strong>{paginatedMails.length}</strong> dari <strong>{filteredMails.length}</strong> surat
                (Halaman {currentPage} dari {totalPages})
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/80 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1 font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  if (totalPages > 6 && Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) {
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        currentPage === pNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/80 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
