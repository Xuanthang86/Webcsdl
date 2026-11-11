import crypto from 'crypto';
import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { authMiddleware, requirePermission, requireRole, createSessionToken, revokeToken } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { ModuleType, ApprovalStatus, UserRole, User } from '../types.ts';

export const apiRouter = Router();

apiRouter.use(authMiddleware);

// Whitelisted modules
const VALID_MODULES = new Set<string>([
  'science_tasks',
  'initiatives',
  'experts',
  'startups',
  'support_organizations',
  'startup_projects',
  'startup_ideas',
  'wards',
  'universities',
  'featured_startups',
  'organizations',
  'investors',
  'investment_funds',
  'technologies',
  'programs',
  'collaboration_needs',
  'patents',
  'publications',
  'lab_equipments',
  'policies'
]);

// Text sanitization helper to neutralize stored XSS / script injections
function sanitizeString(input: any): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      clean[k] = sanitizeString(v);
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeObject(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

// 1. Authentication & Role Switcher
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user ? db.sanitizeUser(req.user) : undefined,
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

// Role Switcher: RESTRICTED to authenticated administrators only to prevent privilege escalation
apiRouter.post('/auth/switch-role', (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ success: false, message: 'Thiếu thông tin vai trò.' });
    return;
  }

  // Prevent unauthorized self-elevation by guests or unauthenticated users
  if (!req.user || !['super_admin', 'system_admin'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Chỉ Quản trị viên hệ thống mới có quyền chuyển đổi góc nhìn vai trò để kiểm thử. Vui lòng đăng nhập với tài khoản hợp lệ.'
    });
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

  const sessionToken = createSessionToken(targetUser);
  res.cookie('portal_session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  db.addAuditLog({
    userId: targetUser.id,
    userName: targetUser.fullName,
    userRole: targetUser.role,
    action: 'login',
    details: `Quản trị viên chuyển phiên làm việc sang vai trò [${targetUser.role}]`
  });

  res.json({ success: true, token: sessionToken, user: db.sanitizeUser(targetUser) });
});

apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response): void => {
  const { username, password } = req.body;
  if (!username) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
    return;
  }

  const trimmed = username.trim().toLowerCase();
  const existingUser = db.getUsers().find(u => 
    u.username.toLowerCase() === trimmed || 
    (u.email && u.email.toLowerCase() === trimmed)
  );

  if (existingUser && existingUser.isActive === false) {
    res.status(403).json({
      success: false,
      message: 'Tài khoản của bạn đang ở trạng thái Chờ duyệt. Vui lòng liên hệ Quản trị viên để được kiểm tra và kích hoạt tài khoản.'
    });
    return;
  }

  try {
    const user = db.authenticateUser(username, password);
    if (!user) {
      res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác hoặc tài khoản đã bị khóa.' });
      return;
    }

    const sessionToken = createSessionToken(user);
    res.cookie('portal_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'login',
      details: `Đăng nhập hệ thống thành công với tài khoản [${user.username}] (${user.role})`
    });

    res.json({ success: true, token: sessionToken, user: db.sanitizeUser(user) });
  } catch (err: any) {
    res.status(429).json({ success: false, message: err.message || 'Lỗi đăng nhập hệ thống' });
  }
});

