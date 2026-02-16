import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import routes from './routes';
import openApiDocument from './docs/openapi';
import { requestLogger } from './utils/logger';
import logger from './utils/logger';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.env === 'production'
        ? [config.frontend.url]
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://192.168.1.113:3000', 'http://192.168.1.113:3001', 'http://192.168.1.113:3002', 'http://192.168.1.113:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.rateLimit.perMinute,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ============================================
// ROUTES
// ============================================

app.get('/api-docs.json', (_req, res) => {
    res.json(openApiDocument);
});

app.use(
    '/api-docs',
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
        // Keep docs usable if helmet sets restrictive CSP headers.
        res.removeHeader('Content-Security-Policy');
        next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
        explorer: true,
        customSiteTitle: 'OpEx 5.0 API Docs',
    })
);

app.use(config.apiPrefix, routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        error: {
            code: 'NOT_FOUND',
            message: `Cannot ${req.method} ${req.path}`,
        },
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(err.status || 500).json({
        success: false,
        message: config.env === 'production' ? 'Internal server error' : err.message,
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message,
            ...(config.env !== 'production' && { stack: err.stack }),
        },
    });
});

export default app;
