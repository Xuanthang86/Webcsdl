import {
  ModuleType,
  BaseEntity,
  SystemConfig,
  User,
  AggregatedStats,
  EntityRelationship,
  AuditLog,
  ConnectionMessage
} from '../types';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('portal_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User; availableRoles: Array<{ role: string; label: string }> }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data;
  },

  async switchRole(role: string): Promise<User> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi chuyển đổi vai trò');
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('portal_auth_token', data.token);
    }
    return data.user;
  },

  async login(username: string, password?: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập không thành công');
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('portal_auth_token', data.token);
    }
    return data.user;
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portal_auth_token');
    }
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.users || [];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tạo tài khoản');
    return data.user;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật tài khoản');
    return data.user;
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi xóa tài khoản');
    return data.success;
  },

  // Config
  async getConfig(): Promise<SystemConfig> {
    const res = await fetch('/api/config', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.config;
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    return data.config;
  },

  // Stats
  async getStats(): Promise<AggregatedStats> {
    const res = await fetch('/api/stats', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.stats;
  },

  // Search
  async searchGlobal(params: {
    q?: string;
    moduleType?: string;
    field?: string;
    location?: string;
    status?: string;
    verificationStatus?: string;
  }): Promise<{ total: number; results: BaseEntity[] }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.moduleType) searchParams.set('moduleType', params.moduleType);
    if (params.field) searchParams.set('field', params.field);
    if (params.location) searchParams.set('location', params.location);
    if (params.status) searchParams.set('status', params.status);
    if (params.verificationStatus) searchParams.set('verificationStatus', params.verificationStatus);

    const res = await fetch(`/api/search?${searchParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Module records
  async getModuleRecords(moduleType: ModuleType, sortBy?: string, order?: 'asc' | 'desc'): Promise<BaseEntity[]> {
    const searchParams = new URLSearchParams();
    if (sortBy) searchParams.set('sortBy', sortBy);
    if (order) searchParams.set('order', order);
    const res = await fetch(`/api/modules/${moduleType}?${searchParams.toString()}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data || [];
  },

  async getRecordById(moduleType: ModuleType, id: string): Promise<{ data: BaseEntity; relationships: EntityRelationship[] }> {
    const res = await fetch(`/api/modules/${moduleType}/${id}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json;
  },

  async createRecord(moduleType: ModuleType, payload: any): Promise<BaseEntity> {
    const res = await fetch(`/api/modules/${moduleType}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi tạo mới bản ghi');
    return json.data;
  },

  async updateRecord(moduleType: ModuleType, id: string, payload: any): Promise<BaseEntity> {
    const res = await fetch(`/api/modules/${moduleType}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi cập nhật bản ghi');
    return json.data;
  },

  async deleteRecord(moduleType: ModuleType, id: string): Promise<boolean> {
    const res = await fetch(`/api/modules/${moduleType}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.success;
  },

  // Workflow
  async transitionWorkflow(moduleType: ModuleType, id: string, status: string, note?: string): Promise<BaseEntity> {
    const res = await fetch(`/api/modules/${moduleType}/${id}/workflow`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, note })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi chuyển trạng thái quy trình');
    return json.data;
  },

  // Relationships
  async getRelationships(entityId?: string): Promise<EntityRelationship[]> {
    const url = entityId ? `/api/relationships?entityId=${entityId}` : '/api/relationships';
    const res = await fetch(url, { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async createRelationship(rel: Omit<EntityRelationship, 'id' | 'createdAt'>): Promise<EntityRelationship> {
    const res = await fetch('/api/relationships', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(rel)
    });
    const json = await res.json();
    return json.data;
  },

  async deleteRelationship(id: string): Promise<boolean> {
    const res = await fetch(`/api/relationships/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.success;
  },

  // Import / Export
  async importRecords(moduleType: ModuleType, items: any[]): Promise<{ importedCount: number; errors: string[]; duplicates: string[] }> {
    const res = await fetch(`/api/import/${moduleType}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ items })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi nhập dữ liệu');
    return json.result;
  },

  getExportUrl(moduleType: ModuleType): string {
    return `/api/export/${moduleType}`;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const res = await fetch(`/api/audit-logs?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.logs || [];
  },

  // Connections
  async getConnections(needId?: string): Promise<ConnectionMessage[]> {
    const url = needId ? `/api/connections?needId=${needId}` : '/api/connections';
    const res = await fetch(url, { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async sendConnection(payload: {
    needId: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    senderOrg?: string;
    message: string;
    proposedCapability?: string;
  }): Promise<ConnectionMessage> {
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi gửi yêu cầu kết nối');
    return json.data;
  },

  async updateConnectionStatus(id: string, status: 'accepted' | 'declined'): Promise<boolean> {
    const res = await fetch(`/api/connections/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    return json.success;
  },

  // Backup & Restore
  getBackupUrl(): string {
    return '/api/backup';
  },

  async restoreBackup(snapshot: any): Promise<boolean> {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(snapshot)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi phục hồi dữ liệu');
    return json.success;
  },

  // Test suite
  async runAcceptanceTests(): Promise<{
    timestamp: string;
    totalTests: number;
    passedTests: number;
    results: Array<{ id: number; name: string; passed: boolean; message: string; durationMs: number }>;
  }> {
    const res = await fetch('/api/test-suite/run', { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data;
  },

  // Form Management (Section VIII.3)
  async getFormConfig(moduleType: string): Promise<any> {
    const res = await fetch(`/api/forms/${moduleType}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.config || { customFields: [] };
  },

  async updateFormConfig(moduleType: string, config: any): Promise<any> {
    const res = await fetch(`/api/forms/${moduleType}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config)
    });
    const json = await res.json();
    return json.config;
  }
};
