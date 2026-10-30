import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole, ModuleType } from './types.ts';
import { db } from './db.ts';

if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET must be defined and at least 32 characters long in production environments.');
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'danang-sokhcn-portal-secure-secret-2026-v2';

// In-memory set for revoked tokens (e.g. on logout or password change)
const revokedTokenSignatures = new Set<string>();

export function revokeToken(token: string): void {
  if (!token || typeof token !== 'string') return;
  const parts = token.split('.');
  const sig = parts[1] || token;
  revokedTokenSignatures.add(sig);

  // Bound memory usage if many sessions are revoked
  if (revokedTokenSignatures.size > 20000) {
    const iter = revokedTokenSignatures.values();
    for (let i = 0; i < 5000; i++) {
      const item = iter.next().value;
      if (item) revokedTokenSignatures.delete(item);
    }
  }
}

export function isTokenRevoked(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  const sig = parts[1] || token;
  return revokedTokenSignatures.has(sig);
}

export interface SessionPayload {
  uid: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    uid: user.id,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days validity
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  if (isTokenRevoked(token)) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  
  // Constant time comparison to prevent timing attacks
  if (sig.length !== expectedSig.length) return null;
  const bufSig = Buffer.from(sig);
  const bufExpected = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(bufSig, bufExpected)) return null;

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload.uid || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

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
  let token: string | undefined;

  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Custom header
  if (!token && req.headers['x-session-token']) {
    token = req.headers['x-session-token'] as string;
  }

  // 3. Cryptographically signed cookie
  if (!token && req.cookies && req.cookies['portal_session']) {
    token = req.cookies['portal_session'];
  }

  let user: User | undefined;

  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      const foundUser = db.getUserById(payload.uid);
      if (foundUser && foundUser.isActive) {
        user = foundUser;
      }
    }
  }

  // Fallback default: public guest user
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
