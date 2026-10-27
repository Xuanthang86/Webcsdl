import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authMiddleware, AuthenticatedRequest, requirePermission, requireRole } from '../auth.ts';
import { ModuleType, ApprovalStatus, UserRole } from '../types.ts';

export const apiRouter = Router();

apiRouter.use(authMiddleware);

// 1. Authentication & Role Switcher
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
    availableRoles: [
      { role: 'super_admin', label: 'Super Admin (Toàn quyền hệ thống)' },
      { role: 'system_admin', label: 'Quản trị viên hệ thống' },
      { role: 'agency_leader', label: 'Lãnh đạo cơ quan (Phê duyệt)' },
      { role: 'data_officer', label: 'Cán bộ quản lý dữ liệu' },
      { role: 'evaluator_expert', label: 'Chuyên gia thẩm định' },
      { role: 'partner_officer', label: 'Cán bộ đơn vị phối hợp' },
      { role: 'org_representative', label: 'Đại diện Doanh nghiệp' },
      { role: 'expert_user', label: 'Chuyên gia / Nhà khoa học' },
      { role: 'investor_user', label: 'Nhà đầu tư / Quỹ' },
      { role: 'public_user', label: 'Công dân / Người dùng công khai' }
    ]
  });
});

apiRouter.post('/auth/switch-role', (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ success: false, message: 'Thiếu thông tin vai trò.' });
    return;
  }
  const targetUser = db.getUsers().find(u => u.role === role) || {
    id: `usr_${role}`,
    username: role,
    fullName: `Người dùng ${role}`,
    email: `${role}@thanhpho.gov.vn`,
    role: role as UserRole,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  res.cookie('user_role', targetUser.role, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
  res.cookie('user_id', targetUser.id, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });

  db.addAuditLog({
    userId: targetUser.id,
    userName: targetUser.fullName,
    userRole: targetUser.role,
    action: 'login',
    details: `Chuyển phiên làm việc sang vai trò [${targetUser.role}]`
  });

  res.json({ success: true, user: targetUser });
});

apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response): void => {
  const { username, password } = req.body;
  if (!username) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
    return;
  }
  const user = db.authenticateUser(username, password);
  if (!user) {
    res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác hoặc tài khoản đã bị khóa.' });
    return;
  }
  res.cookie('user_role', user.role, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
  res.cookie('user_id', user.id, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
  db.addAuditLog({
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'login',
    details: `Đăng nhập hệ thống thành công với tài khoản [${user.username}] (${user.role})`
  });
  res.json({ success: true, user });
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response): void => {
  res.clearCookie('user_role');
  res.clearCookie('user_id');
  res.json({ success: true, message: 'Đã đăng xuất.' });
});

apiRouter.get('/auth/users', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, users: db.getUsers() });
});

// User Management (Admin & RBAC)
apiRouter.get('/users', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, users: db.getUsers() });
});

apiRouter.post('/users', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const newUser = db.createUser(req.body, req.user);
    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi tạo tài khoản' });
  }
});

apiRouter.put('/users/:id', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const updatedUser = db.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi cập nhật tài khoản' });
  }
});

apiRouter.delete('/users/:id', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const success = db.deleteUser(req.params.id, req.user);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi xóa tài khoản' });
  }
});

// 2. System Configuration
apiRouter.get('/config', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, config: db.getSystemConfig() });
});

apiRouter.put('/config', requirePermission('canManageConfig'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const updated = db.updateSystemConfig(req.body, req.user);
  res.json({ success: true, config: updated });
});

// Form Management Configuration (Section VIII.3)
apiRouter.get('/forms/:moduleType', (req: AuthenticatedRequest, res: Response) => {
  const config = db.getFormConfig(req.params.moduleType);
  res.json({ success: true, config });
});

apiRouter.put('/forms/:moduleType', requirePermission('canManageConfig'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const updated = db.updateFormConfig(req.params.moduleType, req.body, req.user);
  res.json({ success: true, config: updated });
});

// 3. Live Aggregated Statistics
apiRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAggregatedStats();
  res.json({ success: true, stats });
});

