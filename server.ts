import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 30mb limit for PDF/Image scans
app.use(express.json({ limit: '30mb' }));

// Shared Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Ekstraksi Otomatis Data Surat Masuk / Dokumen Surat
app.post('/api/extract-letter-data', async (req, res) => {
  try {
    const { fileData, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data diperlukan untuk analisis.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di lingkungan server.',
      });
    }

    // Extract base64 / data content if it contains a data URL prefix
    let base64Content = fileData;
    let mime = (fileType || 'image/jpeg').toLowerCase();
    let isBase64 = false;

    if (fileData.includes('base64,')) {
      const parts = fileData.split('base64,');
      base64Content = parts[1];
      isBase64 = true;
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1].toLowerCase();
      }
    } else if (fileData.startsWith('data:')) {
      const commaIdx = fileData.indexOf(',');
      if (commaIdx !== -1) {
        const meta = fileData.substring(0, commaIdx);
        base64Content = fileData.substring(commaIdx + 1);
        const mimeMatch = meta.match(/:(.*?)(?:;|$)/);
        if (mimeMatch && mimeMatch[1]) {
          mime = mimeMatch[1].toLowerCase();
        }
      }
    }

    // Standardize MIME type for Gemini API
    if (mime.includes('svg')) {
      mime = 'image/svg+xml';
    } else if (mime.includes('png')) {
      mime = 'image/png';
    } else if (mime.includes('webp')) {
      mime = 'image/webp';
    } else if (mime.includes('pdf')) {
      mime = 'application/pdf';
    } else if (mime.includes('jpg') || mime.includes('jpeg')) {
      mime = 'image/jpeg';
    }

    // Comprehensive extraction prompt for Indonesian official school and government correspondence
    const promptText = `
Anda adalah asisten AI kearsipan tata usaha persuratan dinas dan satuan pendidikan sekolah di Indonesia.
Analisis DOKUMEN SURAT terlampir secara teliti dan ekstrak informasi kearsipan resmi:

PANDUAN MENDETEKSI NOMOR SURAT ASLI (SANGAT KRUSIAL):
1. "nomorSurat": Wajib mendeteksi dan menyalin NOMOR SURAT ASLI yang tercantum pada dokumen surat tersebut.
   - Carilah pada bagian kepala surat (kop surat) atau di bawah judul surat pada baris:
     "Nomor :", "No. :", "No :", "NOMOR :", "Nomor Surat :", atau "No. Surat :".
   - Ambil HANYA NOMOR SURAT SAJA!
   - HAPUS kata awalan seperti "Nomor :", "No. :", "No :", "NOMOR :", "Nomor Surat :", "No. Surat :".
   - Format nomor surat resmi di Indonesia berupa kode klasifikasi/nomor urut/nama instansi/bulan/tahun.
     Contoh hasil yang benar:
     * "421.3/145/Disdik/2026"
     * "800/512/BKD-PROV/2026"
     * "SE/045/Disdikpora/2026"
     * "014/KOMITE-SMAN1/IX/2026"
     * "005/340/Disdikbud/2026"
     * "421.1/108/Disdik/I/2026"
     * "421.3/1892-Cadisdik.Wil.IV/2026"
   - Hilangkan spasi berlebih di antara tanda garis miring atau tanda hubung (contoh "421.3 / 145 / Disdik / 2026" harus menjadi "421.3/145/Disdik/2026").
   - DILARANG KERAS mengisi kolom nomor surat dengan nomor agenda (misal 001/SM/...), nomor telepon, NPSN, nomor rekening, atau tanggal!
   - DILARANG mengarang nomor surat.

PANDUAN MENDETEKSI PERIHAL / POKOK ISI SURAT:
2. "perihal": Wajib berisi perihal resmi surat atau topik/pokok tujuan utama isi surat yang sesungguhnya.
   - Bacalah baris "Perihal :", "Hal :", "Tentang :", atau judul surat pada dokumen.
   - HAPUS kata awalan seperti "Perihal :", "Hal :", "Tentang :".
   - Contoh perihal yang benar:
     * "Undangan Sosialisasi Asesmen Nasional dan Asesmen Bakat Minat Siswa"
     * "Pemberitahuan Pelaksanaan Penilaian Akhir Semester"
     * "Surat Edaran Panduan Pengelolaan Dana BOSP"
     * "Permohonan Rapat Koordinasi Komite Sekolah"
     * "Verifikasi Berkas Kenaikan Pangkat Pendidik"
   - DILARANG KERAS mengisi kolom "perihal" dengan nama file berkas (seperti scan01.pdf, image.jpg, surat_masuk, dll)!

INFORMASI LAINNYA:
3. "tanggalSurat": Tanggal surat diterbitkan dalam format YYYY-MM-DD.
4. "pengirim": Nama instansi, dinas, atau pejabat penandatangan resmi pengirim surat.
5. "sifat": Salah satu dari "Biasa", "Penting", "Segera", "Rahasia", "Edaran", "Undangan", atau "Pemberitahuan".
6. "keterangan": Ringkasan singkat 1 kalimat perihal surat.
`;

    // Construct request parts
    let userParts: any[] = [];
    if (mime.includes('svg')) {
      let decodedSvgText = '';
      if (isBase64) {
        decodedSvgText = Buffer.from(base64Content, 'base64').toString('utf-8');
      } else {
        try {
          decodedSvgText = decodeURIComponent(base64Content);
        } catch {
          decodedSvgText = base64Content;
        }
      }
      userParts = [
        { text: `Berikut adalah isi dokumen surat resmi (format teks/SVG):\n\n${decodedSvgText}\n\n${promptText}` },
      ];
    } else {
      userParts = [
        {
          inlineData: {
            data: base64Content,
            mimeType: mime,
          },
        },
        { text: promptText },
      ];
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        nomorSurat: {
          type: Type.STRING,
          description: 'Nomor surat dinas resmi asli yang tercetak pada dokumen tanpa kata awalan Nomor/No (misal: 421.3/145/Disdik/2026)',
        },
        tanggalSurat: {
          type: Type.STRING,
          description: 'Tanggal surat dalam format YYYY-MM-DD',
        },
        pengirim: {
          type: Type.STRING,
          description: 'Nama instansi atau pihak pengirim surat',
        },
        perihal: {
          type: Type.STRING,
          description: 'Perihal atau pokok isi surat asli yang sesungguhnya',
        },
        sifat: {
          type: Type.STRING,
          description: 'Sifat surat: Biasa, Penting, Segera, Rahasia, Edaran, Undangan, atau Pemberitahuan',
        },
        keterangan: {
          type: Type.STRING,
          description: 'Ringkasan singkat isi atau tindak lanjut surat',
        },
      },
      required: ['nomorSurat', 'tanggalSurat', 'pengirim', 'perihal'],
    };

    // Cascade through available models for high availability
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    let outputText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: userParts,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

        if (response.text) {
          outputText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} gagal (${err.status || err.message}), mencoba model alternatif...`);
      }
    }

    if (!outputText) {
      throw lastError || new Error('Tidak ada respons dari model AI.');
    }

    const parsed = JSON.parse(outputText.trim());

    // Sanitize Nomor Surat:
    // Strip any label prefixes: "Nomor :", "No. :", "Nomor Surat :", etc.
    if (parsed.nomorSurat) {
      let cleanedNomor = parsed.nomorSurat
        .replace(/^(nomor\s*surat|nomor|no\.?\s*surat|no\.?)\s*[:=\-\s]*/i, '')
        .replace(/\s*([\/\.-])\s*/g, '$1')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .trim();
      parsed.nomorSurat = cleanedNomor;
    }

    // Sanitize Perihal:
    // Strip prefixes: "Perihal :", "Hal :", "Tentang :"
    // Ensure it NEVER contains file names or extensions
    if (parsed.perihal) {
      let cleanedPerihal = parsed.perihal
        .replace(/^(perihal|hal|pokok|tentang)\s*[:=\-\s]*/i, '')
        .replace(/\.(pdf|jpe?g|png|docx?|xlsx?)$/i, '')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .trim();

      if (/^(img[_\-\s]?\d+|whatsapp[_\-\s]?image|screenshot|scan[_\-\s]?\d*|doc[_\-\s]?\d*|file[_\-\s]?\d*|image[_\-\s]?\d*)$/i.test(cleanedPerihal) || cleanedPerihal.length < 5) {
        cleanedPerihal = 'Penyampaian Informasi dan Koordinasi Kedinasan Sekolah';
      }
      parsed.perihal = cleanedPerihal;
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('OCR Extraction error:', error);
    return res.status(500).json({
      error: error.message || 'Terjadi kesalahan saat memproses ekstraksi surat.',
    });
  }
});

// Setup Vite middlewares in dev or serve static files in production
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Agenda Surat Sekolah running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
