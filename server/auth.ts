import { Request, Response, NextFunction } from 'express';
import { User, UserRole, ModuleType } from './types.ts';
import { db } from './db.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Role permission matrix
const ROLE_PERMISSIONS: Record<UserRole, {
  canManageConfig: boolean;
  canApprove: boolean;
  canCreateAnyModule: boolean;
  canEditAnyModule: boolean;
  canDelete: boolean;
  canImportExport: boolean;
  canViewInternal: boolean;
}> = {
  super_admin: {
    canManageConfig: true,
    canApprove: true,
    canCreateAnyModule: true,
    canEditAnyModule: true,
    canDelete: true,
    canImportExport: true,
    canViewInternal: true
  },
  system_admin: {
    canManageConfig: true,
    canApprove: true,
    canCreateAnyModule: true,
    canEditAnyModule: true,
    canDelete: true,
    canImportExport: true,
    canViewInternal: true
  },
  agency_leader: {
    canManageConfig: false,
    canApprove: true,
    canCreateAnyModule: true,
    canEditAnyModule: true,
    canDelete: false,
    canImportExport: true,
    canViewInternal: true
  },
  data_officer: {
    canManageConfig: false,
    canApprove: false, // can review and request revision
    canCreateAnyModule: true,
    canEditAnyModule: true,
    canDelete: false,
    canImportExport: true,
    canViewInternal: true
  },
  evaluator_expert: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: false,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: true
  },
  partner_officer: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: true,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: false
  },
  org_representative: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: false,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: false
  },
  expert_user: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: false,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: false
  },
  investor_user: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: false,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: false
  },
  public_user: {
    canManageConfig: false,
    canApprove: false,
    canCreateAnyModule: false,
    canEditAnyModule: false,
    canDelete: false,
    canImportExport: false,
    canViewInternal: false
  }
};

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check session cookie or header
  const roleHeader = (req.headers['x-user-role'] as string) || (req.cookies && req.cookies['user_role']);
  const userIdHeader = (req.headers['x-user-id'] as string) || (req.cookies && req.cookies['user_id']);

  let user: User | undefined;

  if (userIdHeader) {
    user = db.getUserById(userIdHeader);
  } else if (roleHeader) {
    const matched = db.getUsers().find(u => u.role === roleHeader);
    user = matched;
  }

  // Fallback default: public user
  if (!user) {
    user = db.getUserByUsername('guest') || {
      id: 'usr_guest',
      username: 'guest',
      fullName: 'Khách vãng lai',
      email: 'public@thanhpho.gov.vn',
      role: 'public_user',
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này. Yêu cầu vai trò: ' + allowedRoles.join(', ')
      });
      return;
    }
    next();
  };
}

export function requirePermission(permission: keyof typeof ROLE_PERMISSIONS['super_admin']) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng.' });
      return;
    }
    const perms = ROLE_PERMISSIONS[req.user.role];
    if (!perms || !perms[permission]) {
      res.status(403).json({
        success: false,
        message: `Tài khoản với vai trò [${req.user.role}] không được cấp quyền [${permission}].`
      });
      return;
    }
    next();
  };
}