// 4. Global Search
apiRouter.get('/search', (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string) || '';
  const moduleType = (req.query.moduleType as string) || '';
  const field = (req.query.field as string) || '';
  const location = (req.query.location as string) || '';
  const status = (req.query.status as string) || '';
  const verificationStatus = (req.query.verificationStatus as string) || '';

  const isInternal = req.user?.role !== 'public_user';
  const isPublicOnly = !isInternal;

  const results = db.searchGlobal(
    query,
    { moduleType, field, location, status, verificationStatus },
    isPublicOnly
  );

  res.json({
    success: true,
    total: results.length,
    results
  });
});

// 5. Module CRUD Operations
apiRouter.get('/modules/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  const isPublicOnly = req.user?.role === 'public_user';
  const records = db.getModuleRecords(moduleType, isPublicOnly);

  // Sorting
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  records.sort((a, b) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return -order;
    if (valA > valB) return order;
    return 0;
  });

  res.json({
    success: true,
    moduleType,
    total: records.length,
    data: records
  });
});

apiRouter.get('/modules/:moduleType/:id', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  const id = req.params.id;
  const record = db.getRecordById(moduleType, id);

  if (!record) {
    res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi.' });
    return;
  }

  if (req.user?.role === 'public_user' && record.publicityLevel !== 'public') {
    res.status(403).json({ success: false, message: 'Dữ liệu nội bộ, không được phép truy cập công khai.' });
    return;
  }

  // Also fetch related entities
  const relationships = db.getEntityRelationships(id);

  res.json({
    success: true,
    data: record,
    relationships
  });
});

apiRouter.post('/modules/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  const config = db.getSystemConfig();

  // If public user, check if public submission is allowed
  if (req.user.role === 'public_user') {
    if (!config.enablePublicSubmissions) {
      res.status(403).json({ success: false, message: 'Cổng thông tin hiện đang tạm khóa chức năng nộp hồ sơ công khai.' });
      return;
    }
    // Public user submissions are always 'draft' or 'submitted'
    req.body.status = 'submitted';
    req.body.verificationStatus = 'pending';
    req.body.publicityLevel = 'restricted'; // require review before public
  }

  const created = db.createRecord(moduleType, req.body, req.user);
  res.status(201).json({ success: true, data: created });
});

apiRouter.put('/modules/:moduleType/:id', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  const id = req.params.id;

  // Check edit rights
  const current = db.getRecordById(moduleType, id);
  if (!current) {
    res.status(404).json({ success: false, message: 'Bản ghi không tồn tại.' });
    return;
  }

  // Public users cannot edit directly verified/approved records
  if (req.user.role === 'public_user') {
    res.status(403).json({ success: false, message: 'Người dùng công khai không có quyền sửa đổi bản ghi trực tiếp.' });
    return;
  }

  const updated = db.updateRecord(moduleType, id, req.body, req.user);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/modules/:moduleType/:id', requirePermission('canDelete'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  const id = req.params.id;

  const success = db.deleteRecord(moduleType, id, req.user);
  if (!success) {
    res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi để xóa.' });
    return;
  }
  res.json({ success: true, message: 'Đã xóa bản ghi an toàn.' });
});

// 6. Workflow Transition
apiRouter.post('/modules/:moduleType/:id/workflow', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  const id = req.params.id;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ success: false, message: 'Thiếu trạng thái chuyển giao.' });
    return;
  }

  // Only authorized roles can approve or reject
  if (status === 'approved' || status === 'rejected') {
    if (!['super_admin', 'system_admin', 'agency_leader'].includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Chỉ Lãnh đạo cơ quan hoặc Quản trị viên mới có quyền Phê duyệt/Từ chối.' });
      return;
    }
  }

  const transitioned = db.transitionWorkflow(moduleType, id, status as ApprovalStatus, note || '', req.user);
  if (!transitioned) {
    res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi.' });
    return;
  }

  res.json({ success: true, data: transitioned });
});

