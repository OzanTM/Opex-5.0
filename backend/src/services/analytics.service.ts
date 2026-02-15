import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class AnalyticsService {
    /**
     * Refresh Materialized Views
     * Should be called periodically (e.g., via cron)
     */
    async refreshViews(): Promise<void> {
        try {
            logger.info('Refreshing materialized views...');

            // Refresh concurrently to avoid locking table for reads
            await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_suggestion_stats');
            await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY user_performance_stats');

            logger.info('Materialized views refreshed successfully');
        } catch (error: any) {
            logger.error('Failed to refresh materialized views', { error: error.message });
            throw error;
        }
    }

    /**
     * Get monthly suggestion statistics
     */
    async getMonthlyStats(companyId?: number): Promise<any[]> {
        let query = 'SELECT * FROM monthly_suggestion_stats';

        if (companyId) {
            query += ` WHERE company_id = ${companyId}`;
        }

        query += ' ORDER BY month DESC';

        return prisma.$queryRawUnsafe(query);
    }

    /**
     * Get top performing users
     */
    async getTopContributors(limit: number = 10): Promise<any[]> {
        return prisma.$queryRawUnsafe(`
            SELECT 
                ups.*,
                u.first_name,
                u.last_name,
                u.email,
                u.avatar
            FROM user_performance_stats ups
            JOIN users u ON ups.user_id = u.id
            ORDER BY ups.total_suggestions DESC
            LIMIT ${limit}
        `);
    }
}

export default new AnalyticsService();
