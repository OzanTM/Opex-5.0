import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError, sendBadRequest, sendUnauthorized, sendNotFound } from '../utils/response';
import { IAuthRequest } from '../types';
import logger from '../utils/logger';

export class AuthController {
    /**
     * Login
     * POST /api/v1/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { employeeId, password } = req.body;

            if (!employeeId || !password) {
                sendBadRequest(res, 'Employee ID and password are required');
                return;
            }

            const result = await authService.login({ employeeId, password });

            sendSuccess(res, result, 'Login successful');
        } catch (error: any) {
            logger.error('Login error', { error: error.message });

            if (error.message === 'INVALID_CREDENTIALS') {
                sendUnauthorized(res, 'Invalid employee ID or password');
                return;
            }

            if (error.message.startsWith('ACCOUNT_LOCKED')) {
                const minutes = error.message.split(':')[1];
                sendError(res, `Account is locked. Please try again in ${minutes} minutes`, 423, 'ACCOUNT_LOCKED');
                return;
            }

            if (error.message === 'ACCOUNT_SUSPENDED') {
                sendError(res, 'Account is suspended. Please contact administrator', 403, 'ACCOUNT_SUSPENDED');
                return;
            }

            sendError(res, 'Login failed', 500, 'LOGIN_ERROR');
        }
    }

    /**
     * Refresh token
     * POST /api/v1/auth/refresh
     */
    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                sendBadRequest(res, 'Refresh token is required');
                return;
            }

            const result = await authService.refreshAccessToken(refreshToken);

            sendSuccess(res, result, 'Token refreshed successfully');
        } catch (error: any) {
            logger.error('Refresh token error', { error: error.message });

            if (error.message === 'INVALID_REFRESH_TOKEN') {
                sendUnauthorized(res, 'Invalid or expired refresh token');
                return;
            }

            sendError(res, 'Token refresh failed', 500, 'REFRESH_ERROR');
        }
    }

    /**
     * Logout
     * POST /api/v1/auth/logout
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const { refreshToken } = req.body;

            await authService.logout(user.id, refreshToken);

            sendSuccess(res, null, 'Logout successful');
        } catch (error: any) {
            logger.error('Logout error', { error: error.message });
            sendError(res, 'Logout failed', 500, 'LOGOUT_ERROR');
        }
    }

    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                sendBadRequest(res, 'All password fields are required');
                return;
            }

            await authService.changePassword(user.id, {
                currentPassword,
                newPassword,
                confirmPassword,
            });

            sendSuccess(res, null, 'Password changed successfully. Please login again.');
        } catch (error: any) {
            logger.error('Change password error', { error: error.message });

            if (error.message === 'PASSWORDS_DO_NOT_MATCH') {
                sendBadRequest(res, 'New passwords do not match');
                return;
            }

            if (error.message === 'PASSWORD_TOO_WEAK') {
                sendBadRequest(res, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit');
                return;
            }

            if (error.message === 'INVALID_CURRENT_PASSWORD') {
                sendBadRequest(res, 'Current password is incorrect');
                return;
            }

            sendError(res, 'Password change failed', 500, 'PASSWORD_CHANGE_ERROR');
        }
    }

    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                sendBadRequest(res, 'Email is required');
                return;
            }

            await authService.requestPasswordReset(email);

            // Always return success to prevent email enumeration
            sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
        } catch (error: any) {
            logger.error('Forgot password error', { error: error.message });
            // Still return success to prevent email enumeration
            sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
        }
    }

    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword, confirmPassword } = req.body;

            if (!token || !newPassword || !confirmPassword) {
                sendBadRequest(res, 'All fields are required');
                return;
            }

            await authService.resetPassword({
                token,
                newPassword,
                confirmPassword,
            });

            sendSuccess(res, null, 'Password reset successfully. Please login with your new password.');
        } catch (error: any) {
            logger.error('Reset password error', { error: error.message });

            if (error.message === 'PASSWORDS_DO_NOT_MATCH') {
                sendBadRequest(res, 'Passwords do not match');
                return;
            }

            if (error.message === 'PASSWORD_TOO_WEAK') {
                sendBadRequest(res, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit');
                return;
            }

            if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
                sendBadRequest(res, 'Invalid or expired reset token');
                return;
            }

            sendError(res, 'Password reset failed', 500, 'PASSWORD_RESET_ERROR');
        }
    }

    /**
     * Get current user profile
     * GET /api/v1/auth/me
     */
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = (req as IAuthRequest).user;

            sendSuccess(res, user, 'Profile retrieved successfully');
        } catch (error: any) {
            logger.error('Get profile error', { error: error.message });
            sendError(res, 'Failed to get profile', 500, 'PROFILE_ERROR');
        }
    }
}

export default new AuthController();