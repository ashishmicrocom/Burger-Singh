// API Service for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    storeCode?: string;
    storeName?: string;
    assignedStores?: string[];
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
  };
  token?: string;
}

interface ApiError {
  success: false;
  message: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_URL;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        const error: any = new Error(data.message || 'Request failed');
        error.response = { 
          status: response.status, 
          data: data,
          statusText: response.statusText 
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return response;
  }

  async getMe(): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    storeCode?: string;
    storeName?: string;
    assignedStores?: string[];
    phone?: string;
  }): Promise<{ success: boolean; message: string; user?: any }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Outlet endpoints
  async getOutlets(): Promise<{ success: boolean; count: number; outlets: any[] }> {
    return this.request('/outlets');
  }

  async getOutletById(id: string): Promise<{ success: boolean; outlet: any }> {
    return this.request(`/outlets/${id}`);
  }

  // Role endpoints
  async getRoles(): Promise<{ success: boolean; count: number; roles: any[] }> {
    return this.request('/roles');
  }

  async getRoleById(id: string): Promise<{ success: boolean; role: any }> {
    return this.request(`/roles/${id}`);
  }

  // Onboarding endpoints
  async saveDraft(data: any): Promise<{ success: boolean; message: string; onboarding: any }> {
    return this.request('/onboarding/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDraft(phone: string): Promise<{ success: boolean; onboarding: any }> {
    return this.request(`/onboarding/draft/${phone}`);
  }

  async uploadDocuments(id: string, formData: FormData): Promise<{ success: boolean; message: string; files: any }> {
    // Don't set Content-Type for FormData - browser will set it with boundary
    const response = await fetch(`${this.baseURL}/onboarding/${id}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  async submitApplication(id: string): Promise<{ success: boolean; message: string; onboarding: any }> {
    return this.request(`/onboarding/${id}/submit`, {
      method: 'POST',
    });
  }

  async getApplications(filters?: any): Promise<{ success: boolean; applications: any[]; total: number }> {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/onboarding${params ? '?' + params : ''}`);
  }

  async getApplicationById(id: string): Promise<{ success: boolean; application: any }> {
    return this.request(`/onboarding/${id}`);
  }

  // Admin endpoints
  async getAdminStats(): Promise<{ success: boolean; stats: any }> {
    return this.request('/admin/stats');
  }

  async getAllEmployees(filters?: any): Promise<{ success: boolean; employees: any[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/admin/employees${params ? '?' + params : ''}`);
  }

  async getEmployeeById(id: string): Promise<{ success: boolean; employee: any }> {
    return this.request(`/admin/employees/${id}`);
  }

  async exportEmployeesCSV(filters?: any): Promise<void> {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${this.baseURL}/admin/employees/export/csv${params ? '?' + params : ''}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportEmployeesJSON(filters?: any): Promise<void> {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${this.baseURL}/admin/employees/export/json${params ? '?' + params : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const data = await response.json();
    
    // Convert JSON to blob and download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getFieldCoaches(): Promise<{ success: boolean; coaches: any[] }> {
    return this.request('/admin/field-coaches');
  }

  async createOutlet(data: any): Promise<{ success: boolean; message: string; outlet: any }> {
    return this.request('/outlets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOutlet(id: string, data: any): Promise<{ success: boolean; message: string; outlet: any }> {
    return this.request(`/outlets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleOutletStatus(id: string): Promise<{ success: boolean; message: string; outlet: any }> {
    return this.request(`/outlets/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteOutlet(id: string): Promise<{ success: boolean; message: string }> {
    console.log('🌐 API Service: DELETE request to /outlets/' + id);
    const result = await this.request<{ success: boolean; message: string }>(`/outlets/${id}`, {
      method: 'DELETE',
    });
    console.log('🌐 API Service: DELETE response:', result);
    return result;
  }

  async bulkImportOutlets(outlets: any[]): Promise<{ success: boolean; message: string; successCount: number; failureCount: number; errors: any[] }> {
    return this.request('/outlets/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ outlets }),
    });
  }

  async generateExportLink(filters?: any): Promise<{ success: boolean; link: string; token: string; expiresAt: string }> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/admin/generate-export-link?${queryParams}`, {
      method: 'POST',
    });
  }

  async terminateEmployee(id: string, reason: string): Promise<{ success: boolean; message: string; employee: any }> {
    return this.request(`/admin/employees/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deactivateEmployee(id: string, reason: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.request(`/admin/employees/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rehireEmployee(id: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.request(`/admin/employees/${id}/rehire`, {
      method: 'POST',
    });
  }

  async createRole(data: any): Promise<{ success: boolean; message: string; role: any }> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: any): Promise<{ success: boolean; message: string; role: any }> {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // User management endpoints
  async createFieldCoach(data: any): Promise<{ success: boolean; message: string; user: any }> {
    return this.request('/admin/users/field-coach', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFieldCoach(id: string, data: any): Promise<{ success: boolean; message: string; user: any }> {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createStoreManager(data: any): Promise<{ success: boolean; message: string; user: any }> {
    return this.request('/admin/users/store-manager', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStoreManager(id: string, data: any): Promise<{ success: boolean; message: string; user: any }> {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getStoreManagers(): Promise<{ success: boolean; managers: any[] }> {
    return this.request('/admin/users/store-managers');
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Field Coach endpoints
  async getFieldCoachStats(): Promise<{ success: boolean; stats: any }> {
    return this.request('/field-coach/stats');
  }

  async getFieldCoachApplications(filters?: any): Promise<{ success: boolean; applications: any[]; total: number }> {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/field-coach/applications${params ? '?' + params : ''}`);
  }

  async getFieldCoachApplicationById(id: string): Promise<{ success: boolean; application: any }> {
    return this.request(`/field-coach/applications/${id}`);
  }

  async approveFieldCoachApplication(id: string): Promise<{ success: boolean; message: string; application: any }> {
    return this.request(`/field-coach/applications/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectFieldCoachApplication(id: string, reason: string): Promise<{ success: boolean; message: string; application: any }> {
    return this.request(`/field-coach/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getFieldCoachDeactivations(): Promise<{ success: boolean; deactivations: any[]; total: number }> {
    return this.request('/field-coach/deactivations');
  }

  async approveDeactivation(id: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.request(`/field-coach/deactivations/${id}/approve`, {
      method: 'PUT'
    });
  }

  async rejectDeactivation(id: string, rejectionReason?: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.request(`/field-coach/deactivations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason })
    });
  }

  // Manager endpoints
  async getManagerStats(): Promise<{ success: boolean; data: any }> {
    return this.request('/manager/stats');
  }

  async getManagerOnboardings(search?: string, status?: string): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const queryString = params.toString();
    return this.request(`/manager/onboardings${queryString ? `?${queryString}` : ''}`);
  }

  async getManagerEmployees(search?: string): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const queryString = params.toString();
    return this.request(`/manager/employees${queryString ? `?${queryString}` : ''}`);
  }

  async requestEmployeeDeactivation(employeeId: string, reason: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/manager/employees/${employeeId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getManagerDeactivationRequests(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/manager/deactivations');
  }

  // Dashboard endpoints (generic dashboard for any role)
  async getDashboardStats(): Promise<{ success: boolean; data: any }> {
    return this.request('/dashboard/stats');
  }

  async getDashboardApplications(search?: string, status?: string): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const queryString = params.toString();
    return this.request(`/dashboard/applications${queryString ? `?${queryString}` : ''}`);
  }

  async approveDashboardApplication(applicationId: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/dashboard/applications/${applicationId}/approve`, {
      method: 'POST'
    });
  }

  async rejectDashboardApplication(applicationId: string, reason: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/dashboard/applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // OTP endpoints
  async sendPhoneOTP(phone: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    return this.request('/otp/send-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhoneOTP(phone: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return this.request('/otp/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async sendEmailOTP(email: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    return this.request('/otp/send-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmailOTP(email: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return this.request('/otp/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  // ID Verification endpoints
  async verifyPAN(panNumber: string, name?: string, dob?: string, onboardingId?: string): Promise<{ success: boolean; verified: boolean; message?: string; data?: any }> {
    return this.request('/onboarding/verify-pan', {
      method: 'POST',
      body: JSON.stringify({ panNumber, name, dob, onboardingId }),
    });
  }

  async initiateAadhaarVerification(
    redirectUrl: string, 
    onboardingId?: string
  ): Promise<{ success: boolean; clientId?: string; digilockerUrl?: string; expiresAt?: string; message?: string }> {
    return this.request('/onboarding/verify-aadhaar/initiate', {
      method: 'POST',
      body: JSON.stringify({ redirectUrl, onboardingId }),
    });
  }

  async checkAadhaarVerificationStatus(
    clientId?: string, 
    onboardingId?: string,
    urlStatus?: string
  ): Promise<{ success: boolean; verified: boolean; status?: string; message?: string; data?: any }> {
    return this.request('/onboarding/verify-aadhaar/status', {
      method: 'POST',
      body: JSON.stringify({ clientId, onboardingId, urlStatus }),
    });
  }

  // Approval Workflow endpoints
  async sendApprovalEmail(onboardingId: string, fieldCoachEmail: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/onboarding/${onboardingId}/send-approval-email`, {
      method: 'POST',
      body: JSON.stringify({ fieldCoachEmail })
    });
  }

  async checkApprovalToken(onboardingId: string, token: string): Promise<{ success: boolean; isValid: boolean; applicationStatus: string; expiryTime: string }> {
    return fetch(`${this.baseURL}/onboarding/${onboardingId}/check-token?token=${token}`)
      .then(r => r.json());
  }

  async approveWithToken(onboardingId: string, token: string): Promise<{ success: boolean; message: string; data?: any }> {
    return fetch(`${this.baseURL}/onboarding/${onboardingId}/approve-with-token?token=${token}`)
      .then(r => r.json());
  }

  async rejectWithToken(onboardingId: string, token: string, reason: string): Promise<{ success: boolean; message: string; data?: any }> {
    return fetch(`${this.baseURL}/onboarding/${onboardingId}/reject-with-token?token=${token}&reason=${encodeURIComponent(reason)}`)
      .then(r => r.json());
  }

  async getPendingApprovals(fieldCoachEmail: string): Promise<{ success: boolean; count: number; approvals: any[] }> {
    return this.request(`/onboarding/pending/approvals?fieldCoachEmail=${encodeURIComponent(fieldCoachEmail)}`);
  }
}

export const apiService = new ApiService();
export default apiService;
