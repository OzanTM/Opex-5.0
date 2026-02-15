import { Job } from 'bull';
import emailService from '../services/email.service';
import logger from '../utils/logger';
import { IEmailPayload } from '../types';

/**
 * Process email job
 */
export const processEmailJob = async (job: Job<IEmailPayload>) => {
    try {
        const payload = job.data;

        logger.info(`Processing email to: ${payload.to}`, { subject: payload.subject });

        const success = await emailService.sendEmail(payload);

        if (!success) {
            throw new Error('Failed to send email via transporter');
        }

        return { sent: true };
    } catch (error: any) {
        logger.error('Email worker error', { error: error.message, jobId: job.id });
        throw error;
    }
};
