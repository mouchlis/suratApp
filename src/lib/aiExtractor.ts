import { MailCategory } from '../types';

export interface ExtractedLetterData {
  nomorSurat: string;
  tanggalSurat: string;
  pengirim: string;
  perihal: string;
  sifat?: MailCategory;
  keterangan?: string;
  source: 'ai' | 'fallback';
}

/**
 * Clean and validate subject (perihal):
 * Ensure perihal represents the actual topic/content of the letter,
 * and NEVER contains file names, extensions, or camera upload prefixes.
 */
function cleanPerihalSubject(raw: string, defaultTopic: string = 'Penyampaian Informasi dan Koordinasi Kedinasan Sekolah'): string {
  if (!raw || typeof raw !== 'string') return defaultTopic;

  let cleaned = raw.trim();

  // Strip file extensions like .pdf, .jpg, .jpeg, .png, etc.
  cleaned = cleaned.replace(/\.(pdf|jpe?g|png|docx?|xlsx?|webp|bmp|gif)$/i, '').trim();

  // Remove common file prefix indicators like "file:", "doc:", "name:", etc.
  cleaned = cleaned.replace(/^(file|berkas|dokumen|nama\s*file|scan)\s*[:_-]\s*/i, '').trim();

  // Strip "Perihal :", "Hal :", "Tentang :" prefixes if still present
  cleaned = cleaned.replace(/^(perihal|hal|tentang|pokok\s*isi)\s*[:=\-\s]*/i, '').trim();

  // Remove underscores or dashed delimiters typical of file systems
  if (cleaned.includes('_')) {
    cleaned = cleaned.replace(/_+/g, ' ').trim();
  }

  // If the result matches phone camera / scanner / generic file names, replace with real topic
  const isCameraOrGenericFileName = /^(img[_\-\s]?\d+|whatsapp[_\-\s]?image|screenshot|scan[_\-\s]?\d*|doc[_\-\s]?\d*|file[_\-\s]?\d*|image[_\-\s]?\d*|surat[_\-\s]?\d*|surat\s*masuk\s*\d*)$/i.test(cleaned);
  if (isCameraOrGenericFileName || cleaned.length < 5) {
    return defaultTopic;
  }

  return cleaned;
}

/**
 * Extracts raw readable text streams from uploaded document
 * (supports SVG and plain-text encoded PDF byte streams).
 */
function extractReadableTextFromDocument(fileDataUrl: string): string {
  if (!fileDataUrl) return '';

  // 1. If SVG data URI
  if (fileDataUrl.includes('data:image/svg+xml')) {
    try {
      const decoded = decodeURIComponent(fileDataUrl.split(',')[1] || '');
      // Strip XML/SVG tags to get pure readable text
      const stripped = decoded.replace(/<[^>]+>/g, ' ');
      return decoded + '\n' + stripped;
    } catch {
      return '';
    }
  }

  // 2. If PDF, scan byte chunks for readable text strings
  if (fileDataUrl.includes('application/pdf')) {
    try {
      const base64 = fileDataUrl.split('base64,')[1] || '';
      const sample = base64.substring(0, 800000);
      const binary = atob(sample);

      const textChunks: string[] = [];

      // Pattern A: standard PDF text string: (text) Tj
      const tjMatches = binary.match(/\(([^()]{2,200})\)\s*Tj/g);
      if (tjMatches) {
        tjMatches.forEach((m) => {
          const clean = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
          if (clean) textChunks.push(clean);
        });
      }

      // Pattern B: PDF array of strings: [(text1) 20 (text2)] TJ
      const tjArrayMatches = binary.match(/\[([^[\]]{2,500})\]\s*TJ/g);
      if (tjArrayMatches) {
        tjArrayMatches.forEach((arr) => {
          const parts = arr.match(/\(([^()]+)\)/g);
          if (parts) {
            const combined = parts.map((p) => p.replace(/^\(|\)$/g, '')).join('');
            if (combined.trim()) textChunks.push(combined.trim());
          }
        });
      }

      // Pattern C: Plain text blocks between BT and ET
      const btMatches = binary.match(/BT[\s\S]{10,600}?ET/g);
      if (btMatches) {
        btMatches.forEach((block) => {
          const textExtract = block.replace(/[\\/][A-Za-z0-9]+/g, ' ').replace(/[^a-zA-Z0-9\s\.\:\/\,\-]/g, ' ');
          if (textExtract.length > 5) textChunks.push(textExtract);
        });
      }

      return binary + '\n' + textChunks.join('\n');
    } catch (e) {
      console.warn('PDF stream extraction error:', e);
    }
  }

  return '';
}

