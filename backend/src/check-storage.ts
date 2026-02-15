import storageService from './services/storage.service';
import logger from './utils/logger';
import config from './config';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

// Mock Multer File
const mockFile = {
    fieldname: 'file',
    originalname: 'test-upload.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    buffer: Buffer.from('Hello MinIO! This is a test upload.'),
    size: 32
} as Express.Multer.File;

async function ensureBucketExists() {
    if (config.upload.provider !== 's3') return;

    const client = new S3Client({
        region: config.aws.region,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
        endpoint: config.aws.endpoint,
        forcePathStyle: true,
    });

    try {
        await client.send(new HeadBucketCommand({ Bucket: config.aws.s3Bucket }));
        logger.info(`Bucket ${config.aws.s3Bucket} exists.`);
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            logger.info(`Bucket ${config.aws.s3Bucket} not found, creating...`);
            await client.send(new CreateBucketCommand({ Bucket: config.aws.s3Bucket }));
            logger.info(`Bucket ${config.aws.s3Bucket} created.`);
        } else {
            logger.error('Check bucket failed', error);
            throw error;
        }
    }
}

async function testStorage() {
    try {
        logger.info('Testing Storage Service...');
        logger.info(`Provider: ${config.upload.provider}`);

        if (config.upload.provider === 's3' && config.aws.endpoint) {
            logger.info(`Endpoint: ${config.aws.endpoint}`);
        }

        await ensureBucketExists();

        // Test Upload
        const url = await storageService.uploadFile(mockFile, 'test-storage');
        logger.info(`File uploaded successfully: ${url}`);

        // Test Get URL
        const publicUrl = storageService.getFileUrl('test-upload.txt', 'test-storage');
        logger.info(`Public URL: ${publicUrl}`);

        // Test Delete (Optional, maybe keep it to verify in browser first)
        // await storageService.deleteFile(url);
        // logger.info('File deleted successfully');

    } catch (error) {
        logger.error('Storage test failed', { error });
    }
}

// Override config for test if needed (e.g. force s3 if .env is not picked up correctly in this script context)
// But dotenv should handle it in config/index.ts
// config.upload.provider = 's3'; 

testStorage();
