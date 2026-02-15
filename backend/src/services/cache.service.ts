import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

class CacheService {
    private client: Redis;
    private isConnected: boolean = false;

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            lazyConnect: true, // Don't connect immediately on instantiation
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('Redis Cache connected');
        });

        this.client.on('error', (err) => {
            this.isConnected = false;
            logger.error('Redis Cache error', { error: err.message });
        });

        // Initialize connection
        this.connect();
    }

    private async connect() {
        try {
            await this.client.connect();
        } catch (error: any) {
            logger.error('Failed to connect to Redis Cache', { error: error.message });
        }
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!this.isConnected) return null;
            const data = await this.client.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            logger.error(`Cache GET error for key: ${key}`, { error });
            return null;
        }
    }

    /**
     * Set value in cache
     * @param ttl Time to live in seconds (default: 3600 - 1 hour)
     */
    async set(key: string, value: any, ttl: number = 3600): Promise<void> {
        try {
            if (!this.isConnected) return;
            const data = JSON.stringify(value);
            await this.client.setex(key, ttl, data);
        } catch (error) {
            logger.error(`Cache SET error for key: ${key}`, { error });
        }
    }

    /**
     * Delete value from cache
     */
    async del(key: string): Promise<void> {
        try {
            if (!this.isConnected) return;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Cache DEL error for key: ${key}`, { error });
        }
    }

    /**
     * Delete keys by pattern
     * Use with caution!
     */
    async delByPattern(pattern: string): Promise<void> {
        try {
            if (!this.isConnected) return;
            const stream = this.client.scanStream({
                match: pattern,
                count: 100
            });

            stream.on('data', async (keys: string[]) => {
                if (keys.length) {
                    const pipeline = this.client.pipeline();
                    keys.forEach((key) => {
                        pipeline.del(key);
                    });
                    await pipeline.exec();
                }
            });

            stream.on('end', () => {
                logger.debug(`Cache cleared for pattern: ${pattern}`);
            });

        } catch (error) {
            logger.error(`Cache DEL PATTERN error: ${pattern}`, { error });
        }
    }

    /**
     * Clear all cache
     */
    async flush(): Promise<void> {
        try {
            if (!this.isConnected) return;
            await this.client.flushall();
            logger.warn('Cache flushed');
        } catch (error) {
            logger.error('Cache FLUSH error', { error });
        }
    }
}

export default new CacheService();
