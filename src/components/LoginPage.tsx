import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Inbox,
  Send,
  Database
} from 'lucide-react';
import { SchoolProfile } from '../types';

export interface AuthUser {
  username: string;
  nama: string;
  role: 'Operator Tata Usaha' | 'Kepala Sekolah' | 'Administrator';
  avatarInitials: string;
}

interface LoginPageProps {
  schoolProfile: SchoolProfile;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  schoolProfile,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan isi Nama Pengguna dan Kata Sandi');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password.trim();

      // Flexible validation: allows standard admin, operator, kepsek, or any user with valid input
      if (u === 'admin' && p === 'admin123') {
        onLoginSuccess({
          username: 'admin',
          nama: schoolProfile.operatorNama || 'Ahmad Fauzi, S.Kom.',
          role: 'Administrator',
          avatarInitials: 'AD',
        });
      } else if (u === 'operator' && (p === 'operator123' || p === 'sekolah2026' || p === 'admin123')) {
        onLoginSuccess({
          username: 'operator',
          nama: schoolProfile.operatorNama || 'Ahmad Fauzi, S.Kom.',
          role: 'Operator Tata Usaha',
          avatarInitials: 'TU',
        });
      } else if (u === 'kepsek' && (p === 'kepsek123' || p === 'admin123')) {
        onLoginSuccess({
          username: 'kepsek',
          nama: schoolProfile.kepalaSekolah || 'Dr. H. Bambang Sudirman, M.Pd.',
          role: 'Kepala Sekolah',
          avatarInitials: 'KS',
        });
      } else if (p.length >= 4) {
        // Allow general user entry
        onLoginSuccess({
          username: username.trim(),
          nama: username.trim().toUpperCase(),
          role: 'Operator Tata Usaha',
          avatarInitials: username.substring(0, 2).toUpperCase(),
        });
      } else {
        setErrorMessage('Kata sandi minimal 4 karakter (Coba: admin / admin123)');
        setIsLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('agenda_remember_user', username.trim());
      } else {
        localStorage.removeItem('agenda_remember_user');
      }

      setIsLoading(false);
    }, 450);
  };

  const handleQuickDemo = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-slate-800">
      {/* Dynamic Ambient Glassmorphism Orbs / Light Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Glass Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/80 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.35)] rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all duration-300 hover:border-white/80">
          {/* Subtle Top Specular Reflection Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80" />

          {/* Logo & School Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-white/40 ring-4 ring-blue-100/50 mb-1">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-[11px] font-bold text-blue-700 tracking-wide uppercase">
                <Database className="w-3 h-3 text-emerald-500" />
                <span>Sistem Kearsipan Digital</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                AGENDA SURAT SEKOLAH
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {schoolProfile.namaSekolah}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2 backdrop-blur-md animate-shake">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Nama Pengguna / Akun
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Help */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-medium">Ingat Sesi Masuk</span>
              </label>
              <span className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer">
                Perlu Bantuan?
              </span>
            </div>

            {/* Submit Button with Glass Gloss */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30 border border-white/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Buku Agenda</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Akun Uji Coba Cepat:</span>
              <span className="text-blue-600 font-semibold lowercase">klik untuk isi otomatis</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'admin123')}
                className="p-2 rounded-xl bg-slate-50/80 hover:bg-blue-50/90 border border-slate-200/80 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                  <span>Operator TU</span>
                  <span className="text-[10px] text-slate-400">admin</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sandi: admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('kepsek', 'kepsek123')}
                className="p-2 rounded-xl bg-slate-50/80 hover:bg-indigo-50/90 border border-slate-200/80 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                  <span>Kepala Sekolah</span>
                  <span className="text-[10px] text-slate-400">kepsek</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sandi: kepsek123</div>
              </button>
            </div>
          </div>

          {/* Security & Persistence Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database Terenkripsi & Penyimpanan Dokumen Permanen</span>
          </div>
        </div>

        {/* Footer School Identity */}
        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          &copy; {new Date().getFullYear()} {schoolProfile.namaSekolah} &bull; NPSN: {schoolProfile.npsn}
        </p>
      </div>
    </div>
  );
};
