/**
 * OpEx 5.0 - Report Service
 * Handles reporting and statistics operations
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// ============================================
// DASHBOARD STATISTICS
// ============================================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (companyId?: number) => {
    const companyFilter = companyId ? { companyId } : {};

    // Total suggestions
    const totalSuggestions = await prisma.suggestion.count({
        where: companyFilter,
    });

    // Suggestions by status
    const suggestionsByStatus = await prisma.suggestion.groupBy({
        by: ['status'],
        where: companyFilter,
        _count: true,
    });

    // Suggestions by category (category is a string field)
    const suggestionsByCategory = await prisma.suggestion.groupBy({
        by: ['category'],
        where: companyFilter,
        _count: true,
    });

    // Total approved suggestions
    const approvedSuggestions = await prisma.suggestion.count({
        where: {
            ...companyFilter,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
    });

    // Total completed suggestions
    const completedSuggestions = await prisma.suggestion.count({
        where: {
            ...companyFilter,
            status: 'COMPLETED',
        },
    });

    // Total projects
    const totalProjects = await prisma.project.count();

    // Active projects
    const activeProjects = await prisma.project.count({
        where: { status: 'IN_PROGRESS' },
    });

    // Total estimated savings
    const totalEstimatedSavings = await prisma.suggestion.aggregate({
        where: {
            ...companyFilter,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        _sum: { estimatedSavings: true },
    });

    // Total actual savings
    const totalActualSavings = await prisma.project.aggregate({
        _sum: { actualSavings: true },
    });

    // Total estimated cost
    const totalEstimatedCost = await prisma.suggestion.aggregate({
        where: {
            ...companyFilter,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        _sum: { estimatedCost: true },
    });

    // Total actual cost
    const totalActualCost = await prisma.project.aggregate({
        _sum: { actualCost: true },
    });

    // Pending approvals count (using ApprovalStep)
    const pendingApprovals = await prisma.approvalStep.count({
        where: {
            status: 'PENDING',
            ...(companyId && {
                workflow: {
                    suggestion: { companyId },
                },
            }),
        },
    });

    // Recent suggestions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSuggestions = await prisma.suggestion.count({
        where: {
            ...companyFilter,
            createdAt: { gte: thirtyDaysAgo },
        },
    });

    return {
        suggestions: {
            total: totalSuggestions,
            approved: approvedSuggestions,
            completed: completedSuggestions,
            recent: recentSuggestions,
            byStatus: suggestionsByStatus.map((s) => ({
                status: s.status,
                count: s._count,
            })),
            byCategory: suggestionsByCategory.map((c) => ({
                category: c.category || 'Kategorisiz',
                count: c._count,
            })),
        },
        projects: {
            total: totalProjects,
            active: activeProjects,
        },
        financial: {
            estimatedSavings: totalEstimatedSavings._sum.estimatedSavings || 0,
            actualSavings: totalActualSavings._sum.actualSavings || 0,
            estimatedCost: totalEstimatedCost._sum.estimatedCost || 0,
            actualCost: totalActualCost._sum.actualCost || 0,
        },
        approvals: {
            pending: pendingApprovals,
        },
    };
};

// ============================================
// SUGGESTION REPORTS
// ============================================

interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

/**
 * Get suggestion statistics by date range
 */
