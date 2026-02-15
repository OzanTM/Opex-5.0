import analyticsService from './services/analytics.service';
import logger from './utils/logger';

async function checkAnalytics() {
    try {
        logger.info('Refreshing views...');
        await analyticsService.refreshViews();

        logger.info('Fetching Monthly Stats...');
        const monthlyStats = await analyticsService.getMonthlyStats();
        console.table(monthlyStats);

        logger.info('Fetching Top Contributors...');
        const topUsers = await analyticsService.getTopContributors();
        console.table(topUsers);

        if (monthlyStats.length > 0 && topUsers.length > 0) {
            logger.info('✅ Analytics verification SUCCESS');
        } else {
            logger.warn('⚠️ Analytics verification returned empty results (maybe expected if seed failed)');
        }

    } catch (error) {
        logger.error('Analytics verification failed', { error });
    } finally {
        process.exit(0);
    }
}

checkAnalytics();
