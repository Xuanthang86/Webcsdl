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

// Authentication is cookie-based. The HttpOnly cookie is browser-session-only;
// the signed token uses a sliding 12-hour lifetime refreshed while an admin tab is active.
function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem('portal_session_token');
  window.localStorage.removeItem('portal_session_token');
  window.localStorage.removeItem('portal_auth_token');
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  removeStoredToken();
  return { ...extraHeaders };
}

function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders((init.headers as Record<string, string>) || {});
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });
}

async function parseJsonResponse<T = any>(res: Response, options: { suppressAuthExpired?: boolean } = {}): Promise<T> {
  if (res.status === 401 && typeof window !== 'undefined' && !options.suppressAuthExpired) {
    removeStoredToken();
    window.dispatchEvent(new CustomEvent('portal:auth-expired'));
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập bằng tài khoản Quản trị viên hợp lệ.');
      }
      if (res.status === 405) {
        throw new Error('Phương thức yêu cầu không được máy chủ hỗ trợ (405).');
      }
      throw new Error(`Lỗi máy chủ (${res.status}): ${text.replace(/<[^>]+>/g, '').trim().slice(0, 150) || res.statusText}`);
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
    const res = await authFetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    return parseJsonResponse(res);
  },

  async login(username: string, password?: string): Promise<User> {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await parseJsonResponse(res, { suppressAuthExpired: true });
    if (!data.user || typeof data.user !== 'object') {
      throw new Error('Đăng nhập không nhận được thông tin tài khoản hợp lệ từ máy chủ. Vui lòng thử lại.');
    }
    // The session is held only in an HttpOnly cookie, never in JavaScript storage.
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      const res = await authFetch('/api/auth/logout', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      await parseJsonResponse(res, { suppressAuthExpired: true }).catch(() => {});
    } finally {
      removeStoredToken();
    }
  },

  async changePassword(params: { currentPassword?: string; newPassword: string; confirmPassword?: string }): Promise<{ success: boolean; message?: string; user?: User }> {
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    });
    return parseJsonResponse(res);
  },

  async updateProfile(params: { phone?: string; organization?: string }): Promise<{ success: boolean; message?: string; user?: User }> {
    const res = await authFetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    });
    return parseJsonResponse(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await authFetch('/api/users', {
      headers: getAuthHeaders()
    });
    const data = await parseJsonResponse(res);
    return data.users || [];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await authFetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData)
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const res = await authFetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData)
    });
    const data = await parseJsonResponse(res);
    return data.user;
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await authFetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  // Config
  async getConfig(): Promise<SystemConfig> {
    const res = await authFetch('/api/config', {
      headers: getAuthHeaders()
    });
    const data = await parseJsonResponse(res);
    return data.config;
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await authFetch('/api/config', {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config)
    });
    const data = await parseJsonResponse(res);
    return data.config;
  },

  // Stats
  async getStats(year?: string): Promise<AggregatedStats> {
    const url = year ? `/api/stats?year=${encodeURIComponent(year)}` : '/api/stats';
    const res = await authFetch(url, {
      headers: getAuthHeaders()
    });
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

    const res = await authFetch(`/api/search?${searchParams.toString()}`, {
      headers: getAuthHeaders()
    });
    return await parseJsonResponse(res);
  },

  // Module records
  async getModuleRecords(moduleType: ModuleType, sortBy?: string, order?: 'asc' | 'desc', publicOnly?: boolean): Promise<BaseEntity[]> {
    const pageSize = 500;
    const allRecords: BaseEntity[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;
    while (offset < total) {
      const searchParams = new URLSearchParams();
      if (sortBy) searchParams.set('sortBy', sortBy);
      if (order) searchParams.set('order', order);
      if (publicOnly) searchParams.set('publicOnly', 'true');
      searchParams.set('limit', String(pageSize));
      searchParams.set('offset', String(offset));
      const res = await authFetch(`/api/modules/${moduleType}?${searchParams.toString()}`, {
        headers: getAuthHeaders()
      });
      const json = await parseJsonResponse(res);
      const page: BaseEntity[] = Array.isArray(json.data) ? json.data : [];
      allRecords.push(...page);
      total = Number.isFinite(Number(json.total)) ? Number(json.total) : allRecords.length;
      if (page.length === 0 || page.length < pageSize) break;
      offset += page.length;
    }
    return allRecords;
  },

  async getRecordById(moduleType: ModuleType, id: string): Promise<{ data: BaseEntity; relationships: EntityRelationship[] }> {
    const res = await authFetch(`/api/modules/${moduleType}/${id}`, {
      headers: getAuthHeaders()
    });
    return parseJsonResponse(res);
  },

  async createRecord(moduleType: ModuleType, payload: any): Promise<BaseEntity> {
    const res = await authFetch(`/api/modules/${moduleType}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async updateRecord(moduleType: ModuleType, id: string, payload: any): Promise<BaseEntity> {
    const res = await authFetch(`/api/modules/${moduleType}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async deleteRecord(moduleType: ModuleType, id: string): Promise<boolean> {
    const res = await authFetch(`/api/modules/${moduleType}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Workflow
  async transitionWorkflow(moduleType: ModuleType, id: string, status: string, note?: string): Promise<BaseEntity> {
    const res = await authFetch(`/api/modules/${moduleType}/${id}/workflow`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, note })
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // Relationships
  async getRelationships(entityId?: string): Promise<EntityRelationship[]> {
    const url = entityId ? `/api/relationships?entityId=${entityId}` : '/api/relationships';
    const res = await authFetch(url, { headers: getAuthHeaders() });
    const json = await parseJsonResponse(res);
    return json.data || [];
  },

  async createRelationship(rel: Omit<EntityRelationship, 'id' | 'createdAt'>): Promise<EntityRelationship> {
    const res = await authFetch('/api/relationships', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(rel)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async deleteRelationship(id: string): Promise<boolean> {
    const res = await authFetch(`/api/relationships/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Import / Export
  async importRecords(moduleType: ModuleType, items: any[], conflictAction: 'skip' | 'overwrite' = 'skip'): Promise<{ importedCount: number; importedIds: string[]; errors: string[]; duplicates: string[] }> {
    const res = await authFetch(`/api/import/${moduleType}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ items, conflictAction })
    });
    const json = await parseJsonResponse(res);
    return json.result;
  },

  async batchImport(moduleType: ModuleType, items: any[], conflictAction?: 'skip' | 'overwrite'): Promise<{ importedCount: number; importedIds: string[]; errors: string[]; duplicates: string[] }> {
    return this.importRecords(moduleType, items, conflictAction || 'skip');
  },

  async approveImportedRecords(moduleType: ModuleType, ids: string[]): Promise<{ success: boolean; approvedCount: number; message?: string }> {
    let approvedCount = 0;
    const batchSize = 200;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const res = await authFetch(`/api/import/${moduleType}/approve`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids: batch })
      });
      const result = await parseJsonResponse(res);
      approvedCount += Number(result.approvedCount) || 0;
    }
    return { success: true, approvedCount };
  },

  getExportUrl(moduleType: ModuleType): string {
    return `/api/export/${moduleType}`;
  },

  getTemplateUrl(moduleType: ModuleType): string {
    return `/api/templates/${moduleType}`;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const res = await authFetch(`/api/audit-logs?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return (Array.isArray(json.logs) ? json.logs : []).map((row: any) => ({
      id: String(row.id || ''),
      userId: row.user_id || row.userId || '',
      userName: row.user_name || row.userName || 'Hệ thống',
      userRole: row.user_role || row.userRole || 'system',
      action: row.action || 'unknown',
      targetModule: row.target_module || row.targetModule || row.module || undefined,
      targetId: row.target_id || row.targetId || row.entity_id || undefined,
      targetTitle: row.target_title || row.targetTitle || undefined,
      details: row.details || '',
      timestamp: row.timestamp || row.created_at || row.createdAt || ''
    }));
  },

  // Connections
  async getConnections(needId?: string): Promise<ConnectionMessage[]> {
    const url = needId ? `/api/connections?needId=${needId}` : '/api/connections';
    const res = await authFetch(url, { headers: getAuthHeaders() });
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
    const res = await authFetch('/api/connections', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  async updateConnectionStatus(id: string, status: 'accepted' | 'declined'): Promise<boolean> {
    const res = await authFetch(`/api/connections/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    const json = await parseJsonResponse(res);
    return json.success;
  },

  // Backup & Restore
  getBackupUrl(): string {
    return '/api/backup';
  },

  async downloadBackup(): Promise<Blob> {
    const res = await authFetch('/api/backup', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      await parseJsonResponse(res);
      throw new Error('Không thể tải bản sao lưu dữ liệu.');
    }
    return res.blob();
  },

  async restoreBackup(snapshot: any): Promise<boolean> {
    const res = await authFetch('/api/restore', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    const res = await authFetch('/api/test-suite/run', { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // Form Management (Section VIII.3)
  async getFormConfig(moduleType: string): Promise<any> {
    const res = await authFetch(`/api/forms/${moduleType}`, {
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.config || { customFields: [] };
  },

  async updateFormConfig(moduleType: string, config: any): Promise<any> {
    const res = await authFetch(`/api/forms/${moduleType}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config)
    });
    const json = await parseJsonResponse(res);
    return json.config;
  },

  // Cloudflare D1 & SQL Export / Reconcile
  async exportD1Sql(download = false): Promise<string> {
    const res = await authFetch(`/api/d1/export-sql${download ? '?download=1' : ''}`, {
      headers: getAuthHeaders()
    });
    return res.text();
  },

  async reconcileD1(): Promise<any> {
    const res = await authFetch('/api/d1/reconcile', {
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.data;
  },

  // ImageKit & Attachments
  async getImageKitAuth(): Promise<{ token: string; expire: number; signature: string; publicKey: string; urlEndpoint: string }> {
    const res = await authFetch('/api/imagekit/auth', {
      headers: getAuthHeaders()
    });
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
    const res = await authFetch('/api/imagekit/upload', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    const res = await authFetch(`/api/attachments${query}`, {
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.data || [];
  },

  async deleteAttachment(id: string): Promise<boolean> {
    const res = await authFetch(`/api/attachments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await parseJsonResponse(res);
    return json.success;
  }
};

