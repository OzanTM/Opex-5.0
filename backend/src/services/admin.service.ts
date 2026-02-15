/**
 * OpEx 5.0 - Admin Service
 * Handles administrative operations: user management, company structure, system settings
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { sendEmail } from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// Status and Role constants
const UserStatus = {
    PENDING_PASSWORD_CHANGE: 'PENDING_PASSWORD_CHANGE',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    INACTIVE: 'INACTIVE',
};

const UserRole = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    COMMITTEE_MANAGER: 'COMMITTEE_MANAGER',
    COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
    APPROVER: 'APPROVER',
    PROJECT_LEADER: 'PROJECT_LEADER',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate random password
 */
const generatePassword = (length: number = 12): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// ============================================
// USER MANAGEMENT
// ============================================

interface CreateUserData {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    companyId: number;
    departmentId?: number;
    unitId?: number;
    role: string;
}

interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    position?: string;
    departmentId?: number;
    unitId?: number;
    role?: string;
    status?: string;
}

interface UserListFilters {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    companyId?: number;
    departmentId?: number;
}

/**
 * Get all users with pagination and filters
 */
export const getUsers = async (filters: UserListFilters = {}) => {
    const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        companyId,
        departmentId,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
        where.OR = [
            { employeeId: { contains: search } },
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (status) {
        where.status = status;
    }

    if (companyId) {
        where.companyId = companyId;
    }

    if (departmentId) {
        where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
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
                role: true,
                status: true,
                company: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                unit: { select: { id: true, name: true } },
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number) => {
    const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
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
            role: true,
            status: true,
            company: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
            lastLoginAt: true,
            lastPasswordChange: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

/**
 * Create new user
 */
export const createUser = async (data: CreateUserData, createdBy: number) => {
    // Check if employeeId or email already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { employeeId: data.employeeId },
                { email: data.email },
            ],
        },
    });

    if (existingUser) {
        throw new Error(
            existingUser.employeeId === data.employeeId
                ? 'Bu sicil numarasi zaten kullaniliyor'
                : 'Bu email adresi zaten kullaniliyor'
        );
    }

    // Generate random password
    const temporaryPassword = generatePassword(12);
    const hashedPassword = await hash(temporaryPassword, SALT_ROUNDS);

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
            role: data.role,
            status: UserStatus.PENDING_PASSWORD_CHANGE,
        },
        select: {
            id: true,
            uuid: true,
            employeeId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
        },
    });

    // Send welcome email with temporary password
    try {
        await sendEmail({
            to: data.email,
            subject: 'OpEx 5.0 - Hesabiniz Olusturuldu',
            templateCode: 'user-created',
            templateData: {
                employeeName: `${data.firstName} ${data.lastName}`,
                employeeId: data.employeeId,
                temporaryPassword,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
            },
        });
    } catch (error) {
        logger.error('Failed to send welcome email:', error);
    }

    // Create audit log
    await createAuditLog({
        userId: createdBy,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        newValue: user,
    });

    return { user, temporaryPassword };
};

/**
 * Update user
 */
export const updateUser = async (id: number, data: UpdateUserData, updatedBy: number) => {
    const existingUser = await prisma.user.findFirst({
        where: { id, deletedAt: null },
    });

    if (!existingUser) {
        throw new Error('Kullanici bulunamadi');
    }

    const user = await prisma.user.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date(),
        },
        select: {
            id: true,
            uuid: true,
            employeeId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
        },
    });

    // Create audit log
    await createAuditLog({
        userId: updatedBy,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: id,
        oldValue: existingUser,
        newValue: user,
    });

    return user;
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (id: number, deletedBy: number) => {
    const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
    });

    if (!user) {
        throw new Error('Kullanici bulunamadi');
    }

    await prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: UserStatus.INACTIVE,
        },
    });

    // Create audit log
    await createAuditLog({
        userId: deletedBy,
        action: 'USER_DELETED',
        entity: 'User',
        entityId: id,
        oldValue: user,
    });

    return { message: 'Kullanici silindi' };
};

/**
 * Reset user password
 */
