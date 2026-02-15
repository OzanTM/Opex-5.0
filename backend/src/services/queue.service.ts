import Queue from 'bull';
import config from '../config';
import logger from '../utils/logger';

/**
 * Initialize queues
 */
export const emailQueue = new Queue('email-queue', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Queue event listeners
emailQueue.on('error', (error) => {
    logger.error('Email queue error', { error: error.message });
});

emailQueue.on('active', (job) => {
    logger.info(`Processing email job ${job.id}`, { type: job.name });
});

emailQueue.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, error) => {
    logger.error(`Email job ${job.id} failed`, { error: error.message });
});
