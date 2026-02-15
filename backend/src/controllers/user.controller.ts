/**
 * OpEx 5.0 - User Controller
 * Handles user profile and notification endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import logger from '../utils/logger';

// ============================================
// USER PROFILE
// ============================================

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const user = await userService.getUserProfile(userId);

        if (!user) {
            return sendNotFound(res, 'Kullanici bulunamadi');
        }

        return sendSuccess(res, user, 'Kullanici profili');
    } catch (error) {
        logger.error('Get profile error:', error);
        return sendError(res, 'Profil getirilirken hata olustu', 500);
    }
};

/**
 * Update current user profile
 * PATCH /api/v1/users/me
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { firstName, lastName, phone, position } = req.body;

        const user = await userService.updateUserProfile(userId, {
            firstName,
            lastName,
            phone,
            position,
        });

        return sendSuccess(res, user, 'Profil guncellendi');
    } catch (error: any) {
        logger.error('Update profile error:', error);
        return sendError(res, error.message || 'Profil guncellenirken hata olustu', 500);
    }
};

/**
 * Change password
 * POST /api/v1/users/me/password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 'Mevcut ve yeni sifre zorunludur', 400);
        }

        if (newPassword.length < 8) {
            return sendError(res, 'Yeni sifre en az 8 karakter olmalidir', 400);
        }

        const result = await userService.changePassword(userId, currentPassword, newPassword);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Change password error:', error);
        return sendError(res, error.message || 'Sifre degistirilirken hata olustu', 500);
    }
};

/**
 * Update avatar
 * POST /api/v1/users/me/avatar
 */
export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return sendError(res, 'Avatar URL zorunludur', 400);
        }

        const user = await userService.updateAvatar(userId, avatarUrl);
        return sendSuccess(res, user, 'Avatar guncellendi');
    } catch (error: any) {
        logger.error('Update avatar error:', error);
        return sendError(res, error.message || 'Avatar guncellenirken hata olustu', 500);
    }
};

/**
 * Get user statistics
 * GET /api/v1/users/me/stats
 */
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const stats = await userService.getUserStats(userId);
        return sendSuccess(res, stats, 'Kullanici istatistikleri');
    } catch (error) {
        logger.error('Get user stats error:', error);
        return sendError(res, 'Istatistikler getirilirken hata olustu', 500);
    }
};

/**
 * Get recent suggestions
 * GET /api/v1/users/me/suggestions
 */
export const getRecentSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const limit = parseInt(req.query.limit as string) || 5;
        const suggestions = await userService.getRecentSuggestions(userId, limit);
        return sendSuccess(res, suggestions, 'Son öneriler');
    } catch (error) {
        logger.error('Get recent suggestions error:', error);
        return sendError(res, 'Son öneriler getirilirken hata olustu', 500);
    }
};

/**
 * Get pending approvals
 * GET /api/v1/users/me/pending-approvals
 */
export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const approvals = await userService.getPendingApprovals(userId);
        return sendSuccess(res, approvals, 'Bekleyen onaylar');
    } catch (error) {
        logger.error('Get pending approvals error:', error);
        return sendError(res, 'Bekleyen onaylar getirilirken hata olustu', 500);
    }
};

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get notifications
 * GET /api/v1/users/me/notifications
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const filters = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            unreadOnly: req.query.unreadOnly === 'true',
        };

        const result = await userService.getNotifications(userId, filters);
        return sendSuccess(res, result, 'Bildirimler');
    } catch (error) {
        logger.error('Get notifications error:', error);
        return sendError(res, 'Bildirimler getirilirken hata olustu', 500);
    }
};

/**
 * Get unread notification count
 * GET /api/v1/users/me/notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const result = await userService.getUnreadCount(userId);
        return sendSuccess(res, result, 'Okunmamis bildirim sayisi');
    } catch (error) {
        logger.error('Get unread count error:', error);
        return sendError(res, 'Okunmamis bildirim sayisi getirilirken hata olustu', 500);
    }
};

/**
 * Mark notification as read
 * PATCH /api/v1/users/me/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId)) {
            return sendError(res, 'Gecersiz bildirim ID', 400);
        }

        const result = await userService.markAsRead(userId, notificationId);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Mark as read error:', error);
        return sendError(res, error.message || 'Bildirim isaretlenirken hata olustu', 500);
    }
};

/**
 * Mark all notifications as read
 * POST /api/v1/users/me/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const result = await userService.markAllAsRead(userId);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Mark all as read error:', error);
        return sendError(res, error.message || 'Bildirimler isaretlenirken hata olustu', 500);
    }
};

/**
 * Delete notification
 * DELETE /api/v1/users/me/notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId)) {
            return sendError(res, 'Gecersiz bildirim ID', 400);
        }

        const result = await userService.deleteNotification(userId, notificationId);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Delete notification error:', error);
        return sendError(res, error.message || 'Bildirim silinirken hata olustu', 500);
    }
};
