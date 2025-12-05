import type { ExamInfo } from '@/types/schedule';

const DB_NAME = 'StudentExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'examCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface ExamCachedData {
  studentId: string;
  data: ExamInfo[];
  timestamp: number;
  expiry: number;
}

class ExamCacheService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'studentId' });
        }
      };
    });
  }

  async get(studentId: string, hasnet: boolean = true): Promise<ExamInfo[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(studentId);

      request.onsuccess = () => {
        const cached: ExamCachedData = request.result;
        if (cached && Date.now() < cached.expiry) {
          resolve(cached.data);
        } else {
            if (cached && hasnet) {
                this.delete(studentId);
                resolve(null);
            } else if (cached && !hasnet) {
                resolve(cached.data);
            } else {
                resolve(null);
            }
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  async getStale(studentId: string): Promise<ExamInfo[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(studentId);

      request.onsuccess = () => {
        const cached: ExamCachedData = request.result;
        resolve(cached ? cached.data : null);
      };

      request.onerror = () => resolve(null);
    });
  }

  async set(studentId: string, data: ExamInfo[]): Promise<void> {
    if (!this.db) await this.init();

    const cachedData: ExamCachedData = {
      studentId,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_DURATION,
    };

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(cachedData);
      transaction.oncomplete = () => resolve();
    });
  }

  async delete(studentId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(studentId);
      transaction.oncomplete = () => resolve();
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve();
    });
  }
}

export const examCacheService = new ExamCacheService();


