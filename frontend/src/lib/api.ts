import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<never>>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                // Clear tokens and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API helper functions
export const apiClient = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        api.get<ApiResponse<T>>(url, config).then(res => res.data),

    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.post<ApiResponse<T>>(url, data, config).then(res => res.data),

    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.put<ApiResponse<T>>(url, data, config).then(res => res.data),

    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.patch<ApiResponse<T>>(url, data, config).then(res => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        api.delete<ApiResponse<T>>(url, config).then(res => res.data),
};

// Auth API
export const authApi = {
    login: (employeeId: string, password: string) =>
        apiClient.post<LoginResponse>('/auth/login', { employeeId, password }),

    logout: (refreshToken?: string) =>
        apiClient.post('/auth/logout', { refreshToken }),

    refresh: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string, confirmPassword: string) =>
        apiClient.post('/auth/reset-password', { token, newPassword, confirmPassword }),

    changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
        apiClient.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),

    getProfile: () =>
        apiClient.get<User>('/auth/me'),
};

// Suggestions API
export const suggestionsApi = {
    getAll: (params?: Record<string, unknown>) =>
        apiClient.get<PaginatedResponse<Suggestion>>('/suggestions', { params }),

    getMy: (params?: Record<string, unknown>) =>
        apiClient.get<PaginatedResponse<Suggestion>>('/suggestions/my', { params }),

    getById: (id: number) =>
        apiClient.get<Suggestion>(`/suggestions/${id}`),

    create: (data: Partial<Suggestion>) =>
        apiClient.post<Suggestion>('/suggestions', data),

    update: (id: number, data: Partial<Suggestion>) =>
        apiClient.put<Suggestion>(`/suggestions/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/suggestions/${id}`),

    submit: (id: number) =>
        apiClient.post<Suggestion>(`/suggestions/${id}/submit`),

    committeeReview: (id: number, data: { action: string; category?: string; projectLeaderId?: number; teamMemberIds?: number[]; notes?: string; rejectionReason?: string; revisionRequestReason?: string }) =>
        apiClient.post<Suggestion>(`/suggestions/${id}/committee-review`, data),

    approve: (id: number, notes?: string) =>
        apiClient.post<Suggestion>(`/suggestions/${id}/approve`, { notes }),

    reject: (id: number, reason: string) =>
        apiClient.post<Suggestion>(`/suggestions/${id}/reject`, { reason }),

    uploadDocuments: (id: number, files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return apiClient.post(`/suggestions/${id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Import types for API
import { Suggestion, LoginResponse, User } from '@/types';

export default api;