import { emailQueue } from './services/queue.service';
import logger from './utils/logger';

async function checkQueue() {
    try {
        logger.info('Checking Redis connection...');
        const client = await emailQueue.client;
        await client.ping();
        logger.info('Redis connection successful');

        const jobCounts = await emailQueue.getJobCounts();
        logger.info('Queue job counts:', jobCounts);

        // Add a test job
        const job = await emailQueue.add('send-email', {
            to: 'test@example.com',
            subject: 'Redis Check',
            body: '<h1>Redis is working!</h1>'
        });
        logger.info(`Test job added with ID: ${job.id}`);

    } catch (error) {
        logger.error('Redis check failed', { error });
    } finally {
        await emailQueue.close();
        process.exit(0);
    }
}

checkQueue();
