/**
 * OpEx 5.0 - Project Service
 * Handles project management operations
 */

import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Project status constants
const ProjectStatus = {
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

// ============================================
// PROJECT MANAGEMENT
// ============================================

interface ProjectFilters {
    page?: number;
    limit?: number;
    status?: string;
    projectLeaderId?: number;
    companyId?: number;
    search?: string;
}

/**
 * Get all projects with filters
 */
export const getProjects = async (filters: ProjectFilters = {}) => {
    const {
        page = 1,
        limit = 20,
        status,
        projectLeaderId,
        companyId,
        search,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (projectLeaderId) {
        where.projectLeaderId = projectLeaderId;
    }

    if (companyId) {
        where.suggestion = { companyId };
    }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
        ];
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                status: true,
                progress: true,
                startDate: true,
                estimatedEndDate: true,
                actualEndDate: true,
                createdAt: true,
                projectLeader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                suggestion: {
                    select: {
                        id: true,
                        referenceNumber: true,
                        title: true,
                        company: { select: { id: true, name: true } },
                    },
                },
                _count: {
                    select: {
                        teamMembers: { where: { removedAt: null } },
                        milestones: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.project.count({ where }),
    ]);

    return {
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get project by ID
 */
export const getProjectById = async (id: number) => {
    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            uuid: true,
            name: true,
            description: true,
            status: true,
            progress: true,
            startDate: true,
            estimatedEndDate: true,
            actualEndDate: true,
            actualCost: true,
            actualSavings: true,
            createdAt: true,
            updatedAt: true,
            projectLeader: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    position: true,
                },
            },
            suggestion: {
                select: {
                    id: true,
                    referenceNumber: true,
                    title: true,
                    currentSituation: true,
                    proposedSolution: true,
                    estimatedCost: true,
                    estimatedSavings: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    company: { select: { id: true, name: true } },
                },
            },
            teamMembers: {
                where: { removedAt: null },
                select: {
                    id: true,
                    role: true,
                    assignedAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            position: true,
                        },
                    },
                },
            },
            milestones: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    dueDate: true,
                    completedDate: true,
                    isCompleted: true,
                    createdAt: true,
                },
                orderBy: { dueDate: 'asc' },
            },
        },
    });

    return project;
};

/**
 * Update project progress
 */
export const updateProjectProgress = async (
    id: number,
    progress: number,
    updatedBy: number
) => {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            suggestion: { include: { user: true } },
        },
    });

    if (!project) {
        throw new Error('Proje bulunamadi');
    }

    // Validate progress value
    if (progress < 0 || progress > 100) {
        throw new Error('Ilerleme degeri 0-100 arasinda olmalidir');
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            progress,
            status: progress === 100 ? ProjectStatus.COMPLETED : ProjectStatus.IN_PROGRESS,
            actualEndDate: progress === 100 ? new Date() : null,
            updatedAt: new Date(),
        },
    });

    // If project completed, send notification
    if (progress === 100 && project.suggestion?.user) {
        try {
            await sendEmail({
                to: project.suggestion.user.email,
                subject: 'Projeniz Tamamlandi - ' + project.name,
                templateCode: 'project-completed',
                templateData: {
                    employeeName: `${project.suggestion.user.firstName} ${project.suggestion.user.lastName}`,
                    projectName: project.name,
                    suggestionTitle: project.suggestion.title,
                    completionDate: new Date().toLocaleDateString('tr-TR'),
                },
            });
        } catch (error) {
            logger.error('Failed to send project completion email:', error);
        }
    }

    return updatedProject;
};

/**
 * Complete project
 */