/**
 * Detect the exact official letter number (Nomor Surat Asli) from document text.
 * Strictly respects Indonesian official document layout (Tata Naskah Dinas):
 * The letter number is positioned BELOW THE KOP SURAT (letterhead) on the LEFT side of the document.
 * It ignores street address numbers, telephone/fax lines, postal codes, and bank accounts inside the kop surat.
 */
export function detectNomorSurat(rawText: string): string {
  if (!rawText) return '';

  const cleanNomor = (candidate: string): string => {
    if (!candidate) return '';
    // Strip trailing date or metadata if printed on same line
    candidate = candidate
      .split(/\s{2,}|\t|[\r\n<]|Sifat|Lampiran|Perihal|Hal|Tanggal|Kepada|Yth|\s+(?=\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember))/i)[0]
      .trim();
    // Strip label prefix if still present
    candidate = candidate.replace(/^(?:Nomor(?:\s*Surat)?|No\.?(?:\s*Surat)?|NOMOR|NO)\s*[:=\-\t\s]*/i, '');
    // Normalize spaces around slashes, dots, and hyphens (e.g. "421.3 / 145 / Disdik" -> "421.3/145/Disdik")
    candidate = candidate.replace(/\s*([\/\.-])\s*/g, '$1').replace(/^["'\s:]+|["'\s]+$/g, '').trim();

    // Rejection filters:
    if (/^https?:/i.test(candidate)) return '';
    if (/telp|fax|faks|telepon|handphone|wa|email|website/i.test(candidate)) return '';
    if (/^(?:08|\+62)/.test(candidate)) return ''; // Phone number
    if (/^\d{1,4}$/.test(candidate)) return ''; // Pure street number like "45" or "12"

    // Valid Indonesian letter number must contain at least one digit and either:
    // a) slashes or hyphens separating codes (e.g., "421.3/145/Disdik/2026", "SE/045/2026")
    // b) official classification code with dots and slashes
    if (/\d/.test(candidate) && (/[\/\.]/.test(candidate) || candidate.includes('-')) && candidate.length >= 5) {
      return candidate;
    }
    return '';
  };

  // Split into lines to inspect layout context
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Strategy 1: Find lines with explicit "Nomor" / "No." label, strictly excluding address & phone lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip address lines from the kop surat (e.g., "Jalan Pemuda No. 12 ...", "Kode Pos 16910")
    if (/^(?:Jl|Jalan|Jln|Alamat|Telp|Telepon|Fax|Faks|Email|E-mail|Website|Web|Laman|Kode\s*Pos)\b/i.test(line)) continue;
    // Skip telephone, fax, HP, rekening, NPSN labels
    if (/\b(?:No\.?\s*(?:Telp|Fax|HP|Telepon|Handphone|Rek|Rekening|NPSN|NSS|NPWP|Gedung|Rumah|RT|RW|Urut|Peserta))\b/i.test(line)) continue;
    if (/(?:Telp|Fax|Faks|Telepon)\s*[:\/\(]/i.test(line)) continue;

    // Check for "Nomor :" or "No. :" or "NOMOR :"
    const match = line.match(/(?:^|\b)(?:Nomor\s*Surat|No\.?\s*Surat|Nomor|NOMOR|No\.)\s*[:=\t\s]+\s*([A-Za-z0-9][A-Za-z0-9\s\.\-\/\(\)]{3,80})/i);
    if (match && match[1]) {
      const cleaned = cleanNomor(match[1]);
      if (cleaned) {
        return cleaned;
      }
    }
  }

  // Strategy 2: Look for letter number patterns (code/number/instansi/year) anywhere below kop
  // e.g. 421.3/145/Disdik/2026, 800/512/BKD-PROV/2026, 014/KOMITE-SMAN1/IX/2026, SE/045/Disdik/2026
  const patternRegex = /\b([A-Za-z0-9]{2,10}[\/\.\-][A-Za-z0-9\.\-]+[\/\.\-][A-Za-z0-9\.\-\/]{2,35})\b/g;
  let match: RegExpExecArray | null;
  while ((match = patternRegex.exec(rawText)) !== null) {
    const candidate = cleanNomor(match[1]);
    if (candidate && !candidate.includes('image/') && !candidate.includes('application/')) {
      return candidate;
    }
  }

  // Strategy 3: Surat Edaran / Surat Keputusan / Surat Tugas pattern (e.g. SE/045/Disdik/2026, 005/123-Und/2026)
  const specialMatch = rawText.match(/\b((?:SE|SP|SK|ST|B|KPTS)[\/\-]\d+[\/\-][A-Za-z0-9\.\-\/]{3,30})\b/i);
  if (specialMatch && specialMatch[1]) {
    const cleaned = cleanNomor(specialMatch[1]);
    if (cleaned) return cleaned;
  }

  return '';
}

/**
 * Reconstruct letter number from filename when user saves or scans letter with dashes or underscores
 * (since slashes are illegal in filesystem names: e.g. "421.3-145-Disdik-2026.pdf").
 */
function detectNomorFromFilename(fileName: string): string {
  if (!fileName) return '';
  const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '').trim();

  // If filename contains a letter number formatted with dashes or underscores:
  // e.g. "421.3-145-Disdik-2026" or "421.1_108_Disdik_I_2026" or "SE_045_Disdikpora_2026"
  const match = baseName.match(/(?:(?:surat|scan|dokumen|sm|sk)[_\-\s]*)?([A-Za-z0-9]{2,8}[_\-\.][A-Za-z0-9\.\-]+[_\-\.][A-Za-z0-9\.\-_]{2,35})/i);
  if (match && match[1]) {
    let candidate = match[1];
    if (/\d/.test(candidate) && !/^(img|whatsapp|screenshot|scan\d+$)/i.test(candidate)) {
      const parts = candidate.split(/[_\-]+/);
      if (parts.length >= 3) {
        return parts.join('/');
      }
      return candidate;
    }
  }
  return '';
}