export const getSuggestionStats = async (
    dateRange: DateRange = {},
    companyId?: number,
    departmentId?: number
) => {
    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (departmentId) where.departmentId = departmentId;

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    // Total count
    const total = await prisma.suggestion.count({ where });

    // By status
    const byStatus = await prisma.suggestion.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    // By category (string field)
    const byCategory = await prisma.suggestion.groupBy({
        by: ['category'],
        where,
        _count: true,
        _sum: { estimatedSavings: true, estimatedCost: true },
    });

    // By company
    const byCompany = await prisma.suggestion.groupBy({
        by: ['companyId'],
        where,
        _count: true,
    });

    // By department
    const byDepartment = await prisma.suggestion.groupBy({
        by: ['departmentId'],
        where,
        _count: true,
    });

    // Get related entity names
    const [companies, departments] = await Promise.all([
        prisma.company.findMany({ select: { id: true, name: true } }),
        prisma.department.findMany({ select: { id: true, name: true } }),
    ]);

    const companyMap = new Map(companies.map((c) => [c.id, c.name]));
    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

    // Monthly trend (simplified for SQLite)
    const suggestions = await prisma.suggestion.findMany({
        where,
        select: { createdAt: true },
    });

    // Group by month manually
    const monthlyData: { [key: string]: number } = {};
    suggestions.forEach((s) => {
        const month = s.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const monthlyTrend = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);

    return {
        total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byCategory: byCategory.map((c) => ({
            category: c.category || 'Kategorisiz',
            count: c._count,
            estimatedSavings: c._sum.estimatedSavings || 0,
            estimatedCost: c._sum.estimatedCost || 0,
        })),
        byCompany: byCompany.map((c) => ({
            companyId: c.companyId,
            companyName: companyMap.get(c.companyId) || 'Bilinmiyor',
            count: c._count,
        })),
        byDepartment: byDepartment
            .filter((d) => d.departmentId !== null)
            .map((d) => ({
                departmentId: d.departmentId,
                departmentName: departmentMap.get(d.departmentId!) || 'Bilinmiyor',
                count: d._count,
            })),
        monthlyTrend,
    };
};

/**
 * Get top performers (users with most suggestions)
 */
export const getTopPerformers = async (
    limit: number = 10,
    dateRange: DateRange = {},
    companyId?: number
) => {
    const where: any = {};

    if (companyId) where.companyId = companyId;

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const topPerformers = await prisma.suggestion.groupBy({
        by: ['userId'],
        where,
        _count: true,
        _sum: { estimatedSavings: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
    });

    // Get user details
    const userIds = topPerformers.map((p) => p.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            position: true,
            department: { select: { name: true } },
        },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topPerformers.map((p, index) => ({
        rank: index + 1,
        user: userMap.get(p.userId),
        suggestionCount: p._count,
        totalEstimatedSavings: p._sum.estimatedSavings || 0,
    }));
};

// ============================================
// PROJECT REPORTS
// ============================================

/**
 * Get project statistics
 */
export const getProjectStats = async (dateRange: DateRange = {}) => {
    const where: any = {};

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    // Total projects
    const total = await prisma.project.count({ where });

    // By status
    const byStatus = await prisma.project.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    // Average progress
    const avgProgress = await prisma.project.aggregate({
        where,
        _avg: { progress: true },
    });

    // Total actual savings
    const totalSavings = await prisma.project.aggregate({
        where,
        _sum: { actualSavings: true, actualCost: true },
    });

    // Projects by leader
    const byLeader = await prisma.project.groupBy({
        by: ['projectLeaderId'],
        where,
        _count: true,
    });

    // Get leader details
    const leaderIds = byLeader.map((l) => l.projectLeaderId);
    const leaders = await prisma.user.findMany({
        where: { id: { in: leaderIds } },
        select: { id: true, firstName: true, lastName: true },
    });

    const leaderMap = new Map(leaders.map((l) => [l.id, l]));

    return {
        total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        averageProgress: avgProgress._avg.progress || 0,
        totalSavings: totalSavings._sum.actualSavings || 0,
        totalCost: totalSavings._sum.actualCost || 0,
        byLeader: byLeader.map((l) => ({
            leader: leaderMap.get(l.projectLeaderId),
            count: l._count,
        })),
    };
};

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * Get financial summary
 */
export const getFinancialSummary = async (
    dateRange: DateRange = {},
    companyId?: number
) => {
    const suggestionWhere: any = {};
    const projectWhere: any = {};

    if (companyId) {
        suggestionWhere.companyId = companyId;
    }

    if (dateRange.startDate || dateRange.endDate) {
        suggestionWhere.createdAt = {};
        projectWhere.createdAt = {};
        if (dateRange.startDate) {
            suggestionWhere.createdAt.gte = dateRange.startDate;
            projectWhere.createdAt.gte = dateRange.startDate;
        }
        if (dateRange.endDate) {
            suggestionWhere.createdAt.lte = dateRange.endDate;
            projectWhere.createdAt.lte = dateRange.endDate;
        }
    }

    // Estimated savings from suggestions
    const estimatedSavings = await prisma.suggestion.aggregate({
        where: {
            ...suggestionWhere,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        _sum: { estimatedSavings: true, estimatedCost: true },
    });

    // Actual savings from completed projects
    const actualSavings = await prisma.project.aggregate({
        where: {
            ...projectWhere,
            status: 'COMPLETED',
        },
        _sum: { actualSavings: true, actualCost: true },
    });

    // Savings by category
    const savingsByCategory = await prisma.suggestion.groupBy({
        by: ['category'],
        where: {
            ...suggestionWhere,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        _sum: { estimatedSavings: true },
    });

    return {
        estimated: {
            savings: estimatedSavings._sum.estimatedSavings || 0,
            cost: estimatedSavings._sum.estimatedCost || 0,
        },
        actual: {
            savings: actualSavings._sum.actualSavings || 0,
            cost: actualSavings._sum.actualCost || 0,
        },
        byCategory: savingsByCategory.map((c) => ({
            category: c.category || 'Kategorisiz',
            estimatedSavings: c._sum.estimatedSavings || 0,
        })),
    };
};

// ============================================
// APPROVAL REPORTS
// ============================================

/**
 * Get approval statistics
 */
export const getApprovalStats = async (
    dateRange: DateRange = {},
    companyId?: number
) => {
    const where: any = {};

    if (companyId) {
        where.workflow = { suggestion: { companyId } };
    }

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    // Total approval steps
    const total = await prisma.approvalStep.count({ where });

    // By status
    const byStatus = await prisma.approvalStep.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    // By step type
    const byStepType = await prisma.approvalStep.groupBy({
        by: ['stepType'],
        where,
        _count: true,
    });

    // Average approval time
    const approvalSteps = await prisma.approvalStep.findMany({
        where: {
            ...where,
            status: { in: ['APPROVED', 'REJECTED'] },
            approvedAt: { not: null },
        },
        select: {
            createdAt: true,
            approvedAt: true,
        },
    });

    let totalApprovalTime = 0;
    let approvalCount = 0;

    approvalSteps.forEach((step) => {
        if (step.approvedAt) {
            const diff = step.approvedAt.getTime() - step.createdAt.getTime();
            totalApprovalTime += diff;
            approvalCount++;
        }
    });

    const averageApprovalTime = approvalCount > 0 ? totalApprovalTime / approvalCount : 0;

    return {
        total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byStepType: byStepType.map((s) => ({ stepType: s.stepType, count: s._count })),
        averageApprovalTimeMs: averageApprovalTime,
        averageApprovalTimeDays: Math.round(averageApprovalTime / (1000 * 60 * 60 * 24)),
    };
};

// ============================================
// EXPORT DATA
// ============================================

/**
 * Get suggestions for export
 */
export const getSuggestionsForExport = async (
    dateRange: DateRange = {},
    companyId?: number,
    status?: string
) => {
    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (status) where.status = status;

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const suggestions = await prisma.suggestion.findMany({
        where,
        select: {
            referenceNumber: true,
            title: true,
            currentSituation: true,
            proposedSolution: true,
            estimatedCost: true,
            estimatedSavings: true,
            status: true,
            category: true,
            createdAt: true,
            user: {
                select: {
                    employeeId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            company: { select: { name: true } },
            department: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return suggestions;
};

/**
 * Get projects for export
 */
export const getProjectsForExport = async (
    dateRange: DateRange = {},
    status?: string
) => {
    const where: any = {};

    if (status) where.status = status;

    if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const projects = await prisma.project.findMany({
        where,
        select: {
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
            projectLeader: {
                select: {
                    employeeId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            suggestion: {
                select: {
                    referenceNumber: true,
                    title: true,
                    company: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return projects;
};
