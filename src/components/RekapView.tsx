import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Inbox, 
  Send, 
  Download, 
  Filter
} from 'lucide-react';
import { MailItem, MailType, SchoolProfile } from '../types';
import { exportToCSV, printAgendaBook } from '../lib/export';

interface RekapViewProps {
  mails: MailItem[];
  schoolProfile: SchoolProfile;
  onOpenExportModal: () => void;
}

export const RekapView: React.FC<RekapViewProps> = ({
  mails,
  schoolProfile,
  onOpenExportModal,
}) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<MailType | 'all'>('all');

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

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYear);
    mails.forEach((m) => {
      if (m.tanggalSurat) set.add(m.tanggalSurat.substring(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [mails, currentYear]);

  const filteredMails = useMemo(() => {
    return mails.filter((m) => {
      if (selectedType !== 'all' && m.type !== selectedType) return false;
      if (selectedYear !== 'all') {
        const yr = m.tanggalSurat?.substring(0, 4);
        if (yr !== selectedYear) return false;
      }
      if (selectedMonth !== 'all') {
        const mo = m.tanggalSurat?.substring(5, 7);
        if (mo !== selectedMonth) return false;
      }
      return true;
    });
  }, [mails, selectedType, selectedYear, selectedMonth]);

  const countMasuk = filteredMails.filter((m) => m.type === 'masuk').length;
  const countKeluar = filteredMails.filter((m) => m.type === 'keluar').length;

  const handlePrintMasuk = () => {
    const list = filteredMails.filter((m) => m.type === 'masuk');
    const period = `Periode: ${selectedMonth !== 'all' ? months.find((x) => x.value === selectedMonth)?.label : 'Seluruh Bulan'} ${selectedYear}`;
    printAgendaBook(list, 'masuk', schoolProfile, period);
  };

  const handlePrintKeluar = () => {
    const list = filteredMails.filter((m) => m.type === 'keluar');
    const period = `Periode: ${selectedMonth !== 'all' ? months.find((x) => x.value === selectedMonth)?.label : 'Seluruh Bulan'} ${selectedYear}`;
    printAgendaBook(list, 'keluar', schoolProfile, period);
  };

  const handleExportExcel = () => {
    exportToCSV(filteredMails, selectedType, schoolProfile.namaSekolah);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Glass) */}
      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md border border-white/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Rekap Laporan & Cetak Buku Agenda
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Cetak Buku Agenda Surat Masuk / Keluar resmi sekolah atau ekspor laporan periode ke Excel
            </p>
          </div>
        </div>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-white/30 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Cadangan & Ekspor Lengkap</span>
        </button>
      </div>

      {/* Filter Selector Bar (Glass) */}
      <div className="rounded-3xl p-5 backdrop-blur-xl bg-white/75 border border-white/70 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">Filter Periode Laporan:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Sepanjang Tahun (12 Bulan)</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Jenis:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Semua (Masuk & Keluar)</option>
              <option value="masuk">Surat Masuk Saja</option>
              <option value="keluar">Surat Keluar Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2 Print Action Cards (Glassmorphic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Cetak Buku Agenda Surat Masuk */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-700 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-black px-3 py-1 bg-blue-500/15 text-blue-800 rounded-xl border border-blue-400/30 shadow-2xs">
                {countMasuk} Surat Masuk
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cetak Buku Agenda Surat Masuk
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Menghasilkan lembar buku agenda surat masuk formal lengkap dengan Kop Surat Sekolah, Nomor Agenda, Tanggal, Pengirim, Perihal, Sifat, dan tanda tangan Kepala Sekolah.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2">
            <button
              onClick={handlePrintMasuk}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-white/30"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Buku Agenda Masuk</span>
            </button>
          </div>
        </div>

        {/* Card Cetak Buku Agenda Surat Keluar */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-black px-3 py-1 bg-emerald-500/15 text-emerald-800 rounded-xl border border-emerald-400/30 shadow-2xs">
                {countKeluar} Surat Keluar
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cetak Buku Agenda Surat Keluar
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Menghasilkan format cetak resmi buku agenda surat keluar berorientasi landscape untuk arsip kantor Tata Usaha dan pelaporan dinas.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2">
            <button
              onClick={handlePrintKeluar}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-white/30"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Buku Agenda Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Table Preview (Glass) */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2 bg-white/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pratinjau Data Laporan ({filteredMails.length} Surat)
            </h3>
            <p className="text-xs text-slate-500">
              Periode: {selectedMonth !== 'all' ? months.find((x) => x.value === selectedMonth)?.label : 'Seluruh Bulan'} {selectedYear}
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel ({filteredMails.length} baris)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 font-bold text-slate-600 uppercase">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">No. Agenda</th>
                <th className="py-3 px-4 w-32">Jenis</th>
                <th className="py-3 px-4">Nomor & Tanggal</th>
                <th className="py-3 px-4">Pengirim / Tujuan</th>
                <th className="py-3 px-4">Perihal</th>
                <th className="py-3 px-4 w-20 text-center">Sifat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ada surat pada periode filter ini.
                  </td>
                </tr>
              ) : (
                filteredMails.map((m, i) => (
                  <tr key={m.id} className="hover:bg-white/90">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400 font-bold">{i + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{m.nomorAgenda}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                          m.type === 'masuk'
                            ? 'bg-blue-500/15 text-blue-800 border border-blue-400/30'
                            : 'bg-emerald-500/15 text-emerald-800 border border-emerald-400/30'
                        }`}
                      >
                        {m.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{m.nomorSurat}</div>
                      <div className="text-[11px] text-slate-400">{m.tanggalSurat}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium">{m.type === 'masuk' ? m.pengirim : m.tujuan}</td>
                    <td className="py-2.5 px-4 max-w-xs truncate font-medium">{m.perihal}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200">
                        {m.sifat}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
