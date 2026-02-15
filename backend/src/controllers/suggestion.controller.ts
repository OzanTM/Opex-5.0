import { Request, Response, NextFunction } from 'express';
import suggestionService from '../services/suggestion.service';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendPaginated } from '../utils/response';
import { IAuthRequest, ISuggestionFilter, SuggestionStatus } from '../types';
import logger from '../utils/logger';

export class SuggestionController {
    /**
     * Create suggestion
     * POST /api/v1/suggestions
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const data = req.body;

            // Validate required fields
            if (!data.title || !data.currentSituation || !data.proposedSolution) {
                sendBadRequest(res, 'Title, current situation, and proposed solution are required');
                return;
            }

            if (!data.gainCategories || data.gainCategories.length === 0) {
                sendBadRequest(res, 'At least one gain category is required');
                return;
            }

            const suggestion = await suggestionService.createSuggestion(user.id, data);

            sendSuccess(res, suggestion, 'Suggestion created successfully', 201);
        } catch (error: any) {
            logger.error('Create suggestion error', { error: error.message });
            sendError(res, 'Failed to create suggestion', 500, 'CREATE_ERROR');
        }
    }

    /**
     * Submit suggestion for review
     * POST /api/v1/suggestions/:id/submit
     */
    async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            const suggestion = await suggestionService.submitSuggestion(suggestionId, user.id);

