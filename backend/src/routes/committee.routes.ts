import { Router } from 'express';
import { authenticate, authorize, isCommitteeMember } from '../middleware/auth';
import { SuggestionService } from '../services/suggestion.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { IAuthRequest } from '../types';

const router = Router();
const suggestionService = new SuggestionService();

// All committee routes require authentication and committee role
router.use(authenticate);
router.use(isCommitteeMember);

/**
 * GET /api/v1/committee/pending
 * Get all suggestions pending committee review
 */
router.get('/pending', async (req, res) => {
    try {
        const user = (req as IAuthRequest).user;
        const suggestions = await suggestionService.getPendingCommitteeReview();
        sendSuccess(res, suggestions, 'Pending suggestions retrieved successfully');
    } catch (error: any) {
        sendError(res, error.message, 500, 'INTERNAL_ERROR');
    }
});

/**
 * GET /api/v1/committee/evaluated
 * Get suggestions already evaluated by committee
 */
router.get('/evaluated', async (req, res) => {
    try {
        const user = (req as IAuthRequest).user;
        const suggestions = await suggestionService.getEvaluatedByCommittee();
        sendSuccess(res, suggestions, 'Evaluated suggestions retrieved successfully');
    } catch (error: any) {
        sendError(res, error.message, 500, 'INTERNAL_ERROR');
    }
});

/**
 * GET /api/v1/committee/stats
 * Get committee dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await suggestionService.getCommitteeStats();
        sendSuccess(res, stats, 'Committee stats retrieved successfully');
    } catch (error: any) {
        sendError(res, error.message, 500, 'INTERNAL_ERROR');
    }
});

/**
 * POST /api/v1/committee/evaluate/:id
 * Evaluate a suggestion (approve, reject, request revision)
 */
router.post('/evaluate/:id', async (req, res) => {
    try {
        const user = (req as IAuthRequest).user;
        const suggestionId = parseInt(req.params.id);
        const { action, category, projectLeaderId, teamMemberIds, notes, rejectionReason, revisionRequestReason } = req.body;

        const result = await suggestionService.committeeReview(suggestionId, user.id, {
            action,
            category,
            projectLeaderId,
            teamMemberIds,
            notes,
            rejectionReason,
            revisionRequestReason,
        });

        sendSuccess(res, result, `Suggestion ${action} successfully`);
    } catch (error: any) {
        if (error.message === 'SUGGESTION_NOT_FOUND') {
            sendNotFound(res, 'Suggestion not found');
        } else {
            sendError(res, error.message, 500, 'INTERNAL_ERROR');
        }
    }
});

/**
 * PUT /api/v1/committee/assign-project/:id
 * Assign project leader and team to an approved suggestion
 */
router.put('/assign-project/:id', async (req, res) => {
    try {
        const user = (req as IAuthRequest).user;
        const suggestionId = parseInt(req.params.id);
        const { projectLeaderId, teamMemberIds, projectName, projectDescription } = req.body;

        const result = await suggestionService.assignProject(suggestionId, {
            projectLeaderId,
            teamMemberIds,
            projectName,
            projectDescription,
        });

        sendSuccess(res, result, 'Project assigned successfully');
    } catch (error: any) {
        if (error.message === 'SUGGESTION_NOT_FOUND') {
            sendNotFound(res, 'Suggestion not found');
        } else {
            sendError(res, error.message, 500, 'INTERNAL_ERROR');
        }
    }
});

export default router;