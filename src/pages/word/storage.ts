/**
 * IndexedDB 字库存储工具类
 */
class HanziDB {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'hanzi_writer_db';
    private readonly DB_VERSION = 3;
    private readonly STORE_NAME = 'hanzi_data';
    // 内存缓存，只缓存常用汉字
    private memoryCache: Map<string, any> = new Map();
    // 缓存容量限制
    private readonly MAX_CACHE_SIZE = 1000;
    // 上次访问时间记录
    private accessTimes: Map<string, number> = new Map();

    // 打开数据库连接
    private async openDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
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

    // 存储单个汉字数据
    async setChar(char: string, data: any): Promise<void> {
        try {
            // 更新内存缓存
            this.updateMemoryCache(char, data);

            // 异步存储到IndexedDB
            const db = await this.openDB();
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const serializedData = JSON.stringify(data);
            await store.put(serializedData, char);
        } catch (error) {
            console.error('存储汉字数据失败:', char, error);
        }
    }

    // 批量存储多个汉字数据
    async bulkSetChars(charMap: Record<string, any>): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            // 批量添加到IndexedDB
            Object.entries(charMap).forEach(([char, data]) => {
                const serializedData = JSON.stringify(data);
                store.put(serializedData, char);
                // 同时更新内存缓存
                this.updateMemoryCache(char, data);
            });

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('批量存储汉字数据失败:', error);
        }
    }

    // 获取单个汉字数据
    async getChar(char: string): Promise<any | null> {
        // 1. 优先从内存缓存获取
        if (this.memoryCache.has(char)) {
            this.accessTimes.set(char, Date.now());
            return this.memoryCache.get(char);
        }

        // 2. 从IndexedDB获取
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(char);

            return new Promise(resolve => {
                request.onsuccess = () => {
                    try {
                        const result = request.result;
                        if (result) {
                            const data = JSON.parse(result);
                            // 更新到内存缓存
                            this.updateMemoryCache(char, data);
                            resolve(data);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('解析汉字数据失败:', char, error);
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.error('读取汉字数据失败:', char, request.error);
                    resolve(null);
                };
            });
        } catch (error) {
            console.error('获取汉字数据异常:', char, error);
            return null;
        }
    }

    // 更新内存缓存，包含LRU淘汰策略
    private updateMemoryCache(char: string, data: any): void {
        this.memoryCache.set(char, data);
        this.accessTimes.set(char, Date.now());

        // 如果缓存超过容量，删除最久未使用的项
        if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
            const oldestChar = Array.from(this.accessTimes.entries()).sort(
                (a, b) => a[1] - b[1],
            )[0][0];
            this.memoryCache.delete(oldestChar);
            this.accessTimes.delete(oldestChar);
        }
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
                    console.log(error);
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
