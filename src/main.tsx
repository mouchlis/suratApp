import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
} catch (error) {
  console.error('Fatal initialization error:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090d16;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:20px;text-align:center;">
        <div style="max-width:400px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);padding:28px;border-radius:20px;">
          <h2 style="font-size:18px;margin-bottom:8px;font-weight:700;">Gagal Menampilkan Aplikasi</h2>
          <p style="font-size:13px;color:#94a3b8;margin-bottom:16px;">Terjadi kendala saat membaca data peramban. Silakan muat ulang.</p>
          <button onclick="localStorage.clear();window.location.reload();" style="background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:600;cursor:pointer;">Reset & Muat Ulang</button>
        </div>
      </div>
    `;
  }
}
