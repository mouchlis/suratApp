import { MailItem, SchoolProfile } from '../types';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'SMA NEGERI 1 KUSUMA BANGSA',
  npsn: '20108921',
  alamat: 'Jl. Merdeka Belajar No. 45, Kecamatan Sukamaju, Kota Harapan',
  telepon: '(021) 7890-1234',
  email: 'tatausaha@sman1kusumabangsa.sch.id',
  website: 'www.sman1kusumabangsa.sch.id',
  kepalaSekolah: 'Dr. H. Bambang Sudirman, M.Pd.',
  nipKepalaSekolah: '19750812 200003 1 004',
  operatorNama: 'Ahmad Fauzi, S.Kom. (Tata Usaha)',
};

// Generates an SVG Data URI rendered as an image for sample preview
function createSampleDocImage(title: string, sub: string, nomor: string, date: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <rect width="100%" height="100%" fill="#ffffff" />
    <rect x="40" y="40" width="720" height="1020" rx="4" fill="#fafafa" stroke="#e2e8f0" stroke-width="2" />
    
    <!-- Kop Surat Header -->
    <circle cx="100" cy="110" r="35" fill="#1e40af" opacity="0.15" />
    <text x="100" y="117" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e40af" text-anchor="middle">LOGO</text>
    <text x="430" y="95" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e3a8a" text-anchor="middle">PEMERINTAH PROVINSI / DINAS PENDIDIKAN</text>
    <text x="430" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">${title.toUpperCase()}</text>
    <text x="430" y="142" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Jl. Jenderal Sudirman Kav. 12, Telp (021) 555-0199, Fax: (021) 555-0198</text>
    <line x1="70" y1="165" x2="730" y2="165" stroke="#1e3a8a" stroke-width="3" />
    <line x1="70" y1="170" x2="730" y2="170" stroke="#1e3a8a" stroke-width="1" />
    
    <!-- Metadata Surat -->
    <text x="75" y="210" font-family="Arial, sans-serif" font-size="13" fill="#334155">Nomor       : ${nomor}</text>
    <text x="75" y="235" font-family="Arial, sans-serif" font-size="13" fill="#334155">Sifat          : Penting / Segera</text>
    <text x="75" y="260" font-family="Arial, sans-serif" font-size="13" fill="#334155">Lampiran  : 1 (satu) Berkas</text>
    <text x="75" y="285" font-family="Arial, sans-serif" font-size="13" fill="#334155">Perihal      : ${sub}</text>

    <text x="560" y="210" font-family="Arial, sans-serif" font-size="13" fill="#334155">Tanggal: ${date}</text>

    <!-- Isi Ringkas -->
    <rect x="75" y="320" width="650" height="2" fill="#e2e8f0" />
    <text x="75" y="360" font-family="Arial, sans-serif" font-size="14" fill="#1e293b" font-weight="bold">Kepada Yth.</text>
    <text x="75" y="385" font-family="Arial, sans-serif" font-size="13" fill="#334155">Kepala SMA Negeri 1 Kusuma Bangsa</text>
    <text x="75" y="405" font-family="Arial, sans-serif" font-size="13" fill="#334155">Di Tempat</text>

    <text x="75" y="460" font-family="Arial, sans-serif" font-size="13" fill="#334155">Dengan hormat,</text>
    <text x="75" y="490" font-family="Arial, sans-serif" font-size="13" fill="#334155">Sehubungan dengan agenda program kerja peningkatan mutu pendidikan tahun ajaran</text>
    <text x="75" y="515" font-family="Arial, sans-serif" font-size="13" fill="#334155">berjalan, bersama ini kami sampaikan arahan dan tindak lanjut perihal:</text>
    <rect x="75" y="535" width="650" height="40" rx="4" fill="#eff6ff" stroke="#bfdbfe" />
    <text x="95" y="560" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1d4ed8">"${sub}"</text>

    <text x="75" y="615" font-family="Arial, sans-serif" font-size="13" fill="#334155">Diharapkan satuan pendidikan dapat mempersiapkan dokumen pendukung sesuai</text>
    <text x="75" y="640" font-family="Arial, sans-serif" font-size="13" fill="#334155">dengan pedoman teknis yang terlampir pada petunjuk operasional baku.</text>

    <text x="75" y="690" font-family="Arial, sans-serif" font-size="13" fill="#334155">Demikian surat ini kami sampaikan untuk menjadi perhatian dan dilaksanakan.</text>

    <!-- Tanda Tangan -->
    <text x="500" y="780" font-family="Arial, sans-serif" font-size="13" fill="#334155">Ditetapkan di : Harapan</text>
    <text x="500" y="805" font-family="Arial, sans-serif" font-size="13" fill="#334155">Pada tanggal : ${date}</text>
    <text x="500" y="830" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Kepala Dinas Pendidikan,</text>
    
    <!-- Stampel Simbolis -->
    <circle cx="560" cy="890" r="36" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,2" opacity="0.6" />
    <text x="560" y="895" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#2563eb" text-anchor="middle">DINAS PENDIDIKAN</text>

    <text x="500" y="960" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-decoration="underline">Drs. H. Mulyono, M.M.</text>
    <text x="500" y="980" font-family="Arial, sans-serif" font-size="12" fill="#64748b">NIP. 19690415 199403 1 002</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const INITIAL_MAIL_ITEMS: MailItem[] = [
  {
    id: 'sm-2026-001',
    type: 'masuk',
    nomorAgenda: '001/SM/2026',
    nomorSurat: '421.1/108/Disdik/I/2026',
    tanggalSurat: '2026-10-02',
    tanggalDiterima: '2026-10-03',
    pengirim: 'Dinas Pendidikan Provinsi Cabang Wilayah III',
    perihal: 'Undangan Sosialisasi Asesmen Bakat & Minat Siswa Kelas XII',
    sifat: 'Penting',
    keterangan: 'Wajib dihadiri Kepala Sekolah dan Koordinator Guru BK pada hari Senin.',
    lampiranAda: true,
    file: {
      fileName: 'Surat_Undangan_ABM_Disdik.png',
      fileSize: 184500,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'DINAS PENDIDIKAN PROVINSI',
        'Undangan Sosialisasi Asesmen Bakat Minat Siswa Kelas XII',
        '421.1/108/Disdik/I/2026',
        '02 Oktober 2026'
      ),
      uploadedAt: '2026-10-03T09:15:00.000Z',
    },
    disposisi: {
      tujuanDisposisi: 'Waka Kurikulum & Koordinator BK',
      isiDisposisi: 'Mohon dihadiri dan dibuatkan resume tindak lanjut.',
      sifatDisposisi: 'Segera',
      batasWaktu: '2026-10-10',
      status: 'Diteruskan',
    },
    createdAt: '2026-10-03T09:15:00.000Z',
    updatedAt: '2026-10-03T09:15:00.000Z',
  },
  {
    id: 'sm-2026-002',
    type: 'masuk',
    nomorAgenda: '002/SM/2026',
    nomorSurat: 'SE/045/Disdikpora/2026',
    tanggalSurat: '2026-09-28',
    tanggalDiterima: '2026-09-29',
    pengirim: 'Kementerian Pendidikan Dasar & Menengah RI',
    perihal: 'Surat Edaran Panduan Bantuan Operasional Satuan Pendidikan (BOSP) 2026/2027',
    sifat: 'Edaran',
    keterangan: 'Pedoman penyusunan RKAS pergeseran triwulan akhir.',
    lampiranAda: true,
    file: {
      fileName: 'SE_Juknis_BOSP_Kemendikdasmen.png',
      fileSize: 245000,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH',
        'Surat Edaran Panduan Pengelolaan BOSP 2026',
        'SE/045/Disdikpora/2026',
        '28 September 2026'
      ),
      uploadedAt: '2026-09-29T10:30:00.000Z',
    },
    disposisi: {
      tujuanDisposisi: 'Bendahara Sekolah & Tim Pengembang Sekolah',
      isiDisposisi: 'Pelajari juknis baru dan sesuaikan laporan ARKAS.',
      sifatDisposisi: 'Biasa',
      batasWaktu: '2026-10-15',
      status: 'Selesai',
    },
    createdAt: '2026-09-29T10:30:00.000Z',
    updatedAt: '2026-09-29T10:30:00.000Z',
  },
  {
    id: 'sm-2026-003',
    type: 'masuk',
    nomorAgenda: '003/SM/2026',
    nomorSurat: '014/KOMITE-SMAN1/IX/2026',
    tanggalSurat: '2026-09-25',
    tanggalDiterima: '2026-09-26',
    pengirim: 'Pengurus Komite SMAN 1 Kusuma Bangsa',
    perihal: 'Permohonan Rapat Koordinasi Program Pembangunan Musholla & Sanitasi Siswa',
    sifat: 'Biasa',
    keterangan: 'Rencana musyawarah bersama wali murid perwakilan kelas X dan XI.',
    lampiranAda: false,
    disposisi: {
      tujuanDisposisi: 'Waka Sarana Prasarana',
      isiDisposisi: 'Siapkan ruang aula dan materi paparan desain musholla.',
      sifatDisposisi: 'Biasa',
      batasWaktu: '2026-10-05',
      status: 'Selesai',
    },
    createdAt: '2026-09-26T08:00:00.000Z',
    updatedAt: '2026-09-26T08:00:00.000Z',
  },
  {
    id: 'sm-2026-004',
    type: 'masuk',
    nomorAgenda: '004/SM/2026',
    nomorSurat: '800/512/BKD-PROV/2026',
    tanggalSurat: '2026-10-05',
    tanggalDiterima: '2026-10-06',
    pengirim: 'Badan Kepegawaian Daerah (BKD) Provinsi',
    perihal: 'Verifikasi Berkas Kenaikan Pangkat ASN Guru Periode Desember 2026',
    sifat: 'Segera',
    keterangan: 'Ada 4 orang guru yang berkas usulannya perlu konfirmasi revisi SKP.',
    lampiranAda: true,
    file: {
      fileName: 'Verifikasi_Kenaikan_Pangkat_BKD.png',
      fileSize: 198000,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'BADAN KEPEGAWAIAN DAERAH PROVINSI',
        'Verifikasi Berkas Kenaikan Pangkat ASN Guru',
        '800/512/BKD-PROV/2026',
        '05 Oktober 2026'
      ),
      uploadedAt: '2026-10-06T11:20:00.000Z',
    },
    disposisi: {
      tujuanDisposisi: 'Bagian Urusan Kepegawaian TU',
      isiDisposisi: 'Segera hubungi bapak/ibu guru bersangkutan hari ini.',
      sifatDisposisi: 'Sangat Segera',
      batasWaktu: '2026-10-08',
      status: 'Diproses',
    },
    createdAt: '2026-10-06T11:20:00.000Z',
    updatedAt: '2026-10-06T11:20:00.000Z',
  },

  // SURAT KELUAR
  {
    id: 'sk-2026-001',
    type: 'keluar',
    nomorAgenda: '001/SK/2026',
    nomorSurat: '421.3/089/SMAN1/X/2026',
    tanggalSurat: '2026-10-04',
    tanggalKirim: '2026-10-04',
    tujuan: 'Kepala Dinas Pendidikan Provinsi Wilayah III',
    perihal: 'Pengajuan Usulan Bantuan Sarana Laboratorium Komputer Digital',
    sifat: 'Penting',
    keterangan: 'Melampirkan proposal 36 unit PC untuk penunjang ANBK dan pembelajaran Coding.',
    lampiranAda: true,
    file: {
      fileName: 'Surat_Pengajuan_Lab_Komputer_SMAN1.png',
      fileSize: 215000,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'SMA NEGERI 1 KUSUMA BANGSA',
        'Pengajuan Usulan Bantuan Sarana Lab Komputer',
        '421.3/089/SMAN1/X/2026',
        '04 Oktober 2026'
      ),
      uploadedAt: '2026-10-04T13:00:00.000Z',
    },
    createdAt: '2026-10-04T13:00:00.000Z',
    updatedAt: '2026-10-04T13:00:00.000Z',
  },
  {
    id: 'sk-2026-002',
    type: 'keluar',
    nomorAgenda: '002/SK/2026',
    nomorSurat: '421.3/090/SMAN1/X/2026',
    tanggalSurat: '2026-10-05',
    tanggalKirim: '2026-10-05',
    tujuan: 'Orang Tua / Wali Murid Kelas X, XI, dan XII',
    perihal: 'Pemberitahuan Pelaksanaan Penilaian Tengah Semester (PTS) Ganjil',
    sifat: 'Edaran',
    keterangan: 'Jadwal PTS dilaksanakan tanggal 13 s.d 20 Oktober 2026 dengan sistem CBT.',
    lampiranAda: true,
    file: {
      fileName: 'Edaran_Jadwal_PTS_Ganjil_Ortu.png',
      fileSize: 167000,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'SMA NEGERI 1 KUSUMA BANGSA',
        'Pemberitahuan Jadwal PTS Ganjil Tahun Ajaran 2026/2027',
        '421.3/090/SMAN1/X/2026',
        '05 Oktober 2026'
      ),
      uploadedAt: '2026-10-05T08:30:00.000Z',
    },
    createdAt: '2026-10-05T08:30:00.000Z',
    updatedAt: '2026-10-05T08:30:00.000Z',
  },
  {
    id: 'sk-2026-003',
    type: 'keluar',
    nomorAgenda: '003/SK/2026',
    nomorSurat: '421.3/091/SMAN1/X/2026',
    tanggalSurat: '2026-10-07',
    tanggalKirim: '2026-10-07',
    tujuan: 'Puskesmas Kecamatan Sukamaju',
    perihal: 'Permohonan Pemeriksaan Kesehatan Berkala & Skrining Remaja Siswa Baru',
    sifat: 'Biasa',
    keterangan: 'Kerjasama program UKS dan posyandu remaja sekolah.',
    lampiranAda: false,
    createdAt: '2026-10-07T10:15:00.000Z',
    updatedAt: '2026-10-07T10:15:00.000Z',
  },
  {
    id: 'sk-2026-004',
    type: 'keluar',
    nomorAgenda: '004/SK/2026',
    nomorSurat: '800/092/SMAN1/X/2026',
    tanggalSurat: '2026-10-07',
    tanggalKirim: '2026-10-08',
    tujuan: 'Koordinator Pengawas SMA Wilayah III',
    perihal: 'Penyampaian Laporan Kinerja Bulanan Guru dan Tenaga Kependidikan September 2026',
    sifat: 'Pemberitahuan',
    keterangan: 'Laporan kehadiran, ketercapaian modul ajar, dan jurnal kegiatan harian.',
    lampiranAda: true,
    file: {
      fileName: 'Laporan_Kinerja_September_2026.png',
      fileSize: 189000,
      fileType: 'image/png',
      dataUrl: createSampleDocImage(
        'SMA NEGERI 1 KUSUMA BANGSA',
        'Penyampaian Laporan Kinerja Bulanan September 2026',
        '800/092/SMAN1/X/2026',
        '07 Oktober 2026'
      ),
      uploadedAt: '2026-10-08T07:45:00.000Z',
    },
    createdAt: '2026-10-08T07:45:00.000Z',
    updatedAt: '2026-10-08T07:45:00.000Z',
  },
];
