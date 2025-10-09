/**
 * IndexedDB 字库存储工具类
 */
class HanziDB {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'hanzi_writer_db';
    private readonly DB_VERSION = 1;
    private readonly STORE_NAME = 'hanzi_data';

    // 打开数据库连接
    private async openDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                // 创建存储对象
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    // 存储数据 - 添加JSON序列化
    async set(key: string, value: any): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            try {
                // 将对象序列化为JSON字符串
                const serializedValue = JSON.stringify(value);
                const request = store.put(serializedValue, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 获取数据 - 添加JSON反序列化
    async get(key: string): Promise<any | null> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                try {
                    const result = request.result;
                    // 如果结果是字符串，则尝试解析为JSON对象
                    resolve(result ? JSON.parse(result) : null);
                } catch (error) {
                    // 如果解析失败，直接返回原始结果
                    resolve(request.result);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // 检查是否存在
    async has(key: string): Promise<boolean> {
        const data = await this.get(key);
        return data !== undefined && data !== null;
    }

    // 清除所有数据
    async clear(): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// 创建单例实例
export const hanziDB = new HanziDB();

export default HanziDB;
