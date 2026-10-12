import React from 'react';
import { 
  Inbox, 
  Send, 
  Files, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  TrendingUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { MailItem, MailType, SchoolProfile } from '../types';

interface DashboardProps {
  mails: MailItem[];
  schoolProfile: SchoolProfile;
  onNavigateTab: (tab: 'masuk' | 'keluar' | 'rekap') => void;
  onOpenAddModal: (type: MailType) => void;
  onViewMail: (mail: MailItem) => void;
  onDownloadFile: (mail: MailItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  mails,
  schoolProfile,
  onNavigateTab,
  onOpenAddModal,
  onViewMail,
  onDownloadFile,
}) => {
  const masukMails = mails.filter((m) => m.type === 'masuk');
  const keluarMails = mails.filter((m) => m.type === 'keluar');
  const totalMails = mails.length;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  const masukBulanIni = masukMails.filter((m) => m.tanggalSurat?.startsWith(currentMonthStr)).length;
  const keluarBulanIni = keluarMails.filter((m) => m.tanggalSurat?.startsWith(currentMonthStr)).length;
  const suratPenting = mails.filter((m) => m.sifat === 'Penting' || m.sifat === 'Segera').length;
  const totalLampiran = mails.filter((m) => m.file !== undefined).length;

  // Recent 6 mail activities
  const recentMails = [...mails]
    .sort((a, b) => new Date(b.createdAt || b.tanggalSurat).getTime() - new Date(a.createdAt || a.tanggalSurat).getTime())
    .slice(0, 6);

  // Category counts
  const categories: Array<{ label: string; count: number; color: string; bg: string }> = [
    { label: 'Penting', count: mails.filter((m) => m.sifat === 'Penting').length, color: 'bg-rose-500', bg: 'text-rose-700' },
    { label: 'Segera', count: mails.filter((m) => m.sifat === 'Segera').length, color: 'bg-amber-500', bg: 'text-amber-700' },
    { label: 'Biasa', count: mails.filter((m) => m.sifat === 'Biasa').length, color: 'bg-blue-500', bg: 'text-blue-700' },
    { label: 'Edaran', count: mails.filter((m) => m.sifat === 'Edaran').length, color: 'bg-purple-500', bg: 'text-purple-700' },
    { label: 'Undangan', count: mails.filter((m) => m.sifat === 'Undangan').length, color: 'bg-emerald-500', bg: 'text-emerald-700' },
  ];

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

  const getMonthName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Glassmorphic Gradient */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-r from-blue-700/85 via-indigo-700/85 to-blue-800/85 p-6 md:p-8 text-white border border-white/30 shadow-[0_20px_50px_rgba(30,58,138,0.3)]">
        {/* Decorative Glass Lights */}
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 translate-y-8 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-blue-100 mb-3 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-white/40">&bull;</span>
              <span className="text-emerald-300 flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3" /> Glassmorphism UI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-xs">
              Selamat Datang di Agenda Surat Sekolah
            </h1>
            <p className="mt-2 text-xs md:text-sm text-blue-100/90 leading-relaxed font-normal">
              Kelola pencatatan surat masuk, surat keluar, disposisi kepala sekolah, dan penyimpanan berkas resmi {schoolProfile.namaSekolah} secara terpusat, aman, dan tersimpan permanen.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => onOpenAddModal('masuk')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/95 text-blue-800 font-bold text-xs shadow-lg hover:bg-white active:scale-95 transition-all border border-white/80 cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-blue-600" />
              <span>+ Surat Masuk</span>
            </button>
            <button
              onClick={() => onOpenAddModal('keluar')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950/70 hover:bg-blue-950/90 text-white font-bold text-xs border border-white/30 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-300" />
              <span>+ Surat Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Main KPI Stat Cards (Frosted Glass) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card Surat Masuk */}
        <div 
          onClick={() => onNavigateTab('masuk')}
          className="group rounded-3xl p-6 backdrop-blur-xl bg-white/75 hover:bg-white/90 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Surat Masuk</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                {masukMails.length}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="font-bold text-blue-800 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-400/30">
                  +{masukBulanIni} bulan ini
                </span>
                <span>dari instansi luar</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-blue-600/30 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-blue-700 group-hover:scale-105 transition-all shadow-xs">
              <Inbox className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Buka Agenda Surat Masuk</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card Surat Keluar */}
        <div 
          onClick={() => onNavigateTab('keluar')}
          className="group rounded-3xl p-6 backdrop-blur-xl bg-white/75 hover:bg-white/90 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Surat Keluar</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 group-hover:text-emerald-600 transition-colors">
                {keluarMails.length}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="font-bold text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-400/30">
                  +{keluarBulanIni} bulan ini
                </span>
                <span>diterbitkan sekolah</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-600/30 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-all shadow-xs">
              <Send className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Buka Agenda Surat Keluar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card Total Surat */}
        <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/75 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Arsip Surat</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5">
                {totalMails}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="font-bold text-indigo-800 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-400/30">
                  {totalLampiran} berkas terlampir
                </span>
                <span>di IndexedDB</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-indigo-600/30 border border-indigo-400/40 backdrop-blur-md flex items-center justify-center text-indigo-700 shadow-xs">
              <Files className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{suratPenting} berstatus Penting/Segera</span>
            </span>
            <span className="font-bold text-slate-500">Tahun {currentYear}</span>
          </div>
        </div>
      </div>

      {/* Grid: 6 Aktivitas Surat Terkini & Klasifikasi Distribusi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Tabel 6 Surat Terkini (Frosted Glass Panel) */}
        <div className="lg:col-span-2 rounded-3xl backdrop-blur-2xl bg-white/80 border border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2 bg-white/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Aktivitas Surat Terakhir Dicatat</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daftar mutasi surat masuk dan keluar terkini di buku agenda
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Rekap Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentMails.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Belum ada agenda surat yang dicatat.</p>
              </div>
            ) : (
              recentMails.map((mail) => (
                <div
                  key={mail.id}
                  className="p-4 hover:bg-white/90 transition-colors flex items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 sm:mt-0 ${
                        mail.type === 'masuk'
                          ? 'bg-blue-500/15 text-blue-800 border border-blue-400/30'
                          : 'bg-emerald-500/15 text-emerald-800 border border-emerald-400/30'
                      }`}
                      title={mail.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                    >
                      {mail.type === 'masuk' ? <Inbox className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                          {mail.nomorAgenda}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getSifatBadge(mail.sifat)}`}>
                          {mail.sifat}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {getMonthName(mail.tanggalSurat)}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 truncate mt-1 max-w-md" title={mail.perihal}>
                        {mail.perihal}
                      </h4>

                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                        {mail.type === 'masuk' ? `Dari: ${mail.pengirim}` : `Tujuan: ${mail.tujuan}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {mail.file && (
                      <button
                        onClick={() => onDownloadFile(mail)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title={`Unduh: ${mail.file.fileName}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewMail(mail)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Detail</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Klasifikasi Sifat & Jaminan Database */}
        <div className="space-y-6">
          {/* Card Klasifikasi Sifat */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/80 border border-white/70 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Klasifikasi Sifat Surat</span>
            </h3>

            <div className="space-y-3.5">
              {categories.map((cat) => {
                const percent = totalMails > 0 ? Math.round((cat.count / totalMails) * 100) : 0;
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.label}</span>
                      <span>
                        {cat.count} surat <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden backdrop-blur-xs">
                      <div
                        className={`${cat.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card Panduan & Keamanan Berkas */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/90 via-blue-950/90 to-indigo-950/90 text-white p-5 shadow-xl border border-white/15">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Jaminan Penyimpanan Permanen</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">
              Database & File Tersimpan di Browser
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh berkas dokumen PDF, JPG, dan PNG yang Anda unggah otomatis tersimpan ke dalam database IndexedDB. Berkas tidak akan hilang meskipun peramban ditutup.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Cadangkan data berkala:</span>
              <button
                onClick={() => onNavigateTab('rekap')}
                className="font-bold text-blue-300 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Ekspor Excel / JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
