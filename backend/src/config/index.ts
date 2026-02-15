import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
    env: string;
    port: number;
    apiPrefix: string;

    database: {
        url: string;
    };

    redis: {
        host: string;
        port: number;
        password: string;
    };

    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };

    session: {
        timeout: number;
        maxConcurrentSessions: number;
    };

    email: {
        provider: string;
        sendgridApiKey: string;
        from: string;
        fromName: string;
    };

    upload: {
        provider: string;
        dir: string;
        maxFileSize: number;
        allowedFileTypes: string[];
    };

    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3Bucket: string;
        endpoint?: string;
        forcePathStyle?: boolean;
    };

    frontend: {
        url: string;
    };

    rateLimit: {
        perMinute: number;
        perHour: number;
    };

    logging: {
        level: string;
        file: string;
    };

    security: {
        bcryptSaltRounds: number;
        maxFailedLogins: number;
        lockoutDuration: number;
    };

    company: {
        name: string;
        logoUrl: string;
    };
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',

    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/opex_db',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    session: {
        timeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10), // 30 min
        maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3', 10),
    },

    email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        sendgridApiKey: process.env.SENDGRID_API_KEY || '',
        from: process.env.EMAIL_FROM || 'noreply@opex5.com',
        fromName: process.env.EMAIL_FROM_NAME || 'OpEx 5.0',
    },

    upload: {
        provider: process.env.UPLOAD_PROVIDER || 'local',
        dir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,jpg,png,gif').split(','),
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'eu-west-1',
        s3Bucket: process.env.AWS_S3_BUCKET || 'opex-uploads',
        endpoint: process.env.AWS_ENDPOINT, // For MinIO
        forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true', // For MinIO
    },

    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },

    rateLimit: {
        perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10),
        perHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '1000', 10),
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/opex.log',
    },

    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
        maxFailedLogins: parseInt(process.env.MAX_FAILED_LOGINS || '5', 10),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 min
    },

    company: {
        name: process.env.COMPANY_NAME || 'OpEx Company',
        logoUrl: process.env.COMPANY_LOGO_URL || '',
    },
};

export default config;