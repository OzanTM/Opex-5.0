import { Router } from 'express';
import authRoutes from './auth.routes';
import suggestionRoutes from './suggestion.routes';
import committeeRoutes from './committee.routes';
import approvalRoutes from './approval.routes';
import adminRoutes from './admin.routes';
import projectRoutes from './project.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'OpEx 5.0 API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/committee', committeeRoutes);
router.use('/approvals', approvalRoutes);
router.use('/admin', adminRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
