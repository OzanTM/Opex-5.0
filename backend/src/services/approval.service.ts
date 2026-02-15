import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Status constants (SQLite stores enums as strings)
const ApprovalStepStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    RETURNED: 'RETURNED',
} as const;

const SuggestionStatus = {
    DRAFT: 'DRAFT',
    PENDING_COMMITTEE_REVIEW: 'PENDING_COMMITTEE_REVIEW',
    COMMITTEE_REVISION_REQUESTED: 'COMMITTEE_REVISION_REQUESTED',
    COMMITTEE_REJECTED: 'COMMITTEE_REJECTED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
} as const;

interface ApproveStepParams {
    stepId: number;
    approverId: number;
    notes?: string;
}

interface RejectStepParams {
    stepId: number;
    approverId: number;
    rejectionReason: string;
    notes?: string;
}

interface ReturnToCommitteeParams {
    stepId: number;
    approverId: number;
    reason: string;
    notes?: string;
}

export class ApprovalService {
    /**
     * Get pending approvals for an approver
     */
    async getPendingApprovals(approverId: number) {
        const pendingSteps = await prisma.approvalStep.findMany({
            where: {
                approverId,
                status: ApprovalStepStatus.PENDING,
            },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        employeeId: true,
                                        firstName: true,
                                        lastName: true,
                                        position: true,
                                    },
                                },
                                company: { select: { id: true, name: true } },
                                department: { select: { id: true, name: true } },
                                unit: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return pendingSteps.map(step => ({
            id: step.id,
            stepNumber: step.stepNumber,
            stepType: step.stepType,
            suggestion: {
                id: step.workflow.suggestion.id,
                referenceNumber: step.workflow.suggestion.referenceNumber,
                title: step.workflow.suggestion.title,
                currentSituation: step.workflow.suggestion.currentSituation,
                proposedSolution: step.workflow.suggestion.proposedSolution,
                expectedBenefits: step.workflow.suggestion.expectedBenefits,
                category: step.workflow.suggestion.category,
                estimatedCost: step.workflow.suggestion.estimatedCost,
                estimatedSavings: step.workflow.suggestion.estimatedSavings,
                owner: step.workflow.suggestion.user,
                company: step.workflow.suggestion.company,
                department: step.workflow.suggestion.department,
                unit: step.workflow.suggestion.unit,
                createdAt: step.workflow.suggestion.createdAt,
            },
            createdAt: step.createdAt,
        }));
    }

    /**
     * Get approval history for an approver
     */
    async getApprovalHistory(approverId: number) {
        const history = await prisma.approvalStep.findMany({
            where: {
                approverId,
                status: { in: [ApprovalStepStatus.APPROVED, ApprovalStepStatus.REJECTED] },
            },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        employeeId: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 50,
        });

        return history.map(step => ({
            id: step.id,
            stepNumber: step.stepNumber,
            status: step.status,
            notes: step.notes,
            rejectionReason: step.rejectionReason,
            processedAt: step.approvedAt || step.rejectedAt,
            suggestion: {
                id: step.workflow.suggestion.id,
                referenceNumber: step.workflow.suggestion.referenceNumber,
                title: step.workflow.suggestion.title,
                owner: step.workflow.suggestion.user,
            },
        }));
    }

