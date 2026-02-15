/**
 * OpEx 5.0 - Report Controller
 * Handles reporting endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard statistics
 * GET /api/v1/reports/dashboard
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const stats = await reportService.getDashboardStats(companyId);
        return sendSuccess(res, stats, 'Dashboard istatistikleri');
    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        return sendError(res, 'Dashboard istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// SUGGESTION REPORTS
// ============================================

/**
 * Get suggestion statistics
 * GET /api/v1/reports/suggestions
 */
export const getSuggestionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const departmentId = req.query.departmentId
            ? parseInt(req.query.departmentId as string)
            : undefined;

        const stats = await reportService.getSuggestionStats(dateRange, companyId, departmentId);
        return sendSuccess(res, stats, 'Öneri istatistikleri');
    } catch (error) {
        logger.error('Get suggestion stats error:', error);
        return sendError(res, 'Öneri istatistikleri getirilirken hata olustu', 500);
    }
};

/**
 * Get top performers
 * GET /api/v1/reports/top-performers
 */
export const getTopPerformers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const performers = await reportService.getTopPerformers(limit, dateRange, companyId);
        return sendSuccess(res, performers, 'En basarili kullanicilar');
    } catch (error) {
        logger.error('Get top performers error:', error);
        return sendError(res, 'En basarili kullanicilar getirilirken hata olustu', 500);
    }
};

// ============================================
// PROJECT REPORTS
// ============================================

/**
 * Get project statistics
 * GET /api/v1/reports/projects
 */
export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };

        const stats = await reportService.getProjectStats(dateRange);
        return sendSuccess(res, stats, 'Proje istatistikleri');
    } catch (error) {
        logger.error('Get project stats error:', error);
        return sendError(res, 'Proje istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * Get financial summary
 * GET /api/v1/reports/financial
 */
export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const summary = await reportService.getFinancialSummary(dateRange, companyId);
        return sendSuccess(res, summary, 'Finansal özet');
    } catch (error) {
        logger.error('Get financial summary error:', error);
        return sendError(res, 'Finansal özet getirilirken hata olustu', 500);
    }
};

// ============================================
// APPROVAL REPORTS
// ============================================

/**
 * Get approval statistics
 * GET /api/v1/reports/approvals
 */
export const getApprovalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

        const stats = await reportService.getApprovalStats(dateRange, companyId);
        return sendSuccess(res, stats, 'Onay istatistikleri');
    } catch (error) {
        logger.error('Get approval stats error:', error);
        return sendError(res, 'Onay istatistikleri getirilirken hata olustu', 500);
    }
};

// ============================================
// EXPORT
// ============================================

/**
 * Export suggestions
 * GET /api/v1/reports/export/suggestions
 */
export const exportSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
        const status = req.query.status as string;

        const suggestions = await reportService.getSuggestionsForExport(dateRange, companyId, status);
        return sendSuccess(res, suggestions, 'Öneri verileri');
    } catch (error) {
        logger.error('Export suggestions error:', error);
        return sendError(res, 'Öneri verileri disa aktarilirken hata olustu', 500);
    }
};

/**
 * Export projects
 * GET /api/v1/reports/export/projects
 */
export const exportProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateRange = {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        };
        const status = req.query.status as string;

        const projects = await reportService.getProjectsForExport(dateRange, status);
        return sendSuccess(res, projects, 'Proje verileri');
    } catch (error) {
        logger.error('Export projects error:', error);
        return sendError(res, 'Proje verileri disa aktarilirken hata olustu', 500);
    }
};
