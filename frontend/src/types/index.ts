// User Types
export type UserRole =
    | 'USER'
    | 'ADMIN'
    | 'COMMITTEE_MANAGER'
    | 'COMMITTEE_MEMBER'
    | 'APPROVER'
    | 'PROJECT_LEADER';

export type UserStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED'
    | 'PENDING_PASSWORD_CHANGE';

export interface User {
    id: number;
    uuid: string;
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    avatar?: string;
    companyId: number;
    departmentId?: number;
    unitId?: number;
    role: UserRole;
    status: UserStatus;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    company?: {
        id: number;
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
    department?: {
        id: number;
        code: string;
        name: string;
        description?: string;
        companyId: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
    unit?: {
        id: number;
        code: string;
        name: string;
        description?: string;
        departmentId: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

export interface AssignableUser {
    id: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    position?: string;
    role: UserRole;
    department?: {
        id: number;
        name: string;
    };
    unit?: {
        id: number;
        name: string;
    };
}

// Suggestion Types
export type SuggestionStatus =
    | 'DRAFT'
    | 'PENDING_COMMITTEE_REVIEW'
    | 'COMMITTEE_REVISION_REQUESTED'
    | 'COMMITTEE_REJECTED'
    | 'PENDING_APPROVAL'
    | 'APPROVER_REJECTED'
    | 'APPROVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export type SuggestionCategory =
    | 'MAKUL_ONERI'
    | 'KAIZEN'
    | 'A3'
    | 'AR_GE'
    | 'SUGGESTION'
    | 'OTHER';

export type GainCategory =
    | 'COST_SAVINGS'
    | 'TIME_SAVINGS'
    | 'QUALITY'
    | 'SAFETY'
    | 'ENVIRONMENT'
    | 'PRODUCTIVITY'
    | 'CUSTOMER_SATISFACTION'
    | 'OTHER';

export interface Suggestion {
    id: number;
    uuid: string;
    referenceNumber: string;
    title: string;
    currentSituation: string;
    proposedSolution: string;
    expectedBenefits?: string;
    category?: SuggestionCategory;
    gainCategories: GainCategory[];
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
    documents: Document[];
    approvalWorkflow?: ApprovalWorkflow;
    project?: Project;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    approvedAt?: string;
    completedAt?: string;
}

export interface Document {
    id: number;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
}

// Approval Types
export type ApprovalStepType =
    | 'CHEF_APPROVAL'
    | 'CHIEF_APPROVAL'
    | 'MANAGER_APPROVAL'
    | 'FACTORY_MANAGER'
    | 'FACTORY_MANAGER_APPROVAL'
    | 'GMY_APPROVAL';

export type ApprovalStepStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'SKIPPED';

export interface ApprovalStep {
    id: number;
    stepNumber: number;
    stepType: ApprovalStepType;
    approver: {
        id: number;
        employeeId: string;
        firstName: string;
        lastName: string;
        position?: string;
    };
    status: ApprovalStepStatus;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    notes?: string;
}

export interface ApprovalWorkflow {
    id: number;
    currentStep: number;
    totalSteps: number;
    steps: ApprovalStep[];
    completedAt?: string;
}

// Project Types
export type ProjectStatus =
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'ON_HOLD'
    | 'COMPLETED'
    | 'CANCELLED';

export interface Project {
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
    startDate?: string;
    estimatedEndDate?: string;
    actualEndDate?: string;
    actualCost?: number;
    actualSavings?: number;
    milestones: Milestone[];
}

export interface Milestone {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    completedDate?: string;
    isCompleted: boolean;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Dashboard Types
export interface DashboardStats {
    totalSuggestions: number;
    pendingSuggestions: number;
    approvedSuggestions: number;
    rejectedSuggestions: number;
    completedSuggestions: number;
    totalEstimatedSavings: number;
    totalActualSavings: number;
    averageApprovalTime: number;
    suggestionsByStatus: { status: string; count: number }[];
    suggestionsByCategory: { category: string; count: number }[];
    suggestionsByMonth: { month: string; count: number }[];
    topPerformers: { userId: number; name: string; count: number }[];
}

// Form Types
export interface LoginFormData {
    employeeId: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    requiresPasswordChange?: boolean;
}


export interface SuggestionFormData {
    title: string;
    currentSituation: string;
    proposedSolution: string;
    expectedBenefits?: string;
    category?: SuggestionCategory;
    gainCategories: GainCategory[];
    estimatedCost?: number;
    estimatedSavings?: number;
    estimatedTimeSavings?: number;
}

// Status Labels
export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
    DRAFT: 'Taslak',
    PENDING_COMMITTEE_REVIEW: 'Komite Onayında',
    COMMITTEE_REVISION_REQUESTED: 'Güncelleme Bekliyor',
    COMMITTEE_REJECTED: 'Komite Tarafından Reddedildi',
    PENDING_APPROVAL: 'Müdür Onayında',
    APPROVER_REJECTED: 'Müdür Tarafından Reddedildi',
    APPROVED: 'Onaylandı',
    IN_PROGRESS: 'Uygulamada',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
};

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionCategory, string> = {
    MAKUL_ONERI: 'Makul Öneri',
    KAIZEN: 'Kaizen',
    A3: 'A3',
    AR_GE: 'Ar-Ge',
    SUGGESTION: 'Öneri',
    OTHER: 'Diğer',
};

export const GAIN_CATEGORY_LABELS: Record<GainCategory, string> = {
    COST_SAVINGS: 'Maliyet Tasarrufu',
    TIME_SAVINGS: 'Zaman Tasarrufu',
    QUALITY: 'Kalite İyileştirmesi',
    SAFETY: 'İş Güvenliği',
    ENVIRONMENT: 'Çevre',
    PRODUCTIVITY: 'Verimlilik',
    CUSTOMER_SATISFACTION: 'Müşteri Memnuniyeti',
    OTHER: 'Diğer',
};

export const APPROVAL_STEP_STATUS_LABELS: Record<ApprovalStepStatus, string> = {
    PENDING: 'Beklemede',
    APPROVED: 'Onaylandı',
    REJECTED: 'Reddedildi',
    SKIPPED: 'Atlandı',
};

export const APPROVAL_STEP_TYPE_LABELS: Record<ApprovalStepType, string> = {
    CHEF_APPROVAL: 'Şef Onayı',
    CHIEF_APPROVAL: 'Şef Onayı',
    MANAGER_APPROVAL: 'Müdür Onayı',
    FACTORY_MANAGER: 'Fabrika Müdürü Onayı',
    FACTORY_MANAGER_APPROVAL: 'Fabrika Müdürü Onayı',
    GMY_APPROVAL: 'GMY Onayı',
};

export const STATUS_LABELS_TR: Record<string, string> = {
    ...SUGGESTION_STATUS_LABELS,
    ...APPROVAL_STEP_STATUS_LABELS,
    SUBMITTED: 'Gönderildi',
    UNDER_REVIEW: 'İnceleniyor',
    REVISION_REQUESTED: 'Revizyon İstendi',
    PENDING_PASSWORD_CHANGE: 'Şifre Değişikliği Bekleniyor',
    ACTIVE: 'Aktif',
    INACTIVE: 'Pasif',
    SUSPENDED: 'Askıda',
    PLANNED: 'Planlandı',
    ON_HOLD: 'Beklemede',
};

export const getStatusLabelTr = (status: string): string => {
    return STATUS_LABELS_TR[status] || status;
};
