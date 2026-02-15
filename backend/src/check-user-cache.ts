import cacheService from './services/cache.service';
import { getUserProfile, getUserStats } from './services/user.service';
import logger from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserCache() {
    try {
        logger.info('Testing Redis User Cache...');

        const user = await prisma.user.findFirst();
        if (!user) {
            logger.error('No users found to test');
            return;
        }

        const userId = user.id;

        // 1. Clear cache
        await cacheService.del(`users:${userId}`);
        await cacheService.del(`users:${userId}:stats`);

        // 2. Fetch User Profile
        console.time('Profile Fetch (DB)');
        await getUserProfile(userId);
        console.timeEnd('Profile Fetch (DB)');

        // 3. Fetch User Profile again (Cache)
        console.time('Profile Fetch (Cache)');
        await getUserProfile(userId);
        console.timeEnd('Profile Fetch (Cache)');

        // 4. Fetch Stats
        console.time('Stats Fetch (DB)');
        await getUserStats(userId);
        console.timeEnd('Stats Fetch (DB)');

        // 5. Fetch Stats again (Cache)
        console.time('Stats Fetch (Cache)');
        await getUserStats(userId);
        console.timeEnd('Stats Fetch (Cache)');

        logger.info('✅ User Cache tests completed!');

    } catch (error) {
        logger.error('User Cache check failed', { error });
    } finally {
        process.exit(0);
    }
}

checkUserCache();