// Self-registration endpoint - sets isActive: false requiring Admin approval
apiRouter.post('/auth/register', (req: AuthenticatedRequest, res: Response): void => {
  const { username, password, fullName, email, role, phone, organization } = req.body;
  const rawUsername = (username || '').toString().trim();
  const rawPassword = (password || '').toString();

  if (!rawUsername || !rawPassword) {
    res.status(400).json({ success: false, message: 'Vui lòng điền tên đăng nhập và mật khẩu.' });
    return;
  }
  if (rawPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    return;
  }

  const existing = db.getUsers().find(u => 
    u.username.toLowerCase() === rawUsername.toLowerCase() || 
    (email && u.email?.toLowerCase() === email.toString().trim().toLowerCase())
  );
  if (existing) {
    res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc email này đã tồn tại trên hệ thống.' });
    return;
  }

  try {
    const newUser = db.createUser({
      username: rawUsername,
      password: rawPassword,
      fullName: (fullName || rawUsername).toString().trim(),
      email: (email || `${rawUsername}@danang.gov.vn`).toString().trim(),
      role: (role || 'public_user') as UserRole,
      phone: (phone || '').toString().trim(),
      organization: (organization || '').toString().trim(),
      isActive: false // Self-registered accounts require Admin approval before login!
    });

    db.addAuditLog({
      userId: newUser.id,
      userName: newUser.fullName,
      userRole: newUser.role,
      action: 'create',
      details: `Đăng ký tài khoản tự do mới [${newUser.username}] - Trạng thái Chờ Quản trị viên xét duyệt.`
    });

    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Đăng ký tài khoản thành công! Tài khoản của bạn đang ở trạng thái Chờ duyệt. Quản trị viên hệ thống sẽ kiểm tra và kích hoạt tài khoản trước khi bạn có thể đăng nhập.',
      user: db.sanitizeUser(newUser)
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi đăng ký tài khoản' });
  }
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response): void => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeToken(authHeader.substring(7).trim());
  }
  if (req.cookies && req.cookies['portal_session']) {
    revokeToken(req.cookies['portal_session']);
  }
  if (req.headers['x-session-token']) {
    revokeToken(req.headers['x-session-token'] as string);
  }
  res.clearCookie('portal_session');
  res.clearCookie('user_role');
  res.clearCookie('user_id');
  res.json({ success: true, message: 'Đã đăng xuất và vô hiệu hóa phiên làm việc an toàn.' });
});

apiRouter.post('/auth/change-password', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước khi đổi mật khẩu.' });
    return;
  }
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    return;
  }
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.' });
    return;
  }

  // Verify current password strictly - Section VII.5
  if (!currentPassword) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại.' });
    return;
  }
  const authCheck = db.authenticateUser(req.user.username, currentPassword);
  if (!authCheck) {
    res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    return;
  }

  try {
    const updated = db.updateUser(req.user.id, { password: newPassword }, req.user);
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'update',
      details: `Người dùng [${req.user.username}] tự đổi mật khẩu tài khoản thành công.`
    });
    res.json({ success: true, message: 'Đổi mật khẩu thành công.', user: db.sanitizeUser(updated) });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi đổi mật khẩu' });
  }
});

apiRouter.put('/auth/profile', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước khi cập nhật thông tin cá nhân.' });
    return;
  }
  const { phone, organization } = req.body;
  try {
    const updates: Partial<User> = {};
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (organization !== undefined) updates.organization = String(organization).trim();

    const updated = db.updateUser(req.user.id, updates, req.user);
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'update',
      details: `Người dùng [${req.user.username}] cập nhật thông tin tài khoản: SĐT: ${updates.phone || 'giữ nguyên'}, Cơ quan: ${updates.organization || 'giữ nguyên'}`
    });
    res.json({ success: true, message: 'Cập nhật thông tin tài khoản thành công.', user: db.sanitizeUser(updated) });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi cập nhật thông tin' });
  }
});

apiRouter.get('/auth/users', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, users: db.getUsers().map(u => db.sanitizeUser(u)) });
});

// User Management (Admin & RBAC)
apiRouter.get('/users', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, users: db.getUsers().map(u => db.sanitizeUser(u)) });
});

apiRouter.post('/users', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const newUser = db.createUser(req.body, req.user);
    res.status(201).json({ success: true, user: db.sanitizeUser(newUser) });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Lỗi tạo tài khoản' });
  }
});

apiRouter.put('/users/:id', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const updatedUser = db.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true, user: db.sanitizeUser(updatedUser) });
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
  const cleanBody = sanitizeObject(req.body);
  const updated = db.updateSystemConfig(cleanBody, req.user);
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
  const year = req.query.year as string | undefined;
  const stats = db.getAggregatedStats(year);
  res.json({ success: true, stats });
});

// 4. Global Search
// Only privileged reviewers or users explicitly granted the module may see full expert contact details.
const canViewExpertContacts = (user: AuthenticatedRequest['user']): boolean => Boolean(
  user && (
    ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'].includes(user.role) ||
    Boolean(user.managedModules?.includes('experts'))
  )
);

