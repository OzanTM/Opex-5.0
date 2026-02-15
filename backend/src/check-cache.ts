import cacheService from './services/cache.service';
import suggestionService from './services/suggestion.service';
import logger from './utils/logger';

async function checkCache() {
    try {
        logger.info('Testing Redis Cache...');

        // 1. Clear all cache
        await cacheService.flush();

        // 2. Fetch suggestions (Cache Miss)
        console.time('First Fetch (DB)');
        const result1 = await suggestionService.getSuggestions({});
        console.timeEnd('First Fetch (DB)');
        logger.info(`Fetched ${result1.total} suggestions`);

        // 3. Fetch suggestions again (Cache Hit)
        console.time('Second Fetch (Cache)');
        const result2 = await suggestionService.getSuggestions({});
        console.timeEnd('Second Fetch (Cache)');

        // 4. Verify Cache
        const cacheKey = `suggestions:list:${JSON.stringify({})}`;
        const cachedValue = await cacheService.get(cacheKey);

        if (cachedValue) {
            logger.info('✅ Cache HIT verified!');
        } else {
            logger.error('❌ Cache MISS (Expected Hit)');
        }

    } catch (error) {
        logger.error('Cache check failed', { error });
    } finally {
        // Close redis connection (if exposed or rely on timeout)
        process.exit(0);
    }
}

checkCache();
