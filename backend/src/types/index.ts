import { Request } from 'express';

// ============================================
// TYPE CONSTANTS (SQLite stores as strings)
// ============================================

export type UserRole = 'USER' | 'ADMIN' | 'COMMITTEE_MANAGER' | 'COMMITTEE_MEMBER' | 'APPROVER' | 'PROJECT_LEADER';
export type UserStatus = 'PENDING_PASSWORD_CHANGE' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type SuggestionStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

// ============================================
// User Types
// ============================================

export interface IUser {
    id: number;
    uuid: string;
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    position: string | null;
    avatar: string | null;
    companyId: number;
    departmentId: number | null;
    unitId: number | null;
    role: string;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAuthenticatedUser extends IUser {
    iat: number;
    exp: number;
}

export interface IAuthRequest extends Request {
    user: IAuthenticatedUser;
}

export interface ILoginRequest {
    employeeId: string;
    password: string;
}

export interface ILoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        uuid: string;
        employeeId: string;
        email: string;
        firstName: string;
        lastName: string;
        position: string | null;
        role: string;
        status: string;
        company?: {
            id: number;
            name: string;
        };
        department?: {
            id: number;
            name: string;
        } | null;
        unit?: {
            id: number;
            name: string;
        } | null;
    };
    requiresPasswordChange: boolean;
}

export interface IRegisterRequest {
    employeeId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    companyId: number;
    departmentId?: number;
    unitId?: number;
    role?: UserRole;
}

export interface IChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface IResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

// ============================================
// Suggestion Types
// ============================================

export interface ICreateSuggestionRequest {
    title: string;
    currentSituation: string;
    proposedSolution: string;
    expectedBenefits?: string;
    category?: string;
    gainCategories: string[];
    estimatedCost?: number;
    estimatedSavings?: number;
    estimatedTimeSavings?: number;
    currency?: string;
}

export interface IUpdateSuggestionRequest {
    title?: string;
    currentSituation?: string;
    proposedSolution?: string;
    expectedBenefits?: string;
    category?: string;
    gainCategories?: string[];
    estimatedCost?: number;
    estimatedSavings?: number;
    estimatedTimeSavings?: number;
}

export interface ISuggestionFilter {
    status?: SuggestionStatus;
    category?: string;
    userId?: number;
    companyId?: number;
    departmentId?: number;
    unitId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ISuggestionListResponse {
    suggestions: ISuggestionWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ISuggestionWithDetails {
    id: number;
    uuid: string;
    referenceNumber: string;
    title: string;
    currentSituation: string;
    proposedSolution: string;
    expectedBenefits?: string;
    category?: string;
    gainCategories: string[];
    estimatedCost?: number;
    estimatedSavings?: number;
    estimatedTimeSavings?: number;
    currency: string;
    status: SuggestionStatus;
    user: {
        id: number;
        employeeId: string;
        firstName: string;
        lastName: string;
        position?: string;
    };
    company: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    unit?: {
        id: number;
        name: string;
    };
    documents: {
        id: number;
        fileName: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
    }[];
    approvalWorkflow?: IApprovalWorkflowDetails;
    project?: IProjectDetails;
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
    approvedAt?: Date;
    completedAt?: Date;
}

// ============================================
// Approval Types
// ============================================

export interface IApprovalWorkflowDetails {
    id: number;
    currentStep: number;
    totalSteps: number;
    steps: IApprovalStepDetails[];
    completedAt?: Date;
}

export interface IApprovalStepDetails {
    id: number;
    stepNumber: number;
    stepType: string;
    approver: {
        id: number;
        employeeId: string;
        firstName: string;
        lastName: string;
        position?: string;
    };
    status: ApprovalStepStatus;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    notes?: string;
}

export interface IApproveRequest {
    notes?: string;
}

export interface IRejectRequest {
    reason: string;
}

export interface ICommitteeReviewRequest {
    action: 'approve' | 'reject' | 'request_revision';
    category?: string;
    projectLeaderId?: number;
    teamMemberIds?: number[];
    notes?: string;
    rejectionReason?: string;
    revisionRequestReason?: string;
}

// ============================================
// Project Types
// ============================================

export interface IProjectDetails {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    progress: number;
    projectLeader: {
        id: number;
        firstName: string;
        lastName: string;
    };
    teamMembers: {
        id: number;
        firstName: string;
        lastName: string;
        role?: string;
    }[];
    startDate?: Date;
    estimatedEndDate?: Date;
    actualEndDate?: Date;
    actualCost?: number;
    actualSavings?: number;
    milestones: {
        id: number;
        title: string;
        description?: string;
        dueDate?: Date;
        completedDate?: Date;
        isCompleted: boolean;
    }[];
}

export interface IUpdateProjectProgressRequest {
    progress: number;
    status?: ProjectStatus;
    notes?: string;
}

export interface IAddMilestoneRequest {
    title: string;
    description?: string;
    dueDate?: Date;
}

// ============================================
// Report Types
// ============================================

export interface IReportFilter {
    dateFrom: Date;
    dateTo: Date;
    companyId?: number;
    departmentId?: number;
    unitId?: number;
    userId?: number;
    status?: SuggestionStatus[];
    category?: string[];
}

export interface IDashboardStats {
    totalSuggestions: number;
    pendingSuggestions: number;
    approvedSuggestions: number;
    rejectedSuggestions: number;
    completedSuggestions: number;
    totalEstimatedSavings: number;
    totalActualSavings: number;
    averageApprovalTime: number; // in days
    suggestionsByStatus: { status: string; count: number }[];
    suggestionsByCategory: { category: string; count: number }[];
    suggestionsByMonth: { month: string; count: number }[];
    topPerformers: { userId: number; name: string; count: number }[];
}

export interface IUserReport {
    userId: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: string;
    totalSuggestions: number;
    approvedSuggestions: number;
    rejectedSuggestions: number;
    pendingSuggestions: number;
    completedSuggestions: number;
    totalEstimatedSavings: number;
    totalActualSavings: number;
    suggestions: ISuggestionWithDetails[];
}

export interface IDepartmentReport {
    departmentId: number;
    departmentName: string;
    totalEmployees: number;
    totalSuggestions: number;
    suggestionsPerEmployee: number;
    approvedSuggestions: number;
    rejectedSuggestions: number;
    pendingSuggestions: number;
    completedSuggestions: number;
    totalEstimatedSavings: number;
    totalActualSavings: number;
    topPerformers: { userId: number; name: string; count: number }[];
}

// ============================================
// Notification Types
// ============================================

export interface INotificationPayload {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface IEmailPayload {
    to: string;
    subject: string;
    templateCode?: string;
    templateData?: Record<string, unknown>;
    body?: string;
    priority?: number;
}

// ============================================
// Pagination Types
// ============================================

export interface IPaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================
// API Response Types
// ============================================

export interface IApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface IApiError {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}

// ============================================
// Audit Log Types
// ============================================

export interface IAuditLogEntry {
    userId?: number;
    action: string;
    entity: string;
    entityId?: number;
    ipAddress?: string;
    userAgent?: string;
    oldValue?: unknown;
    newValue?: unknown;
}
