export type MailType = 'masuk' | 'keluar';

export type MailCategory = 'Biasa' | 'Penting' | 'Rahasia' | 'Segera' | 'Undangan' | 'Edaran' | 'Pemberitahuan';

export interface MailAttachment {
  fileName: string;
  fileSize: number;
  fileType: string; // e.g. 'application/pdf', 'image/jpeg', 'image/png'
  dataUrl: string;  // Base64 Data URL for persistent storage in IndexedDB
  uploadedAt: string;
}

export interface DisposisiData {
  tujuanDisposisi: string; // e.g. "Waka Kurikulum", "Waka Kesiswaan", "Tata Usaha"
  isiDisposisi: string;    // e.g. "Tindak lanjuti dan buat laporan", "Hadiri kegiatan"
  sifatDisposisi: 'Biasa' | 'Segera' | 'Sangat Segera';
  batasWaktu?: string;     // YYYY-MM-DD
  catatan?: string;
  status: 'Belum Disposisi' | 'Diteruskan' | 'Diproses' | 'Selesai';
}

export interface MailItem {
  id: string;
  type: MailType;
  nomorAgenda: string;     // e.g. "042/SM/2026" or "028/SK/2026"
  nomorSurat: string;      // e.g. "421.3/284/Disdik/2026"
  tanggalSurat: string;    // YYYY-MM-DD
  tanggalDiterima?: string; // YYYY-MM-DD (khusus surat masuk)
  tanggalKirim?: string;    // YYYY-MM-DD (khusus surat keluar)
  pengirim?: string;       // (khusus surat masuk) e.g. "Dinas Pendidikan Kab. Sleman"
  tujuan?: string;         // (khusus surat keluar) e.g. "Kepala Balai Besar Penjaminan Mutu"
  perihal: string;         // e.g. "Undangan Sosialisasi Kurikulum Nasional"
  sifat: MailCategory;
  keterangan: string;      // Ringkasan isi surat / catatan
  lampiranAda: boolean;
  file?: MailAttachment;
  disposisi?: DisposisiData;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  website?: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  operatorNama: string;
}

export interface FilterState {
  search: string;
  sifat: string;
  tahun: string;
  bulan: string;
  startDate: string;
  endDate: string;
}
