import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { sendError, sendUnauthorized } from '../utils/response';
import { IAuthenticatedUser, IAuthRequest } from '../types';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Status constants (since SQLite doesn't support enums)
const UserStatus = {
    PENDING_PASSWORD_CHANGE: 'PENDING_PASSWORD_CHANGE',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    DEACTIVATED: 'DEACTIVATED',
};

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: IAuthenticatedUser;
        }
    }
}

/**
 * Authentication middleware - Verify JWT token
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendUnauthorized(res, 'No token provided');
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            sendUnauthorized(res, 'Invalid token format');
            return;
        }

        // Verify token
        let decoded: IAuthenticatedUser;
        try {
            decoded = jwt.verify(token, config.jwt.secret) as IAuthenticatedUser;
        } catch (err) {
            sendUnauthorized(res, 'Invalid or expired token');
            return;
        }

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                uuid: true,
                employeeId: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                position: true,
                avatar: true,
                companyId: true,
                departmentId: true,
                unitId: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            sendUnauthorized(res, 'User not found');
            return;
        }

        // Allow PENDING_PASSWORD_CHANGE and ACTIVE status
        if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_PASSWORD_CHANGE) {
            sendError(res, 'Account is not active', 403, 'ACCOUNT_INACTIVE');
            return;
        }

        // Attach user to request
        (req as IAuthRequest).user = {
            ...user,
            iat: decoded.iat,
            exp: decoded.exp,
        };

        next();
    } catch (error) {
        logger.error('Authentication error', { error });
        sendUnauthorized(res, 'Authentication failed');
    }
};

/**
 * Optional authentication - Attach user if token present, but don't require it
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as IAuthenticatedUser;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    uuid: true,
                    employeeId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    position: true,
                    avatar: true,
                    companyId: true,
                    departmentId: true,
                    unitId: true,
                    role: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (user && user.status === UserStatus.ACTIVE) {
                (req as IAuthRequest).user = {
                    ...user,
                    iat: decoded.iat,
                    exp: decoded.exp,
                };
            }
        } catch (err) {
            // Token invalid, but continue without user
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as IAuthRequest).user;

        if (!user) {
            sendUnauthorized(res, 'Authentication required');
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            sendError(res, 'Insufficient permissions', 403, 'FORBIDDEN');
            return;
        }

        next();
    };
};

/**
 * Check if user belongs to same company (for multi-tenant isolation)
 */
export const checkCompanyAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = (req as IAuthRequest).user;
        const targetCompanyId = parseInt(req.params.companyId || req.body.companyId);

        // Admin can access all companies
        if (user.role === 'ADMIN') {
            return next();
        }

        // Check if user belongs to the same company
        if (targetCompanyId && user.companyId !== targetCompanyId) {
            sendError(res, 'Access denied to this company', 403, 'FORBIDDEN');
            return;
        }

        next();
    } catch (error) {
        logger.error('Company access check error', { error });
        sendError(res, 'Access check failed', 500, 'INTERNAL_ERROR');
    }
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
    const requests = new Map<number, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as IAuthRequest).user;

        if (!user) {
            return next();
        }

        const now = Date.now();
        const userRequests = requests.get(user.id);

        if (!userRequests || now > userRequests.resetTime) {
            requests.set(user.id, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (userRequests.count >= maxRequests) {
            sendError(res, 'Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
            return;
        }

        userRequests.count++;
        next();
    };
};

/**
 * Generate JWT token
 */
export const generateToken = (user: { id: number; employeeId: string; role: string }): string => {
    const options: SignOptions = {
        expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(
        {
            id: user.id,
            employeeId: user.employeeId,
            role: user.role,
        },
        config.jwt.secret,
        options
    );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: number): string => {
    const options: SignOptions = {
        expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(
        { id: userId, nonce: randomUUID() },
        config.jwt.secret,
        options
    );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { id: number } | null => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { id: number };
        return decoded;
    } catch {
        return null;
    }
};

/**
 * Check if user is a committee member (COMMITTEE_MANAGER, COMMITTEE_MEMBER, or ADMIN)
 */
export const isCommitteeMember = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as IAuthRequest).user;

    if (!user) {
        sendUnauthorized(res, 'Authentication required');
        return;
    }

    const committeeRoles = ['ADMIN', 'COMMITTEE_MANAGER', 'COMMITTEE_MEMBER'];
    if (!committeeRoles.includes(user.role)) {
        sendError(res, 'Committee access required', 403, 'FORBIDDEN');
        return;
    }

    next();
};

/**
 * Check if user is an approver (APPROVER, ADMIN, or higher)
 */
export const isApprover = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as IAuthRequest).user;

    if (!user) {
        sendUnauthorized(res, 'Authentication required');
        return;
    }

    const approverRoles = ['ADMIN', 'COMMITTEE_MANAGER', 'APPROVER'];
    if (!approverRoles.includes(user.role)) {
        sendError(res, 'Approver access required', 403, 'FORBIDDEN');
        return;
    }

    next();
};

/**
 * Check if user is project leader for a specific project
 */
export const isProjectLeader = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = (req as IAuthRequest).user;
        const projectId = parseInt(req.params.id || req.params.projectId);

        if (!user) {
            sendUnauthorized(res, 'Authentication required');
            return;
        }

        // Admin and Committee Manager can access all projects
        if (user.role === 'ADMIN' || user.role === 'COMMITTEE_MANAGER') {
            return next();
        }

        // Check if user is the project leader
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                projectLeaderId: user.id,
            },
        });

        if (!project) {
            sendError(res, 'Project leader access required', 403, 'FORBIDDEN');
            return;
        }

        next();
    } catch (error) {
        logger.error('Project leader check error', { error });
        sendError(res, 'Access check failed', 500, 'INTERNAL_ERROR');
    }
};
