import { MailItem, MailType, SchoolProfile } from '../types';

export function downloadFile(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToCSV(mails: MailItem[], type: MailType | 'all', schoolName: string): void {
  const isMasuk = type === 'masuk';
  const isKeluar = type === 'keluar';

  let headers: string[];
  if (isMasuk) {
    headers = [
      'No. Agenda',
      'Nomor Surat',
      'Tanggal Surat',
      'Tanggal Diterima',
      'Pengirim',
      'Perihal',
      'Sifat Surat',
      'Keterangan',
      'Nama File Lampiran',
      'Status Disposisi',
      'Tujuan Disposisi',
    ];
  } else if (isKeluar) {
    headers = [
      'No. Agenda',
      'Nomor Surat',
      'Tanggal Surat',
      'Tanggal Dikirim',
      'Tujuan Penerima',
      'Perihal',
      'Sifat Surat',
      'Keterangan',
      'Nama File Lampiran',
    ];
  } else {
    headers = [
      'Jenis Surat',
      'No. Agenda',
      'Nomor Surat',
      'Tanggal Surat',
      'Pengirim / Tujuan',
      'Perihal',
      'Sifat Surat',
      'Keterangan',
      'Nama File Lampiran',
    ];
  }

  const rows = mails.map((m) => {
    if (isMasuk) {
      return [
        m.nomorAgenda || '',
        m.nomorSurat || '',
        m.tanggalSurat || '',
        m.tanggalDiterima || '',
        m.pengirim || '',
        m.perihal || '',
        m.sifat || '',
        m.keterangan || '',
        m.file?.fileName || 'Tidak Ada File',
        m.disposisi?.status || 'Belum Disposisi',
        m.disposisi?.tujuanDisposisi || '-',
      ];
    } else if (isKeluar) {
      return [
        m.nomorAgenda || '',
        m.nomorSurat || '',
        m.tanggalSurat || '',
        m.tanggalKirim || '',
        m.tujuan || '',
        m.perihal || '',
        m.sifat || '',
        m.keterangan || '',
        m.file?.fileName || 'Tidak Ada File',
      ];
    } else {
      return [
        m.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar',
        m.nomorAgenda || '',
        m.nomorSurat || '',
        m.tanggalSurat || '',
        m.type === 'masuk' ? m.pengirim || '' : m.tujuan || '',
        m.perihal || '',
        m.sifat || '',
        m.keterangan || '',
        m.file?.fileName || 'Tidak Ada File',
      ];
    }
  });

  // Escape quotes and wrap in quotes for CSV compliance
  const formatCell = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const headerRow = headers.map(formatCell).join(';');
  const dataRows = rows.map((r) => r.map(formatCell).join(';')).join('\r\n');

  // Prefix with UTF-8 BOM so MS Excel opens with proper encoding
  const csvContent = '\uFEFF' + headerRow + '\r\n' + dataRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const nowStr = new Date().toISOString().slice(0, 10);
  const typeLabel = type === 'masuk' ? 'Surat_Masuk' : type === 'keluar' ? 'Surat_Keluar' : 'Semua_Surat';
  const fileName = `Agenda_${typeLabel}_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${nowStr}.csv`;

  downloadFile(url, fileName);
  URL.revokeObjectURL(url);
}

// Generate printable HTML for Agenda Book (Buku Agenda Resmi)
export function printAgendaBook(mails: MailItem[], type: MailType, profile: SchoolProfile, periodLabel?: string): void {
  const isMasuk = type === 'masuk';
  const title = isMasuk ? 'BUKU AGENDA SURAT MASUK' : 'BUKU AGENDA SURAT KELUAR';

  const rowsHtml = mails
    .map(
      (m, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-weight: 600;">${m.nomorAgenda}</td>
      <td>${m.nomorSurat}</td>
      <td>${m.tanggalSurat}</td>
      <td>${isMasuk ? m.tanggalDiterima || '-' : m.tanggalKirim || '-'}</td>
      <td>${isMasuk ? m.pengirim || '-' : m.tujuan || '-'}</td>
      <td>${m.perihal}</td>
      <td style="text-align: center;">
        <span style="display:inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; background: #f1f5f9; border: 1px solid #cbd5e1;">
          ${m.sifat}
        </span>
      </td>
      <td>${m.file ? m.file.fileName : '-'}</td>
      ${isMasuk ? `<td>${m.disposisi ? `${m.disposisi.tujuanDisposisi} (${m.disposisi.status})` : '-'}</td>` : ''}
    </tr>
  `
    )
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title} - ${profile.namaSekolah}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
        .header h2 { margin: 4px 0; font-size: 14px; font-weight: normal; }
        .header p { margin: 2px 0; font-size: 11px; color: #475569; }
        .doc-title { text-align: center; margin: 16px 0 12px; }
        .doc-title h3 { margin: 0; font-size: 15px; text-decoration: underline; }
        .doc-title span { font-size: 11px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th, td { border: 1px solid #64748b; padding: 6px 8px; vertical-align: top; }
        th { background-color: #f1f5f9; font-weight: bold; text-align: left; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .footer-col { width: 40%; text-align: center; }
        @media print {
          @page { size: landscape; margin: 12mm; }
          body { margin: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${profile.namaSekolah}</h1>
        <h2>NPSN: ${profile.npsn}</h2>
        <p>${profile.alamat} | Telp: ${profile.telepon} | Email: ${profile.email}</p>
      </div>

      <div class="doc-title">
        <h3>${title}</h3>
        ${periodLabel ? `<div>${periodLabel}</div>` : ''}
        <span>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">No</th>
            <th style="width: 80px;">No. Agenda</th>
            <th style="width: 140px;">Nomor Surat</th>
            <th style="width: 75px;">Tgl Surat</th>
            <th style="width: 75px;">${isMasuk ? 'Tgl Terima' : 'Tgl Kirim'}</th>
            <th style="width: 150px;">${isMasuk ? 'Pengirim' : 'Tujuan'}</th>
            <th>Perihal</th>
            <th style="width: 65px; text-align: center;">Sifat</th>
            <th style="width: 110px;">Berkas File</th>
            ${isMasuk ? '<th style="width: 130px;">Disposisi</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="10" style="text-align:center; padding: 20px;">Tidak ada data surat</td></tr>'}
        </tbody>
      </table>

      <div class="footer" style="margin-top: 35px; width: 100%; display: table;">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 50%; text-align: left; padding-left: 30px;">
            <p>Mengetahui,</p>
            <p style="font-weight: bold;">Kepala Sekolah</p>
            <br><br><br>
            <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${profile.kepalaSekolah}</p>
            <p>NIP. ${profile.nipKepalaSekolah}</p>
          </div>
          <div style="display: table-cell; width: 50%; text-align: right; padding-right: 30px;">
            <p>Petugas Operator Agenda,</p>
            <p style="font-weight: bold;">Tata Usaha</p>
            <br><br><br>
            <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${profile.operatorNama}</p>
            <p>NIP / NIPTT: -</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

// Generate printable Indonesian school "LEMBAR DISPOSISI"
export function printLembarDisposisi(mail: MailItem, profile: SchoolProfile): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const disposisi = mail.disposisi;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Lembar Disposisi - ${mail.nomorAgenda}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; margin: 25px; color: #1e293b; line-height: 1.4; }
        .sheet { max-width: 750px; margin: 0 auto; border: 2px solid #0f172a; padding: 18px; }
        .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { margin: 0; font-size: 16px; text-transform: uppercase; }
        .header h2 { margin: 3px 0; font-size: 14px; }
        .header p { margin: 1px 0; font-size: 11px; color: #475569; }
        .title { text-align: center; margin: 10px 0 15px; font-weight: bold; font-size: 15px; text-decoration: underline; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .info-table td { border: 1px solid #334155; padding: 6px 10px; font-size: 12px; }
        .label { width: 22%; font-weight: bold; background: #f8fafc; }
        .disp-box { border: 1px solid #334155; padding: 10px; margin-bottom: 14px; min-height: 110px; }
        .disp-header { font-weight: bold; margin-bottom: 6px; font-size: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 15px; margin: 8px 0; font-size: 12px; }
        .checkbox-item { display: inline-flex; align-items: center; gap: 5px; }
        .square { display: inline-block; width: 14px; height: 14px; border: 1px solid #0f172a; text-align: center; line-height: 12px; font-size: 10px; }
        .footer-sign { margin-top: 25px; display: flex; justify-content: flex-end; }
        .sign-box { width: 260px; text-align: center; }
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <h1>${profile.namaSekolah}</h1>
          <h2>LEMBAR DISPOSISI SURAT</h2>
          <p>${profile.alamat} | NPSN: ${profile.npsn} | Telp: ${profile.telepon}</p>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">Surat Dari</td>
            <td colspan="3">${mail.pengirim || '-'}</td>
          </tr>
          <tr>
            <td class="label">Nomor Surat</td>
            <td style="width: 38%;">${mail.nomorSurat}</td>
            <td class="label" style="width: 18%;">No. Agenda</td>
            <td><strong>${mail.nomorAgenda}</strong></td>
          </tr>
          <tr>
            <td class="label">Tanggal Surat</td>
            <td>${mail.tanggalSurat}</td>
            <td class="label">Tgl Diterima</td>
            <td>${mail.tanggalDiterima || '-'}</td>
          </tr>
          <tr>
            <td class="label">Sifat Surat</td>
            <td colspan="3">
              <span class="square">${mail.sifat === 'Penting' ? '✓' : ''}</span> Penting &nbsp;&nbsp;
              <span class="square">${mail.sifat === 'Segera' ? '✓' : ''}</span> Segera &nbsp;&nbsp;
              <span class="square">${mail.sifat === 'Rahasia' ? '✓' : ''}</span> Rahasia &nbsp;&nbsp;
              <span class="square">${mail.sifat === 'Biasa' ? '✓' : ''}</span> Biasa
            </td>
          </tr>
          <tr>
            <td class="label">Perihal</td>
            <td colspan="3" style="font-weight: 600;">${mail.perihal}</td>
          </tr>
          <tr>
            <td class="label">Lampiran Berkas</td>
            <td colspan="3">${mail.file ? `${mail.file.fileName} (${(mail.file.fileSize / 1024).toFixed(1)} KB)` : 'Tidak Ada File'}</td>
          </tr>
        </table>

        <div class="disp-box">
          <div class="disp-header">DITERUSKAN KEPADA :</div>
          <div style="font-size: 13px; font-weight: bold; color: #1e3a8a; margin: 4px 0 8px;">
            ${disposisi?.tujuanDisposisi || '...........................................................................'}
          </div>
          <div class="checkbox-group">
            <span class="checkbox-item"><span class="square"></span> Waka Kurikulum</span>
            <span class="checkbox-item"><span class="square"></span> Waka Kesiswaan</span>
            <span class="checkbox-item"><span class="square"></span> Waka Sarpras</span>
            <span class="checkbox-item"><span class="square"></span> Waka Humas</span>
            <span class="checkbox-item"><span class="square"></span> Kepala Tata Usaha</span>
            <span class="checkbox-item"><span class="square"></span> Guru / Pembina</span>
          </div>
        </div>

        <div class="disp-box" style="min-height: 140px;">
          <div class="disp-header">PETUNJUK / INSTRUKSI KEPALA SEKOLAH :</div>
          <div style="font-size: 13px; margin: 6px 0; color: #0f172a; white-space: pre-wrap;">
            ${disposisi?.isiDisposisi || 'Mohon dipelajari, ditindaklanjuti, dan dikoordinasikan sesuai ketentuan.'}
          </div>
          ${disposisi?.catatan ? `<div style="font-size: 11px; color: #64748b; margin-top: 6px;">Catatan: ${disposisi.catatan}</div>` : ''}
          ${disposisi?.batasWaktu ? `<div style="font-size: 11px; color: #dc2626; margin-top: 4px; font-weight: bold;">Batas Waktu Penyelesaian: ${disposisi.batasWaktu}</div>` : ''}
        </div>

        <div class="footer-sign">
          <div class="sign-box">
            <p>Harapan, ${mail.tanggalDiterima || mail.tanggalSurat}</p>
            <p style="font-weight: bold; margin-bottom: 50px;">Kepala Sekolah,</p>
            <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${profile.kepalaSekolah}</p>
            <p style="font-size: 11px; color: #64748b;">NIP. ${profile.nipKepalaSekolah}</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