export const resetUserPassword = async (id: number, resetBy: number) => {
    const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
    });

    if (!user) {
        throw new Error('Kullanici bulunamadi');
    }

    const temporaryPassword = generatePassword(12);
    const hashedPassword = await hash(temporaryPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id },
        data: {
            password: hashedPassword,
            status: UserStatus.PENDING_PASSWORD_CHANGE,
            lastPasswordChange: new Date(),
        },
    });

    // Send email with new password
    try {
        await sendEmail({
            to: user.email,
            subject: 'OpEx 5.0 - Sifreniz Sifirlandi',
            templateCode: 'password-reset-admin',
            templateData: {
                employeeName: `${user.firstName} ${user.lastName}`,
                temporaryPassword,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
            },
        });
    } catch (error) {
        logger.error('Failed to send password reset email:', error);
    }

    // Create audit log
    await createAuditLog({
        userId: resetBy,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: id,
    });

    return { message: 'Sifre sifirlandi', temporaryPassword };
};

/**
 * Bulk create users
 */
export const bulkCreateUsers = async (users: CreateUserData[], createdBy: number) => {
    const results = {
        success: [] as any[],
        failed: [] as any[],
    };

    for (const userData of users) {
        try {
            const result = await createUser(userData, createdBy);
            results.success.push({
                employeeId: userData.employeeId,
                user: result.user,
            });
        } catch (error: any) {
            results.failed.push({
                employeeId: userData.employeeId,
                error: error.message,
            });
        }
    }

    return results;
};

// ============================================
// COMPANY STRUCTURE MANAGEMENT
// ============================================

/**
 * Get all companies
 */
export const getCompanies = async () => {
    const companies = await prisma.company.findMany({
        where: { isActive: true },
        select: {
            id: true,
            code: true,
            name: true,
            description: true,
            _count: {
                select: {
                    users: { where: { deletedAt: null } },
                    departments: { where: { isActive: true } },
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return companies;
};

/**
 * Create company
 */
export const createCompany = async (data: { code: string; name: string; description?: string }, createdBy: number) => {
    const existing = await prisma.company.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new Error('Bu sirket kodu zaten kullaniliyor');
    }

    const company = await prisma.company.create({
        data: {
            code: data.code,
            name: data.name,
            description: data.description,
        },
    });

    await createAuditLog({
        userId: createdBy,
        action: 'COMPANY_CREATED',
        entity: 'Company',
        entityId: company.id,
        newValue: company,
    });

    return company;
};

/**
 * Update company
 */
export const updateCompany = async (id: number, data: { name?: string; description?: string }, updatedBy: number) => {
    const company = await prisma.company.update({
        where: { id },
        data,
    });

    await createAuditLog({
        userId: updatedBy,
        action: 'COMPANY_UPDATED',
        entity: 'Company',
        entityId: id,
        newValue: company,
    });

    return company;
};

/**
 * Get departments by company
 */
export const getDepartments = async (companyId?: number) => {
    const where: any = { isActive: true };
    if (companyId) {
        where.companyId = companyId;
    }

    const departments = await prisma.department.findMany({
        where,
        select: {
            id: true,
            code: true,
            name: true,
            description: true,
            company: { select: { id: true, name: true } },
            _count: {
                select: {
                    users: { where: { deletedAt: null } },
                    units: { where: { isActive: true } },
                },
            },
        },
        orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
    });

    return departments;
};

/**
 * Create department
 */
export const createDepartment = async (
    data: { code: string; name: string; description?: string; companyId: number },
    createdBy: number
) => {
    const existing = await prisma.department.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new Error('Bu departman kodu zaten kullaniliyor');
    }

    const department = await prisma.department.create({
        data: {
            code: data.code,
            name: data.name,
            description: data.description,
            companyId: data.companyId,
        },
    });

    await createAuditLog({
        userId: createdBy,
        action: 'DEPARTMENT_CREATED',
        entity: 'Department',
        entityId: department.id,
        newValue: department,
    });

    return department;
};

/**
 * Get units by department
 */
export const getUnits = async (departmentId?: number) => {
    const where: any = { isActive: true };
    if (departmentId) {
        where.departmentId = departmentId;
    }

    const units = await prisma.unit.findMany({
        where,
        select: {
            id: true,
            code: true,
            name: true,
            description: true,
            department: {
                select: {
                    id: true,
                    name: true,
                    company: { select: { id: true, name: true } },
                },
            },
            _count: {
                select: {
                    users: { where: { deletedAt: null } },
                },
            },
        },
        orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });

    return units;
};

/**
 * Create unit
 */
export const createUnit = async (
    data: { code: string; name: string; description?: string; departmentId: number },
    createdBy: number
) => {
    const existing = await prisma.unit.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new Error('Bu birim kodu zaten kullaniliyor');
    }

    const unit = await prisma.unit.create({
        data: {
            code: data.code,
            name: data.name,
            description: data.description,
            departmentId: data.departmentId,
        },
    });

    await createAuditLog({
        userId: createdBy,
        action: 'UNIT_CREATED',
        entity: 'Unit',
        entityId: unit.id,
        newValue: unit,
    });

    return unit;
};

// ============================================
// SYSTEM SETTINGS
// ============================================

/**
 * Get all system settings
 */
export const getSystemSettings = async () => {
    const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
    });

    // Convert to object
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
        settingsObj[s.key] = s.value;
    });

    return settingsObj;
};

