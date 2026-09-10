const DB_NAME = 'lotm-personal-reader';
const DB_VERSION = 1;
const BOOK_STORE = 'books';
const ACTIVE_BOOK_ID = 'active';

export type StoredEpubRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  savedAt: number;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOK_STORE)) {
        db.createObjectStore(BOOK_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open reader database.'));
  });
}

export async function saveActiveEpub(file: File): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(BOOK_STORE, 'readwrite');
      const store = transaction.objectStore(BOOK_STORE);
      const record: StoredEpubRecord = {
        id: ACTIVE_BOOK_ID,
        name: file.name,
        type: file.type || 'application/epub+zip',
        size: file.size,
        lastModified: file.lastModified,
        savedAt: Date.now(),
        blob: file,
      };
      store.put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save EPUB locally.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving EPUB was aborted.'));
    });
  } finally {
    db.close();
  }
}

export async function loadActiveEpub(): Promise<File | null> {
  const db = await openDatabase();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const transaction = db.transaction(BOOK_STORE, 'readonly');
      const request = transaction.objectStore(BOOK_STORE).get(ACTIVE_BOOK_ID);
      request.onsuccess = () => {
        const record = request.result as StoredEpubRecord | undefined;
        if (!record) return resolve(null);
        resolve(new File([record.blob], record.name, {
          type: record.type || 'application/epub+zip',
          lastModified: record.lastModified,
        }));
      };
      request.onerror = () => reject(request.error ?? new Error('Unable to restore EPUB.'));
    });
  } finally {
    db.close();
  }
}

export async function clearActiveEpub(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(BOOK_STORE, 'readwrite');
      transaction.objectStore(BOOK_STORE).delete(ACTIVE_BOOK_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to remove cached EPUB.'));
    });
  } finally {
    db.close();
  }
}
