import { MailCategory } from '../types';
import { createWorker } from 'tesseract.js';

export interface ExtractedLetterData {
  nomorSurat: string;
  tanggalSurat: string;
  pengirim: string;
  perihal: string;
  sifat?: MailCategory;
  keterangan?: string;
  source: 'ai' | 'fallback' | 'ocr';
}

/**
 * Clean and validate subject (perihal):
 * Ensure perihal represents the actual topic/content of the letter,
 * and NEVER contains file names, extensions, or camera upload prefixes.
 */
export function cleanPerihalSubject(raw: string, defaultTopic: string = 'Penyampaian Informasi dan Koordinasi Kedinasan Sekolah'): string {
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
 * Resize high-resolution image uploads on canvas to optimize transfer speed,
 * memory consumption, and OCR efficiency.
 */
export async function resizeImageForOcr(dataUrl: string, maxDimension = 1800): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // SVGs don't need pixel downscaling
  if (dataUrl.includes('image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= maxDimension && height <= maxDimension) {
        return resolve(dataUrl);
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      // White background for transparent PNG scans
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Client-side OCR using Tesseract.js (runs offline in the browser without server dependency).
 */
export async function performClientOcr(imageSource: string): Promise<string> {
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err) {
    console.warn('[OCR] Client-side OCR error:', err);
    return '';
  }
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
    // a) slashes or hyphens separating codes (e.g., "400.3.5/277/416-101/2026", "421.3/145/Disdik/2026", "SE/045/2026")
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

    // Skip address lines from the kop surat (e.g., "Jalan Pemuda No. 12 ...", "Kode Pos 61361")
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
  // e.g. 400.3.5/277/416-101/2026, 421.3/145/Disdik/2026, 800/512/BKD-PROV/2026
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
 * Detect Perihal / Pokok Isi Surat from text.
 */
export function detectPerihal(rawText: string): string {
  if (!rawText) return '';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Strategy 1: Explicit line: "Hal : Undangan Pembinaan Kurikulum SD tahun 2026" or "Perihal :"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/(?:^|\b)(?:Perihal|Hal|Pokok\s*Isi|Tentang)\s*[:=\t\s]+\s*([^<\r\n]{5,150})/i);
    if (match && match[1]) {
      let candidate = match[1].trim();
      candidate = candidate.split(/Kepada|Yth\b|Tanggal|Lampiran|Sifat/i)[0].trim();
      candidate = candidate.replace(/^["'\s:]+|["'\s]+$/g, '').trim();
      if (candidate.length >= 5) {
        return cleanPerihalSubject(candidate);
      }
    }
  }

  // Strategy 2: Official decree/circular title: "SURAT EDARAN", "SURAT KEPUTUSAN", "UNDANGAN"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:SURAT\s*EDARAN|SURAT\s*KEPUTUSAN|SURAT\s*TUGAS|PEMBERITAHUAN|UNDANGAN)/i.test(line) && line.length < 80) {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        if (/^TENTANG\b/i.test(lines[j])) {
          const topicLine = lines[j].replace(/^TENTANG\s*[:=\s]*/i, '').trim() || lines[j + 1];
          if (topicLine) return cleanPerihalSubject(`${line} tentang ${topicLine}`);
        }
      }
      return cleanPerihalSubject(line);
    }
  }

  return '';
}

/**
 * Detect date of the letter (Tanggal Surat) in Indonesian correspondence.
 */
