/**
 * OpEx 5.0 - Report Routes
 * Routes for reporting and statistics
 */

import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// DASHBOARD
// ============================================

// Get dashboard statistics
router.get('/dashboard', reportController.getDashboardStats);

// ============================================
// SUGGESTION REPORTS
// ============================================

// Get suggestion statistics
router.get('/suggestions', reportController.getSuggestionStats);

// Get top performers
router.get('/top-performers', reportController.getTopPerformers);

// ============================================
// PROJECT REPORTS
// ============================================

// Get project statistics
router.get('/projects', reportController.getProjectStats);

// ============================================
// FINANCIAL REPORTS
// ============================================

// Get financial summary
router.get('/financial', reportController.getFinancialSummary);

// ============================================
// APPROVAL REPORTS
// ============================================

// Get approval statistics
router.get('/approvals', reportController.getApprovalStats);

// ============================================
// EXPORT
// ============================================

// Export suggestions
router.get('/export/suggestions', reportController.exportSuggestions);

// Export projects
router.get('/export/projects', reportController.exportProjects);

export default router;
