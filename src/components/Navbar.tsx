import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  Menu, 
  X, 
  GraduationCap, 
  HardDriveDownload,
  Database,
  LogOut,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { MailType, SchoolProfile } from '../types';
import { AuthUser } from './LoginPage';

interface NavbarProps {
  activeTab: 'dashboard' | 'masuk' | 'keluar' | 'rekap';
  setActiveTab: (tab: 'dashboard' | 'masuk' | 'keluar' | 'rekap') => void;
  countMasuk: number;
  countKeluar: number;
  schoolProfile: SchoolProfile;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenAddModal: (type: MailType) => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  countMasuk,
  countKeluar,
  schoolProfile,
  currentUser,
  onLogout,
  onOpenAddModal,
  onOpenExportModal,
  onOpenSettingsModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'masuk',
      label: 'Surat Masuk',
      icon: Inbox,
      badge: countMasuk,
      badgeColor: 'bg-blue-500/15 text-blue-800 border-blue-400/30',
    },
    {
      id: 'keluar',
      label: 'Surat Keluar',
      icon: Send,
      badge: countKeluar,
      badgeColor: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/30',
    },
    {
      id: 'rekap',
      label: 'Rekap & Cetak',
      icon: FileSpreadsheet,
      badge: null,
    },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/75 border-b border-white/60 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      {/* Top Banner with Frosted Glass Gradient */}
      <div className="bg-gradient-to-r from-blue-950/90 via-indigo-900/90 to-blue-900/90 backdrop-blur-md text-white text-xs py-1.5 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <GraduationCap className="w-4 h-4 text-amber-300 drop-shadow-xs" />
            <span className="font-bold text-white tracking-tight">{schoolProfile.namaSekolah}</span>
            <span className="hidden md:inline text-blue-200">| NPSN: {schoolProfile.npsn}</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-[11px] shadow-2xs">
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">Database Aktif</span>
              <span className="hidden sm:inline text-blue-200 font-normal">(Tersimpan Permanen)</span>
            </span>

            {currentUser && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30 text-blue-200">
                <UserCheck className="w-3 h-3 text-blue-300" />
                <span>{currentUser.role}: {currentUser.nama}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/40 ring-2 ring-white/60">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  AGENDA SURAT
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-800 border border-blue-400/30">
                  SEKOLAH
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistem Tata Usaha & Kearsipan Digital
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Glass Pills) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/5 backdrop-blur-md border border-white/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/95 text-blue-700 shadow-md shadow-blue-950/10 border border-white/80'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold border ${
                        isActive ? 'bg-blue-600 text-white border-blue-700' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Quick Add Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 border border-white/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Surat</span>
              </button>

              {addDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAddDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 backdrop-blur-2xl bg-white/95 border border-white/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        onOpenAddModal('masuk');
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 text-xs text-slate-700 hover:bg-blue-50/90 hover:text-blue-700 rounded-xl transition-colors font-semibold text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Inbox className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Surat Masuk Baru</div>
                        <div className="text-[10px] text-slate-400 font-normal">Dari instansi / pihak luar</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        onOpenAddModal('keluar');
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 text-xs text-slate-700 hover:bg-emerald-50/90 hover:text-emerald-700 rounded-xl transition-colors font-semibold text-left cursor-pointer mt-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Surat Keluar Baru</div>
                        <div className="text-[10px] text-slate-400 font-normal">Diterbitkan oleh sekolah</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Export / Backup Button */}
            <button
              onClick={onOpenExportModal}
              title="Ekspor Excel / CSV & Cadangan Data"
              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-white/80 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md shadow-2xs transition-all cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4" />
            </button>

            {/* School Profile Settings */}
            <button
              onClick={onOpenSettingsModal}
              title="Pengaturan Identitas Sekolah"
              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-white/80 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md shadow-2xs transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Pill & Logout Dropdown */}
            {currentUser && (
              <div className="relative pl-1 border-l border-slate-300/60 ml-1">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/70 shadow-2xs text-xs font-semibold text-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {currentUser.avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="font-bold text-slate-900 truncate max-w-[100px]">{currentUser.nama.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{currentUser.role.split(' ')[0]}</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 backdrop-blur-2xl bg-white/95 border border-white/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-2 border-b border-slate-100 text-xs">
                        <p className="font-bold text-slate-900">{currentUser.nama}</p>
                        <p className="text-[11px] text-blue-600 font-medium">{currentUser.role}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSettingsModal();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left mt-1"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Profil & Pengaturan</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left mt-1 border-t border-slate-100 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Keluar / Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onOpenAddModal('masuk')}
              className="p-2 bg-blue-600 text-white rounded-xl shadow-xs"
              title="Tambah Surat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-md rounded-xl border border-white/60"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/60 backdrop-blur-2xl bg-white/90 px-4 py-3 space-y-2 shadow-xl">
          {currentUser && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60 mb-2">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  {currentUser.avatarInitials}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{currentUser.nama}</div>
                  <div className="text-[10px] text-blue-600">{currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAddModal('masuk');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Inbox className="w-4 h-4" />
              <span>+ Surat Masuk</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAddModal('keluar');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>+ Surat Keluar</span>
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-around gap-2 text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenExportModal();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold bg-white/60"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor & Backup</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettingsModal();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold bg-white/60"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
