const DB_NAME = 'AuthDB';
const DB_VERSION = 1;
const TOKEN_STORE = 'access_tokens';
const USER_STORE = 'users';

interface SessionData {
  token: string;
  user_id: string;
  created_at: number;
}

class MultiSessionService {
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

        if (!db.objectStoreNames.contains(TOKEN_STORE)) {
          const tokenStore = db.createObjectStore(TOKEN_STORE, { keyPath: 'token' });
          tokenStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(USER_STORE)) {
          db.createObjectStore(USER_STORE, { keyPath: 'UserID' });
        }
      };
    });
  }

  // Helper method to wrap IDBRequest in a Promise
  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Helper method to wait for transaction completion
  private transactionComplete(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async createSession(token: string, user: any): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([TOKEN_STORE, USER_STORE], 'readwrite');

    const tokenRequest = tx.objectStore(TOKEN_STORE).put({
      token,
      user_id: user.UserID,
      created_at: Date.now(),
    } as SessionData);

    const userRequest = tx.objectStore(USER_STORE).put(user);

    // Wait for both operations to complete
    await Promise.all([
      this.requestToPromise(tokenRequest),
      this.requestToPromise(userRequest),
    ]);

    // Wait for transaction to complete
    await this.transactionComplete(tx);
  }

  async getUserByToken(token: string): Promise<any | null> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([TOKEN_STORE], 'readonly');
    const tokenStore = tx.objectStore(TOKEN_STORE);

    const session: SessionData | undefined = await this.requestToPromise(tokenStore.get(token));
    if (!session) return null;

    const userTx = this.db!.transaction([USER_STORE], 'readonly');
    const userStore = userTx.objectStore(USER_STORE);
    return await this.requestToPromise(userStore.get(session.user_id));
  }

  async getAllSessions(): Promise<SessionData[]> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([TOKEN_STORE], 'readonly');
    const store = tx.objectStore(TOKEN_STORE);
    return await this.requestToPromise(store.getAll());
  }

  async getAllUsers(): Promise<any[]> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([USER_STORE], 'readonly');
    const store = tx.objectStore(USER_STORE);
    return await this.requestToPromise(store.getAll());
  }

  async updateUser(user: any): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([USER_STORE], 'readwrite');
    const store = tx.objectStore(USER_STORE);

    await this.requestToPromise(store.put(user));
    await this.transactionComplete(tx);
  }

  async deleteSession(token: string): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([TOKEN_STORE], 'readwrite');
    const store = tx.objectStore(TOKEN_STORE);

    await this.requestToPromise(store.delete(token));
    await this.transactionComplete(tx);
  }

  async deleteSessionsByUser(userID: string): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction([TOKEN_STORE], 'readwrite');
    const store = tx.objectStore(TOKEN_STORE);

    const sessions: SessionData[] = await this.requestToPromise(store.getAll());

    const deletePromises = sessions
      .filter((s) => s.user_id === userID)
      .map((s) => this.requestToPromise(store.delete(s.token)));

    await Promise.all(deletePromises);
    await this.transactionComplete(tx);
  }

  async deleteUserCompletely(userID: string): Promise<void> {
    await this.deleteSessionsByUser(userID);
    
    if (!this.db) await this.init();

    const tx = this.db!.transaction([USER_STORE], 'readwrite');
    const store = tx.objectStore(USER_STORE);

    await this.requestToPromise(store.delete(userID));
    await this.transactionComplete(tx);
  }
}

export const multiSessionService = new MultiSessionService();