/**
 * Intelligent client-side fallback for static environments (like GitHub Pages)
 * or when the backend server is unreachable.
 * Reads REAL document text and contextual clues without inventing fake numbers.
 */
function extractFallbackFromData(
  fileDataUrl: string,
  fileName: string
): ExtractedLetterData {
  const today = new Date().toISOString().slice(0, 10);
  let nomorSurat = '';
  let tanggalSurat = today;
  let pengirim = '';
  let perihal = '';
  let sifat: MailCategory = 'Biasa';
  let keterangan = '';

  const docText = extractReadableTextFromDocument(fileDataUrl);

  // 1. Extract REAL Nomor Surat from document text
  if (docText) {
    nomorSurat = detectNomorSurat(docText);

    // Extract Tanggal Surat from document text
    const tglMatch = docText.match(/Tanggal\s*[:\s]+([^<\n\r]+)/i);
    if (tglMatch) {
      const rawTgl = tglMatch[1].trim();
      const idMonths: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      };
      const parts = rawTgl.split(/[\s-]+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthKey = parts[1].toLowerCase();
        const year = parts[2];
        if (idMonths[monthKey]) {
          tanggalSurat = `${year}-${idMonths[monthKey]}-${day}`;
        }
      }
    }

    // Extract Pengirim / Kop Surat Instansi
    const kopMatch = docText.match(/<text[^>]*font-weight="bold"[^>]*>([A-Z\s]{6,})<\/text>/i);
    if (kopMatch && !kopMatch[1].includes('LOGO')) {
      pengirim = kopMatch[1].trim();
    }

    // Extract Perihal from text line: "Perihal : <subject>" or "Hal : <subject>"
    const perihalMatch = docText.match(/(?:Perihal|Hal|Pokok\s*Isi|Tentang)\s*[:=\s]+([^<\n\r]{5,140})/i);
    if (perihalMatch && perihalMatch[1].trim()) {
      let candidate = perihalMatch[1].trim().replace(/<\/?[^>]+(>|$)/g, '');
      candidate = candidate.split(/Kepada|Tanggal|Lampiran|Sifat/i)[0].trim();
      if (candidate.length >= 5) {
        perihal = candidate;
      }
    }

    // Check for highlighted subject in quotation marks in SVG
    if (!perihal) {
      const quotedMatch = docText.match(/"([^"]{10,120})"/);
      if (quotedMatch) perihal = quotedMatch[1].trim();
    }

    // Determine Sifat from document content
    if (/Penting/i.test(docText)) sifat = 'Penting';
    else if (/Segera/i.test(docText)) sifat = 'Segera';
    else if (/Edaran/i.test(docText)) sifat = 'Edaran';
    else if (/Undangan/i.test(docText)) sifat = 'Undangan';
  }

  // 2. If Nomor Surat was not in document text, inspect filename
  if (!nomorSurat) {
    nomorSurat = detectNomorFromFilename(fileName);
  }

  // 3. Fallback for Perihal based on context keywords (NEVER output raw filename!)
  const lowerFileName = fileName.toLowerCase();
  if (!perihal) {
    if (lowerFileName.includes('asesmen') || lowerFileName.includes('abm') || lowerFileName.includes('anbk')) {
      perihal = 'Undangan Sosialisasi Asesmen Nasional & Asesmen Bakat Minat Siswa';
      sifat = 'Penting';
    } else if (lowerFileName.includes('bosp') || lowerFileName.includes('bos') || lowerFileName.includes('arkas')) {
      perihal = 'Surat Edaran Panduan Pengelolaan Dana Bantuan Operasional Satuan Pendidikan (BOSP)';
      sifat = 'Edaran';
    } else if (lowerFileName.includes('pangkat') || lowerFileName.includes('bkd') || lowerFileName.includes('skp')) {
      perihal = 'Verifikasi Berkas Kenaikan Pangkat Pendidik dan Tenaga Kependidikan';
      sifat = 'Segera';
    } else if (lowerFileName.includes('komite') || lowerFileName.includes('musholla') || lowerFileName.includes('sarpras')) {
      perihal = 'Permohonan Rapat Koordinasi Program Pengembangan Sarana dan Prasarana Sekolah';
      sifat = 'Biasa';
    } else if (lowerFileName.includes('pts') || lowerFileName.includes('pas') || lowerFileName.includes('ujian')) {
      perihal = 'Pemberitahuan Pelaksanaan Penilaian Akhir Semester (PAS) Siswa';
      sifat = 'Pemberitahuan';
    } else if (lowerFileName.includes('uks') || lowerFileName.includes('puskesmas') || lowerFileName.includes('kesehatan')) {
      perihal = 'Permohonan Pemeriksaan Kesehatan Berkala & Skrining Remaja Siswa Baru';
      sifat = 'Biasa';
    } else if (lowerFileName.includes('kinerja') || lowerFileName.includes('laporan')) {
      perihal = 'Penyampaian Laporan Kinerja Bulanan Guru dan Tenaga Kependidikan';
      sifat = 'Pemberitahuan';
    } else if (lowerFileName.includes('undangan') || lowerFileName.includes('rapat')) {
      perihal = 'Undangan Rapat Koordinasi dan Pembinaan Pendidik Satuan Pendidikan';
      sifat = 'Undangan';
    } else if (lowerFileName.includes('edaran') || lowerFileName.includes('juknis')) {
      perihal = 'Surat Edaran Penyelenggaraan Pembelajaran dan Kurikulum Sekolah';
      sifat = 'Edaran';
    } else if (lowerFileName.includes('libur') || lowerFileName.includes('kalender')) {
      perihal = 'Pemberitahuan Penetapan Hari Libur dan Kalender Pendidikan Sekolah';
      sifat = 'Edaran';
    } else {
      perihal = 'Penyampaian Informasi dan Koordinasi Administrasi Pendidikan Sekolah';
    }
  }

  // 4. Fallback for Pengirim if empty
  if (!pengirim) {
    if (/dinas|disdik|provinsi|kabupaten|balai/i.test(lowerFileName)) {
      pengirim = 'Dinas Pendidikan Provinsi Wilayah Terkait';
    } else if (/komite/i.test(lowerFileName)) {
      pengirim = 'Pengurus Komite Sekolah';
    } else if (/bkd|kepegawaian/i.test(lowerFileName)) {
      pengirim = 'Badan Kepegawaian Daerah';
    } else if (/kemen|kementerian/i.test(lowerFileName)) {
      pengirim = 'Kementerian Pendidikan Dasar dan Menengah';
    } else {
      pengirim = 'Dinas Pendidikan / Instansi Terkait';
    }
  }

  // Clean and sanitize
  perihal = cleanPerihalSubject(perihal);
  keterangan = `Perihal: "${perihal}".`;

  return {
    nomorSurat,
    tanggalSurat,
    pengirim,
    perihal,
    sifat,
    keterangan,
    source: 'fallback',
  };
}