/**
 * Update system setting
 */
export const updateSystemSetting = async (key: string, value: string, updatedBy: number) => {
    const existing = await prisma.systemSetting.findUnique({
        where: { key },
    });

    const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });

    await createAuditLog({
        userId: updatedBy,
        action: 'SETTING_UPDATED',
        entity: 'SystemSetting',
        entityId: setting.id,
        oldValue: existing?.value,
        newValue: value,
    });

    return setting;
};

// ============================================
// AUDIT LOGS
// ============================================

interface AuditLogData {
    userId?: number;
    action: string;
    entity: string;
    entityId?: number;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (data: AuditLogData) => {
    await prisma.auditLog.create({
        data: {
            userId: data.userId,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
            newValue: data.newValue ? JSON.stringify(data.newValue) : null,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        },
    });
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
}) => {
    const {
        page = 1,
        limit = 50,
        userId,
        action,
        entity,
        startDate,
        endDate,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
        where.userId = userId;
    }

    if (action) {
        where.action = { contains: action };
    }

    if (entity) {
        where.entity = entity;
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = startDate;
        }
        if (endDate) {
            where.createdAt.lte = endDate;
        }
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        employeeId: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                action: true,
                entity: true,
                entityId: true,
                ipAddress: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ============================================
// STATISTICS
// ============================================

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async () => {
    const [
        totalUsers,
        activeUsers,
        pendingUsers,
        totalCompanies,
        totalDepartments,
        totalUnits,
        totalSuggestions,
        pendingApprovals,
        completedProjects,
    ] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { deletedAt: null, status: UserStatus.PENDING_PASSWORD_CHANGE } }),
        prisma.company.count({ where: { isActive: true } }),
        prisma.department.count({ where: { isActive: true } }),
        prisma.unit.count({ where: { isActive: true } }),
        prisma.suggestion.count({ where: { deletedAt: null } }),
        prisma.approvalStep.count({ where: { status: 'PENDING' } }),
        prisma.project.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Users by role
    const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: true,
    });

    // Suggestions by status
    const suggestionsByStatus = await prisma.suggestion.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
    });

    return {
        users: {
            total: totalUsers,
            active: activeUsers,
            pending: pendingUsers,
            byRole: usersByRole.map((r: any) => ({ role: r.role, count: r._count })),
        },
        organization: {
            companies: totalCompanies,
            departments: totalDepartments,
            units: totalUnits,
        },
        suggestions: {
            total: totalSuggestions,
            pendingApprovals,
            byStatus: suggestionsByStatus.map((s: any) => ({ status: s.status, count: s._count })),
        },
        projects: {
            completed: completedProjects,
        },
    };
};

// ============================================
// ROLES
// ============================================

/**
 * Get available roles
 */
export const getRoles = () => {
    return [
        { name: 'USER', description: 'Standart Kullanici - Öneri olusturabilir ve takip edebilir' },
        { name: 'ADMIN', description: 'Sistem Yöneticisi - Tüm sistem ayarlarina erisebilir' },
        { name: 'COMMITTEE_MANAGER', description: 'Komite Sistem Sorumlusu - Önerileri degerlendirebilir ve kategorize edebilir' },
        { name: 'COMMITTEE_MEMBER', description: 'Komite Üyesi - Önerileri görüntüleyebilir ve görüs bildirebilir' },
        { name: 'APPROVER', description: 'Onayci - Kendine atanan önerileri onaylayabilir veya reddedebilir' },
        { name: 'PROJECT_LEADER', description: 'Proje Lideri - Atandigi projeleri yönetebilir' },
    ];
};
