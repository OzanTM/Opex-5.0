/**
 * OpEx 5.0 - Project Controller
 * Handles project management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';
import { sendSuccess, sendError, sendNotFound, sendCreated } from '../utils/response';
import logger from '../utils/logger';

// ============================================
// PROJECT MANAGEMENT
// ============================================

/**
 * Get all projects
 * GET /api/v1/projects
 */
export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            status: req.query.status as string,
            projectLeaderId: parseInt(req.query.projectLeaderId as string),
            companyId: parseInt(req.query.companyId as string),
            search: req.query.search as string,
        };

        const result = await projectService.getProjects(filters);
        return sendSuccess(res, result, 'Projeler listelendi');
    } catch (error) {
        logger.error('Get projects error:', error);
        return sendError(res, 'Projeler listelenirken hata olustu', 500);
    }
};

/**
 * Get project by ID
 * GET /api/v1/projects/:id
 */
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return sendError(res, 'Gecersiz proje ID', 400);
        }

        const project = await projectService.getProjectById(id);
        if (!project) {
            return sendNotFound(res, 'Proje bulunamadi');
        }

        return sendSuccess(res, project, 'Proje detaylari');
    } catch (error) {
        logger.error('Get project by ID error:', error);
        return sendError(res, 'Proje getirilirken hata olustu', 500);
    }
};

/**
 * Update project progress
 * PATCH /api/v1/projects/:id/progress
 */
export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const { progress } = req.body;
        const userId = (req as any).user.id;

        if (isNaN(id)) {
            return sendError(res, 'Gecersiz proje ID', 400);
        }

        if (typeof progress !== 'number' || progress < 0 || progress > 100) {
            return sendError(res, 'Ilerleme degeri 0-100 arasinda olmalidir', 400);
        }

        const project = await projectService.updateProjectProgress(id, progress, userId);
        return sendSuccess(res, project, 'Proje ilerlemesi guncellendi');
    } catch (error: any) {
        logger.error('Update project progress error:', error);
        return sendError(res, error.message || 'Proje ilerlemesi guncellenirken hata olustu', 500);
    }
};

/**
 * Complete project
 * POST /api/v1/projects/:id/complete
 */
export const completeProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const { actualCost, actualSavings } = req.body;
        const userId = (req as any).user.id;

        if (isNaN(id)) {
            return sendError(res, 'Gecersiz proje ID', 400);
        }

        const project = await projectService.completeProject(
            id,
            { actualCost, actualSavings },
            userId
        );
        return sendSuccess(res, project, 'Proje tamamlandi');
    } catch (error: any) {
        logger.error('Complete project error:', error);
        return sendError(res, error.message || 'Proje tamamlanirken hata olustu', 500);
    }
};

/**
 * Add team member
 * POST /api/v1/projects/:id/team
 */
export const addTeamMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.id);
        const { userId, role } = req.body;
        const addedBy = (req as any).user.id;

        if (isNaN(projectId) || isNaN(userId)) {
            return sendError(res, 'Gecersiz proje veya kullanici ID', 400);
        }

        const teamMember = await projectService.addTeamMember(projectId, userId, role, addedBy);
        return sendCreated(res, teamMember, 'Ekip uyesi eklendi');
    } catch (error: any) {
        logger.error('Add team member error:', error);
        return sendError(res, error.message || 'Ekip uyesi eklenirken hata olustu', 500);
    }
};

/**
 * Remove team member
 * DELETE /api/v1/projects/:id/team/:userId
 */
export const removeTeamMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        const removedBy = (req as any).user.id;

        if (isNaN(projectId) || isNaN(userId)) {
            return sendError(res, 'Gecersiz proje veya kullanici ID', 400);
        }

        const result = await projectService.removeTeamMember(projectId, userId, removedBy);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Remove team member error:', error);
        return sendError(res, error.message || 'Ekip uyesi kaldirilirken hata olustu', 500);
    }
};

/**
 * Create milestone
 * POST /api/v1/projects/:id/milestones
 */
export const createMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.id);
        const { title, description, dueDate } = req.body;
        const createdBy = (req as any).user.id;

        if (isNaN(projectId)) {
            return sendError(res, 'Gecersiz proje ID', 400);
        }

        if (!title) {
            return sendError(res, 'Kilometre tasi basligi zorunludur', 400);
        }

        const milestone = await projectService.createMilestone(
            projectId,
            { title, description, dueDate: dueDate ? new Date(dueDate) : undefined },
            createdBy
        );
        return sendCreated(res, milestone, 'Kilometre tasi olusturuldu');
    } catch (error: any) {
        logger.error('Create milestone error:', error);
        return sendError(res, error.message || 'Kilometre tasi olusturulurken hata olustu', 500);
    }
};

/**
 * Update milestone
 * PATCH /api/v1/projects/milestones/:milestoneId
 */
export const updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const milestoneId = parseInt(req.params.milestoneId);
        const { title, description, dueDate, isCompleted } = req.body;
        const updatedBy = (req as any).user.id;

        if (isNaN(milestoneId)) {
            return sendError(res, 'Gecersiz kilometre tasi ID', 400);
        }

        const milestone = await projectService.updateMilestone(
            milestoneId,
            {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                isCompleted,
            },
            updatedBy
        );
        return sendSuccess(res, milestone, 'Kilometre tasi guncellendi');
    } catch (error: any) {
        logger.error('Update milestone error:', error);
        return sendError(res, error.message || 'Kilometre tasi guncellenirken hata olustu', 500);
    }
};

/**
 * Delete milestone
 * DELETE /api/v1/projects/milestones/:milestoneId
 */
export const deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const milestoneId = parseInt(req.params.milestoneId);
        const deletedBy = (req as any).user.id;

        if (isNaN(milestoneId)) {
            return sendError(res, 'Gecersiz kilometre tasi ID', 400);
        }

        const result = await projectService.deleteMilestone(milestoneId, deletedBy);
        return sendSuccess(res, result, result.message);
    } catch (error: any) {
        logger.error('Delete milestone error:', error);
        return sendError(res, error.message || 'Kilometre tasi silinirken hata olustu', 500);
    }
};

/**
 * Get my projects (for project leaders)
 * GET /api/v1/projects/my
 */
export const getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const projects = await projectService.getProjectsByLeader(userId);
        return sendSuccess(res, projects, 'Projelerim listelendi');
    } catch (error) {
        logger.error('Get my projects error:', error);
        return sendError(res, 'Projelerim listelenirken hata olustu', 500);
    }
};

/**
 * Get project statistics
 * GET /api/v1/projects/stats
 */
export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await projectService.getProjectStats();
        return sendSuccess(res, stats, 'Proje istatistikleri');
    } catch (error) {
        logger.error('Get project stats error:', error);
        return sendError(res, 'Proje istatistikleri getirilirken hata olustu', 500);
    }
};
