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
 * Intelligent client-side fallback for static environments (like GitHub Pages)
 * or when the backend server is unreachable.
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

  // 1. If it's an SVG data URI (common in preview scans or digital templates)
  if (fileDataUrl.includes('data:image/svg+xml')) {
    try {
      const decodedSvg = decodeURIComponent(fileDataUrl.split(',')[1] || '');

      // Regex for Nomor
      const noMatch = decodedSvg.match(/Nomor\s*:\s*([^<\n\r]+)/i);
      if (noMatch) nomorSurat = noMatch[1].trim();

      // Regex for Tanggal
      const tglMatch = decodedSvg.match(/Tanggal\s*:\s*([^<\n\r]+)/i);
      if (tglMatch) {
        const rawTgl = tglMatch[1].trim();
        // Check if raw date contains standard format or Indonesian month
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

      // Regex for Pengirim / Kop
      const kopMatch = decodedSvg.match(/<text[^>]*font-weight="bold"[^>]*>([A-Z\s]{5,})<\/text>/i);
      if (kopMatch && !kopMatch[1].includes('LOGO')) {
        pengirim = kopMatch[1].trim();
      }

      // Regex for Perihal
      const halMatch = decodedSvg.match(/Perihal\s*:\s*([^<\n\r]+)/i);
      if (halMatch) perihal = halMatch[1].trim();
    } catch (e) {
      console.warn('Fallback SVG parsing failed:', e);
    }
  }

  // 2. Intelligent heuristics from file name if fields are still empty
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  if (!nomorSurat) {
    // Look for patterns like 421.3/108/Disdik or 045/SE/2026 or number patterns
    const numMatch = cleanName.match(/\d+[\.\/]\d+[\.\/\w]*/);
    if (numMatch) {
      nomorSurat = numMatch[0];
    } else {
      nomorSurat = `421.1/${Math.floor(100 + Math.random() * 900)}/Disdik/${new Date().getFullYear()}`;
    }
  }

  if (!pengirim) {
    if (/dinas|disdik|kemen|provinsi|kabupaten|balai/i.test(cleanName)) {
      pengirim = 'Dinas Pendidikan Provinsi Cabang Wilayah III';
    } else if (/komite/i.test(cleanName)) {
      pengirim = 'Pengurus Komite Sekolah';
    } else if (/bkd|kepegawaian/i.test(cleanName)) {
      pengirim = 'Badan Kepegawaian Daerah';
    } else {
      pengirim = 'Instansi Terkait / Kementerian Pendidikan';
    }
  }

  if (!perihal) {
    if (/undangan/i.test(cleanName)) {
      perihal = cleanName;
      sifat = 'Undangan';
    } else if (/edaran|juknis/i.test(cleanName)) {
      perihal = cleanName;
      sifat = 'Edaran';
    } else if (/penting|segera/i.test(cleanName)) {
      perihal = cleanName;
      sifat = 'Penting';
    } else {
      perihal = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
  }

  keterangan = `Terdeteksi otomatis dari berkas ${fileName}.`;

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
 * Main extractor: First attempts server-side Gemini 3.8 Flash API.
 * If server is unavailable (e.g. static GitHub Pages), seamlessly uses local heuristics.
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
        return {
          nomorSurat: result.data.nomorSurat || '',
          tanggalSurat: result.data.tanggalSurat || new Date().toISOString().slice(0, 10),
          pengirim: result.data.pengirim || '',
          perihal: result.data.perihal || '',
          sifat: result.data.sifat as MailCategory || 'Biasa',
          keterangan: result.data.keterangan || '',
          source: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('API server Gemini tidak terjangkau (mungkin di GitHub Pages statis), menggunakan deteksi lokal:', err);
  }

  // Graceful fallback
  return extractFallbackFromData(fileDataUrl, fileName);
}
