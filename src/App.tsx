import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MailList } from './components/MailList';
import { RekapView } from './components/RekapView';
import { MailModal } from './components/MailModal';
import { MailDetailModal } from './components/MailDetailModal';
import { DisposisiModal } from './components/DisposisiModal';
import { DeleteModal } from './components/DeleteModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LoginPage, AuthUser } from './components/LoginPage';
import { 
  initDatabase, 
  getAllMails, 
  saveMail, 
  deleteMail as dbDeleteMail, 
  getSchoolProfile, 
  saveSchoolProfile, 
  resetDatabase 
} from './lib/db';
import { downloadFile, exportToCSV, printAgendaBook } from './lib/export';
import { DEFAULT_SCHOOL_PROFILE } from './lib/sampleData';
import { MailItem, MailType, SchoolProfile } from './types';
import { Database, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('agenda_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'masuk' | 'keluar' | 'rekap'>('dashboard');
  const [mails, setMails] = useState<MailItem[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailModalType, setMailModalType] = useState<MailType>('masuk');
  const [editingMail, setEditingMail] = useState<MailItem | null>(null);

  const [detailMail, setDetailMail] = useState<MailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [disposisiMail, setDisposisiMail] = useState<MailItem | null>(null);
  const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);

  const [deleteTargetMail, setDeleteTargetMail] = useState<MailItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast Helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [loadedMails, loadedProfile] = await Promise.all([
        getAllMails(),
        getSchoolProfile(),
      ]);
      setMails(loadedMails);
      setSchoolProfile(loadedProfile);
    } catch (err) {
      console.error('Failed to load database:', err);
      showToast('error', 'Gagal memuat database', 'Terjadi kendala saat membaca penyimpanan lokal.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial Boot
  useEffect(() => {
    async function boot() {
      try {
        await initDatabase();
        await refreshData();
      } catch (err) {
        console.error('Init database error:', err);
        setIsLoading(false);
      }
    }
    boot();
  }, [refreshData]);

  // Login handler
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('agenda_auth_session', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast('success', `Selamat Datang, ${user.nama}!`, `Berhasil masuk sebagai ${user.role}.`);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('agenda_auth_session');
    } catch (e) {
      console.error(e);
    }
    showToast('info', 'Sesi Berakhir', 'Anda telah keluar dari aplikasi.');
  };

  // Counts
  const countMasuk = mails.filter((m) => m.type === 'masuk').length;
  const countKeluar = mails.filter((m) => m.type === 'keluar').length;

  // Handlers for Mail Operations
  const handleOpenAddModal = (type: MailType) => {
    setMailModalType(type);
    setEditingMail(null);
    setIsMailModalOpen(true);
  };

  const handleEditMail = (mail: MailItem) => {
    setMailModalType(mail.type);
    setEditingMail(mail);
    setIsMailModalOpen(true);
  };

  const handleSaveMail = async (mailData: MailItem) => {
    try {
      await saveMail(mailData);
      await refreshData();
      showToast(
        'success',
        editingMail ? 'Perubahan Berhasil Disimpan' : 'Surat Berhasil Dicatat',
        `Nomor Agenda: ${mailData.nomorAgenda} telah tersimpan permanen di database.`
      );
    } catch (err) {
      console.error('Save mail error:', err);
      showToast('error', 'Gagal Menyimpan', 'Terjadi masalah saat menulis data ke database.');
      throw err;
    }
  };

  const handleDeletePrompt = (mail: MailItem) => {
    setDeleteTargetMail(mail);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (mail: MailItem) => {
    try {
      await dbDeleteMail(mail.id);
      setIsDeleteModalOpen(false);
      setDeleteTargetMail(null);
      await refreshData();
      showToast('success', 'Surat Berhasil Dihapus', `Data agenda ${mail.nomorAgenda} telah dihapus.`);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('error', 'Gagal Menghapus', 'Tidak dapat menghapus berkas dari database.');
    }
  };

  const handleViewMail = (mail: MailItem) => {
    setDetailMail(mail);
    setIsDetailModalOpen(true);
  };

  const handlePrintDisposisi = (mail: MailItem) => {
    setDisposisiMail(mail);
    setIsDisposisiModalOpen(true);
  };

  const handleDownloadFile = (mail: MailItem) => {
    if (!mail.file || !mail.file.dataUrl) {
      showToast('info', 'Tidak Ada Berkas', 'Surat ini tidak memiliki lampiran berkas.');
      return;
    }
    downloadFile(mail.file.dataUrl, mail.file.fileName);
    showToast('success', 'File Sedang Diunduh', mail.file.fileName);
  };

  // Export & Print from Table
  const handleExportTableCSV = (filteredMails: MailItem[]) => {
    const typeLabel = activeTab === 'masuk' ? 'masuk' : activeTab === 'keluar' ? 'keluar' : 'all';
    exportToCSV(filteredMails, typeLabel, schoolProfile.namaSekolah);
    showToast('success', 'Ekspor Berhasil', 'File Excel/CSV berhasil dibuat dan diunduh.');
  };

  const handlePrintAgendaBook = (filteredMails: MailItem[]) => {
    const currentType = activeTab === 'keluar' ? 'keluar' : 'masuk';
    printAgendaBook(filteredMails, currentType, schoolProfile);
  };

  // School Profile Save
  const handleSaveProfile = async (newProfile: SchoolProfile) => {
    try {
      await saveSchoolProfile(newProfile);
      setSchoolProfile(newProfile);
      showToast('success', 'Profil Sekolah Disimpan', 'Identitas kop surat dan pimpinan telah diperbarui.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal Menyimpan Profil');
      throw err;
    }
  };

  // Reset to initial sample data
  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      await refreshData();
      showToast('success', 'Database Direset', 'Data contoh agenda surat sekolah berhasil dimuat ulang.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal Mereset Data');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="backdrop-blur-2xl bg-white/80 p-8 rounded-3xl border border-white/60 shadow-2xl text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center animate-spin shadow-lg shadow-blue-500/30">
            <Loader2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-slate-800">Menyiapkan Agenda Surat Sekolah...</h2>
          <p className="text-xs text-slate-500 font-medium">Memuat basis data kearsipan lokal</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the dedicated Glassmorphic Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage
          schoolProfile={schoolProfile}
          onLoginSuccess={handleLoginSuccess}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-slate-900">
      {/* Dynamic Ambient Background with Glowing Glass Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep Slate / Indigo gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] bg-indigo-600/18 rounded-full blur-[130px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '5s' }} />

        {/* Delicate Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Main Content Wrapper (Overlays the glass background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Glass Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          countMasuk={countMasuk}
          countKeluar={countKeluar}
          schoolProfile={schoolProfile}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAddModal={handleOpenAddModal}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              mails={mails}
              schoolProfile={schoolProfile}
              onNavigateTab={setActiveTab}
              onOpenAddModal={handleOpenAddModal}
              onViewMail={handleViewMail}
              onDownloadFile={handleDownloadFile}
            />
          )}

          {activeTab === 'masuk' && (
            <MailList
              type="masuk"
              mails={mails.filter((m) => m.type === 'masuk')}
              schoolProfile={schoolProfile}
              onOpenAddModal={() => handleOpenAddModal('masuk')}
              onEditMail={handleEditMail}
              onDeleteMail={handleDeletePrompt}
              onViewMail={handleViewMail}
              onPrintDisposisi={handlePrintDisposisi}
              onDownloadFile={handleDownloadFile}
              onExportCSV={handleExportTableCSV}
              onPrintAgendaBook={handlePrintAgendaBook}
            />
          )}

          {activeTab === 'keluar' && (
            <MailList
              type="keluar"
              mails={mails.filter((m) => m.type === 'keluar')}
              schoolProfile={schoolProfile}
              onOpenAddModal={() => handleOpenAddModal('keluar')}
              onEditMail={handleEditMail}
              onDeleteMail={handleDeletePrompt}
              onViewMail={handleViewMail}
              onPrintDisposisi={handlePrintDisposisi}
              onDownloadFile={handleDownloadFile}
              onExportCSV={handleExportTableCSV}
              onPrintAgendaBook={handlePrintAgendaBook}
            />
          )}

          {activeTab === 'rekap' && (
            <RekapView
              mails={mails}
              schoolProfile={schoolProfile}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}
        </main>

        {/* Frosted Glass Footer */}
        <footer className="mt-auto border-t border-white/20 backdrop-blur-xl bg-white/70 py-4 px-4 sm:px-6 text-xs text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Agenda Surat Sekolah</span>
              <span>&bull;</span>
              <span>{schoolProfile.namaSekolah}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Tema Glassmorphism Aktif</span>
              </span>
              <span>&bull;</span>
              <span>Penyimpanan Terenkripsi IndexedDB</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals with Glassmorphic styling */}
      <MailModal
        isOpen={isMailModalOpen}
        type={mailModalType}
        initialMail={editingMail}
        onClose={() => {
          setIsMailModalOpen(false);
          setEditingMail(null);
        }}
        onSave={handleSaveMail}
      />

      <MailDetailModal
        isOpen={isDetailModalOpen}
        mail={detailMail}
        schoolProfile={schoolProfile}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailMail(null);
        }}
        onEdit={(mail) => {
          setIsDetailModalOpen(false);
          handleEditMail(mail);
        }}
        onPrintDisposisi={(mail) => {
          setIsDetailModalOpen(false);
          handlePrintDisposisi(mail);
        }}
        onDownloadFile={handleDownloadFile}
      />

      <DisposisiModal
        isOpen={isDisposisiModalOpen}
        mail={disposisiMail}
        schoolProfile={schoolProfile}
        onClose={() => {
          setIsDisposisiModalOpen(false);
          setDisposisiMail(null);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        mail={deleteTargetMail}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetMail(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        mails={mails}
        schoolProfile={schoolProfile}
        onClose={() => setIsExportModalOpen(false)}
        onDataRestored={refreshData}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        profile={schoolProfile}
        totalMails={mails.length}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveProfile={handleSaveProfile}
        onResetDatabase={handleResetDatabase}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