            sendSuccess(res, suggestion, 'Suggestion submitted for review');
        } catch (error: any) {
            logger.error('Submit suggestion error', { error: error.message });

            if (error.message === 'SUGGESTION_NOT_FOUND') {
                sendNotFound(res, 'Suggestion not found');
                return;
            }

            if (error.message === 'INVALID_STATUS_TRANSITION') {
                sendBadRequest(res, 'Suggestion cannot be submitted in its current status');
                return;
            }

            sendError(res, 'Failed to submit suggestion', 500, 'SUBMIT_ERROR');
        }
    }

    /**
     * Get all suggestions (with filtering)
     * GET /api/v1/suggestions
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;

            const filter: ISuggestionFilter = {
                status: req.query.status as SuggestionStatus,
                category: req.query.category as string,
                userId: req.query.userId ? parseInt(req.query.userId as string, 10) : undefined,
                companyId: req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined,
                departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string, 10) : undefined,
                unitId: req.query.unitId ? parseInt(req.query.unitId as string, 10) : undefined,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as 'asc' | 'desc',
            };

            // Non-admin users can only see their own company's suggestions
            if (user.role !== 'ADMIN') {
                filter.companyId = user.companyId;
            }

            const { data, total } = await suggestionService.getSuggestions(filter);

            sendPaginated(res, data, total, filter.page!, filter.limit!);
        } catch (error: any) {
            logger.error('Get suggestions error', { error: error.message });
            sendError(res, 'Failed to get suggestions', 500, 'GET_ERROR');
        }
    }

    /**
     * Get my suggestions
     * GET /api/v1/suggestions/my
     */
    async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;

            const filter: ISuggestionFilter = {
                userId: user.id,
                status: req.query.status as SuggestionStatus,
                page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
            };

            const { data, total } = await suggestionService.getSuggestions(filter);

            sendPaginated(res, data, total, filter.page!, filter.limit!);
        } catch (error: any) {
            logger.error('Get my suggestions error', { error: error.message });
            sendError(res, 'Failed to get suggestions', 500, 'GET_ERROR');
        }
    }

    /**
     * Get suggestion by ID
     * GET /api/v1/suggestions/:id
     */
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            const suggestion = await suggestionService.getSuggestionById(suggestionId);

            if (!suggestion) {
                sendNotFound(res, 'Suggestion not found');
                return;
            }

            sendSuccess(res, suggestion, 'Suggestion retrieved successfully');
        } catch (error: any) {
            logger.error('Get suggestion error', { error: error.message });
            sendError(res, 'Failed to get suggestion', 500, 'GET_ERROR');
        }
    }

    /**
     * Update suggestion
     * PUT /api/v1/suggestions/:id
     */
    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            const suggestion = await suggestionService.updateSuggestion(suggestionId, user.id, req.body);

            sendSuccess(res, suggestion, 'Suggestion updated successfully');
        } catch (error: any) {
            logger.error('Update suggestion error', { error: error.message });

            if (error.message === 'SUGGESTION_NOT_FOUND') {
                sendNotFound(res, 'Suggestion not found');
                return;
            }

            if (error.message === 'CANNOT_UPDATE_SUGGESTION') {
                sendBadRequest(res, 'Suggestion cannot be updated in its current status');
                return;
            }

            sendError(res, 'Failed to update suggestion', 500, 'UPDATE_ERROR');
        }
    }

    /**
     * Delete suggestion
     * DELETE /api/v1/suggestions/:id
     */
    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            await suggestionService.deleteSuggestion(suggestionId, user.id);

            sendSuccess(res, null, 'Suggestion deleted successfully');
        } catch (error: any) {
            logger.error('Delete suggestion error', { error: error.message });

            if (error.message === 'SUGGESTION_NOT_FOUND') {
                sendNotFound(res, 'Suggestion not found');
                return;
            }

            if (error.message === 'CAN_ONLY_DELETE_DRAFT') {
                sendBadRequest(res, 'Only draft suggestions can be deleted');
                return;
            }

            sendError(res, 'Failed to delete suggestion', 500, 'DELETE_ERROR');
        }
    }

    /**
     * Committee review
     * POST /api/v1/suggestions/:id/committee-review
     */
    async committeeReview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            // Check if user is committee manager
            if (user.role !== 'COMMITTEE_MANAGER' && user.role !== 'ADMIN') {
                sendError(res, 'Only committee managers can review suggestions', 403, 'FORBIDDEN');
                return;
            }

            const { action, category, projectLeaderId, teamMemberIds, notes, rejectionReason, revisionRequestReason } = req.body;

            if (!action || !['approve', 'reject', 'request_revision'].includes(action)) {
                sendBadRequest(res, 'Valid action is required (approve, reject, request_revision)');
                return;
            }

            if (action === 'approve' && !projectLeaderId) {
                sendBadRequest(res, 'Project leader is required for approval');
                return;
            }

            if (action === 'reject' && !rejectionReason) {
                sendBadRequest(res, 'Rejection reason is required');
                return;
            }

            if (action === 'request_revision' && !revisionRequestReason) {
                sendBadRequest(res, 'Revision request reason is required');
                return;
            }

            const suggestion = await suggestionService.committeeReview(suggestionId, user.id, {
                action,
                category,
                projectLeaderId,
                teamMemberIds,
                notes,
                rejectionReason,
                revisionRequestReason,
            });

            sendSuccess(res, suggestion, `Suggestion ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision requested'}`);
        } catch (error: any) {
            logger.error('Committee review error', { error: error.message });

            if (error.message === 'SUGGESTION_NOT_FOUND') {
                sendNotFound(res, 'Suggestion not found');
                return;
            }

            if (error.message === 'INVALID_STATUS_TRANSITION') {
                sendBadRequest(res, 'Suggestion cannot be reviewed in its current status');
                return;
            }

            sendError(res, 'Failed to review suggestion', 500, 'REVIEW_ERROR');
        }
    }

    /**
     * Approve suggestion (by approver)
     * POST /api/v1/suggestions/:id/approve
     */
    async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            const { notes } = req.body;

            const suggestion = await suggestionService.approveSuggestion(suggestionId, user.id, notes);

            sendSuccess(res, suggestion, 'Suggestion approved');
        } catch (error: any) {
            logger.error('Approve suggestion error', { error: error.message });

            if (error.message === 'WORKFLOW_NOT_FOUND') {
                sendNotFound(res, 'Approval workflow not found');
                return;
            }

            if (error.message === 'NOT_AUTHORIZED_TO_APPROVE') {
                sendError(res, 'You are not authorized to approve this suggestion', 403, 'FORBIDDEN');
                return;
            }

            if (error.message === 'STEP_ALREADY_PROCESSED') {
                sendBadRequest(res, 'This step has already been processed');
                return;
            }

            sendError(res, 'Failed to approve suggestion', 500, 'APPROVE_ERROR');
        }
    }

    /**
     * Reject suggestion (by approver)
     * POST /api/v1/suggestions/:id/reject
     */
    async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const suggestionId = parseInt(req.params.id, 10);

            if (isNaN(suggestionId)) {
                sendBadRequest(res, 'Invalid suggestion ID');
                return;
            }

            const { reason } = req.body;

            if (!reason) {
                sendBadRequest(res, 'Rejection reason is required');
                return;
            }

            const suggestion = await suggestionService.rejectSuggestion(suggestionId, user.id, reason);

            sendSuccess(res, suggestion, 'Suggestion rejected');
        } catch (error: any) {
            logger.error('Reject suggestion error', { error: error.message });

            if (error.message === 'WORKFLOW_NOT_FOUND') {
                sendNotFound(res, 'Approval workflow not found');
                return;
            }

            if (error.message === 'NOT_AUTHORIZED_TO_REJECT') {
                sendError(res, 'You are not authorized to reject this suggestion', 403, 'FORBIDDEN');
                return;
            }

            sendError(res, 'Failed to reject suggestion', 500, 'REJECT_ERROR');
        }
    }
}

export default new SuggestionController();
