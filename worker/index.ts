/**
 * Cloudflare Worker Backend for Cổng Dữ Liệu KHCN & KNĐMST TP Đà Nẵng
 * Compatible with Cloudflare Workers runtime + D1 Database + Static Assets
 */

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results?: T[]; success: boolean }>;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<any>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
  SESSION_SECRET?: string;
  IMAGEKIT_PUBLIC_KEY?: string;
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
}

// Module whitelist
const ALLOWED_MODULES = [
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
  'patents',
  'organizations',
  'investors',
  'investment_funds',
  'technologies',
  'programs',
  'collaboration_needs',
  'publications',
  'lab_equipments',
  'policies'
];

// Helper: JSON response with CORS & standard headers
function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    }
  });
}

// Helper: Sign HMAC-SHA256 session token via Web Crypto API
async function signToken(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${btoa(payload)}.${b64Sig}`;
}

// Helper: Verify HMAC-SHA256 session token
async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, sigPart] = parts;
    const payloadStr = atob(b64Payload);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadStr));
    const expectedSigB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    if (sigPart !== expectedSigB64) return null;
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

// Parse cookie
function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const secret = env.SESSION_SECRET || 'danang-sokhcn-secure-worker-session-secret-2026';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Authenticate user from HttpOnly cookie or Authorization Bearer header
    let user: any = null;
    const cookieToken = getCookie(request, 'danang_session');
    const authHeader = request.headers.get('Authorization');
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (token) {
      user = await verifyToken(token, secret);
    }

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        runtime: 'cloudflare_workers',
        time: new Date().toISOString()
      });
    }

    // Config route
    if (url.pathname === '/api/config') {
      return jsonResponse({
        portalName: 'Cổng dữ liệu KHCN & KNĐMST TP Đà Nẵng',
        governingAgency: 'ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
        contactAddress: 'Trung tâm Đổi mới sáng tạo Đà Nẵng',
        cityArea: 'Thành phố Đà Nẵng',
        contactEmail: 'sokhcn@danang.gov.vn',
        contactPhone: '(0236) 3822 851',
        allowPublicSubmission: true,
        requireApproval: true
      });
    }

    // Roles route
    if (url.pathname === '/api/roles') {
      return jsonResponse({
        roles: [
          { role: 'super_admin', label: 'Quản trị viên Cấp cao (Super Admin)' },
          { role: 'system_admin', label: 'Quản trị Hệ thống (System Admin)' },
          { role: 'agency_leader', label: 'Lãnh đạo Cơ quan / Sở KH&CN' },
          { role: 'data_officer', label: 'Cán bộ Quản lý Dữ liệu' },
          { role: 'evaluator_expert', label: 'Chuyên gia Đánh giá / Hội đồng' },
          { role: 'partner_officer', label: 'Cán bộ Đối tác / Vườn ươm' },
          { role: 'org_representative', label: 'Đại diện Đơn vị / Doanh nghiệp' },
          { role: 'expert_user', label: 'Chuyên gia / Nhà khoa học' },
          { role: 'investor_user', label: 'Nhà đầu tư / Quỹ đầu tư' },
          { role: 'public_user', label: 'Người dùng Đại chúng / Công dân' }
        ]
      });
    }

    // Auth Me
    if (url.pathname === '/api/auth/me') {
      if (!user) {
        return jsonResponse({ success: false, user: null }, 401);
      }
      return jsonResponse({ success: true, user });
    }

    // ImageKit Auth endpoint
    if (url.pathname === '/api/imagekit/auth') {
      const tokenStr = crypto.randomUUID();
      const expire = Math.floor(Date.now() / 1000) + 2400; // 40 minutes
      const privateKey = env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key_danang';
      const signaturePayload = tokenStr + expire;
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(privateKey),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signaturePayload));
      const signature = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return jsonResponse({
        token: tokenStr,
        expire,
        signature,
        publicKey: env.IMAGEKIT_PUBLIC_KEY || 'public_danang_sokhcn',
        urlEndpoint: env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/danangsokhcn'
      });
    }

    // Modules API
    if (url.pathname.startsWith('/api/modules/')) {
      const moduleName = url.pathname.replace('/api/modules/', '').split('/')[0];
      if (!ALLOWED_MODULES.includes(moduleName)) {
        return jsonResponse({ success: false, message: 'Phân hệ không hợp lệ' }, 400);
      }

      // If D1 is bound, query D1; otherwise provide formatted empty / fallback response
      if (env.DB) {
        try {
          const limit = parseInt(url.searchParams.get('limit') || '50', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          const query = `SELECT * FROM ${moduleName} LIMIT ? OFFSET ?`;
          const results = await env.DB.prepare(query).bind(limit, offset).all();
          const countQuery = `SELECT COUNT(*) as total FROM ${moduleName}`;
          const countResult = await env.DB.prepare(countQuery).first<{ total: number }>();

          return jsonResponse({
            success: true,
            data: results.results || [],
            total: countResult?.total || 0,
            module: moduleName
          });
        } catch (dbErr: any) {
          return jsonResponse({
            success: false,
            message: 'Lỗi truy vấn cơ sở dữ liệu D1: ' + dbErr.message
          }, 500);
        }
      }

      return jsonResponse({
        success: true,
        data: [],
        total: 0,
        module: moduleName
      });
    }

    // Pass through to static assets (SPA)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
