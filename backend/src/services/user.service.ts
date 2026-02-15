/**
 * OpEx 5.0 - User Service
 * Handles user profile and notification operations
 */

import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import logger from '../utils/logger';
import cacheService from './cache.service';

const prisma = new PrismaClient();

// ============================================
// USER PROFILE
// ============================================

/**
 * Get user profile
 */
export const getUserProfile = async (userId: number) => {
    const cacheKey = `users:${userId}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) return cached;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            uuid: true,
            employeeId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            position: true,
            avatar: true,
            role: true,
            status: true,
            company: {
                select: { id: true, name: true, code: true },
            },
            department: {
                select: { id: true, name: true, code: true },
            },
            unit: {
                select: { id: true, name: true, code: true },
            },
            createdAt: true,
            lastLoginAt: true,
        },
    });

    if (user) {
        await cacheService.set(cacheKey, user, 3600); // 1 hour cache
    }

    return user;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
    userId: number,
    data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        position?: string;
    }
) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            position: data.position,
        },
        select: {
            id: true,
            uuid: true,
            employeeId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            position: true,
            avatar: true,
            role: true,
            company: {
                select: { id: true, name: true },
            },
            department: {
                select: { id: true, name: true },
            },
        },
    });

    await cacheService.del(`users:${userId}`);

    return user;
};

/**
 * Change user password
 */
export const changePassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string
) => {
    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true, status: true },
    });

    if (!user) {
        throw new Error('Kullanici bulunamadi');
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
        throw new Error('Mevcut sifre hatali');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            lastPasswordChange: new Date(),
            status: user.status === 'PENDING_PASSWORD_CHANGE' ? 'ACTIVE' : user.status,
        },
    });

    await cacheService.del(`users:${userId}`);

    return { message: 'Sifre basariyla degistirildi' };
};

/**
 * Update user avatar
 */
export const updateAvatar = async (userId: number, avatarUrl: string) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
            id: true,
            avatar: true,
        },
    });

    await cacheService.del(`users:${userId}`);

    return user;
};

// ============================================
// NOTIFICATIONS
// ============================================

interface NotificationFilters {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
}

/**
 * Get user notifications
 */
export const getNotifications = async (userId: number, filters: NotificationFilters = {}) => {
    const { page = 1, limit = 20, unreadOnly = false } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
        where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                uuid: true,
                type: true,
                title: true,
                message: true,
                data: true,
                isRead: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: number) => {
    const count = await prisma.notification.count({
        where: { userId, isRead: false },
    });

    return { unreadCount: count };
};

/**
 * Mark notification as read
 */
export const markAsRead = async (userId: number, notificationId: number) => {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
    });

    if (!notification) {
        throw new Error('Bildirim bulunamadi');
    }

    await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Bildirim okundu olarak isaretlendi' };
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: number) => {
    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Tüm bildirimler okundu olarak isaretlendi' };
};

/**
 * Delete notification
 */
export const deleteNotification = async (userId: number, notificationId: number) => {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
    });

    if (!notification) {
        throw new Error('Bildirim bulunamadi');
    }

    await prisma.notification.delete({
        where: { id: notificationId },
    });

    return { message: 'Bildirim silindi' };
};

/**
 * Create notification (internal use)
 */
export const createNotification = async (
    userId: number,
    data: {
        type: string;
        title: string;
        message: string;
        data?: string; // JSON string
    }
) => {
    const notification = await prisma.notification.create({
        data: {
            userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
        },
    });

    return notification;
};

// ============================================
// USER STATISTICS
// ============================================

/**
 * Get user statistics
 */
export const getUserStats = async (userId: number) => {
    const cacheKey = `users:${userId}:stats`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) return cached;

    // Total suggestions
    const totalSuggestions = await prisma.suggestion.count({
        where: { userId },
    });

    // Suggestions by status
    const suggestionsByStatus = await prisma.suggestion.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
    });

    // Total estimated savings
    const totalEstimatedSavings = await prisma.suggestion.aggregate({
        where: { userId },
        _sum: { estimatedSavings: true },
    });

    // Approved suggestions count
    const approvedCount = await prisma.suggestion.count({
        where: {
            userId,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
    });

    // Completed suggestions count
    const completedCount = await prisma.suggestion.count({
        where: { userId, status: 'COMPLETED' },
    });

    // Projects led
    const projectsLed = await prisma.project.count({
        where: { projectLeaderId: userId },
    });

    // Projects as team member
    const projectsAsMember = await prisma.projectTeamMember.count({
        where: { userId, removedAt: null },
    });

    const stats = {
        suggestions: {
            total: totalSuggestions,
            approved: approvedCount,
            completed: completedCount,
            byStatus: suggestionsByStatus.map((s) => ({ status: s.status, count: s._count })),
            totalEstimatedSavings: totalEstimatedSavings._sum.estimatedSavings || 0,
        },
        projects: {
            led: projectsLed,
            asMember: projectsAsMember,
        },
    };

    await cacheService.set(cacheKey, stats, 600); // 10 minutes cache

    return stats;
};

// ============================================
// USER ACTIVITY
// ============================================

/**
 * Get user's recent suggestions
 */
export const getRecentSuggestions = async (userId: number, limit: number = 5) => {
    const suggestions = await prisma.suggestion.findMany({
        where: { userId },
        take: limit,
        select: {
            id: true,
            referenceNumber: true,
            title: true,
            status: true,
            createdAt: true,
            category: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return suggestions;
};

/**
 * Get user's pending approvals
 */
export const getPendingApprovals = async (userId: number) => {
    const pendingSteps = await prisma.approvalStep.findMany({
        where: {
            approverId: userId,
            status: 'PENDING',
        },
        select: {
            id: true,
            stepNumber: true,
            stepType: true,
            createdAt: true,
            workflow: {
                select: {
                    id: true,
                    suggestion: {
                        select: {
                            id: true,
                            referenceNumber: true,
                            title: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return pendingSteps;
};
