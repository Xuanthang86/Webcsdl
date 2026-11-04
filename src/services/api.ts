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

function secureFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  return fetch(url, {
    credentials: 'include',
    ...init,
    headers
  });
}

async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('portal:auth-expired'));
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      const isHtml = text.trim().startsWith('<');
      const errorMsg = isHtml 
        ? `Lỗi máy chủ (${res.status}): Dịch vụ tạm thời không phản hồi đúng định dạng JSON.` 
        : `Lỗi máy chủ (${res.status}): ${text.slice(0, 150) || res.statusText}`;
      throw new Error(errorMsg);
    }
    return text as unknown as T;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Lỗi yêu cầu hệ thống (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User; availableRoles: Array<{ role: string; label: string }> }> {
    const res = await secureFetch('/api/auth/me');
    return parseJsonResponse(res);
  },

  async switchRole(role: string): Promise<User> {
    const res = await secureFetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async login(username: string, password?: string): Promise<User> {
    const res = await secureFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async logout(): Promise<void> {
    const res = await secureFetch('/api/auth/logout', { 
      method: 'POST'
    });
    await parseJsonResponse(res).catch(() => {});
  },

  async changePassword(params: { currentPassword?: string; newPassword: string; confirmPassword?: string }): Promise<{ success: boolean; message?: string; user?: User }> {
    const res = await secureFetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return parseJsonResponse(res);
  },

  async updateProfile(params: { phone?: string; organization?: string }): Promise<{ success: boolean; message?: string; user?: User }> {
    const res = await secureFetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return parseJsonResponse(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await secureFetch('/api/users');
    const data = await parseJsonResponse(res);
    return data.users || [];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await secureFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const res = await secureFetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await secureFetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  // Config
  async getConfig(): Promise<SystemConfig> {
    const res = await secureFetch('/api/config');
    const data = await parseJsonResponse(res);
    return data.config;
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await secureFetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await parseJsonResponse(res);
    return data.config;
  },

  // Stats
  async getStats(year?: string): Promise<AggregatedStats> {
    const url = year ? `/api/stats?year=${encodeURIComponent(year)}` : '/api/stats';
    const res = await secureFetch(url);
    const data = await parseJsonResponse(res);
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

    const res = await secureFetch(`/api/search?${searchParams.toString()}`);
    return await parseJsonResponse(res);
  },

  // Module records
  async getModuleRecords(moduleType: ModuleType, sortBy?: string, order?: 'asc' | 'desc'): Promise<BaseEntity[]> {
    const searchParams = new URLSearchParams();
    if (sortBy) searchParams.set('sortBy', sortBy);
    if (order) searchParams.set('order', order);
    const res = await secureFetch(`/api/modules/${moduleType}?${searchParams.toString()}`);
    const json = await parseJsonResponse(res);
    return json.data || [];
  },

  async getRecordById(moduleType: ModuleType, id: string): Promise<{ data: BaseEntity; relationships: EntityRelationship[] }> {
    const res = await secureFetch(`/api/modules/${moduleType}/${id}`);
    return parseJsonResponse(res);
  },

  async createRecord(moduleType: ModuleType, payload: any): Promise<BaseEntity> {
    const res = await secureFetch(`/api/modules/${moduleType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async updateRecord(moduleType: ModuleType, id: string, payload: any): Promise<BaseEntity> {
    const res = await secureFetch(`/api/modules/${moduleType}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async deleteRecord(moduleType: ModuleType, id: string): Promise<boolean> {
    const res = await secureFetch(`/api/modules/${moduleType}/${id}`, {
      method: 'DELETE'
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Workflow
  async transitionWorkflow(moduleType: ModuleType, id: string, status: string, note?: string): Promise<BaseEntity> {
    const res = await secureFetch(`/api/modules/${moduleType}/${id}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // Relationships
  async getRelationships(entityId?: string): Promise<EntityRelationship[]> {
    const url = entityId ? `/api/relationships?entityId=${entityId}` : '/api/relationships';
    const res = await secureFetch(url);
    const json = await parseJsonResponse(res);
    return json.data || [];
  },

  async createRelationship(rel: Omit<EntityRelationship, 'id' | 'createdAt'>): Promise<EntityRelationship> {
    const res = await secureFetch('/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rel)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async deleteRelationship(id: string): Promise<boolean> {
    const res = await secureFetch(`/api/relationships/${id}`, { 
      method: 'DELETE'
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Import / Export
  async importRecords(moduleType: ModuleType, items: any[]): Promise<{ importedCount: number; errors: string[]; duplicates: string[] }> {
    const res = await secureFetch(`/api/import/${moduleType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const json = await parseJsonResponse(res);
    return json.result;
  },

  async batchImport(moduleType: string, items: any[], duplicateHandling = 'skip'): Promise<{ importedCount: number; errors: string[]; duplicates: string[] }> {
    const res = await secureFetch(`/api/import/${moduleType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, duplicateHandling })
    });
    const json = await parseJsonResponse(res);
    return json.result || { importedCount: items.length, errors: [], duplicates: [] };
  },

  getExportUrl(moduleType: ModuleType): string {
    return `/api/export/${moduleType}`;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const res = await secureFetch(`/api/audit-logs?limit=${limit}`);
    const json = await parseJsonResponse(res);
    return json.logs || [];
  },

  // Connections
  async getConnections(needId?: string): Promise<ConnectionMessage[]> {
    const url = needId ? `/api/connections?needId=${needId}` : '/api/connections';
    const res = await secureFetch(url);
    const json = await parseJsonResponse(res);
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
    const res = await secureFetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async updateConnectionStatus(id: string, status: 'accepted' | 'declined'): Promise<boolean> {
    const res = await secureFetch(`/api/connections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Backup & Restore
  getBackupUrl(): string {
    return '/api/backup';
  },

  async restoreBackup(snapshot: any): Promise<boolean> {
    const res = await secureFetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Test suite
  async runAcceptanceTests(): Promise<{
    timestamp: string;
    totalTests: number;
    passedTests: number;
    results: Array<{ id: number; name: string; passed: boolean; message: string; durationMs: number }>;
  }> {
    const res = await secureFetch('/api/test-suite/run', { 
      method: 'POST'
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // Form Management (Section VIII.3)
  async getFormConfig(moduleType: string): Promise<any> {
    const res = await secureFetch(`/api/forms/${moduleType}`);
    const json = await parseJsonResponse(res);
    return json.config || { customFields: [] };
  },

  async updateFormConfig(moduleType: string, config: any): Promise<any> {
    const res = await secureFetch(`/api/forms/${moduleType}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const json = await parseJsonResponse(res);
    return json.config;
  },

  // Cloudflare D1 & SQL Export / Reconcile
  async exportD1Sql(download = false): Promise<string> {
    const res = await secureFetch(`/api/d1/export-sql${download ? '?download=1' : ''}`);
    return res.text();
  },

  async reconcileD1(): Promise<any> {
    const res = await secureFetch('/api/d1/reconcile');
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // ImageKit & Attachments
  async getImageKitAuth(): Promise<{ token: string; expire: number; signature: string; publicKey: string; urlEndpoint: string }> {
    const res = await secureFetch('/api/imagekit/auth');
    return parseJsonResponse(res);
  },

  async uploadAttachment(data: {
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    cdnUrl?: string;
    entityId?: string;
    moduleType?: string;
    title?: string;
  }): Promise<any> {
    const res = await secureFetch('/api/imagekit/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async getAttachments(filter?: { entityId?: string; moduleType?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filter?.entityId) params.append('entityId', filter.entityId);
    if (filter?.moduleType) params.append('moduleType', filter.moduleType);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await secureFetch(`/api/attachments${query}`);
    const json = await parseJsonResponse(res);
    return json.data || [];
  },

  async deleteAttachment(id: string): Promise<boolean> {
    const res = await secureFetch(`/api/attachments/${id}`, {
      method: 'DELETE'
    });
    const json = await parseJsonResponse(res);
    return json.success;
  }
};
