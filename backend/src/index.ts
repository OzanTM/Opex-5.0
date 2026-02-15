import { PrismaClient } from '@prisma/client';
import config from './config';
import app from './app';
// import { requestLogger } from './utils/logger'; // Removed as it is used in app.ts
import { initializeEmailTransporter, initializeEmailTemplates } from './services/email.service';
import logger from './utils/logger';
import { emailQueue } from './services/queue.service';
import { processEmailJob } from './workers/email.worker';

const prisma = new PrismaClient();

// Initialize Email Worker
emailQueue.process('send-email', processEmailJob);
logger.info('Email worker initialized');

// ============================================
// STARTUP
// ============================================

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        // Initialize email service
        initializeEmailTransporter();
        await initializeEmailTemplates();
        logger.info('Email service initialized');

        // Start server
        app.listen(config.port, () => {
            logger.info(`OpEx 5.0 API server running on port ${config.port}`);
            logger.info(`Environment: ${config.env}`);
            logger.info(`API prefix: ${config.apiPrefix}`);
            logger.info(`Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
});

// Start the server
startServer();