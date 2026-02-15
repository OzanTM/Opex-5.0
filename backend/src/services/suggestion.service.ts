import { PrismaClient } from '@prisma/client';
import {
    ICreateSuggestionRequest,
    IUpdateSuggestionRequest,
    ISuggestionFilter,
    ISuggestionWithDetails,
    ICommitteeReviewRequest
} from '../types';
import { queueEmail } from './email.service';
import config from '../config';
import logger from '../utils/logger';
import cacheService from './cache.service';
import approvalService from './approval.service';

const prisma = new PrismaClient();

// Status constants (since SQLite doesn't support enums)
const SuggestionStatus = {
    DRAFT: 'DRAFT',
    PENDING_COMMITTEE_REVIEW: 'PENDING_COMMITTEE_REVIEW',
    COMMITTEE_REVISION_REQUESTED: 'COMMITTEE_REVISION_REQUESTED',
    COMMITTEE_REJECTED: 'COMMITTEE_REJECTED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVER_REJECTED: 'APPROVER_REJECTED',
    APPROVED: 'APPROVED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const ApprovalStepStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SKIPPED: 'SKIPPED',
};

const ProjectStatus = {
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

interface IAssignProjectRequest {
    projectLeaderId: number;
    teamMemberIds?: number[];
    projectName?: string;
    projectDescription?: string;
}

export class SuggestionService {
    /**
     * Generate unique reference number
     */
    private generateReferenceNumber(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ONR-${year}-${random}`;
    }

    /**
     * Create a new suggestion
     */
    async createSuggestion(userId: number, data: ICreateSuggestionRequest): Promise<ISuggestionWithDetails> {
        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true, department: true, unit: true },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Create suggestion
        const suggestion = await prisma.suggestion.create({
            data: {
                referenceNumber: this.generateReferenceNumber(),
                userId,
                companyId: user.companyId,
                departmentId: user.departmentId,
                unitId: user.unitId,
                title: data.title,
                currentSituation: data.currentSituation,
                proposedSolution: data.proposedSolution,
                expectedBenefits: data.expectedBenefits,
                category: data.category,
                gainCategories: JSON.stringify(data.gainCategories),
                estimatedCost: data.estimatedCost,
                estimatedSavings: data.estimatedSavings,
                estimatedTimeSavings: data.estimatedTimeSavings,
                currency: data.currency || 'TRY',
                status: SuggestionStatus.DRAFT,
            },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        // Create status history
        await prisma.statusHistory.create({
            data: {
                suggestionId: suggestion.id,
                fromStatus: SuggestionStatus.DRAFT,
                toStatus: SuggestionStatus.DRAFT,
                changedById: userId,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'Suggestion',
                entityId: suggestion.id,
                newValue: JSON.stringify(suggestion),
            },
        });

        // Invalidate cache
        await cacheService.delByPattern('suggestions:list:*');

        return this.formatSuggestion(suggestion);
    }

    /**
     * Submit suggestion for review
     */
    async submitSuggestion(suggestionId: number, userId: number): Promise<ISuggestionWithDetails> {
        const suggestion = await prisma.suggestion.findFirst({
            where: { id: suggestionId, userId },
        });

        if (!suggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        if (suggestion.status !== SuggestionStatus.DRAFT) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }

        // Update status
        const updated = await prisma.suggestion.update({
            where: { id: suggestionId },
            data: {
                status: SuggestionStatus.PENDING_COMMITTEE_REVIEW,
                submittedAt: new Date(),
            },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        // Create status history
        await prisma.statusHistory.create({
            data: {
                suggestionId: suggestion.id,
                fromStatus: suggestion.status,
                toStatus: SuggestionStatus.PENDING_COMMITTEE_REVIEW,
                changedById: userId,
            },
        });

        // Send email to suggestion owner (non-critical, don't fail submit)
        try {
            await queueEmail({
                to: updated.user.employeeId,
                subject: `Öneriniz Alindi - ${updated.title}`,
                templateCode: 'SUGGESTION_SUBMITTED',
                templateData: {
                    firstName: updated.user.firstName,
                    fullName: `${updated.user.firstName} ${updated.user.lastName}`,
                    suggestionTitle: updated.title,
                    companyName: updated.company.name,
                    suggestionUrl: `${config.frontend.url}/suggestions/${updated.uuid}`,
                },
            });
        } catch (emailError: any) {
            logger.error('Failed to queue email for suggestion submit', { suggestionId, error: emailError.message });
        }

        // Invalidate cache
        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${suggestionId}`);

        return this.formatSuggestion(updated);
    }

    /**
     * Committee review - approve, reject, or request revision
     */
    async committeeReview(suggestionId: number, reviewerId: number, data: ICommitteeReviewRequest): Promise<ISuggestionWithDetails> {
        const suggestion = await prisma.suggestion.findUnique({
            where: { id: suggestionId },
            include: { user: true, company: true },
        });

        if (!suggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        if (suggestion.status !== SuggestionStatus.PENDING_COMMITTEE_REVIEW &&
            suggestion.status !== SuggestionStatus.APPROVER_REJECTED) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }

        let newStatus: string;
        let emailTemplate: string;

        switch (data.action) {
            case 'approve':
                newStatus = SuggestionStatus.PENDING_APPROVAL;
                emailTemplate = 'SUGGESTION_COMMITTEE_APPROVED';
                break;
            case 'reject':
                newStatus = SuggestionStatus.COMMITTEE_REJECTED;
                emailTemplate = 'SUGGESTION_COMMITTEE_REJECTED';
                break;
            case 'request_revision':
                newStatus = SuggestionStatus.COMMITTEE_REVISION_REQUESTED;
                emailTemplate = 'SUGGESTION_REVISION_REQUESTED';
                break;
            default:
                throw new Error('INVALID_ACTION');
        }

        // Update suggestion
        const updated = await prisma.suggestion.update({
            where: { id: suggestionId },
            data: {
                status: newStatus,
                category: data.category,
                committeeReviewDate: new Date(),
                committeeReviewerId: reviewerId,
                committeeNotes: data.notes,
                rejectionReason: data.rejectionReason,
                revisionRequestReason: data.revisionRequestReason,
            },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        // Create status history
        await prisma.statusHistory.create({
            data: {
                suggestionId: suggestion.id,
                fromStatus: suggestion.status,
                toStatus: newStatus,
                changedById: reviewerId,
                reason: data.notes || data.rejectionReason || data.revisionRequestReason,
            },
        });

        // If approved, create approval workflow and project
        if (data.action === 'approve' && data.projectLeaderId) {
            await this.createApprovalWorkflow(suggestion.id, suggestion.userId);

            // Create project
            await prisma.project.create({
                data: {
                    suggestionId: suggestion.id,
                    name: suggestion.title,
                    description: suggestion.proposedSolution,
                    projectLeaderId: data.projectLeaderId,
                    status: ProjectStatus.PLANNED,
                },
            });
        }

        // Send email to suggestion owner (non-critical)
        try {
            await queueEmail({
                to: suggestion.user.email,
                subject: `Öneriniz Hakkinda - ${suggestion.title}`,
                templateCode: emailTemplate,
                templateData: {
                    firstName: suggestion.user.firstName,
                    fullName: `${suggestion.user.firstName} ${suggestion.user.lastName}`,
                    suggestionTitle: suggestion.title,
                    companyName: suggestion.company.name,
                    revisionReason: data.revisionRequestReason,
                    rejectionReason: data.rejectionReason,
                    suggestionUrl: `${config.frontend.url}/suggestions/${suggestion.uuid}`,
                    newSuggestionUrl: `${config.frontend.url}/suggestions/new`,
                },
            });
        } catch (emailError: any) {
            logger.error('Failed to queue email for committee review', { suggestionId, error: emailError.message });
        }

        // Invalidate cache
        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${suggestionId}`);

        return this.formatSuggestion(updated);
    }

    /**
     * Create approval workflow based on user hierarchy
     */
    private async createApprovalWorkflow(suggestionId: number, userId: number): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { department: true, unit: true },
        });

        if (!user) return;

        // Prefer department approver, fallback to any company approver/admin.
        const approver =
            await prisma.user.findFirst({
                where: {
                    companyId: user.companyId,
                    departmentId: user.departmentId ?? undefined,
                    role: 'APPROVER',
                },
            }) ??
            await prisma.user.findFirst({
                where: {
                    companyId: user.companyId,
                    role: { in: ['APPROVER', 'ADMIN'] },
                },
            });

        if (!approver) {
            logger.warn('No approver found while creating approval workflow', { suggestionId, userId });
            return;
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                suggestionId,
                totalSteps: 1,
                steps: {
                    create: {
                        stepNumber: 1,
                        stepType: 'MANAGER_APPROVAL',
                        approverId: approver.id,
                        status: ApprovalStepStatus.PENDING,
                    },
                },
            },
        });

        try {
            const suggestion = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
            if (suggestion) {
                await queueEmail({
                    to: approver.email,
                    subject: `Onayiniz Bekleniyor - ${suggestion.title}`,
                    templateCode: 'APPROVAL_REMINDER',
                    templateData: {
                        approverName: `${approver.firstName} ${approver.lastName}`,
                        suggestionTitle: suggestion.title,
                        suggestionUrl: `${config.frontend.url}/suggestions/${suggestion.uuid}`,
                    },
                });
            }
        } catch (emailError: any) {
            logger.error('Failed to queue approval notification email', {
                suggestionId,
                approverId: approver.id,
                error: emailError.message,
            });
        }

        logger.info('Approval workflow created', { suggestionId, workflowId: workflow.id });
    }

    /**
     * Get suggestions pending committee review
     */
    async getPendingCommitteeReview(): Promise<ISuggestionWithDetails[]> {
        const suggestions = await prisma.suggestion.findMany({
            where: { status: SuggestionStatus.PENDING_COMMITTEE_REVIEW },
            orderBy: { submittedAt: 'asc' },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        return suggestions.map((suggestion) => this.formatSuggestion(suggestion));
    }

    /**
     * Get suggestions evaluated by committee
     */
    async getEvaluatedByCommittee(): Promise<ISuggestionWithDetails[]> {
        const suggestions = await prisma.suggestion.findMany({
            where: {
                committeeReviewDate: { not: null },
                status: {
                    in: [
                        SuggestionStatus.PENDING_APPROVAL,
                        SuggestionStatus.COMMITTEE_REJECTED,
                        SuggestionStatus.COMMITTEE_REVISION_REQUESTED,
                        SuggestionStatus.APPROVED,
                        SuggestionStatus.IN_PROGRESS,
                        SuggestionStatus.COMPLETED,
                    ],
                },
            },
            orderBy: { committeeReviewDate: 'desc' },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        return suggestions.map((suggestion) => this.formatSuggestion(suggestion));
    }

    /**
     * Get committee dashboard stats
     */
    async getCommitteeStats(): Promise<{
        pending: number;
        approvedToApproval: number;
        rejected: number;
        revisionRequested: number;
        totalEvaluated: number;
    }> {
        const [pending, approvedToApproval, rejected, revisionRequested] = await Promise.all([
            prisma.suggestion.count({ where: { status: SuggestionStatus.PENDING_COMMITTEE_REVIEW } }),
            prisma.suggestion.count({ where: { status: SuggestionStatus.PENDING_APPROVAL } }),
            prisma.suggestion.count({ where: { status: SuggestionStatus.COMMITTEE_REJECTED } }),
            prisma.suggestion.count({ where: { status: SuggestionStatus.COMMITTEE_REVISION_REQUESTED } }),
        ]);

        return {
            pending,
            approvedToApproval,
            rejected,
            revisionRequested,
            totalEvaluated: approvedToApproval + rejected + revisionRequested,
        };
    }

    /**
     * Assign/Update project details for a suggestion
     */
    async assignProject(suggestionId: number, data: IAssignProjectRequest): Promise<ISuggestionWithDetails> {
        const suggestion = await prisma.suggestion.findUnique({
            where: { id: suggestionId },
            include: { project: true },
        });

        if (!suggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        const project = suggestion.project
            ? await prisma.project.update({
                where: { suggestionId },
                data: {
                    name: data.projectName || suggestion.title,
                    description: data.projectDescription || suggestion.proposedSolution,
                    projectLeaderId: data.projectLeaderId,
                },
            })
            : await prisma.project.create({
                data: {
                    suggestionId,
                    name: data.projectName || suggestion.title,
                    description: data.projectDescription || suggestion.proposedSolution,
                    projectLeaderId: data.projectLeaderId,
                    status: ProjectStatus.PLANNED,
                },
            });

        // Recreate project team for a deterministic state.
        await prisma.projectTeamMember.deleteMany({ where: { projectId: project.id } });

        const teamMemberIds = Array.from(new Set((data.teamMemberIds || []).filter((id) => id !== data.projectLeaderId)));
        if (teamMemberIds.length > 0) {
            await prisma.projectTeamMember.createMany({
                data: teamMemberIds.map((userId) => ({
                    projectId: project.id,
                    userId,
                })),
            });
        }

        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${suggestionId}`);

        const updatedSuggestion = await this.getSuggestionById(suggestionId);
        if (!updatedSuggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        return updatedSuggestion;
    }

    /**
     * Approve suggestion by processing current approver's pending step
     */
    async approveSuggestion(suggestionId: number, approverId: number, notes?: string): Promise<ISuggestionWithDetails> {
        const workflow = await prisma.approvalWorkflow.findUnique({
            where: { suggestionId },
            include: {
                steps: {
                    where: { status: ApprovalStepStatus.PENDING },
                    orderBy: { stepNumber: 'asc' },
                },
            },
        });

        if (!workflow) {
            throw new Error('WORKFLOW_NOT_FOUND');
        }

        const currentStep = workflow.steps[0];
        if (!currentStep) {
            throw new Error('STEP_ALREADY_PROCESSED');
        }

        if (currentStep.approverId !== approverId) {
            throw new Error('NOT_AUTHORIZED_TO_APPROVE');
        }

        try {
            await approvalService.approveStep({
                stepId: currentStep.id,
                approverId,
                notes,
            });
        } catch (error: any) {
            if (error.message === 'ALREADY_PROCESSED') {
                throw new Error('STEP_ALREADY_PROCESSED');
            }
            if (error.message === 'NOT_AUTHORIZED') {
                throw new Error('NOT_AUTHORIZED_TO_APPROVE');
            }
            throw error;
        }

        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${suggestionId}`);

        const updatedSuggestion = await this.getSuggestionById(suggestionId);
        if (!updatedSuggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        return updatedSuggestion;
    }

    /**
     * Reject suggestion by processing current approver's pending step
     */
    async rejectSuggestion(suggestionId: number, approverId: number, reason: string): Promise<ISuggestionWithDetails> {
        const workflow = await prisma.approvalWorkflow.findUnique({
            where: { suggestionId },
            include: {
                steps: {
                    where: { status: ApprovalStepStatus.PENDING },
                    orderBy: { stepNumber: 'asc' },
                },
            },
        });

        if (!workflow) {
            throw new Error('WORKFLOW_NOT_FOUND');
        }

        const currentStep = workflow.steps[0];
        if (!currentStep) {
            throw new Error('STEP_ALREADY_PROCESSED');
        }

        if (currentStep.approverId !== approverId) {
            throw new Error('NOT_AUTHORIZED_TO_REJECT');
        }

        try {
            await approvalService.rejectStep({
                stepId: currentStep.id,
                approverId,
                rejectionReason: reason,
            });
        } catch (error: any) {
            if (error.message === 'ALREADY_PROCESSED') {
                throw new Error('STEP_ALREADY_PROCESSED');
            }
            if (error.message === 'NOT_AUTHORIZED') {
                throw new Error('NOT_AUTHORIZED_TO_REJECT');
            }
            throw error;
        }

        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${suggestionId}`);

        const updatedSuggestion = await this.getSuggestionById(suggestionId);
        if (!updatedSuggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        return updatedSuggestion;
    }

    /**
     * Get suggestions with filtering and pagination
     */
    async getSuggestions(filter: ISuggestionFilter): Promise<{ data: ISuggestionWithDetails[]; total: number }> {
        const cacheKey = `suggestions:list:${JSON.stringify(filter)}`;
        const cached = await cacheService.get<{ data: ISuggestionWithDetails[]; total: number }>(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {};

        if (filter.status) where.status = filter.status;
        if (filter.category) where.category = filter.category;
        if (filter.userId) where.userId = filter.userId;
        if (filter.companyId) where.companyId = filter.companyId;
        if (filter.departmentId) where.departmentId = filter.departmentId;
        if (filter.unitId) where.unitId = filter.unitId;

        if (filter.dateFrom || filter.dateTo) {
            where.createdAt = {};
            if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
            if (filter.dateTo) where.createdAt.lte = filter.dateTo;
        }

        if (filter.search) {
            where.OR = [
                { title: { contains: filter.search } },
                { currentSituation: { contains: filter.search } },
                { proposedSolution: { contains: filter.search } },
                { referenceNumber: { contains: filter.search } },
            ];
        }

        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const skip = (page - 1) * limit;

        const [suggestions, total] = await Promise.all([
            prisma.suggestion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                    company: { select: { id: true, name: true } },
                    department: { select: { id: true, name: true } },
                    unit: { select: { id: true, name: true } },
                    documents: true,
                },
            }),
            prisma.suggestion.count({ where }),
        ]);

        const result = {
            data: suggestions.map((s: any) => this.formatSuggestion(s)),
            total,
        };

        // Cache result for 5 minutes
        await cacheService.set(cacheKey, result, 300);

        return result;
    }

    /**
     * Get suggestion by ID
     */
    async getSuggestionById(id: number): Promise<ISuggestionWithDetails | null> {
        const cacheKey = `suggestions:${id}`;
        const cached = await cacheService.get<ISuggestionWithDetails>(cacheKey);

        if (cached) return cached;

        const suggestion = await prisma.suggestion.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
                approvalWorkflow: {
                    include: {
                        steps: {
                            include: {
                                approver: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                            },
                        },
                    },
                },
                project: {
                    include: {
                        projectLeader: { select: { id: true, firstName: true, lastName: true } },
                        teamMembers: {
                            include: { user: { select: { id: true, firstName: true, lastName: true } } },
                        },
                        milestones: true,
                    },
                },
            },
        });

        if (!suggestion) return null;

        const result = this.formatSuggestion(suggestion);

        // Cache for 10 minutes
        await cacheService.set(cacheKey, result, 600);

        return result;
    }

    /**
     * Update suggestion
     */
    async updateSuggestion(id: number, userId: number, data: IUpdateSuggestionRequest): Promise<ISuggestionWithDetails> {
        const suggestion = await prisma.suggestion.findFirst({
            where: { id, userId },
        });

        if (!suggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        if (suggestion.status !== SuggestionStatus.DRAFT &&
            suggestion.status !== SuggestionStatus.COMMITTEE_REVISION_REQUESTED) {
            throw new Error('CANNOT_UPDATE_SUGGESTION');
        }

        const updateData: any = {
            ...data,
            updatedAt: new Date(),
        };

        if (data.gainCategories) {
            updateData.gainCategories = JSON.stringify(data.gainCategories);
        }

        const updated = await prisma.suggestion.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, employeeId: true, firstName: true, lastName: true, position: true } },
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                documents: true,
            },
        });

        // If was in revision requested, resubmit
        if (suggestion.status === SuggestionStatus.COMMITTEE_REVISION_REQUESTED) {
            await prisma.suggestion.update({
                where: { id },
                data: { status: SuggestionStatus.PENDING_COMMITTEE_REVIEW },
            });
        }

        // Invalidate cache
        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${id}`);

        return this.formatSuggestion(updated);
    }

    /**
     * Delete suggestion (soft delete)
     */
    async deleteSuggestion(id: number, userId: number): Promise<void> {
        const suggestion = await prisma.suggestion.findFirst({
            where: { id, userId },
        });

        if (!suggestion) {
            throw new Error('SUGGESTION_NOT_FOUND');
        }

        if (suggestion.status !== SuggestionStatus.DRAFT) {
            throw new Error('CAN_ONLY_DELETE_DRAFT');
        }

        await prisma.suggestion.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'Suggestion',
                entityId: id,
            },
        });

        // Invalidate cache
        await cacheService.delByPattern('suggestions:list:*');
        await cacheService.del(`suggestions:${id}`);
    }

    /**
     * Format suggestion for response
     */
    private formatSuggestion(suggestion: any): ISuggestionWithDetails {
        let gainCategories = [];
        try {
            if (suggestion.gainCategories) {
                gainCategories = JSON.parse(suggestion.gainCategories);
            }
        } catch (e) {
            gainCategories = [];
        }

        return {
            id: suggestion.id,
            uuid: suggestion.uuid,
            referenceNumber: suggestion.referenceNumber,
            title: suggestion.title,
            currentSituation: suggestion.currentSituation,
            proposedSolution: suggestion.proposedSolution,
            expectedBenefits: suggestion.expectedBenefits,
            category: suggestion.category,
            gainCategories,
            estimatedCost: suggestion.estimatedCost,
            estimatedSavings: suggestion.estimatedSavings,
            estimatedTimeSavings: suggestion.estimatedTimeSavings,
            currency: suggestion.currency,
            status: suggestion.status,
            user: suggestion.user,
            company: suggestion.company,
            department: suggestion.department,
            unit: suggestion.unit,
            documents: suggestion.documents?.map((d: any) => ({
                id: d.id,
                fileName: d.fileName,
                originalName: d.originalName,
                filePath: d.filePath,
                fileSize: d.fileSize,
                mimeType: d.mimeType,
            })),
            approvalWorkflow: suggestion.approvalWorkflow ? {
                id: suggestion.approvalWorkflow.id,
                currentStep: suggestion.approvalWorkflow.currentStep,
                totalSteps: suggestion.approvalWorkflow.totalSteps,
                steps: suggestion.approvalWorkflow.steps?.map((s: any) => ({
                    id: s.id,
                    stepNumber: s.stepNumber,
                    stepType: s.stepType,
                    approver: s.approver,
                    status: s.status,
                    approvedAt: s.approvedAt,
                    rejectedAt: s.rejectedAt,
                    rejectionReason: s.rejectionReason,
                    notes: s.notes,
                })),
                completedAt: suggestion.approvalWorkflow.completedAt,
            } : undefined,
            project: suggestion.project ? {
                id: suggestion.project.id,
                uuid: suggestion.project.uuid,
                name: suggestion.project.name,
                description: suggestion.project.description,
                status: suggestion.project.status,
                progress: suggestion.project.progress,
                projectLeader: suggestion.project.projectLeader,
                teamMembers: suggestion.project.teamMembers?.map((tm: any) => ({
                    id: tm.user.id,
                    firstName: tm.user.firstName,
                    lastName: tm.user.lastName,
                    role: tm.role,
                })),
                startDate: suggestion.project.startDate,
                estimatedEndDate: suggestion.project.estimatedEndDate,
                actualEndDate: suggestion.project.actualEndDate,
                actualCost: suggestion.project.actualCost,
                actualSavings: suggestion.project.actualSavings,
                milestones: suggestion.project.milestones,
            } : undefined,
            createdAt: suggestion.createdAt,
            updatedAt: suggestion.updatedAt,
            submittedAt: suggestion.submittedAt,
            approvedAt: suggestion.approvedAt,
            completedAt: suggestion.completedAt,
        };
    }
}

export default new SuggestionService();
