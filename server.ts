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
    const { fileData, fileType, fileName } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data diperlukan untuk analisis.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di lingkungan server.',
      });
    }

    // Extract base64 part if it contains a data URL prefix
    let base64Content = fileData;
    let mime = fileType || 'image/jpeg';

    if (fileData.includes('base64,')) {
      const parts = fileData.split('base64,');
      base64Content = parts[1];
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1];
      }
    }

    // Call Gemini 3.8 Flash to extract letter fields
    const promptText = `
Anda adalah asisten cerdas kearsipan tata usaha persuratan dinas dan satuan pendidikan sekolah di Indonesia.
Analisis DOKUMEN SURAT terlampir dan ekstrak informasi kearsipan resmi:

ATURAN UTAMA UNTUK KOLOM PERIHAL / POKOK ISI SURAT:
- "perihal": WAJIB berisi perihal resmi surat atau pokok/tujuan utama isi surat yang sesungguhnya.
- Bacalah baris "Perihal:", "Hal:", atau baca kalimat pembuka dan isi paragraf surat untuk mengetahui apa topik surat tersebut (contoh yang benar: "Undangan Sosialisasi Kurikulum Pembelajaran", "Pemberitahuan Pelaksanaan Asesmen Nasional", "Permohonan Bantuan Sarana Prasarana", "Edaran Hari Libur dan Pembagian Rapor", "Laporan Pertanggungjawaban Dana BOS").
- DILARANG KERAS mengisi kolom "perihal" dengan nama file (seperti "scan.pdf", "surat.jpg", "IMG_...", "WhatsApp Image...", dll).
- Jika pada dokumen tidak tertulis kata "Perihal:" secara tersurat, simpulkan dari inti tujuan surat tersebut (maksimal 10-15 kata).

INFORMASI YANG DIEKSTRAK:
1. nomorSurat: Nomor surat resmi dinas yang tertera pada surat (contoh: "421.3/145/Disdik/2026", "800/092/SMAN1/2026").
2. tanggalSurat: Tanggal surat diterbitkan dalam format baku YYYY-MM-DD.
3. pengirim: Nama lengkap instansi, dinas, kementerian, organisasi, atau pejabat penandatangan pengirim surat.
4. perihal: Pokok masalah / hal / isi inti dari surat tersebut (BUKAN nama file dokumen).
5. sifat: Klasifikasikan sifat surat ke salah satu dari: "Biasa", "Penting", "Segera", "Rahasia", "Edaran", "Undangan", atau "Pemberitahuan".
6. keterangan: Ringkasan singkat 1-2 kalimat mengenai pokok surat atau arahan tindak lanjut.
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Content,
                mimeType: mime,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomorSurat: {
              type: Type.STRING,
              description: 'Nomor surat resmi yang tertera di dokumen',
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
              description: 'Perihal atau pokok isi surat',
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
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      return res.status(500).json({ error: 'Tidak ada respons dari model AI.' });
    }

    const parsed = JSON.parse(outputText.trim());

    // Sanitize perihal: ensure it is not a filename
    if (parsed.perihal) {
      parsed.perihal = parsed.perihal.replace(/\.(pdf|jpe?g|png|docx?|xlsx?)$/i, '').trim();
      if (/^(img[_-]?\d+|whatsapp[_-]?image|screenshot|scan[_-]?\d*|doc[_-]?\d*|file[_-]?\d*|image[_-]?\d*)$/i.test(parsed.perihal)) {
        parsed.perihal = 'Pemberitahuan / Informasi Kedinasan Sekolah';
      }
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
