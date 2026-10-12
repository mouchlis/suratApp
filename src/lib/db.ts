import { MailItem, MailType, SchoolProfile } from '../types';
import { DEFAULT_SCHOOL_PROFILE, INITIAL_MAIL_ITEMS } from './sampleData';

const DB_NAME = 'AgendaSuratSekolahDB';
const DB_VERSION = 1;
const STORE_MAILS = 'mails';
const STORE_SETTINGS = 'settings';

let dbInstance: IDBDatabase | null = null;
let useLocalStorageFallback = false;

// LocalStorage Keys for fallback
const LS_MAILS = 'agenda_fallback_mails';
const LS_PROFILE = 'agenda_fallback_profile';

function isIndexedDBSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (!isIndexedDBSupported()) {
    useLocalStorageFallback = true;
    throw new Error('IndexedDB tidak didukung pada peramban ini');
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store mails
        if (!db.objectStoreNames.contains(STORE_MAILS)) {
          const mailStore = db.createObjectStore(STORE_MAILS, { keyPath: 'id' });
          mailStore.createIndex('type', 'type', { unique: false });
          mailStore.createIndex('nomorAgenda', 'nomorAgenda', { unique: false });
          mailStore.createIndex('tanggalSurat', 'tanggalSurat', { unique: false });
          mailStore.createIndex('sifat', 'sifat', { unique: false });
          mailStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store settings (e.g. school profile)
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB gagal dibuka, beralih ke fallback localStorage:', (event.target as IDBOpenDBRequest).error);
        useLocalStorageFallback = true;
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      useLocalStorageFallback = true;
      reject(err);
    }
  });
}

// Initialise and Seed DB if empty
export async function initDatabase(): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MAILS, STORE_SETTINGS], 'readwrite');
      const mailStore = transaction.objectStore(STORE_MAILS);
      const countRequest = mailStore.count();

      countRequest.onsuccess = () => {
        if (countRequest.result === 0) {
          // Seed default mail records
          INITIAL_MAIL_ITEMS.forEach((item) => {
            mailStore.put(item);
          });

          // Seed school profile
          const settingsStore = transaction.objectStore(STORE_SETTINGS);
          settingsStore.put({ key: 'school_profile', value: DEFAULT_SCHOOL_PROFILE });
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => {
        console.warn('Gagal seed ke IndexedDB, beralih ke fallback:', e);
        useLocalStorageFallback = true;
        seedFallbackLocalStorage();
        resolve();
      };
    });
  } catch (err) {
    console.warn('Menggunakan fallback penyimpanan lokal:', err);
    useLocalStorageFallback = true;
    seedFallbackLocalStorage();
  }
}

function seedFallbackLocalStorage() {
  try {
    if (!localStorage.getItem(LS_MAILS)) {
      localStorage.setItem(LS_MAILS, JSON.stringify(INITIAL_MAIL_ITEMS));
    }
    if (!localStorage.getItem(LS_PROFILE)) {
      localStorage.setItem(LS_PROFILE, JSON.stringify(DEFAULT_SCHOOL_PROFILE));
    }
  } catch (e) {
    console.error('LocalStorage quota or access error:', e);
  }
}

// Get all mails
export async function getAllMails(): Promise<MailItem[]> {
  if (useLocalStorageFallback) {
    try {
      const raw = localStorage.getItem(LS_MAILS);
      const items: MailItem[] = raw ? JSON.parse(raw) : INITIAL_MAIL_ITEMS;
      return items.sort((a, b) => new Date(b.tanggalSurat).getTime() - new Date(a.tanggalSurat).getTime());
    } catch {
      return [...INITIAL_MAIL_ITEMS];
    }
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MAILS, 'readonly');
      const store = transaction.objectStore(STORE_MAILS);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as MailItem[]).sort((a, b) => {
          return new Date(b.tanggalSurat).getTime() - new Date(a.tanggalSurat).getTime();
        });
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    const raw = localStorage.getItem(LS_MAILS);
    const items: MailItem[] = raw ? JSON.parse(raw) : INITIAL_MAIL_ITEMS;
    return items;
  }
}

// Get mail by type
export async function getMailsByType(type: MailType): Promise<MailItem[]> {
  const all = await getAllMails();
  return all.filter((item) => item.type === type);
}

// Get single mail
export async function getMailById(id: string): Promise<MailItem | undefined> {
  const all = await getAllMails();
  return all.find((item) => item.id === id);
}

// Save or Update mail
export async function saveMail(mail: MailItem): Promise<MailItem> {
  const now = new Date().toISOString();
  const itemToSave: MailItem = {
    ...mail,
    updatedAt: now,
    createdAt: mail.createdAt || now,
  };

  if (useLocalStorageFallback) {
    const all = await getAllMails();
    const index = all.findIndex((m) => m.id === itemToSave.id);
    if (index >= 0) {
      all[index] = itemToSave;
    } else {
      all.push(itemToSave);
    }
    localStorage.setItem(LS_MAILS, JSON.stringify(all));
    return itemToSave;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MAILS, 'readwrite');
      const store = transaction.objectStore(STORE_MAILS);
      const request = store.put(itemToSave);

      request.onsuccess = () => resolve(itemToSave);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const all = await getAllMails();
    const index = all.findIndex((m) => m.id === itemToSave.id);
    if (index >= 0) all[index] = itemToSave;
    else all.push(itemToSave);
    localStorage.setItem(LS_MAILS, JSON.stringify(all));
    return itemToSave;
  }
}

