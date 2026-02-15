import multer from 'multer';
import config from '../config';
import { sendError } from '../utils/response';
import { Request, Response, NextFunction } from 'express';

// Configure multer to use memory storage
// We will handle the actual storage (Local/S3) in the controller/service
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExt || !config.upload.allowedFileTypes.includes(fileExt)) {
        return cb(new Error('Invalid file type'));
    }

    // Check mime type (optional, can be stricter)
    // ...

    cb(null, true);
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize, // Default 10MB
    },
    fileFilter: fileFilter,
});

export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            sendError(res, 'File too large', 400);
            return;
        }
        sendError(res, err.message, 400);
        return;
    } else if (err) {
        sendError(res, err.message, 400);
        return;
    }
    next();
};