    /**
     * Get approval statistics for an approver
     */
    async getApprovalStats(approverId: number) {
        const [pending, approved, rejected, thisMonth] = await Promise.all([
            prisma.approvalStep.count({
                where: { approverId, status: ApprovalStepStatus.PENDING },
            }),
            prisma.approvalStep.count({
                where: { approverId, status: ApprovalStepStatus.APPROVED },
            }),
            prisma.approvalStep.count({
                where: { approverId, status: ApprovalStepStatus.REJECTED },
            }),
            prisma.approvalStep.count({
                where: {
                    approverId,
                    status: { in: [ApprovalStepStatus.APPROVED, ApprovalStepStatus.REJECTED] },
                    updatedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        // Get average processing time
        const processedSteps = await prisma.approvalStep.findMany({
            where: {
                approverId,
                status: { in: [ApprovalStepStatus.APPROVED, ApprovalStepStatus.REJECTED] },
                approvedAt: { not: null },
            },
            select: {
                createdAt: true,
                approvedAt: true,
            },
            take: 100,
        });

        let avgProcessingTime = 0;
        if (processedSteps.length > 0) {
            const totalMs = processedSteps.reduce((acc, step) => {
                if (step.approvedAt) {
                    return acc + (step.approvedAt.getTime() - step.createdAt.getTime());
                }
                return acc;
            }, 0);
            avgProcessingTime = Math.round(totalMs / processedSteps.length / (1000 * 60 * 60)); // hours
        }

        return {
            pending,
            approved,
            rejected,
            thisMonth,
            avgProcessingTimeHours: avgProcessingTime,
        };
    }

    /**
     * Get approval step details
     */
    async getApprovalStep(stepId: number, userId: number) {
        const step = await prisma.approvalStep.findUnique({
            where: { id: stepId },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true, position: true } },
                                company: { select: { id: true, name: true } },
                                department: { select: { id: true, name: true } },
                                unit: { select: { id: true, name: true } },
                                documents: true,
                            },
                        },
                        steps: {
                            include: {
                                approver: { select: { id: true, firstName: true, lastName: true, position: true } },
                            },
                            orderBy: { stepNumber: 'asc' },
                        },
                    },
                },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        if (!step) {
            throw new Error('STEP_NOT_FOUND');
        }

        // Check if user is the approver for this step
        if (step.approverId !== userId) {
            throw new Error('ACCESS_DENIED');
        }

        return {
            id: step.id,
            stepNumber: step.stepNumber,
            stepType: step.stepType,
            status: step.status,
            notes: step.notes,
            rejectionReason: step.rejectionReason,
            createdAt: step.createdAt,
            approver: step.approver,
            suggestion: step.workflow.suggestion,
            workflow: {
                id: step.workflow.id,
                currentStep: step.workflow.currentStep,
                totalSteps: step.workflow.totalSteps,
                steps: step.workflow.steps,
            },
        };
    }

    /**
     * Approve a step in the approval workflow
     */
    async approveStep(params: ApproveStepParams) {
        const { stepId, approverId, notes } = params;

        // Get the step with workflow
        const step = await prisma.approvalStep.findUnique({
            where: { id: stepId },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: { user: true },
                        },
                        steps: {
                            orderBy: { stepNumber: 'asc' },
                        },
                    },
                },
            },
        });

        if (!step) {
            throw new Error('STEP_NOT_FOUND');
        }

        // Verify approver
        if (step.approverId !== approverId) {
            throw new Error('NOT_AUTHORIZED');
        }

        // Check if already processed
        if (step.status !== ApprovalStepStatus.PENDING) {
            throw new Error('ALREADY_PROCESSED');
        }

        // Update step status
        await prisma.approvalStep.update({
            where: { id: stepId },
            data: {
                status: ApprovalStepStatus.APPROVED,
                approvedAt: new Date(),
                notes,
            },
        });

        // Create approval history
        await prisma.approvalHistory.create({
            data: {
                stepId,
                actionById: approverId,
                action: 'APPROVED',
                notes,
            },
        });

        const workflow = step.workflow;
        const suggestion = workflow.suggestion;

        // Check if this was the last step
        if (step.stepNumber >= workflow.totalSteps) {
            // All approvals complete - update suggestion status
            await prisma.suggestion.update({
                where: { id: suggestion.id },
                data: {
                    status: SuggestionStatus.APPROVED,
                    approvedAt: new Date(),
                },
            });

            // Send email to suggestion owner
            await sendEmail({
                to: suggestion.user.email,
                subject: 'Öneriniz Onaylandi - ' + suggestion.title,
                templateCode: 'suggestion-approved',
                templateData: {
                    employeeName: suggestion.user.firstName,
                    suggestionTitle: suggestion.title,
                    referenceNumber: suggestion.referenceNumber,
                },
            });

            logger.info('Suggestion fully approved', { suggestionId: suggestion.id });
        } else {
            // Move to next step
            const nextStep = workflow.steps.find(s => s.stepNumber === step.stepNumber + 1);
            if (nextStep) {
                await prisma.approvalWorkflow.update({
                    where: { id: workflow.id },
                    data: { currentStep: nextStep.stepNumber },
                });

                // Notify next approver
                const nextApprover = await prisma.user.findUnique({
                    where: { id: nextStep.approverId },
                });

                if (nextApprover) {
                    await sendEmail({
                        to: nextApprover.email,
                        subject: 'Yeni Öneri Onayiniz Bekliyor - ' + suggestion.title,
                        templateCode: 'approval-request',
                        templateData: {
                            managerName: nextApprover.firstName,
                            suggestionTitle: suggestion.title,
                            referenceNumber: suggestion.referenceNumber,
                            ownerName: suggestion.user.firstName + ' ' + suggestion.user.lastName,
                        },
                    });
                }
            }
        }

        return {
            success: true,
            isFinalApproval: step.stepNumber >= workflow.totalSteps,
            suggestionId: suggestion.id,
        };
    }

    /**
     * Reject a step in the approval workflow
     */
    async rejectStep(params: RejectStepParams) {
        const { stepId, approverId, rejectionReason, notes } = params;

        const step = await prisma.approvalStep.findUnique({
            where: { id: stepId },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: { user: true },
                        },
                    },
                },
            },
        });

        if (!step) {
            throw new Error('STEP_NOT_FOUND');
        }

        if (step.approverId !== approverId) {
            throw new Error('NOT_AUTHORIZED');
        }

        if (step.status !== ApprovalStepStatus.PENDING) {
            throw new Error('ALREADY_PROCESSED');
        }

        // Update step status
        await prisma.approvalStep.update({
            where: { id: stepId },
            data: {
                status: ApprovalStepStatus.REJECTED,
                rejectedAt: new Date(),
                rejectionReason,
                notes,
            },
        });

        // Create approval history
        await prisma.approvalHistory.create({
            data: {
                stepId,
                actionById: approverId,
                action: 'REJECTED',
                notes: rejectionReason,
            },
        });

        const suggestion = step.workflow.suggestion;

        // Update suggestion status - return to committee for re-evaluation
        await prisma.suggestion.update({
            where: { id: suggestion.id },
            data: {
                status: SuggestionStatus.PENDING_COMMITTEE_REVIEW,
                rejectionReason: `Müdür Reddi: ${rejectionReason}`,
            },
        });

        // Send email to suggestion owner
        await sendEmail({
            to: suggestion.user.email,
            subject: 'Öneriniz Hakkinda - ' + suggestion.title,
            templateCode: 'suggestion-manager-rejected',
            templateData: {
                employeeName: suggestion.user.firstName,
                suggestionTitle: suggestion.title,
                referenceNumber: suggestion.referenceNumber,
                rejectionReason,
            },
        });

        // Notify committee
        const committeeMembers = await prisma.user.findMany({
            where: {
                role: { in: ['COMMITTEE_MANAGER', 'COMMITTEE_MEMBER'] },
            },
        });

        for (const member of committeeMembers) {
            await sendEmail({
                to: member.email,
                subject: 'Öneri Yeniden Degerlendirme Gerekiyor - ' + suggestion.title,
                templateCode: 'committee-re-evaluation',
                templateData: {
                    suggestionTitle: suggestion.title,
                    referenceNumber: suggestion.referenceNumber,
                    rejectionReason,
                },
            });
        }

        logger.info('Suggestion rejected by manager', { suggestionId: suggestion.id, stepId });

        return {
            success: true,
            suggestionId: suggestion.id,
            status: 'RETURNED_TO_COMMITTEE',
        };
    }

    /**
     * Return suggestion to committee for re-evaluation
     */
    async returnToCommittee(params: ReturnToCommitteeParams) {
        const { stepId, approverId, reason, notes } = params;

        const step = await prisma.approvalStep.findUnique({
            where: { id: stepId },
            include: {
                workflow: {
                    include: {
                        suggestion: {
                            include: { user: true },
                        },
                    },
                },
            },
        });

        if (!step) {
            throw new Error('STEP_NOT_FOUND');
        }

        if (step.approverId !== approverId) {
            throw new Error('NOT_AUTHORIZED');
        }

        if (step.status !== ApprovalStepStatus.PENDING) {
            throw new Error('ALREADY_PROCESSED');
        }

        // Update step status
        await prisma.approvalStep.update({
            where: { id: stepId },
            data: {
                status: ApprovalStepStatus.RETURNED,
                notes: `Komiteye iade: ${reason}. ${notes || ''}`,
            },
        });

        // Create approval history
        await prisma.approvalHistory.create({
            data: {
                stepId,
                actionById: approverId,
                action: 'RETURNED',
                notes: reason,
            },
        });

        const suggestion = step.workflow.suggestion;

        // Update suggestion status
        await prisma.suggestion.update({
            where: { id: suggestion.id },
            data: {
                status: SuggestionStatus.PENDING_COMMITTEE_REVIEW,
                revisionRequestReason: reason,
            },
        });

        // Notify committee
        const committeeMembers = await prisma.user.findMany({
            where: {
                role: { in: ['COMMITTEE_MANAGER', 'COMMITTEE_MEMBER'] },
            },
        });

        for (const member of committeeMembers) {
            await sendEmail({
                to: member.email,
                subject: 'Öneri Yeniden Degerlendirme Gerekiyor - ' + suggestion.title,
                templateCode: 'committee-re-evaluation',
                templateData: {
                    suggestionTitle: suggestion.title,
                    referenceNumber: suggestion.referenceNumber,
                    reason,
                },
            });
        }

        logger.info('Suggestion returned to committee', { suggestionId: suggestion.id, stepId });

        return {
            success: true,
            suggestionId: suggestion.id,
            status: 'RETURNED_TO_COMMITTEE',
        };
    }
}

export default new ApprovalService();