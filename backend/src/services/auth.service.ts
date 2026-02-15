import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import {
    ILoginRequest,
    ILoginResponse,
    IRegisterRequest,
    IChangePasswordRequest,
    IResetPasswordRequest
} from '../types';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import logger from '../utils/logger';
import { sendEmail } from './email.service';

const prisma = new PrismaClient();

// Status and Role constants (since SQLite doesn't support enums)
const UserStatus = {
    PENDING_PASSWORD_CHANGE: 'PENDING_PASSWORD_CHANGE',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    DEACTIVATED: 'DEACTIVATED',
};

const UserRole = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    COMMITTEE_MANAGER: 'COMMITTEE_MANAGER',
    COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
    APPROVER: 'APPROVER',
    PROJECT_LEADER: 'PROJECT_LEADER',
};

export class AuthService {
    /**
     * Login user
     */
    async login(data: ILoginRequest): Promise<ILoginResponse> {
        const { employeeId, password } = data;

        // Find user by employee ID
        const user = await prisma.user.findUnique({
            where: { employeeId },
            include: {
                company: true,
                department: true,
                unit: true,
            },
        });

        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new Error(`ACCOUNT_LOCKED:${remainingTime}`);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            // Increment failed login attempts
            const failedAttempts = user.failedLoginAttempts + 1;

            if (failedAttempts >= config.security.maxFailedLogins) {
                // Lock account
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: failedAttempts,
                        lockedUntil: new Date(Date.now() + config.security.lockoutDuration),
                    },
                });

                throw new Error('ACCOUNT_LOCKED:15');
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: failedAttempts },
            });

            throw new Error('INVALID_CREDENTIALS');
        }

        // Check user status
        if (user.status === UserStatus.SUSPENDED) {
            throw new Error('ACCOUNT_SUSPENDED');
        }

        // Reset failed attempts and update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                status: user.status === UserStatus.PENDING_PASSWORD_CHANGE
                    ? UserStatus.PENDING_PASSWORD_CHANGE
                    : UserStatus.ACTIVE,
            },
        });

        // Generate tokens
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entity: 'User',
                entityId: user.id,
            },
        });

        logger.info('User logged in', { userId: user.id, employeeId: user.employeeId });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                uuid: user.uuid,
                employeeId: user.employeeId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                position: user.position,
                role: user.role,
                status: user.status,
                company: user.company,
                department: user.department,
                unit: user.unit,
            },
            requiresPasswordChange: user.status === UserStatus.PENDING_PASSWORD_CHANGE,
        };
    }

    /**
     * Register new user (Admin only)
     */
    async register(adminId: number, data: IRegisterRequest): Promise<any> {
        // Check if employee ID already exists
        const existingUser = await prisma.user.findUnique({
            where: { employeeId: data.employeeId },
        });

        if (existingUser) {
            throw new Error('EMPLOYEE_ID_EXISTS');
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingEmail) {
            throw new Error('EMAIL_EXISTS');
        }

        // Generate default password
        const defaultPassword = this.generateDefaultPassword();
        const hashedPassword = await bcrypt.hash(defaultPassword, config.security.bcryptSaltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                employeeId: data.employeeId,
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                position: data.position,
                companyId: data.companyId,
                departmentId: data.departmentId,
                unitId: data.unitId,
                role: data.role || UserRole.USER,
                status: UserStatus.PENDING_PASSWORD_CHANGE,
            },
            include: {
                company: true,
                department: true,
                unit: true,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'CREATE_USER',
                entity: 'User',
                entityId: user.id,
                newValue: JSON.stringify({ employeeId: user.employeeId, email: user.email }),
            },
        });

        // Send welcome email with default password
        await sendEmail({
            to: user.email,
            subject: 'OpEx 5.0 - Hesabiniz Olusturuldu',
            templateCode: 'WELCOME',
            templateData: {
                firstName: user.firstName,
                employeeId: user.employeeId,
                defaultPassword,
                loginUrl: `${config.frontend.url}/login`,
            },
        });

        logger.info('User created', { userId: user.id, employeeId: user.employeeId, createdBy: adminId });

        return {
            id: user.id,
            uuid: user.uuid,
            employeeId: user.employeeId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            position: user.position,
            role: user.role,
            status: user.status,
            company: user.company,
            department: user.department,
            unit: user.unit,
            defaultPassword, // Return default password for admin to share with user
        };
    }

    /**
     * Change password
     */
    async changePassword(userId: number, data: IChangePasswordRequest): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

        if (!isValidPassword) {
            throw new Error('INVALID_CURRENT_PASSWORD');
        }

        // Validate new password
        if (!this.validatePassword(data.newPassword)) {
            throw new Error('PASSWORD_POLICY_VIOLATION');
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(data.newPassword, config.security.bcryptSaltRounds);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                lastPasswordChange: new Date(),
                status: UserStatus.ACTIVE,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CHANGE_PASSWORD',
                entity: 'User',
                entityId: userId,
            },
        });

        logger.info('Password changed', { userId });
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if email exists or not
            return;
        }

        // Generate reset token
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        });

        // Send reset email
        const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: 'OpEx 5.0 - Sifre Sifirlama',
            templateCode: 'PASSWORD_RESET',
            templateData: {
                firstName: user.firstName,
                lastName: user.lastName,
                resetUrl,
                expiresIn: '1 saat',
            },
        });

        logger.info('Password reset requested', { userId: user.id, email });
    }

    /**
     * Reset password with token
     */
    async resetPassword(data: IResetPasswordRequest): Promise<void> {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: data.token,
                passwordResetExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }

        // Validate new password
        if (!this.validatePassword(data.newPassword)) {
            throw new Error('PASSWORD_POLICY_VIOLATION');
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(data.newPassword, config.security.bcryptSaltRounds);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                lastPasswordChange: new Date(),
                status: UserStatus.ACTIVE,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'RESET_PASSWORD',
                entity: 'User',
                entityId: user.id,
            },
        });

        logger.info('Password reset completed', { userId: user.id });
    }

    /**
     * Logout user
     */
    async logout(userId: number, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: {
                    token: refreshToken,
                    userId,
                },
                data: {
                    revokedAt: new Date(),
                },
            });
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'LOGOUT',
                entity: 'User',
                entityId: userId,
            },
        });

        logger.info('User logged out', { userId });
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        // Check if token exists and is not revoked
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!storedToken || storedToken.revokedAt) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: storedToken.userId },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Generate new tokens
        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user.id);

        // Revoke old refresh token and create new one
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    /**
     * Get user profile
     */
    async getProfile(userId: number): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                department: true,
                unit: true,
            },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        return {
            id: user.id,
            uuid: user.uuid,
            employeeId: user.employeeId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            position: user.position,
            avatar: user.avatar,
            role: user.role,
            status: user.status,
            company: user.company,
            department: user.department,
            unit: user.unit,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: number, data: Partial<IRegisterRequest>): Promise<any> {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                position: data.position,
            },
            include: {
                company: true,
                department: true,
                unit: true,
            },
        });

        logger.info('Profile updated', { userId });

        return user;
    }

    /**
     * Generate default password
     */
    private generateDefaultPassword(): string {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';

        // Ensure at least one of each required character type
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
        password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
        password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special

        // Fill the rest with random characters
        for (let i = password.length; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Validate password against policy
     */
    private validatePassword(password: string): boolean {
        // Min 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{8,}$/;
        return passwordRegex.test(password);
    }
}

export default new AuthService();
