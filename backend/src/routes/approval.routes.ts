import { Router } from 'express';
import { authenticate, authorize, isApprover } from '../middleware/auth';
import { ApprovalService } from '../services/approval.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

const router = Router();
const approvalService = new ApprovalService();

// All approval routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/approvals/pending
 * @desc    Get pending approvals for current user
 * @access  Private (Approver roles)
 */
router.get('/pending', isApprover, async (req, res) => {
    try {
        const user = (req as any).user;
        const pending = await approvalService.getPendingApprovals(user.id);
        return sendSuccess(res, pending, 'Pending approvals retrieved successfully');
    } catch (error) {
        logger.error('Get pending approvals error', { error });
        return sendError(res, 'Failed to get pending approvals', 500);
    }
});

/**
 * @route   GET /api/v1/approvals/history
 * @desc    Get approval history for current user
 * @access  Private (Approver roles)
 */
router.get('/history', isApprover, async (req, res) => {
    try {
        const user = (req as any).user;
        const history = await approvalService.getApprovalHistory(user.id);
        return sendSuccess(res, history, 'Approval history retrieved successfully');
    } catch (error) {
        logger.error('Get approval history error', { error });
        return sendError(res, 'Failed to get approval history', 500);
    }
});

/**
 * @route   GET /api/v1/approvals/stats
 * @desc    Get approval statistics for current user
 * @access  Private (Approver roles)
 */
router.get('/stats', isApprover, async (req, res) => {
    try {
        const user = (req as any).user;
        const stats = await approvalService.getApprovalStats(user.id);
        return sendSuccess(res, stats, 'Approval statistics retrieved successfully');
    } catch (error) {
        logger.error('Get approval stats error', { error });
        return sendError(res, 'Failed to get approval statistics', 500);
    }
});

/**
 * @route   GET /api/v1/approvals/:id
 * @desc    Get approval step details
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const step = await approvalService.getApprovalStep(parseInt(id), user.id);
        return sendSuccess(res, step, 'Approval step retrieved successfully');
    } catch (error) {
        logger.error('Get approval step error', { error });
        if ((error as Error).message === 'ACCESS_DENIED') {
            return sendError(res, 'Access denied', 403);
        }
        return sendError(res, 'Failed to get approval step', 500);
    }
});

/**
 * @route   POST /api/v1/approvals/:id/approve
 * @desc    Approve a suggestion at current step
 * @access  Private (Approver)
 */
router.post('/:id/approve', isApprover, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const user = (req as any).user;

        const result = await approvalService.approveStep({
            stepId: parseInt(id),
            approverId: user.id,
            notes,
        });

        return sendSuccess(res, result, 'Suggestion approved successfully');
    } catch (error) {
        logger.error('Approve step error', { error });
        if ((error as Error).message === 'ALREADY_PROCESSED') {
            return sendError(res, 'This step has already been processed', 400);
        }
        if ((error as Error).message === 'NOT_AUTHORIZED') {
            return sendError(res, 'You are not authorized to approve this step', 403);
        }
        return sendError(res, 'Failed to approve suggestion', 500);
    }
});

/**
 * @route   POST /api/v1/approvals/:id/reject
 * @desc    Reject a suggestion at current step
 * @access  Private (Approver)
 */
router.post('/:id/reject', isApprover, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, notes } = req.body;
        const user = (req as any).user;

        if (!rejectionReason) {
            return sendError(res, 'Rejection reason is required', 400);
        }

        const result = await approvalService.rejectStep({
            stepId: parseInt(id),
            approverId: user.id,
            rejectionReason,
            notes,
        });

        return sendSuccess(res, result, 'Suggestion rejected');
    } catch (error) {
        logger.error('Reject step error', { error });
        if ((error as Error).message === 'ALREADY_PROCESSED') {
            return sendError(res, 'This step has already been processed', 400);
        }
        if ((error as Error).message === 'NOT_AUTHORIZED') {
            return sendError(res, 'You are not authorized to reject this step', 403);
        }
        return sendError(res, 'Failed to reject suggestion', 500);
    }
});

/**
 * @route   POST /api/v1/approvals/:id/return
 * @desc    Return suggestion to committee for re-evaluation
 * @access  Private (Approver - Manager level and above)
 */
router.post('/:id/return', isApprover, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, notes } = req.body;
        const user = (req as any).user;

        if (!reason) {
            return sendError(res, 'Return reason is required', 400);
        }

        const result = await approvalService.returnToCommittee({
            stepId: parseInt(id),
            approverId: user.id,
            reason,
            notes,
        });

        return sendSuccess(res, result, 'Suggestion returned to committee');
    } catch (error) {
        logger.error('Return to committee error', { error });
        return sendError(res, 'Failed to return suggestion to committee', 500);
    }
});

export default router;
