const DB_NAME = 'ChisaAIChatDB';
const DB_VERSION = 2;
const STORE_NAME = 'chatHistory';

export type ChisaAIChatRecord = {
	key: string; // `${userId}::${chatId}`
	userId: string;
	chatId: string;
	messages: unknown[];
	createdAt: number;
	updatedAt: number;
};

export type ChisaAIChatSummary = Pick<
	ChisaAIChatRecord,
	'chatId' | 'createdAt' | 'updatedAt'
> & {
	messageCount: number;
};

const makeKey = (userId: string, chatId: string) => `${userId}::${chatId}`;

class ChisaAIStorage {
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
					const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
					store.createIndex('userId', 'userId', { unique: false });
					store.createIndex('updatedAt', 'updatedAt', { unique: false });
				}
			};
		});
	}

	async get(userId: string, chatId: string): Promise<ChisaAIChatRecord | null> {
		if (!userId || !chatId) return null;
		if (!this.db) await this.init();

		return new Promise((resolve) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(makeKey(userId, chatId));

			request.onsuccess = () => {
				resolve((request.result as ChisaAIChatRecord) ?? null);
			};
			request.onerror = () => resolve(null);
		});
	}

	async set(userId: string, chatId: string, messages: unknown[]): Promise<void> {
		if (!userId || !chatId) return;
		if (!this.db) await this.init();

		const key = makeKey(userId, chatId);

		const existing = await this.get(userId, chatId);
		const now = Date.now();
		const record: ChisaAIChatRecord = {
			key,
			userId,
			chatId,
			messages,
			createdAt: existing?.createdAt ?? now,
			updatedAt: now,
		};

		return new Promise((resolve) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			store.put(record);
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => resolve();
		});
	}

	async delete(userId: string, chatId: string): Promise<void> {
		if (!userId || !chatId) return;
		if (!this.db) await this.init();

		return new Promise((resolve) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			store.delete(makeKey(userId, chatId));
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => resolve();
		});
	}

	async listByUser(userId: string, limit = 20): Promise<ChisaAIChatSummary[]> {
		if (!userId) return [];
		if (!this.db) await this.init();

		return new Promise((resolve) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('userId');
			const request = index.getAll(IDBKeyRange.only(userId));

			request.onsuccess = () => {
				const records = (request.result as ChisaAIChatRecord[]) ?? [];
				const summaries = records
					.sort((a, b) => b.updatedAt - a.updatedAt)
					.slice(0, limit)
					.map((r) => ({
						chatId: r.chatId,
						createdAt: r.createdAt,
						updatedAt: r.updatedAt,
						messageCount: Array.isArray(r.messages) ? r.messages.length : 0,
					}));
				resolve(summaries);
			};

			request.onerror = () => resolve([]);
		});
	}

	async deleteAllByUser(userId: string): Promise<void> {
		if (!userId) return;
		if (!this.db) await this.init();

		const chats = await this.listByUser(userId, Number.MAX_SAFE_INTEGER);
		await Promise.all(chats.map((c) => this.delete(userId, c.chatId)));
	}

	async pruneUserChats(userId: string, maxChats = 20): Promise<void> {
		if (!userId) return;
		if (maxChats < 1) return;

		const chats = await this.listByUser(userId, Number.MAX_SAFE_INTEGER);
		const toDelete = chats.sort((a, b) => b.updatedAt - a.updatedAt).slice(maxChats);
		await Promise.all(toDelete.map((c) => this.delete(userId, c.chatId)));
	}
}

export const chisaAIStorage = new ChisaAIStorage();