const protectExpertContactFields = (record: any, canViewFullContact: boolean): any => {
  if (canViewFullContact || !record || typeof record !== 'object') return record;
  const protectedRecord = { ...record };
  const phoneKeyPattern = /(phone|mobile|telephone|^tel$|sdt|so.?dien.?thoai|dien.?thoai)/i;
  for (const key of Object.keys(protectedRecord)) {
    if (!phoneKeyPattern.test(key)) continue;
    const value = protectedRecord[key];
    if (value === null || value === undefined || String(value).trim() === '') continue;
    const phoneText = String(value).trim();
    // Avoid re-masking values that have already been safely masked.
    if (/^\d{4}\.x{3}\.x{3}$/i.test(phoneText)) continue;
    const digits = phoneText.replace(/\D/g, '');
    protectedRecord[key] = digits.length >= 9 ? \`${digits.slice(0, 4)}.xxx.xxx\` : 'Chưa cập nhật';
  }
  return protectedRecord;
};

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

  const safeResults = results.map(record =>
    record.moduleType === 'experts'
      ? protectExpertContactFields(record, canViewExpertContacts(req.user))
      : record
  );

  res.json({
    success: true,
    total: safeResults.length,
    results: safeResults
  });
});

// 5. Module CRUD Operations
apiRouter.get('/modules/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }
  const isPublicOnly = req.query.publicOnly === 'true' || req.user?.role === 'public_user';
  const records = [...db.getModuleRecords(moduleType, isPublicOnly)];

  // Sorting: specialized for Wards (Phường -> Xã -> Đặc khu) and Universities (Đại học -> Cao đẳng) per Section VI
  if (moduleType === 'wards') {
    records.sort((a, b) => {
      const getRank = (t: string = '') => {
        if (/^phường/i.test(t)) return 1;
        if (/^xã/i.test(t)) return 2;
        if (/^đặc khu/i.test(t)) return 3;
        return 4;
      };
      const rankA = getRank(a.title);
      const rankB = getRank(b.title);
      if (rankA !== rankB) return rankA - rankB;
      return (a.title || '').localeCompare(b.title || '', 'vi');
    });
  } else if (moduleType === 'universities') {
    records.sort((a, b) => {
      const getRank = (t: string = '') => {
        if (/đại học|\bđh\b/i.test(t)) return 1;
        if (/cao đẳng|\bcđ\b/i.test(t)) return 2;
        return 3;
      };
      const rankA = getRank(a.title);
      const rankB = getRank(b.title);
      if (rankA !== rankB) return rankA - rankB;
      return (a.title || '').localeCompare(b.title || '', 'vi');
    });
  } else {
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    records.sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (valA < valB) return -order;
      if (valA > valB) return order;
      return 0;
    });
  }

  const total = records.length;
  const requestedLimit = Number(req.query.limit);
  const requestedOffset = Number(req.query.offset);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(Math.floor(requestedLimit), 5000)
    : total;
  const offset = Number.isFinite(requestedOffset) && requestedOffset > 0
    ? Math.floor(requestedOffset)
    : 0;
  const page = records.slice(offset, offset + limit);
  const data = moduleType === 'experts'
    ? page.map(record => protectExpertContactFields(record, canViewExpertContacts(req.user)))
    : page;

  res.json({
    success: true,
    moduleType,
    total,
    data
  });
});

apiRouter.get('/modules/:moduleType/:id', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }
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

  const safeRecord = moduleType === 'experts'
    ? protectExpertContactFields(record, canViewExpertContacts(req.user))
    : record;

  res.json({
    success: true,
    data: safeRecord,
    relationships
  });
});

apiRouter.post('/modules/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }

  // Enforce Section VII.1 RBAC module restriction
  if (req.user.role !== 'super_admin' && req.user.role !== 'system_admin' && req.user.role !== 'public_user') {
    if (req.user.managedModules && req.user.managedModules.length > 0 && !req.user.managedModules.includes(moduleType)) {
      res.status(403).json({ success: false, message: 'Tài khoản không được phân quyền quản lý phân hệ này.' });
      return;
    }
  }

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

  const cleanPayload = sanitizeObject(req.body);
  const created = db.createRecord(moduleType, cleanPayload, req.user);
  res.status(201).json({ success: true, data: created });
});

apiRouter.put('/modules/:moduleType/:id', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }

  // Enforce Section VII.1 RBAC module restriction
  if (req.user.role !== 'super_admin' && req.user.role !== 'system_admin' && req.user.role !== 'public_user') {
    if (req.user.managedModules && req.user.managedModules.length > 0 && !req.user.managedModules.includes(moduleType)) {
      res.status(403).json({ success: false, message: 'Tài khoản không được phân quyền quản lý phân hệ này.' });
      return;
    }
  }

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

  const cleanPayload = sanitizeObject(req.body);
  const updated = db.updateRecord(moduleType, id, cleanPayload, req.user);
  res.json({ success: true, data: updated });
});

apiRouter.delete('/modules/:moduleType/:id', requirePermission('canDelete'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }

  // Enforce Section VII.1 RBAC module restriction
  if (req.user.role !== 'super_admin' && req.user.role !== 'system_admin') {
    if (req.user.managedModules && req.user.managedModules.length > 0 && !req.user.managedModules.includes(moduleType)) {
      res.status(403).json({ success: false, message: 'Tài khoản không được phân quyền quản lý phân hệ này.' });
      return;
    }
  }

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
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }
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

  const cleanNote = sanitizeString(note || '');
  const transitioned = db.transitionWorkflow(moduleType, id, status as ApprovalStatus, cleanNote, req.user);
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
  const cleanBody = sanitizeObject(req.body);
  const rel = db.createRelationship(cleanBody, req.user);
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
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }

  // Enforce Section VII.1 RBAC module restriction on import
  if (req.user.role !== 'super_admin' && req.user.role !== 'system_admin') {
    if (req.user.managedModules && req.user.managedModules.length > 0 && !req.user.managedModules.includes(moduleType)) {
      res.status(403).json({ success: false, message: 'Tài khoản không được phân quyền nhập dữ liệu cho phân hệ này.' });
      return;
    }
  }

  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'Dữ liệu tệp không hợp lệ hoặc rỗng.' });
    return;
  }

  const cleanItems = items.map(sanitizeObject);
  const result = db.batchImport(moduleType, cleanItems, req.user);
  res.json({ success: true, result });
});

apiRouter.get('/export/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  if (!VALID_MODULES.has(moduleType)) {
    res.status(400).json({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' });
    return;
  }
  const isPublicOnly = req.user?.role === 'public_user';
  const records = db.getModuleRecords(moduleType, isPublicOnly);

  if (records.length === 0) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleType}_export.csv"`);
    res.send('\uFEFFMã,Tiêu đề,Lĩnh vực,Chủ sở hữu,Trạng thái\n');
    return;
  }

  // Generate module-specific CSV columns matching official standards
  let keys: string[] = ['code', 'title', 'field', 'ownerName', 'status', 'verificationStatus', 'createdAt'];
  let headers: string[] = ['Mã bản ghi', 'Tiêu đề / Tên', 'Lĩnh vực', 'Đơn vị / Cá nhân', 'Trạng thái', 'Xác minh', 'Ngày tạo'];

  if (moduleType === 'science_tasks') {
    keys = ['stt', 'title', 'managementLevel', 'leadOrganization', 'principalInvestigator', 'executionTime', 'field', 'description'];
    headers = ['STT', 'Tên đề tài', 'Cấp quản lý', 'Cơ quan chủ trì', 'Chủ nhiệm đề tài', 'Thời gian thực hiện', 'Lĩnh vực', 'Tóm tắt đề tài'];
  } else if (moduleType === 'initiatives') {
    keys = ['stt', 'recognitionYear', 'title', 'authors', 'ownerName', 'ownerAddress', 'field'];
    headers = ['STT', 'Năm công nhận', 'Tên sáng kiến', 'Tác giả', 'Chủ sở hữu', 'Địa chỉ chủ sở hữu', 'Lĩnh vực'];
  } else if (moduleType === 'experts') {
    keys = ['stt', 'title', 'birthYear', 'specialty'];
    headers = ['STT', 'Tên Chuyên gia', 'Năm sinh', 'Chuyên ngành'];
  } else if (moduleType === 'startups') {
    keys = ['stt', 'title', 'address', 'website', 'logoUrl', 'field', 'description', 'problemSolved', 'founderCount', 'currentStaffCount', 'leaderName', 'leaderPhone', 'leaderEmail', 'foundedYear'];
    headers = ['STT', 'Tên doanh nghiệp', 'Địa chỉ hoạt động', 'Website doanh nghiệp (nếu có)', 'File logo doanh nghiệp', 'Lĩnh vực kinh doanh', 'Tóm tắt về doanh nghiệp và sản phẩm', 'Sản phẩm giải quyết vấn đề gì', 'Số lượng sáng lập viên', 'Tổng số nhân sự ở thời điểm hiện tại', 'Họ và tên người đứng đầu doanh nghiệp', 'Số điện thoại người đứng đầu doanh nghiệp', 'Email người đứng đầu doanh nghiệp', 'Năm bắt đầu khởi nghiệp'];
  } else if (moduleType === 'support_organizations') {
    keys = ['stt', 'title', 'address', 'description'];
    headers = ['STT', 'Tên tổ chức', 'Địa chỉ', 'Thông tin về tổ chức'];
  } else if (moduleType === 'startup_projects') {
    keys = ['stt', 'title', 'field', 'problemSolved', 'leaderName', 'incubator', 'startYear'];
    headers = ['STT', 'Tên dự án', 'Lĩnh vực khởi nghiệp', 'Sản phẩm giải quyết vấn đề', 'Người đứng đầu', 'Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án)', 'Năm bắt đầu khởi nghiệp'];
  } else if (moduleType === 'startup_ideas') {
    keys = ['stt', 'title', 'field', 'leaderName', 'mentorTeacher'];
    headers = ['STT', 'Tên ý tưởng', 'Lĩnh vực khởi nghiệp', 'Người đứng đầu', 'Giáo viên hướng dẫn'];
  } else if (moduleType === 'wards') {
    keys = ['stt', 'title', 'address', 'contactInfo', 'website'];
    headers = ['STT', 'Tên xã/phường/đặc khu', 'Địa chỉ', 'Thông tin liên hệ', 'Website'];
  } else if (moduleType === 'universities') {
    keys = ['stt', 'title', 'ward', 'address', 'contactInfo', 'website'];
    headers = ['STT', 'Tên trường', 'Thuộc xã/ phường', 'Địa chỉ', 'Thông tin liên hệ', 'Website'];
  } else if (moduleType === 'featured_startups') {
    keys = ['stt', 'businessName', 'projectName', 'representative', 'address', 'contactInfo', 'website', 'ward'];
    headers = ['STT', 'Tên doanh nghiệp', 'Tên dự án', 'Người đại diện dự án', 'Địa chỉ', 'Thông tin liên hệ', 'Website', 'Thuộc xã/ phường'];
  }

  const rows = records.map((r, idx) => {
    return keys.map(k => {
      let val: any;
      if (k === 'stt') {
        val = idx + 1;
      } else {
        val = r[k] ?? '';
        if (Array.isArray(val)) val = val.join(', ');
      }
      let str = String(val);
      // Neutralize CSV Formula Injection (DDE attack prevention for spreadsheet apps)
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      str = str.replace(/"/g, '""');
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

apiRouter.get('/templates/:moduleType', (req: AuthenticatedRequest, res: Response): void => {
  const moduleType = req.params.moduleType as ModuleType;
  let headers: string[] = ['STT', 'Tiêu đề / Tên', 'Lĩnh vực', 'Đơn vị / Cá nhân'];
  let sampleRow: string[] = ['1', 'Dữ liệu mẫu chuẩn hoá', 'Công nghệ thông tin', 'Sở Khoa học và Công nghệ'];

  if (moduleType === 'science_tasks') {
    headers = [
      'STT',
      'Tên đề tài',
      'Cấp quản lý',
      'Cơ quan chủ trì',
      'Chủ nhiệm đề tài',
      'Thành viên tham gia',
      'Thời gian thực hiện',
      'Lĩnh vực',
      'Tóm tắt đề tài',
      'Tài liệu minh chứng',
      'Ký hiệu Kho'
    ];
    sampleRow = [
      '1',
      'Nghiên cứu ứng dụng công nghệ AI trong cảnh báo sạt lở ven sông',
      'Cấp Thành phố',
      'Đại học Bách Khoa - ĐH Đà Nẵng',
      'PGS.TS. Lê Quang Dũng',
      'TS. Nguyễn Văn A, ThS. Trần Thị B',
      '24 tháng',
      'Công nghệ thông tin',
      'Ứng dụng học sâu và cảm biến địa chấn không dây để phát hiện nguy cơ sạt lở ven sông và ngập lụt đô thị',
      'Quyết định số 142/QĐ-SKHCN',
      'KHO-KHCN-ĐN-2024/089'
    ];
  } else if (moduleType === 'initiatives') {
    headers = ['STT', 'Năm công nhận', 'Tên sáng kiến', 'Tác giả', 'Chủ sở hữu', 'Địa chỉ chủ sở hữu', 'Lĩnh vực'];
    sampleRow = ['1', '2026', 'Mô hình tiết kiệm năng lượng tòa nhà thông minh', 'Nguyễn Thị B, Trần C', 'Trung tâm Đổi mới sáng tạo', 'Quận Hải Châu, TP. Đà Nẵng', 'Năng lượng & Môi trường'];
  } else if (moduleType === 'experts') {
    headers = ['STT', 'Tên Chuyên gia', 'Năm sinh', 'Chuyên ngành'];
    sampleRow = ['1', 'GS.TS. Trần Quốc Hùng', '1975', 'Trí tuệ nhân tạo & Robot'];
  } else if (moduleType === 'startups') {
    headers = ['STT', 'Tên doanh nghiệp', 'Địa chỉ hoạt động', 'Website doanh nghiệp (nếu có)', 'File logo doanh nghiệp', 'Lĩnh vực kinh doanh', 'Tóm tắt về doanh nghiệp và sản phẩm', 'Sản phẩm giải quyết vấn đề gì', 'Số lượng sáng lập viên', 'Tổng số nhân sự ở thời điểm hiện tại', 'Họ và tên người đứng đầu doanh nghiệp', 'Số điện thoại người đứng đầu doanh nghiệp', 'Email người đứng đầu doanh nghiệp', 'Năm bắt đầu khởi nghiệp'];
    sampleRow = ['1', 'Công ty CP Giải pháp Công nghệ Xanh', 'Số 123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 'https://greentech.vn', '/logos/greentech.png', 'Công nghệ Môi trường', 'Cung cấp hệ thống quan trắc nước thải tự động', 'Tự động hóa phân tích nồng độ chất thải theo thời gian thực', '3', '25', 'Lê Hoàng Nam', '0905123456', 'contact@greentech.vn', '2023'];
  } else if (moduleType === 'support_organizations') {
    headers = ['STT', 'Tên tổ chức', 'Địa chỉ', 'Thông tin về tổ chức'];
    sampleRow = ['1', 'Trung tâm Hỗ trợ Khởi nghiệp Đổi mới sáng tạo Đà Nẵng', 'Số 48 Phan Đình Phùng, Hải Châu, Đà Nẵng', 'Đơn vị sự nghiệp công lập hỗ trợ ươm tạo, kết nối vốn và đào tạo khởi nghiệp'];
  } else if (moduleType === 'startup_projects') {
    headers = ['STT', 'Tên dự án', 'Lĩnh vực khởi nghiệp', 'Sản phẩm giải quyết vấn đề', 'Người đứng đầu', 'Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án)', 'Năm bắt đầu khởi nghiệp'];
    sampleRow = ['1', 'Hệ thống trạm sạc xe điện thông minh SmartCharge', 'Năng lượng xanh & Giao thông', 'Mạng lưới sạc nhanh tích hợp thanh toán tự động qua App', 'Phạm Minh Tuấn', 'Vườn ươm Doanh nghiệp Đà Nẵng (DNES)', '2024'];
  } else if (moduleType === 'startup_ideas') {
    headers = ['STT', 'Tên ý tưởng', 'Lĩnh vực khởi nghiệp', 'Người đứng đầu', 'Giáo viên hướng dẫn'];
    sampleRow = ['1', 'Ứng dụng vi tảo hấp thụ CO2 và xử lý khí thải công nghiệp', 'Công nghệ sinh học & Môi trường', 'Trần Thị Thu Hà', 'TS. Nguyễn Đắc Lực'];
  } else if (moduleType === 'wards') {
    headers = ['STT', 'Tên xã/phường/đặc khu', 'Địa chỉ', 'Thông tin liên hệ', 'Website'];
    sampleRow = ['1', 'Phường Thạch Thang', 'Số 12 Quang Trung, Quận Hải Châu, TP. Đà Nẵng', '0236.3822123', 'https://thachthang.danang.gov.vn'];
  } else if (moduleType === 'universities') {
    headers = ['STT', 'Tên trường', 'Thuộc xã/ phường', 'Địa chỉ', 'Thông tin liên hệ', 'Website'];
    sampleRow = ['1', 'Trường Đại học Bách Khoa - Đại học Đà Nẵng', 'Phường Hòa Khánh Bắc', 'Số 54 Nguyễn Lương Bằng, Quận Liên Chiểu, TP. Đà Nẵng', '0236.3842308', 'https://dut.udn.vn'];
  } else if (moduleType === 'featured_startups') {
    headers = ['STT', 'Tên doanh nghiệp', 'Tên dự án', 'Người đại diện dự án', 'Địa chỉ', 'Thông tin liên hệ', 'Website', 'Thuộc xã/ phường'];
    sampleRow = ['1', 'Công ty CP EM&AI', 'Nền tảng Voicebot AI trợ lý ảo thông minh', 'Lê Ngọc Trí', 'Tầng 5, Tòa nhà DNC, Hải Châu, Đà Nẵng', '0912345678', 'https://emandai.net', 'Phường Thạch Thang'];
  }

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    sampleRow.map(v => `"${v.replace(/"/g, '""')}"`).join(',')
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Mau_nhap_lieu_${moduleType}.csv"`);
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
    {
      needId: sanitizeString(needId),
      senderName: sanitizeString(senderName),
      senderEmail: sanitizeString(senderEmail),
      senderPhone: sanitizeString(senderPhone || ''),
      senderOrg: sanitizeString(senderOrg || ''),
      message: sanitizeString(message),
      proposedCapability: sanitizeString(proposedCapability || '')
    },
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

// 12. Automated Acceptance Test Suite (All 18 Scenarios)
apiRouter.post('/test-suite/run', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    return;
  }
  const testResults = db.runAcceptanceTestSuite(req.user);
  res.json({ success: true, data: testResults });
});

// 13. Cloudflare D1 SQL Export & Reconciliation
apiRouter.get('/d1/export-sql', requireRole(['super_admin', 'system_admin', 'agency_leader']), (req: AuthenticatedRequest, res: Response): void => {
  const sqlDump = db.generateD1SqlDump();
  if (req.query.download === '1') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="danang_sokhcn_d1_${Date.now()}.sql"`);
    res.send(sqlDump);
  } else {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(sqlDump);
  }
});

apiRouter.get('/d1/reconcile', requireRole(['super_admin', 'system_admin']), (req: AuthenticatedRequest, res: Response): void => {
  const report = db.reconcileD1Data();
  res.json({ success: true, data: report });
});

// 14. ImageKit CDN Integration & Attachment Management
apiRouter.get('/imagekit/auth', requireRole(['super_admin', 'system_admin', 'agency_leader', 'data_officer']), (req: AuthenticatedRequest, res: Response): void => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';
  if (!privateKey || !publicKey || !urlEndpoint) {
    res.status(503).json({ success: false, message: 'ImageKit chưa được cấu hình đầy đủ trên máy chủ.' });
    return;
  }
  let endpoint: URL;
  try {
    endpoint = new URL(urlEndpoint);
    if (endpoint.protocol !== 'https:') throw new Error('HTTPS is required');
  } catch {
    res.status(503).json({ success: false, message: 'Địa chỉ ImageKit không hợp lệ.' });
    return;
  }
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400; // 40 minutes valid
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

  res.setHeader('Cache-Control', 'no-store');
  res.json({ token, expire, signature, publicKey, urlEndpoint: endpoint.toString().replace(/\/$/, '') });
});

apiRouter.post('/imagekit/upload', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user || req.user.role === 'public_user') {
    // Permit public upload only if submission config allows
    const config = db.getSystemConfig();
    if (!config.enablePublicSubmissions) {
      res.status(403).json({ success: false, message: 'Hệ thống hiện không mở nhận tệp đính kèm công khai.' });
      return;
    }
  }

  const { fileName, fileSize, mimeType, cdnUrl, dataUrl, entityId, moduleType, title } = req.body;
  const cleanFileName = sanitizeString(fileName || '').slice(0, 255);
  const numericFileSize = Number(fileSize);
  const cleanMimeType = sanitizeString(mimeType || 'application/octet-stream').slice(0, 128);
  if (!cleanFileName || !moduleType || !VALID_MODULES.has(String(moduleType)) || !Number.isFinite(numericFileSize) || numericFileSize <= 0 || numericFileSize > 50 * 1024 * 1024) {
    res.status(400).json({ success: false, message: 'Tên tệp hoặc dung lượng tệp không hợp lệ (tối đa 50 MB).' });
    return;
  }
  if (/^(text\/html|application\/(?:javascript|x-javascript)|image\/svg\+xml)/i.test(cleanMimeType)) {
    res.status(415).json({ success: false, message: 'Định dạng tệp có nguy cơ thực thi nội dung không được chấp nhận.' });
    return;
  }
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/danangsokhcn';
  let finalCdnUrl = `${endpoint.replace(/\/$/, '')}/uploads/${Date.now()}_${encodeURIComponent(cleanFileName)}`;
  if (cdnUrl) {
    try {
      const parsed = new URL(String(cdnUrl));
      const allowed = new URL(endpoint);
      if (parsed.protocol !== 'https:' || parsed.hostname !== allowed.hostname || parsed.username || parsed.password) throw new Error('Invalid CDN origin');
      finalCdnUrl = parsed.toString();
    } catch {
      res.status(400).json({ success: false, message: 'Đường dẫn tệp phải thuộc CDN ImageKit đã cấu hình.' });
      return;
    }
  }
  const isImage = cleanMimeType.startsWith('image/');
  const thumbnailUrl = isImage ? `${finalCdnUrl}?tr=w-300,h-300,fo-auto` : undefined;

  const attachment = db.addAttachment({
    fileName: cleanFileName,
    fileSize: numericFileSize,
    mimeType: cleanMimeType,
    cdnUrl: finalCdnUrl,
    thumbnailUrl,
    entityId: entityId ? sanitizeString(String(entityId)).slice(0, 128) : undefined,
    moduleType: moduleType && VALID_MODULES.has(String(moduleType)) ? sanitizeString(String(moduleType)) : undefined,
    title: title ? sanitizeString(title) : sanitizeString(fileName)
  }, req.user);

  res.status(201).json({ success: true, data: attachment });
});

apiRouter.get('/attachments', (req: AuthenticatedRequest, res: Response): void => {
  const { entityId, moduleType } = req.query;
  const attachments = db.getAttachments({
    entityId: typeof entityId === 'string' ? entityId : undefined,
    moduleType: typeof moduleType === 'string' ? moduleType : undefined
  });
  res.json({ success: true, data: attachments });
});

apiRouter.delete('/attachments/:id', requireRole(['super_admin', 'system_admin', 'data_officer']), (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteAttachment(req.params.id, req.user);
  if (!success) {
    res.status(404).json({ success: false, message: 'Không tìm thấy tệp đính kèm để xoá.' });
    return;
  }
  res.json({ success: true, message: 'Đã xoá tệp đính kèm thành công.' });
});