export function detectTanggalSurat(rawText: string): string {
  if (!rawText) return new Date().toISOString().slice(0, 10);

  const idMonths: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
  };

  // Indonesian format with city or date: "Mojokerto, 7 Oktober 2026" or "15 Januari 2026"
  const fullDateMatch = rawText.match(/\b(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})\b/i);
  if (fullDateMatch) {
    const day = fullDateMatch[1].padStart(2, '0');
    const month = idMonths[fullDateMatch[2].toLowerCase()];
    const year = fullDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Numeric date format: DD/MM/YYYY or YYYY-MM-DD
  const numDateMatch = rawText.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
  if (numDateMatch) {
    const day = numDateMatch[1].padStart(2, '0');
    const month = numDateMatch[2].padStart(2, '0');
    const year = numDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Detect sender instansi from kop surat or signature.
 */
export function detectPengirim(rawText: string): string {
  if (!rawText) return 'Dinas Pendidikan / Instansi Terkait';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Strategy 1: Top Kop Surat Header lines
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (/^(?:Jl|Jalan|Telp|Fax|Email|Website|Kode|Laman|http)/i.test(line)) continue;
    if (/\b(?:DINAS|KEMENTERIAN|BADAN|SEKOLAH|KOMITE|YAYASAN|CABANG\s*DINAS)\b/i.test(line)) {
      let instansi = line;
      if (i > 0 && /PEMERINTAH\s+(?:KABUPATEN|KOTA|PROVINSI)\s+([A-Z\s]+)/i.test(lines[i - 1])) {
        const daerah = lines[i - 1].match(/PEMERINTAH\s+((?:KABUPATEN|KOTA|PROVINSI)\s+[A-Za-z\s]+)/i);
        if (daerah) {
          instansi = `${line} ${daerah[1]}`;
        }
      }
      return instansi.trim();
    }
  }

  // Strategy 2: Signature block
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/^(?:Kepala\s+Dinas|Kepala\s+Sekolah|Ketua\s+Komite|Kepala\s+SMA|Kepala\s+SMK|Kepala\s+SMP|Kepala\s+SD)\b/i.test(line) && line.length < 70) {
      return line.trim();
    }
  }

  return 'Dinas Pendidikan / Instansi Terkait';
}

/**
 * Detect mail classification/urgency (Sifat Surat).
 */
export function detectSifat(rawText: string): MailCategory {
  if (/Sifat\s*[:=\t\s]*segera/i.test(rawText) || /\bSegera\b/i.test(rawText)) return 'Segera';
  if (/Sifat\s*[:=\t\s]*penting/i.test(rawText) || /\bPenting\b/i.test(rawText)) return 'Penting';
  if (/Sifat\s*[:=\t\s]*rahasia/i.test(rawText) || /\bRahasia\b/i.test(rawText)) return 'Rahasia';
  if (/\bUndangan\b/i.test(rawText)) return 'Undangan';
  if (/\bEdaran\b/i.test(rawText)) return 'Edaran';
  if (/\bPemberitahuan\b/i.test(rawText)) return 'Pemberitahuan';
  return 'Biasa';
}

/**
 * Reconstruct letter number from filename when user saves or scans letter with dashes or underscores
 * (e.g. "400.3.5-277-416-101-2026.pdf").
 */
