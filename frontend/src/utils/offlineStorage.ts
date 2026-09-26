/**
 * Offline Storage Utility using browser-native IndexedDB.
 * Used for caching photographic evidence and pending civic issue submissions
 * when offline, bypassing the 5MB quota limitation of localStorage.
 */

const DB_NAME = 'CivicMeshOfflineDB';
const DB_VERSION = 1;
const STORE_PHOTOS = 'offline_photos';
const STORE_QUEUE = 'offline_queue';

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Save an offline photo blob / dataUrl to IndexedDB
 */
export const saveOfflinePhoto = async (id: string, dataUrl: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.put({ id, dataUrl, savedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save photo to IndexedDB, fallback to in-memory:', err);
  }
};

/**
 * Retrieve an offline photo by ID from IndexedDB
 */
export const getOfflinePhoto = async (id: string): Promise<string | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get photo from IndexedDB:', err);
    return null;
  }
};

/**
 * Delete an offline photo by ID from IndexedDB
 */
export const deleteOfflinePhoto = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete photo from IndexedDB:', err);
  }
};

/**
 * Save a pending civic issue submission to the offline queue in IndexedDB
 */
export const saveQueuedIssue = async (issue: any): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.put(issue);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save issue to IndexedDB queue:', err);
  }
};

/**
 * Retrieve all pending queued issues from IndexedDB
 */
export const getQueuedIssues = async (): Promise<any[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve queued issues from IndexedDB:', err);
    return [];
  }
};

/**
 * Delete a queued issue by ID from IndexedDB after successful synchronization
 */
export const deleteQueuedIssue = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete queued issue from IndexedDB:', err);
  }
};

/**
 * Clear all cached offline data
 */
export const clearAllOfflineData = async (): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_PHOTOS, STORE_QUEUE], 'readwrite');
    tx.objectStore(STORE_PHOTOS).clear();
    tx.objectStore(STORE_QUEUE).clear();
  } catch (err) {
    console.warn('Failed to clear offline data from IndexedDB:', err);
  }
};
