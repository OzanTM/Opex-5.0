import { Router } from 'express';
import suggestionController from '../controllers/suggestion.controller';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';
import config from '../config';

const router = Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = config.upload.allowedFileTypes;
    const ext = file.originalname.split('.').pop().toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
    fileFilter,
});

// All routes require authentication
router.use(authenticate);

// Suggestion CRUD
router.post('/', suggestionController.create.bind(suggestionController));
router.get('/', suggestionController.getAll.bind(suggestionController));
router.get('/my', suggestionController.getMy.bind(suggestionController));
router.get('/:id', suggestionController.getById.bind(suggestionController));
router.put('/:id', suggestionController.update.bind(suggestionController));
router.delete('/:id', suggestionController.delete.bind(suggestionController));

// Suggestion submission
router.post('/:id/submit', suggestionController.submit.bind(suggestionController));

// Committee review (Committee Manager only)
router.post(
    '/:id/committee-review',
    authorize('COMMITTEE_MANAGER', 'ADMIN'),
    suggestionController.committeeReview.bind(suggestionController)
);

// Approval actions (Approvers only)
router.post('/:id/approve', suggestionController.approve.bind(suggestionController));
router.post('/:id/reject', suggestionController.reject.bind(suggestionController));

// File upload
router.post('/:id/documents', upload.array('files', 10), async (req, res, next) => {
    // File upload handler will be implemented
    res.json({ success: true, message: 'Files uploaded successfully' });
});

export default router;