function detectNomorFromFilename(fileName: string): string {
  if (!fileName) return '';
  const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '').trim();

  const match = baseName.match(/(?:(?:surat|scan|dokumen|sm|sk)[_\-\s]*)?([A-Za-z0-9]{2,8}[_\-\.][A-Za-z0-9\.\-]+[_\-\.][A-Za-z0-9\.\-_]{2,35})/i);
  if (match && match[1]) {
    const candidate = match[1];
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
 * Extracts raw readable text streams from uploaded document
 * (supports SVG and plain-text encoded PDF byte streams).
 */
function extractReadableTextFromDocument(fileDataUrl: string): string {
  if (!fileDataUrl) return '';

  // 1. If SVG data URI
  if (fileDataUrl.includes('data:image/svg+xml')) {
    try {
      const decoded = decodeURIComponent(fileDataUrl.split(',')[1] || '');
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
 * Fallback extraction: processes document text (or OCR result) with regex parsers.
 */
export function extractFallbackFromData(
  fileDataUrl: string,
  fileName: string,
  preloadedText: string = ''
): ExtractedLetterData {
  const docText = preloadedText || extractReadableTextFromDocument(fileDataUrl);

  let nomorSurat = detectNomorSurat(docText);
  let tanggalSurat = detectTanggalSurat(docText);
  let pengirim = detectPengirim(docText);
  let perihal = detectPerihal(docText);
  let sifat: MailCategory = detectSifat(docText);

  // If nomor surat was not found in text, try filename
  if (!nomorSurat) {
    nomorSurat = detectNomorFromFilename(fileName);
  }

  // Fallback for Perihal based on filename keywords if still not found
  if (!perihal) {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('kurikulum') || lowerFileName.includes('pembinaan')) {
      perihal = 'Undangan Pembinaan Kurikulum Satuan Pendidikan';
      sifat = 'Undangan';
    } else if (lowerFileName.includes('asesmen') || lowerFileName.includes('abm') || lowerFileName.includes('anbk')) {
      perihal = 'Undangan Sosialisasi Asesmen Nasional & Asesmen Bakat Minat Siswa';
      sifat = 'Penting';
    } else if (lowerFileName.includes('bosp') || lowerFileName.includes('bos') || lowerFileName.includes('arkas')) {
      perihal = 'Surat Edaran Panduan Pengelolaan Dana Bantuan Operasional Satuan Pendidikan (BOSP)';
      sifat = 'Edaran';
    } else if (lowerFileName.includes('pangkat') || lowerFileName.includes('bkd') || lowerFileName.includes('skp')) {
      perihal = 'Verifikasi Berkas Kenaikan Pangkat Pendidik dan Tenaga Kependidikan';
      sifat = 'Segera';
    } else if (lowerFileName.includes('undangan') || lowerFileName.includes('rapat')) {
      perihal = 'Undangan Rapat Koordinasi dan Pembinaan Pendidik Satuan Pendidikan';
      sifat = 'Undangan';
    } else {
      perihal = 'Penyampaian Informasi dan Koordinasi Administrasi Pendidikan Sekolah';
    }
  }

  perihal = cleanPerihalSubject(perihal);
  const keterangan = `Perihal: "${perihal}".`;

  return {
    nomorSurat,
    tanggalSurat,
    pengirim,
    perihal,
    sifat,
    keterangan,
    source: preloadedText ? 'ocr' : 'fallback',
  };
}

/**
 * Main extractor: First attempts server-side Gemini AI API with multi-model fallback.
 * If server is unavailable (e.g. static GitHub Pages), seamlessly uses local OCR or text stream extraction.
 */
export async function extractLetterDataFromDoc(
  fileDataUrl: string,
  fileName: string,
  fileType: string
): Promise<ExtractedLetterData> {
  // Optimize large images to prevent timeout
  let processedDataUrl = fileDataUrl;
  if (fileDataUrl.startsWith('data:image/') && !fileDataUrl.includes('image/svg+xml')) {
    try {
      processedDataUrl = await resizeImageForOcr(fileDataUrl, 1800);
    } catch {
      processedDataUrl = fileDataUrl;
    }
  }

  // 1. Attempt Server-Side Gemini API
  try {
    const response = await fetch('/api/extract-letter-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: processedDataUrl,
        fileType,
        fileName,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const rawPerihal = result.data.perihal || '';
        const cleanedPerihal = cleanPerihalSubject(rawPerihal, 'Penyampaian Informasi dan Koordinasi Kedinasan Sekolah');

        let cleanedNomor = (result.data.nomorSurat || '')
          .replace(/^(nomor\s*surat|nomor|no\.?\s*surat|no\.?)\s*[:=\-\s]*/i, '')
          .replace(/\s*([\/\.-])\s*/g, '$1')
          .replace(/^["'\s:]+|["'\s]+$/g, '')
          .trim();

        // If nomor surat from AI looks like street number ("45") or phone, clear it
        if (/telp|fax|faks|telepon|http/i.test(cleanedNomor) || /^\d{1,4}$/.test(cleanedNomor)) {
          cleanedNomor = '';
        }

        return {
          nomorSurat: cleanedNomor,
          tanggalSurat: result.data.tanggalSurat || new Date().toISOString().slice(0, 10),
          pengirim: result.data.pengirim || 'Dinas Pendidikan / Instansi Terkait',
          perihal: cleanedPerihal,
          sifat: (result.data.sifat as MailCategory) || 'Biasa',
          keterangan: result.data.keterangan || `Perihal: ${cleanedPerihal}`,
          source: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('[AI Extractor] Server API tidak terjangkau (misal di GitHub Pages statis), beralih ke OCR/ekstraksi lokal:', err);
  }

  // 2. Client-side OCR for Images when deployed to static hosts (GitHub Pages) or server offline
  if (processedDataUrl.startsWith('data:image/') && !processedDataUrl.includes('image/svg+xml')) {
    try {
      console.log('[OCR] Memulai analisis teks OCR di browser...');
      const ocrText = await performClientOcr(processedDataUrl);
      if (ocrText && ocrText.trim().length > 15) {
        console.log('[OCR] Hasil OCR teks berhasil diekstrak:', ocrText.slice(0, 150));
        return extractFallbackFromData(processedDataUrl, fileName, ocrText);
      }
    } catch (ocrErr) {
      console.warn('[OCR] Client OCR gagal:', ocrErr);
    }
  }

  // 3. Graceful stream fallback for PDF and SVG
  return extractFallbackFromData(processedDataUrl, fileName);
}
