const DB_NAME = 'bullmoney-spline-scene-store';
const STORE_NAME = 'sceneBlobs';
const DB_VERSION = 1;
const STORAGE_RETENTION_MS = 1000 * 60 * 60 * 24 * 3; // Keep scene blobs for ~3 days

type StoredSceneRecord = {
  scene: string;
  blob: Blob;
  savedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;
const pendingSceneStores = new Set<string>();

const isSceneStorageSupported = () =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openSceneDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  if (!isSceneStorageSupported()) {
    return Promise.reject(new Error('IndexedDB is unavailable'));
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'scene' });
        store.createIndex('savedAt', 'savedAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onblocked = () => {
      console.warn('[SceneStorage] IndexedDB upgrade blocked');
    };
  }).catch(error => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
};

const cleanupOldEntries = async (db: IDBDatabase) => {
  try {
    const threshold = Date.now() - STORAGE_RETENTION_MS;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('savedAt');

    index.openCursor().onsuccess = event => {
      const cursor = event.target.result as IDBCursorWithValue | null;
      if (!cursor) return;
      const record = cursor.value as StoredSceneRecord;
      if (record.savedAt < threshold) {
        cursor.delete();
      }
      cursor.continue();
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('[SceneStorage] cleanup failed', error);
  }
};

const storeSceneBlobInternal = async (scene: string, blob: Blob) => {
  if (!isSceneStorageSupported()) return;

  try {
    const db = await openSceneDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ scene, blob, savedAt: Date.now() });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await cleanupOldEntries(db);
  } catch (error) {
    console.warn('[SceneStorage] store failed', error);
  }
};

const scheduleIdleTask = (task: () => Promise<void> | void) => {
  const runner = () => Promise.resolve(task()).catch((error) => {
    console.warn('[SceneStorage] idle task failed', error);
  });

  if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
    (window as any).requestIdleCallback(runner, { timeout: 3000 });
  } else {
    setTimeout(runner, 1200);
  }
};

export const getStoredSceneBlob = async (scene: string): Promise<Blob | null> => {
  if (!isSceneStorageSupported()) return null;
  try {
    const db = await openSceneDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return await new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(scene);
      request.onsuccess = () => {
        const record = request.result as StoredSceneRecord | undefined;
        resolve(record?.blob ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[SceneStorage] read failed', error);
    return null;
  }
};

export const scheduleSceneStorageSave = (scene: string, blob: Blob) => {
  if (!isSceneStorageSupported()) return;
  if (pendingSceneStores.has(scene)) return;
  pendingSceneStores.add(scene);

  const run = async () => {
    try {
      await storeSceneBlobInternal(scene, blob.slice(0));
      console.log('[SceneStorage] Saved scene for fast reload:', scene);
    } catch (error) {
      console.warn('[SceneStorage] schedule save failed', error);
    } finally {
      pendingSceneStores.delete(scene);
    }
  };

  scheduleIdleTask(run);
};
