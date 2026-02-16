/**
 * OpEx 5.0 - User Routes
 * Routes for user profile and notifications
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// USER PROFILE
// ============================================

// Get current user profile
router.get('/me', userController.getProfile);

// Update current user profile
router.patch('/me', userController.updateProfile);

// Change password
router.post('/me/password', userController.changePassword);

// Update avatar
router.post('/me/avatar', userController.updateAvatar);

// Get user statistics
router.get('/me/stats', userController.getUserStats);

// Get recent suggestions
router.get('/me/suggestions', userController.getRecentSuggestions);

// Get pending approvals
router.get('/me/pending-approvals', userController.getPendingApprovals);

// Get assignable users (committee/admin)
router.get('/assignable-users', authorize('COMMITTEE_MANAGER', 'ADMIN'), userController.getAssignableUsers);

// ============================================
// NOTIFICATIONS
// ============================================

// Get unread notification count (must be before /notifications/:id)
router.get('/me/notifications/unread-count', userController.getUnreadCount);

// Mark all notifications as read
router.post('/me/notifications/read-all', userController.markAllAsRead);

// Get notifications
router.get('/me/notifications', userController.getNotifications);

// Mark notification as read
router.patch('/me/notifications/:id/read', userController.markAsRead);

// Delete notification
router.delete('/me/notifications/:id', userController.deleteNotification);

export default router;