// 7. Multi-dimensional Relationships
apiRouter.get('/relationships', (req: AuthenticatedRequest, res: Response) => {
  const entityId = req.query.entityId as string;
  if (entityId) {
    res.json({ success: true, data: db.getEntityRelationships(entityId) });
  } else {
    res.json({ success: true, data: db.getAllRelationships() });
  }
});

apiRouter.post('/relationships', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    res.status(403).json({ success: false, message: 'Không có quyền tạo liên kết dữ liệu.' });
    return;
  }
  const rel = db.createRelationship(req.body, req.user);
  res.status(201).json({ success: true, data: rel });
});

apiRouter.delete('/relationships/:id', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    res.status(403).json({ success: false, message: 'Không có quyền xóa liên kết.' });
    return;
  }
  const success = db.deleteRelationship(req.params.id, req.user);
  res.json({ success });
});

// 8. Import & Export
apiRouter.post('/import/:moduleType', requirePermission('canImportExport'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'Dữ liệu tệp không hợp lệ hoặc rỗng.' });
    return;
  }

  const result = db.batchImport(moduleType, items, req.user);
  res.json({ success: true, result });
});

apiRouter.get('/export/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  const isPublicOnly = req.user?.role === 'public_user';
  const records = db.getModuleRecords(moduleType, isPublicOnly);

  if (records.length === 0) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleType}_export.csv"`);
    res.send('\uFEFFMã,Tiêu đề,Lĩnh vực,Chủ sở hữu,Trạng thái\n');
    return;
  }

  // Generate CSV columns
  const keys = ['code', 'title', 'field', 'ownerName', 'status', 'verificationStatus', 'createdAt'];
  const headers = ['Mã bản ghi', 'Tiêu đề / Tên', 'Lĩnh vực', 'Đơn vị / Cá nhân', 'Trạng thái', 'Xác minh', 'Ngày tạo'];

  const rows = records.map(r => {
    return keys.map(k => {
      const val = r[k] ?? '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'export',
      targetModule: moduleType,
      details: `Xuất tệp CSV dữ liệu phân hệ ${moduleType} (${records.length} bản ghi)`
    });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${moduleType}_export_${Date.now()}.csv"`);
  res.send(csvContent);
});

// 9. Audit Logs
apiRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const limit = Number(req.query.limit) || 100;
  res.json({ success: true, logs: db.getAuditLogs(limit) });
});

// 10. Collaboration Connection Requests
apiRouter.get('/connections', (req: AuthenticatedRequest, res: Response) => {
  const needId = req.query.needId as string;
  res.json({ success: true, data: db.getConnectionMessages(needId) });
});

apiRouter.post('/connections', (req: AuthenticatedRequest, res: Response): void => {
  const { needId, senderName, senderEmail, senderPhone, senderOrg, message, proposedCapability } = req.body;
  if (!needId || !senderName || !senderEmail || !message) {
    res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin người liên hệ và nội dung đề xuất.' });
    return;
  }

  const created = db.createConnectionMessage(
    { needId, senderName, senderEmail, senderPhone: senderPhone || '', senderOrg: senderOrg || '', message, proposedCapability: proposedCapability || '' },
    req.user
  );
  res.status(201).json({ success: true, data: created });
});

apiRouter.patch('/connections/:id', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    res.status(403).json({ success: false, message: 'Bạn không có quyền xử lý yêu cầu kết nối.' });
    return;
  }
  const { status } = req.body;
  const success = db.updateConnectionStatus(req.params.id, status, req.user);
  res.json({ success });
});

// 11. Backup & Restore
apiRouter.get('/backup', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  const snapshot = db.backupSnapshot();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="portal_database_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(snapshot, null, 2));
});

apiRouter.post('/restore', requireRole(['super_admin']), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  try {
    db.restoreSnapshot(req.body, req.user);
    res.json({ success: true, message: 'Phục hồi cơ sở dữ liệu thành công.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi phục hồi bản sao lưu.' });
  }
});

// 12. Automated Acceptance Test Suite (All 16 Scenarios)
apiRouter.post('/test-suite/run', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const testResults = db.runAcceptanceTestSuite(req.user);
  res.json({ success: true, data: testResults });
});
