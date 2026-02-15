import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
// import { Upload } from '@aws-sdk/lib-storage'; // Not used in simple upload, but useful for streams
import config from '../config';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface IStorageService {
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    getFileUrl(filename: string, folder?: string): string;
}

class LocalStorageService implements IStorageService {
    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const uploadDir = path.join(config.upload.dir, folder);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, file.buffer);

        // Return relative URL
        return `/uploads/${folder}/${filename}`;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        // fileUrl format: /uploads/folder/filename
        const relativePath = fileUrl.replace(/^\//, ''); // Remove leading slash
        const filePath = path.resolve(process.cwd(), relativePath);

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    getFileUrl(filename: string, folder: string = 'uploads'): string {
        return `/uploads/${folder}/${filename}`;
    }
}

class S3StorageService implements IStorageService {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            },
            endpoint: config.aws.endpoint,
            forcePathStyle: true, // Required for MinIO
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const filename = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;

        await this.client.send(new PutObjectCommand({
            Bucket: config.aws.s3Bucket,
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // Depends on bucket settings
        }));

        return this.getFileUrl(filename);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        // Extract key from URL
        // URL format: https://bucket.s3.region.amazonaws.com/folder/filename OR http://minio:9000/bucket/folder/filename
        // Simple approach: store the Key or extract it. 
        // For now, assuming we might need to parse it. 
        // Let's assume fileUrl IS the key for simplicity in S3 implementation if we return full URL?
        // Actually, returning full URL is better for frontend.

        // For MinIO/S3, it's safer to store the Key in DB, but if we only have URL:
        // Let's implement a simple parser or just ignore if we can't parse.
        // For this demo, I'll assume usage passes the Key if it's S3 service, OR we parse it.

        let key = fileUrl;
        if (fileUrl.startsWith('http')) {
            const parts = fileUrl.split(config.aws.s3Bucket + '/');
            if (parts.length > 1) {
                key = parts[1];
            }
        }

        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: config.aws.s3Bucket,
                Key: key,
            }));
        } catch (error) {
            logger.error('S3 delete error', { error, key });
        }
    }

    getFileUrl(filename: string, folder?: string): string {
        // If filename already contains folder (e.g. from uploadFile return)
        const key = folder ? `${folder}/${filename}` : filename;

        if (config.aws.endpoint) {
            // MinIO format: http://localhost:9000/bucket/key
            return `${config.aws.endpoint}/${config.aws.s3Bucket}/${key}`;
        }

        // AWS S3 Vhost format: https://bucket.s3.region.amazonaws.com/key
        return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
    }
}

// Export factory or instance
const storageService = config.upload.provider === 's3'
    ? new S3StorageService()
    : new LocalStorageService();

export default storageService;