// Delete mail
export async function deleteMail(id: string): Promise<void> {
  if (useLocalStorageFallback) {
    const all = await getAllMails();
    const filtered = all.filter((m) => m.id !== id);
    localStorage.setItem(LS_MAILS, JSON.stringify(filtered));
    return;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MAILS, 'readwrite');
      const store = transaction.objectStore(STORE_MAILS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const all = await getAllMails();
    const filtered = all.filter((m) => m.id !== id);
    localStorage.setItem(LS_MAILS, JSON.stringify(filtered));
  }
}

// Get next auto-increment agenda number for current year
export async function getNextAgendaNumber(type: MailType, year?: string): Promise<string> {
  const targetYear = year || new Date().getFullYear().toString();
  const mails = await getMailsByType(type);
  const suffix = type === 'masuk' ? 'SM' : 'SK';

  let maxNum = 0;
  mails.forEach((m) => {
    if (m.nomorAgenda && m.nomorAgenda.includes(`/${suffix}/${targetYear}`)) {
      const match = m.nomorAgenda.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  const padded = nextNum.toString().padStart(3, '0');
  return `${padded}/${suffix}/${targetYear}`;
}

// School Profile
export async function getSchoolProfile(): Promise<SchoolProfile> {
  if (useLocalStorageFallback) {
    try {
      const raw = localStorage.getItem(LS_PROFILE);
      return raw ? JSON.parse(raw) : DEFAULT_SCHOOL_PROFILE;
    } catch {
      return DEFAULT_SCHOOL_PROFILE;
    }
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('school_profile');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve(request.result.value as SchoolProfile);
        } else {
          resolve(DEFAULT_SCHOOL_PROFILE);
        }
      };
      request.onerror = () => resolve(DEFAULT_SCHOOL_PROFILE);
    });
  } catch {
    return DEFAULT_SCHOOL_PROFILE;
  }
}

export async function saveSchoolProfile(profile: SchoolProfile): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
    return;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.put({ key: 'school_profile', value: profile });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
  }
}

// Reset database to initial sample data
export async function resetDatabase(): Promise<void> {
  if (useLocalStorageFallback) {
    localStorage.setItem(LS_MAILS, JSON.stringify(INITIAL_MAIL_ITEMS));
    localStorage.setItem(LS_PROFILE, JSON.stringify(DEFAULT_SCHOOL_PROFILE));
    return;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MAILS, STORE_SETTINGS], 'readwrite');
      const mailStore = transaction.objectStore(STORE_MAILS);
      const settingsStore = transaction.objectStore(STORE_SETTINGS);

      mailStore.clear();
      settingsStore.clear();

      INITIAL_MAIL_ITEMS.forEach((item) => {
        mailStore.put(item);
      });
      settingsStore.put({ key: 'school_profile', value: DEFAULT_SCHOOL_PROFILE });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    localStorage.setItem(LS_MAILS, JSON.stringify(INITIAL_MAIL_ITEMS));
    localStorage.setItem(LS_PROFILE, JSON.stringify(DEFAULT_SCHOOL_PROFILE));
  }
}

// Full backup exporter / importer
export async function exportDatabaseBackup(): Promise<string> {
  const mails = await getAllMails();
  const profile = await getSchoolProfile();

  const backup = {
    appName: 'Agenda Surat Sekolah',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    schoolProfile: profile,
    mails: mails,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ count: number }> {
  const parsed = JSON.parse(jsonString);
  if (!parsed.mails || !Array.isArray(parsed.mails)) {
    throw new Error('Format file backup tidak valid. Dokumen harus memuat data mails.');
  }

  if (useLocalStorageFallback) {
    if (parsed.schoolProfile) {
      localStorage.setItem(LS_PROFILE, JSON.stringify(parsed.schoolProfile));
    }
    localStorage.setItem(LS_MAILS, JSON.stringify(parsed.mails));
    return { count: parsed.mails.length };
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MAILS, STORE_SETTINGS], 'readwrite');
      const mailStore = transaction.objectStore(STORE_MAILS);
      const settingsStore = transaction.objectStore(STORE_SETTINGS);

      if (parsed.schoolProfile) {
        settingsStore.put({ key: 'school_profile', value: parsed.schoolProfile });
      }

      parsed.mails.forEach((m: MailItem) => {
        mailStore.put(m);
      });

      transaction.oncomplete = () => {
        resolve({ count: parsed.mails.length });
      };

      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    if (parsed.schoolProfile) {
      localStorage.setItem(LS_PROFILE, JSON.stringify(parsed.schoolProfile));
    }
    localStorage.setItem(LS_MAILS, JSON.stringify(parsed.mails));
    return { count: parsed.mails.length };
  }
}
