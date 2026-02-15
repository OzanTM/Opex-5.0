/**
 * OpEx 5.0 - Admin Controller
 * Handles admin API endpoints
 */

import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/response';
import logger from '../utils/logger';

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const filters = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            search: req.query.search as string,
            role: req.query.role as string,
            status: req.query.status as string,
            companyId: req.query.companyId ? parseInt(req.query.companyId as string) : undefined,
            departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        };

        const result = await adminService.getUsers(filters);
        return sendSuccess(res, result, 'Kullanicilar listelendi');
    } catch (error: any) {
        logger.error('Get users error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const user = await adminService.getUserById(id);

        if (!user) {
            return sendNotFound(res, 'Kullanici bulunamadi');
        }

        return sendSuccess(res, user, 'Kullanici detayi');
    } catch (error: any) {
        logger.error('Get user by ID error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Create new user
 * POST /api/admin/users
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const result = await adminService.createUser(req.body, currentUser.id);
        return sendCreated(res, result, 'Kullanici olusturuldu');
    } catch (error: any) {
        logger.error('Create user error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currentUser = (req as any).user;
        const user = await adminService.updateUser(id, req.body, currentUser.id);
        return sendSuccess(res, user, 'Kullanici güncellendi');
    } catch (error: any) {
        logger.error('Update user error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currentUser = (req as any).user;
        const result = await adminService.deleteUser(id, currentUser.id);
        return sendSuccess(res, result, 'Kullanici silindi');
    } catch (error: any) {
        logger.error('Delete user error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Reset user password
 * POST /api/admin/users/:id/reset-password
 */
export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currentUser = (req as any).user;
        const result = await adminService.resetUserPassword(id, currentUser.id);
        return sendSuccess(res, result, 'Sifre sifirlandi');
    } catch (error: any) {
        logger.error('Reset password error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Bulk create users
 * POST /api/admin/users/bulk
 */
export const bulkCreateUsers = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const { users } = req.body;
        const result = await adminService.bulkCreateUsers(users, currentUser.id);
        return sendCreated(res, result, 'Toplu kullanici olusturma tamamlandi');
    } catch (error: any) {
        logger.error('Bulk create users error:', error);
        return sendError(res, error.message, 400);
    }
};

// ============================================
// COMPANY STRUCTURE
// ============================================

/**
 * Get all companies
 * GET /api/admin/companies
 */
export const getCompanies = async (req: Request, res: Response) => {
    try {
        const companies = await adminService.getCompanies();
        return sendSuccess(res, companies, 'Sirketler listelendi');
    } catch (error: any) {
        logger.error('Get companies error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Create company
 * POST /api/admin/companies
 */
export const createCompany = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const company = await adminService.createCompany(req.body, currentUser.id);
        return sendCreated(res, company, 'Sirket olusturuldu');
    } catch (error: any) {
        logger.error('Create company error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Update company
 * PUT /api/admin/companies/:id
 */
export const updateCompany = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currentUser = (req as any).user;
        const company = await adminService.updateCompany(id, req.body, currentUser.id);
        return sendSuccess(res, company, 'Sirket güncellendi');
    } catch (error: any) {
        logger.error('Update company error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Get departments
 * GET /api/admin/departments
 */
export const getDepartments = async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const departments = await adminService.getDepartments(companyId);
        return sendSuccess(res, departments, 'Departmanlar listelendi');
    } catch (error: any) {
        logger.error('Get departments error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Create department
 * POST /api/admin/departments
 */
export const createDepartment = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const department = await adminService.createDepartment(req.body, currentUser.id);
        return sendCreated(res, department, 'Departman olusturuldu');
    } catch (error: any) {
        logger.error('Create department error:', error);
        return sendError(res, error.message, 400);
    }
};

/**
 * Get units
 * GET /api/admin/units
 */
export const getUnits = async (req: Request, res: Response) => {
    try {
        const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
        const units = await adminService.getUnits(departmentId);
        return sendSuccess(res, units, 'Birimler listelendi');
    } catch (error: any) {
        logger.error('Get units error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Create unit
 * POST /api/admin/units
 */
export const createUnit = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const unit = await adminService.createUnit(req.body, currentUser.id);
        return sendCreated(res, unit, 'Birim olusturuldu');
    } catch (error: any) {
        logger.error('Create unit error:', error);
        return sendError(res, error.message, 400);
    }
};

// ============================================
// SYSTEM SETTINGS
// ============================================

/**
 * Get system settings
 * GET /api/admin/settings
 */
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = await adminService.getSystemSettings();
        return sendSuccess(res, settings, 'Sistem ayarlari listelendi');
    } catch (error: any) {
        logger.error('Get settings error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * Update system setting
 * PUT /api/admin/settings/:key
 */
export const updateSystemSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const currentUser = (req as any).user;
        const setting = await adminService.updateSystemSetting(key, value, currentUser.id);
        return sendSuccess(res, setting, 'Ayar güncellendi');
    } catch (error: any) {
        logger.error('Update setting error:', error);
        return sendError(res, error.message, 400);
    }
};

// ============================================
// AUDIT LOGS
// ============================================

/**
 * Get audit logs
 * GET /api/admin/logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const filters = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 50,
            userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
            action: req.query.action as string,
            entity: req.query.entity as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const result = await adminService.getAuditLogs(filters);
        return sendSuccess(res, result, 'Loglar listelendi');
    } catch (error: any) {
        logger.error('Get audit logs error:', error);
        return sendError(res, error.message, 500);
    }
};

// ============================================
// ROLES
// ============================================

/**
 * Get available roles
 * GET /api/admin/roles
 */
export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = adminService.getRoles();
        return sendSuccess(res, roles, 'Roller listelendi');
    } catch (error: any) {
        logger.error('Get roles error:', error);
        return sendError(res, error.message, 500);
    }
};

// ============================================
// STATISTICS
// ============================================

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getAdminStats();
        return sendSuccess(res, stats, 'Admin istatistikleri');
    } catch (error: any) {
        logger.error('Get admin stats error:', error);
        return sendError(res, error.message, 500);
    }
};