export const completeProject = async (
    id: number,
    data: { actualCost?: number; actualSavings?: number },
    completedBy: number
) => {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            suggestion: { include: { user: true } },
        },
    });

    if (!project) {
        throw new Error('Proje bulunamadi');
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            status: ProjectStatus.COMPLETED,
            progress: 100,
            actualEndDate: new Date(),
            actualCost: data.actualCost,
            actualSavings: data.actualSavings,
            updatedAt: new Date(),
        },
    });

    // Update suggestion status
    if (project.suggestion) {
        await prisma.suggestion.update({
            where: { id: project.suggestion.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
    }

    // Send notification to suggestion owner
    if (project.suggestion?.user) {
        try {
            await sendEmail({
                to: project.suggestion.user.email,
                subject: 'Projeniz Tamamlandi - ' + project.name,
                templateCode: 'project-completed',
                templateData: {
                    employeeName: `${project.suggestion.user.firstName} ${project.suggestion.user.lastName}`,
                    projectName: project.name,
                    suggestionTitle: project.suggestion.title,
                    completionDate: new Date().toLocaleDateString('tr-TR'),
                    actualSavings: data.actualSavings,
                },
            });
        } catch (error) {
            logger.error('Failed to send project completion email:', error);
        }
    }

    return updatedProject;
};

/**
 * Add team member to project
 */
export const addTeamMember = async (
    projectId: number,
    userId: number,
    role: string | null,
    addedBy: number
) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        throw new Error('Proje bulunamadi');
    }

    // Check if already a team member
    const existing = await prisma.projectTeamMember.findFirst({
        where: {
            projectId,
            userId,
            removedAt: null,
        },
    });

    if (existing) {
        throw new Error('Kullanici zaten proje ekibinde');
    }

    const teamMember = await prisma.projectTeamMember.create({
        data: {
            projectId,
            userId,
            role,
        },
        select: {
            id: true,
            role: true,
            assignedAt: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    return teamMember;
};

/**
 * Remove team member from project
 */
export const removeTeamMember = async (
    projectId: number,
    userId: number,
    removedBy: number
) => {
    const teamMember = await prisma.projectTeamMember.findFirst({
        where: {
            projectId,
            userId,
            removedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Kullanici proje ekibinde bulunamadi');
    }

    await prisma.projectTeamMember.update({
        where: { id: teamMember.id },
        data: { removedAt: new Date() },
    });

    return { message: 'Kullanici proje ekibinden kaldirildi' };
};

/**
 * Create milestone
 */
export const createMilestone = async (
    projectId: number,
    data: { title: string; description?: string; dueDate?: Date },
    createdBy: number
) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        throw new Error('Proje bulunamadi');
    }

    const milestone = await prisma.projectMilestone.create({
        data: {
            projectId,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
        },
    });

    return milestone;
};

/**
 * Update milestone
 */
export const updateMilestone = async (
    milestoneId: number,
    data: { title?: string; description?: string; dueDate?: Date; isCompleted?: boolean },
    updatedBy: number
) => {
    const milestone = await prisma.projectMilestone.findUnique({
        where: { id: milestoneId },
    });

    if (!milestone) {
        throw new Error('Kilometre tasi bulunamadi');
    }

    const updatedMilestone = await prisma.projectMilestone.update({
        where: { id: milestoneId },
        data: {
            ...data,
            completedDate: data.isCompleted ? new Date() : null,
            updatedAt: new Date(),
        },
    });

    return updatedMilestone;
};

/**
 * Delete milestone
 */
export const deleteMilestone = async (milestoneId: number, deletedBy: number) => {
    const milestone = await prisma.projectMilestone.findUnique({
        where: { id: milestoneId },
    });

    if (!milestone) {
        throw new Error('Kilometre tasi bulunamadi');
    }

    await prisma.projectMilestone.delete({
        where: { id: milestoneId },
    });

    return { message: 'Kilometre tasi silindi' };
};

/**
 * Get projects by leader
 */
export const getProjectsByLeader = async (userId: number) => {
    const projects = await prisma.project.findMany({
        where: {
            projectLeaderId: userId,
            status: { not: ProjectStatus.CANCELLED },
        },
        select: {
            id: true,
            uuid: true,
            name: true,
            status: true,
            progress: true,
            startDate: true,
            estimatedEndDate: true,
            suggestion: {
                select: {
                    id: true,
                    referenceNumber: true,
                    title: true,
                },
            },
            _count: {
                select: {
                    teamMembers: { where: { removedAt: null } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return projects;
};

/**
 * Get project statistics
 */
export const getProjectStats = async () => {
    const [
        totalProjects,
        inProgressProjects,
        completedProjects,
        onHoldProjects,
        averageProgress,
    ] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
        prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
        prisma.project.count({ where: { status: ProjectStatus.ON_HOLD } }),
        prisma.project.aggregate({
            _avg: { progress: true },
        }),
    ]);

    // Projects by status
    const projectsByStatus = await prisma.project.groupBy({
        by: ['status'],
        _count: true,
    });

    return {
        total: totalProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
        averageProgress: averageProgress._avg.progress || 0,
        byStatus: projectsByStatus.map((s: any) => ({ status: s.status, count: s._count })),
    };
};