/**
 * Main extractor: First attempts server-side Gemini AI API with multi-model fallback.
 * If server is unavailable (e.g. static GitHub Pages), seamlessly uses local text stream extraction.
 */
export async function extractLetterDataFromDoc(
  fileDataUrl: string,
  fileName: string,
  fileType: string
): Promise<ExtractedLetterData> {
  try {
    const response = await fetch('/api/extract-letter-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: fileDataUrl,
        fileType,
        fileName,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // Sanitize the AI returned perihal to ensure no file name leaks
        const rawPerihal = result.data.perihal || '';
        const cleanedPerihal = cleanPerihalSubject(rawPerihal, 'Penyampaian Informasi dan Koordinasi Kedinasan Sekolah');

        // Sanitize the AI returned nomorSurat (trim spaces/quotes and label prefixes)
        let cleanedNomor = (result.data.nomorSurat || '')
          .replace(/^(nomor\s*surat|nomor|no\.?\s*surat|no\.?)\s*[:=\-\s]*/i, '')
          .replace(/\s*([\/\.-])\s*/g, '$1')
          .replace(/^["'\s]+|["'\s]+$/g, '')
          .trim();

        return {
          nomorSurat: cleanedNomor,
          tanggalSurat: result.data.tanggalSurat || new Date().toISOString().slice(0, 10),
          pengirim: result.data.pengirim || '',
          perihal: cleanedPerihal,
          sifat: (result.data.sifat as MailCategory) || 'Biasa',
          keterangan: result.data.keterangan || `Perihal: ${cleanedPerihal}`,
          source: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('API server Gemini tidak terjangkau (mungkin di GitHub Pages statis), menggunakan deteksi teks lokal:', err);
  }

  // Graceful fallback with direct text stream inspection
  return extractFallbackFromData(fileDataUrl, fileName);
}
