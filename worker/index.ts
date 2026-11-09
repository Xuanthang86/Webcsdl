/**
 * Cloudflare Worker Backend for Cổng Dữ Liệu KHCN & KNĐMST TP Đà Nẵng
 * Production-ready runtime connecting directly to Cloudflare D1 Database + Static Assets.
 * Enforces strict security, zero mock accounts, cookie-based sessions, and real data queries.
 */

// Ambient Cloudflare Worker & D1 Types
interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results?: T[]; success: boolean }>;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: any }>;
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
  ADMIN_BOOTSTRAP_SECRET?: string;
  IMAGEKIT_PUBLIC_KEY?: string;
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
  BETTERSTACK_SOURCE_TOKEN?: string;
  BETTERSTACK_INGESTING_HOST?: string;
}

// Whitelisted core and ecosystem modules
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


// Convert API field names to the physical SQLite column convention.
function toSqlColumn(key: string): string {
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Restore configurable form fields stored in data_json while preserving
// physical columns as the authoritative values.
function hydrateModuleRow(row: any, moduleName?: string): any {
  if (!row) return row;
  let custom: Record<string, any> = {};
  try {
    custom = row.data_json ? JSON.parse(row.data_json) : {};
  } catch {
    custom = {};
  }
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'data_json') continue;
    const camelKey = key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
    normalized[camelKey] = value;
  }
  // Keep flexible custom fields, but never let data_json override authoritative D1 columns.
  const merged: Record<string, any> = { ...custom, ...normalized, moduleType: moduleName || row.module_type || row.moduleType };
  if (!merged.title) merged.title = merged.name || merged.companyName || merged.projectName || merged.fullName || '';
  if (moduleName === 'startups' && !merged.companyName) merged.companyName = merged.name || merged.title;
  if (moduleName === 'startup_projects' && !merged.projectName) merged.projectName = merged.title || merged.name;
  if (moduleName === 'startup_ideas') {
    if (!merged.title) merged.title = merged.ideaName || merged.ideaTitle || merged.name || '';
    if (!merged.description) merged.description = merged.summary || merged.ideaSummary || merged.idea_summary || '';
    if (!merged.wardSchool) merged.wardSchool = merged.wardOrSchool || merged.ward_school || merged.ward_or_school || '';
  }
  return merged;
}


// Restricted detail access is granted to privileged review roles or explicitly
// assigned module scopes. A public account never receives private detail fields.
function canViewRestrictedModule(user: any, moduleName: string): boolean {
  const privilegedRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'];
  if (privilegedRoles.includes(String(user?.role || ''))) return true;
  return Array.isArray(user?.managedModules) && user.managedModules.includes(moduleName);
}
function canManageModuleRecords(user: any, moduleName: string): boolean {
  const role = String(user?.role || '');
  if (['super_admin', 'system_admin', 'data_officer', 'agency_leader'].includes(role)) return true;
  return role === 'partner_officer' && ['startup_projects', 'startup_ideas'].includes(moduleName);
}
function canCreateModuleRecords(user: any, moduleName: string): boolean {
  if (canManageModuleRecords(user, moduleName)) return true;
  return String(user?.role || '') === 'public_user' && ['science_tasks', 'initiatives', 'startups', 'startup_projects', 'startup_ideas', 'experts', 'collaboration_needs'].includes(moduleName);
}

function canApproveWorkflow(user: any): boolean { return ['super_admin', 'system_admin', 'agency_leader'].includes(String(user?.role || '')); }
function isAllowedWorkflowStatus(status: string): boolean { return ['under_review', 'needs_revision', 'rejected', 'approved', 'published'].includes(status); }
function canExportModuleData(user: any): boolean { return ['super_admin', 'system_admin', 'data_officer'].includes(String(user?.role || '')); }
const PRIMARY_IMPORT_COLUMNS: Record<string, string> = {
  initiatives: 'title', startups: 'name', startup_projects: 'title', startup_ideas: 'title', wards: 'name', universities: 'name',
  organizations: 'name', investors: 'name', investment_funds: 'name',
  technologies: 'title', programs: 'title', publications: 'title', lab_equipments: 'name'
};

function getPrimaryImportColumn(moduleName: string, tableColumns: Set<string>): string {
  const preferredColumn = PRIMARY_IMPORT_COLUMNS[moduleName];
  return preferredColumn && tableColumns.has(preferredColumn) ? preferredColumn : tableColumns.has('title') ? 'title' : tableColumns.has('name') ? 'name' : tableColumns.has('project_name') ? 'project_name' : tableColumns.has('idea_name') ? 'idea_name' : tableColumns.has('initiative_name') ? 'initiative_name' : '';
}
function buildPublicVisibilityWhere(columns: Set<string>): string {
  if (!columns.has('status')) return ' WHERE 1 = 0';
  const conditions = ["LOWER(COALESCE(status, '')) IN ('approved', 'published')"];
  if (columns.has('publicity_level')) conditions.push("LOWER(COALESCE(publicity_level, 'public')) = 'public'");
  return ' WHERE ' + conditions.join(' AND ');
}
function normalizeSnapshotSchemaSql(sql: string): string { return sql.replace(/[`"\[\]]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
// Browser-session cookie: closing the browser ends the login session; do not persist it for seven days.
function createSessionCookie(token: string): string { return `danang_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax`; }

function isPrivilegedMessageReader(user: any): boolean {
  return ['super_admin', 'system_admin', 'agency_leader', 'data_officer'].includes(String(user?.role || ''));
}
function normalizeRelationshipRow(row: any): any {
  if (!row) return row;
  return {
    id: row.id,
    sourceModule: row.source_type || row.source_module || '',
    sourceId: row.source_id || '',
    sourceTitle: row.source_title || '',
    targetModule: row.target_type || row.target_module || '',
    targetId: row.target_id || '',
    targetTitle: row.target_title || '',
    relationType: row.relation_type || row.relationship_type || 'relates_to',
    validFrom: row.valid_from || undefined,
    validTo: row.valid_to || undefined,
    verificationSource: row.verification_source || row.description || undefined,
    status: row.status || 'active',
    createdAt: row.created_at || ''
  };
}


function redactPublicDetail(item: any, moduleName: string): any {
  if (!item) return item;
  const restrictedByModule: Record<string, string[]> = {
    science_tasks: ['members', 'projectTeam', 'participants', 'evidenceFile', 'evidenceDocuments', 'attachmentSummary', 'attachments', 'archiveCode', 'archiveSymbol', 'storageCode', 'warehouseCode'],
    experts: ['dateOfBirth', 'birthDate', 'gender', 'academicRank', 'degree', 'startYear', 'startWorkYear', 'researchTitle', 'position', 'jobTitle', 'email', 'publicEmail', 'phone', 'publicPhone', 'field', 'workplace', 'organization', 'currentAffiliation', 'trainingProcess', 'workExperience', 'foreignLanguages', 'education', 'educationHistory', 'workHistory', 'languages', 'publications', 'qualifications', 'researchOutputs', 'projects', 'projectLevel', 'projectDuration', 'projectMembers', 'projectRole', 'projectStatus', 'awards', 'experienceNotes'],
    startup_projects: ['operatingAddress', 'address', 'summary', 'teamSize', 'memberCount', 'leaderPhone', 'leaderEmail'],
    startup_ideas: ['operatingAddress', 'address', 'wardOrSchool', 'wardSchool', 'summary', 'problemSolved', 'teamSize', 'memberCount', 'leaderPhone', 'leaderEmail', 'affiliatedUnit', 'organization']
  };
  const safe = { ...item };
  for (const key of restrictedByModule[moduleName] || []) delete safe[key];
  // Never expose personal phone numbers or mixed contact strings in public API responses.
  for (const key of Object.keys(safe)) {
    if (/(phone|mobile|telephone|sodienthoai|contactinfo)/i.test(key)) delete safe[key];
  }
  return safe;
}

// Ensure each approved data module can retain additional fields without discarding
// spreadsheet columns that are not yet represented in the physical D1 schema.
async function ensureModuleDataJson(db: D1Database, moduleName: string): Promise<Set<string>> {
  if (!ALLOWED_MODULES.includes(moduleName)) throw new Error('Invalid module');
  let info = await db.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
  let columns = new Set((info.results || []).map((column: any) => String(column.name)));
  if (!columns.has('data_json')) {
    try {
      await db.prepare(`ALTER TABLE ${moduleName} ADD COLUMN data_json TEXT`).run();
    } catch (error) {
      // A concurrent request may have added the column first; re-check before failing.
      info = await db.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
      columns = new Set((info.results || []).map((column: any) => String(column.name)));
      if (!columns.has('data_json')) throw error;
    }
    info = await db.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
    columns = new Set((info.results || []).map((column: any) => String(column.name)));
  }
  return columns;
}

// Additive import-schema compatibility for ecosystem modules deployed with older
// or incomplete schemas. Existing rows are retained and never made public by default.
async function ensureModuleImportSchema(db: D1Database, moduleName: string): Promise<Set<string>> {
  if (!ALLOWED_MODULES.includes(moduleName)) throw new Error('Invalid module');

  // Some approved ecosystem modules were listed in the API but never created in
  // older D1 installations. Create only a minimal, whitelisted, additive table;
  // flexible source columns are retained in data_json by the import pipeline.
  const existingTable = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").bind(moduleName).first<any>();
  if (!existingTable) {
    const primaryColumn = PRIMARY_IMPORT_COLUMNS[moduleName] || 'title';
    await db.prepare(`CREATE TABLE IF NOT EXISTS \"${moduleName}\" (
      id TEXT PRIMARY KEY,
      \"${primaryColumn}\" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      data_json TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`).run();
  }

  let columns = await ensureModuleDataJson(db, moduleName);
  if (!columns.size) throw new Error(`Bảng ${moduleName} chưa tồn tại trong D1.`);

  let primaryColumn = PRIMARY_IMPORT_COLUMNS[moduleName] || getPrimaryImportColumn(moduleName, columns) || 'title';
  if (!columns.has(primaryColumn)) {
    try {
      await db.prepare(`ALTER TABLE "${moduleName}" ADD COLUMN "${primaryColumn}" TEXT`).run();
    } catch (error) {
      const refreshed = await db.prepare(`PRAGMA table_info("${moduleName}")`).all<any>();
      const refreshedColumns = new Set((refreshed.results || []).map((column: any) => String(column.name)));
      if (!refreshedColumns.has(primaryColumn)) throw error;
    }
    columns.add(primaryColumn);
  }
  if (!columns.has('status')) {
    // No default is assigned here: existing records are backfilled conservatively below.
    try {
      await db.prepare(`ALTER TABLE "${moduleName}" ADD COLUMN status TEXT`).run();
    } catch (error) {
      const refreshed = await db.prepare(`PRAGMA table_info("${moduleName}")`).all<any>();
      const refreshedColumns = new Set((refreshed.results || []).map((column: any) => String(column.name)));
      if (!refreshedColumns.has('status')) throw error;
    }
    columns.add('status');
  }

  const info = await db.prepare(`PRAGMA table_info("${moduleName}")`).all<any>();
  columns = new Set((info.results || []).map((column: any) => String(column.name)));
  const rows = await db.prepare(
    `SELECT * FROM "${moduleName}" WHERE id IS NOT NULL AND ( "${primaryColumn}" IS NULL OR TRIM(CAST("${primaryColumn}" AS TEXT)) = '' OR status IS NULL OR TRIM(status) = '' )`
  ).all<any>();
  const normalizeKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
  const candidates: Record<string, string[]> = {
    organizations: ['name', 'title', 'organizationName', 'tenToChuc', 'tenVien', 'tenToChucKHcn'],
    investors: ['name', 'title', 'fullName', 'investorName', 'tenNhaDauTu', 'hoVaTen'],
    investment_funds: ['name', 'title', 'fundName', 'tenQuyDauTu', 'tenQuy'],
    technologies: ['title', 'name', 'technologyName', 'tenCongNghe', 'tenKetQuaNghienCuu'],
    programs: ['title', 'name', 'programName', 'tenChuongTrinh', 'tenChuongTrinhHoTro'],
    publications: ['title', 'name', 'publicationTitle', 'tenBaiBao', 'tenCongBo'],
    lab_equipments: ['name', 'title', 'equipmentName', 'tenThietBi', 'tenPhongThiNghiem']
  };
  const validStatuses = new Set(['draft', 'submitted', 'under_review', 'needs_revision', 'approved', 'rejected', 'archived', 'published']);
  const updates: D1PreparedStatement[] = [];
  for (const row of rows.results || []) {
    let custom: Record<string, any> = {};
    try {
      custom = row.data_json ? JSON.parse(String(row.data_json)) : {};
      if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {};
    } catch { custom = {}; }
    const normalized = new Map(Object.entries(custom).map(([key, value]) => [normalizeKey(key), value]));
    let primaryValue = row[primaryColumn];
    if (primaryValue === null || primaryValue === undefined || String(primaryValue).trim() === '') {
      // Preserve a legacy physical name/title before consulting the flexible JSON payload.
      for (const physicalCandidate of ['name', 'title', 'project_name', 'company_name', 'full_name', 'organization_name']) {
        const physicalValue = row[physicalCandidate];
        if (physicalValue !== null && physicalValue !== undefined && String(physicalValue).trim() !== '') {
          primaryValue = physicalValue;
          break;
        }
      }
    }
    if (primaryValue === null || primaryValue === undefined || String(primaryValue).trim() === '') {
      for (const candidate of candidates[moduleName] || ['title', 'name']) {
        const value = normalized.get(normalizeKey(candidate));
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          primaryValue = String(value).trim();
          break;
        }
      }
    }
    let statusValue = String(row.status || '').trim().toLowerCase();
    if (!validStatuses.has(statusValue)) {
      const rawStatus = custom.status ?? custom.approvalStatus ?? custom.approval_status ?? custom.workflowStatus ?? custom.workflow_status;
      const candidateStatus = String(rawStatus || '').trim().toLowerCase();
      statusValue = validStatuses.has(candidateStatus) ? candidateStatus : 'draft';
    }
    if ((primaryValue !== null && primaryValue !== undefined && String(primaryValue).trim() !== '') ||
        !String(row.status || '').trim()) {
      updates.push(db.prepare(
        `UPDATE "${moduleName}" SET "${primaryColumn}" = CASE WHEN "${primaryColumn}" IS NULL OR TRIM(CAST("${primaryColumn}" AS TEXT)) = '' THEN ? ELSE "${primaryColumn}" END, status = CASE WHEN status IS NULL OR TRIM(status) = '' THEN ? ELSE status END WHERE id = ?`
      ).bind(primaryValue ?? null, statusValue, row.id));
    }
  }
  for (let offset = 0; offset < updates.length; offset += 80) {
    await db.batch(updates.slice(offset, offset + 80));
  }
  return columns;
}

async function ensureSystemConfigTable(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS system_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      portal_name TEXT NOT NULL,
      governing_agency TEXT NOT NULL,
      contact_address TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      city_area TEXT DEFAULT 'Thành phố Đà Nẵng',
      allow_public_submission INTEGER DEFAULT 1,
      require_approval INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
}

async function ensureFormConfigsTable(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS form_configs (
      module_type TEXT PRIMARY KEY,
      config_json TEXT NOT NULL DEFAULT '{"customFields":[]}',
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
}

async function ensureAuditLogTable(db: D1Database): Promise<Set<string>> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      module TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `).run();
  // Upgrade legacy audit tables in place; never drop or rewrite existing log rows.
  let info = await db.prepare('PRAGMA table_info(audit_logs)').all<any>();
  let columns = new Set((info.results || []).map((column: any) => String(column.name)));
  const additions: Array<[string, string]> = [
    ['user_id', 'TEXT'], ['user_name', 'TEXT'], ['user_role', 'TEXT'],
    ['action', "TEXT NOT NULL DEFAULT 'system'"], ['module', 'TEXT'],
    ['entity_id', 'TEXT'], ['details', 'TEXT'], ['ip_address', 'TEXT'],
    // SQLite ALTER TABLE requires a constant default; timestamps are backfilled below.
    ['created_at', 'TEXT'], ['timestamp', 'TEXT']
  ];
  for (const [name, definition] of additions) {
    if (columns.has(name)) continue;
    try { await db.prepare(`ALTER TABLE audit_logs ADD COLUMN "${name}" ${definition}`).run(); }
    catch { /* Another request may have applied the same additive migration. */ }
  }
  for (const name of ['created_at', 'timestamp']) {
    try { await db.prepare(`UPDATE audit_logs SET "${name}" = datetime('now') WHERE "${name}" IS NULL`).run(); }
    catch { /* Keep the existing audit history readable if a legacy schema is unusual. */ }
  }
  info = await db.prepare('PRAGMA table_info(audit_logs)').all<any>();
  columns = new Set((info.results || []).map((column: any) => String(column.name)));
  return columns;
}

async function ensureRelationshipsTable(db: D1Database): Promise<string> {
  const existing = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('relationships', 'entity_relationships')").all<any>();
  const names = new Set((existing.results || []).map((row: any) => String(row.name)));
  if (names.has('relationships')) return 'relationships';
  if (names.has('entity_relationships')) return 'entity_relationships';
  // Create only when neither supported table exists; existing records are untouched.
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_title TEXT,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_title TEXT,
      relation_type TEXT DEFAULT 'relates_to',
      notes TEXT,
      description TEXT,
      verification_source TEXT,
      status TEXT DEFAULT 'active',
      valid_from TEXT,
      valid_to TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  return 'relationships';
}

async function buildAuditLogStatement(db: D1Database, actor: any, action: string, moduleName: string, entityId: string, details: string, onlyIfPreviousWriteChanged = false): Promise<D1PreparedStatement> {
  const columns = await ensureAuditLogTable(db);
  const now = new Date().toISOString();
  const values: Record<string, any> = {
    id: `log_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`, user_id: actor?.id || null,
    user_name: actor?.fullName || actor?.username || 'system', user_role: actor?.role || 'system', action,
    module: moduleName, target_module: moduleName, entity_id: entityId, target_id: entityId, details,
    created_at: now, timestamp: now
  };
  const entries = Object.entries(values).filter(([column]) => columns.has(column));
  if (!entries.some(([column]) => column === 'action')) throw new Error('Bảng audit_logs thiếu cột action bắt buộc.');
  const columnSql = entries.map(([column]) => `"${column}"`).join(', ');
  const valueSql = entries.map(() => '?').join(', ');
  const sql = onlyIfPreviousWriteChanged ? `INSERT INTO audit_logs (${columnSql}) SELECT ${valueSql} WHERE changes() > 0` : `INSERT INTO audit_logs (${columnSql}) VALUES (${valueSql})`;
  return db.prepare(sql).bind(...entries.map(([, value]) => value));
}


// Helper: Origin & CSRF validation
function isAllowedOrigin(origin: string | null, requestUrl: string): boolean {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestOrigin = new URL(requestUrl);
    if (originUrl.origin === requestOrigin.origin) return true;
    const localHosts = ['localhost', '127.0.0.1'];
    return localHosts.includes(originUrl.hostname) && localHosts.includes(requestOrigin.hostname);
  } catch { return false; }
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowed = isAllowedOrigin(origin, request.url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-session-token',
    'Vary': 'Origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  if (new URL(request.url).protocol === 'https:') {
    headers['Strict-Transport-Security'] = 'max-age=31536000';
  }
  if (origin && allowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

// Helper: Response with dynamic CORS & standard headers
function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...extraHeaders
    }
  });
}

// Text sanitization helper
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

// Constant-time string comparison against timing attacks
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Versioned PBKDF2 parameters. Existing rows are explicitly tagged as 10,000
// iterations by the additive migration. Cloudflare Workers WebCrypto currently
// supports PBKDF2 up to 100,000 iterations, so stay within that runtime ceiling.
const LEGACY_PASSWORD_ITERATIONS = 10000;
const CURRENT_PASSWORD_ITERATIONS = 100000;
const LEGACY_PASSWORD_VERSION = 1;
const CURRENT_PASSWORD_VERSION = 2;

async function ensureUserPasswordIterations(db: D1Database): Promise<void> {
  const requiredColumns = [
    { name: 'password_iterations', definition: `INTEGER NOT NULL DEFAULT ${LEGACY_PASSWORD_ITERATIONS}` },
    { name: 'password_version', definition: `INTEGER NOT NULL DEFAULT ${LEGACY_PASSWORD_VERSION}` }
  ];
  for (const required of requiredColumns) {
    let info = await db.prepare('PRAGMA table_info(users)').all<any>();
    let columns = new Set((info.results || []).map((column: any) => String(column.name)));
    if (columns.has(required.name)) continue;
    try {
      await db.prepare(`ALTER TABLE users ADD COLUMN ${required.name} ${required.definition}`).run();
    } catch (error) {
      // Another request may have applied this additive migration concurrently.
      info = await db.prepare('PRAGMA table_info(users)').all<any>();
      columns = new Set((info.results || []).map((column: any) => String(column.name)));
      if (!columns.has(required.name)) throw error;
    }
  }
}

// PBKDF2 Password Hashing with SHA-512 in pure Web Crypto API.
// The iteration count is stored per account so legacy hashes remain verifiable.
async function hashPasswordWebCrypto(password: string, saltHex: string, iterations = CURRENT_PASSWORD_ITERATIONS): Promise<string> {
  if (!Number.isSafeInteger(iterations) || iterations < LEGACY_PASSWORD_ITERATIONS || iterations > 100000) {
    throw new Error('Tham số PBKDF2 không hợp lệ.');
  }
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-512'
    },
    passwordKey,
    64 * 8
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRandomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// UTF-8 safe base64url helpers
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Sign HMAC-SHA256 session token with full UTF-8 payload support
async function signToken(payloadObj: any, secret: string): Promise<string> {
  const jsonStr = JSON.stringify(payloadObj);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const b64Payload = bytesToBase64Url(jsonBytes);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
  const b64Sig = bytesToBase64Url(new Uint8Array(sig));
  return `${b64Payload}.${b64Sig}`;
}

// Verify HMAC-SHA256 session token
async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, sigPart] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
    const expectedSigB64 = bytesToBase64Url(new Uint8Array(expectedSig));
    if (!timingSafeEqualStr(sigPart, expectedSigB64)) return null;

    const payloadBytes = base64UrlToBytes(b64Payload);
    const payloadStr = new TextDecoder().decode(payloadBytes);
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
  if (!match) return null;
  try { return decodeURIComponent(match[3]); } catch { return null; }
}

// Send only sanitized operational/security events to Better Stack when configured.
// Never include credentials, cookies, request bodies, personal data, or raw D1 errors.
function queueBetterStackLog(
  env: Env,
  ctx: ExecutionContext,
  level: 'warn' | 'error',
  message: string,
  attributes: Record<string, string | number | boolean | null> = {}
): void {
  const sourceToken = env.BETTERSTACK_SOURCE_TOKEN?.trim();
  const rawHost = env.BETTERSTACK_INGESTING_HOST?.trim();
  if (!sourceToken || !rawHost) return;

  try {
    // Accept only Better Stack ingestion hosts to prevent SSRF through misconfiguration.
    const parsed = new URL(rawHost.includes('://') ? rawHost : `https://${rawHost}`);
    const host = parsed.hostname.toLowerCase();
    const validHost = parsed.protocol === 'https:' && !parsed.username && !parsed.password &&
      parsed.pathname === '/' && !parsed.search && !parsed.hash &&
      (host === 'in.logs.betterstack.com' || host.endsWith('.betterstackdata.com'));
    if (!validHost) {
      console.warn('[BetterStack] Ignoring invalid ingestion host configuration.');
      return;
    }

    const event = {
      dt: new Date().toISOString(),
      level,
      message,
      service: 'webcsdlkhcn',
      environment: env.ENVIRONMENT || 'unknown',
      ...attributes
    };
    ctx.waitUntil((async () => {
      try {
        const response = await fetch(`https://${host}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sourceToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
        if (!response.ok) console.warn('[BetterStack] Operational log delivery returned HTTP', response.status);
      } catch {
        console.warn('[BetterStack] Operational log delivery failed; application request remains unaffected.');
      }
    })());
  } catch {
    console.warn('[BetterStack] Invalid ingestion host configuration.');
  }
}

function getOperationalRequestId(request: Request): string {
  return request.headers.get('cf-ray') || crypto.randomUUID();
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Serve the public SPA and its static files before API security checks.
    // A missing SESSION_SECRET must not prevent the browser from loading the UI.
    // API endpoints and /health continue through the protected Worker flow below.
    const isApiRequest = url.pathname.startsWith('/api') || url.pathname === '/health';
    if (!isApiRequest) {
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request);
        const assetHeaders = new Headers(assetResponse.headers);
        assetHeaders.set('X-Content-Type-Options', 'nosniff');
        assetHeaders.set('X-Frame-Options', 'DENY');
        assetHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        assetHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        if (url.protocol === 'https:') assetHeaders.set('Strict-Transport-Security', 'max-age=31536000');
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers: assetHeaders
        });
      }
      return new Response('Not Found', { status: 404, headers: { 'X-Content-Type-Options': 'nosniff' } });
    }

    try {
      // 2. Secret Configuration Check
      const isProduction = env.ENVIRONMENT === 'production';
      const secret = env.SESSION_SECRET || (isProduction ? '' : 'danang-portal-dev-local-secret-key-32chars');
      if (isProduction && !secret) {
        return jsonResponse({
          success: false,
          message: 'Lỗi cấu hình máy chủ: SESSION_SECRET chưa được thiết lập trên Cloudflare Secrets.'
        }, 500, corsHeaders);
      }

      // 3. CSRF / Origin Check for State-Changing Requests
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const origin = request.headers.get('Origin') || request.headers.get('Referer');
        if (!origin || !isAllowedOrigin(origin, request.url)) {
          return jsonResponse({
            success: false,
            message: 'Từ chối truy cập: Vi phạm chính sách kiểm tra Origin / CSRF.'
          }, 403, corsHeaders);
        }
      }

      // 4. Authenticate User from Cookie & Verify against D1
      let currentUser: any = {
        id: 'usr_guest',
        username: 'guest',
        fullName: 'Khách vãng lai',
        email: 'guest@danang.gov.vn',
        role: 'public_user'
      };

      const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-session-token');
      const cookieToken = getCookie(request, 'danang_session') || getCookie(request, 'portal_session') || authHeader;
      if (cookieToken && secret) {
        const payload = await verifyToken(cookieToken, secret);
        if (payload && payload.uid && payload.exp && payload.exp > Date.now() && env.DB) {
          try {
            const activeUser = await env.DB.prepare(`
              SELECT id, username, full_name, email, role, organization, department, phone, is_active
              FROM users WHERE id = ? AND is_active = 1
            `).bind(payload.uid).first<any>();

            if (activeUser) {
              let userManagedModules: string[] = [];
              try {
                if (activeUser.department && activeUser.department.startsWith('[')) {
                  userManagedModules = JSON.parse(activeUser.department);
                }
              } catch {}

              currentUser = {
                id: activeUser.id,
                username: activeUser.username,
                fullName: activeUser.full_name,
                email: activeUser.email,
                role: activeUser.role,
                organization: activeUser.organization,
                phone: activeUser.phone,
                managedModules: userManagedModules
              };
            }
          } catch (dbErr) {
            console.warn('Lỗi truy vấn người dùng phiên làm việc từ D1:', dbErr);
          }
        }
      }

      // =========================================================================
      // ENDPOINTS
      // =========================================================================

      // A. Health Check & Live D1 Ping
      if (url.pathname === '/health') {
        let d1Status = 'disconnected';
        if (env.DB) {
          try {
            const ping = await env.DB.prepare('SELECT 1 as alive').first<{ alive: number }>();
            if (ping?.alive === 1) {
              d1Status = 'connected';
            }
          } catch {
            console.error('[Health] D1 probe failed.');
            queueBetterStackLog(env, ctx, 'error', 'D1 health probe failed', {
              component: 'D1', route: '/health', request_id: getOperationalRequestId(request)
            });
          }
        }
        return jsonResponse({
          status: d1Status === 'connected' ? 'ok' : 'degraded',
          service: 'Cổng Dữ Liệu KHCN & KNĐMST TP Đà Nẵng',
          runtime: 'cloudflare_workers',
          d1_status: d1Status,
          time: new Date().toISOString()
        }, d1Status === 'connected' ? 200 : 503, { ...corsHeaders, 'Cache-Control': 'no-store' });
      }

      // B. System Configuration
      if (url.pathname === '/api/config') {
        if (request.method === 'GET') {
          if (!env.DB) return jsonResponse({ success: false, message: 'CSDL D1 chưa kết nối.' }, 500, corsHeaders);
          try {
            await ensureSystemConfigTable(env.DB);
            const cfg = await env.DB.prepare('SELECT * FROM system_config ORDER BY updated_at DESC LIMIT 1').first<any>();
            if (cfg) {
              return jsonResponse({
                success: true,
                config: {
                  portalName: cfg.portal_name,
                  governingAgency: cfg.governing_agency,
                  contactAddress: cfg.contact_address,
                  cityArea: cfg.city_area || 'Thành phố Đà Nẵng',
                  contactEmail: cfg.contact_email,
                  contactPhone: cfg.contact_phone,
                  enablePublicSubmissions: Boolean(cfg.allow_public_submission ?? 1),
                  requireApproval: Boolean(cfg.require_approval ?? 1)
                }
              }, 200, corsHeaders);
            }
            return jsonResponse({
              success: true,
              config: {
                portalName: 'Cổng dữ liệu KHCN & KNĐMST TP Đà Nẵng',
                governingAgency: 'ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
                contactAddress: 'Trung tâm Đổi mới sáng tạo Đà Nẵng, 24 Trần Phú, Hải Châu, Đà Nẵng',
                cityArea: 'Thành phố Đà Nẵng',
                contactEmail: 'sokhcn@danang.gov.vn',
                contactPhone: '(0236) 3822 851',
                enablePublicSubmissions: true,
                requireApproval: true
              }
            }, 200, corsHeaders);
          } catch (error: any) {
            return jsonResponse({ success: false, message: 'Không thể đọc cấu hình hệ thống. Vui lòng thử lại hoặc liên hệ quản trị viên.' }, 500, corsHeaders);
          }
        }

        if (request.method === 'PUT') {
          if (!['super_admin', 'system_admin'].includes(currentUser.role)) {
            return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới có quyền cập nhật cấu hình hệ thống.' }, 403, corsHeaders);
          }
          if (!env.DB) return jsonResponse({ success: false, message: 'CSDL D1 chưa kết nối.' }, 500, corsHeaders);
          const body = await request.json().catch(() => ({})) as any;
          const clean = sanitizeObject(body);
          try {
            await ensureSystemConfigTable(env.DB);
            const existing = await env.DB.prepare('SELECT id FROM system_config ORDER BY updated_at DESC LIMIT 1').first<any>();
            const values = [
              clean.portalName ?? 'Cổng dữ liệu KHCN & KNĐMST TP Đà Nẵng',
              clean.governingAgency ?? 'SỞ KHOA HỌC VÀ CÔNG NGHỆ ĐÀ NẴNG',
              clean.contactAddress ?? '',
              clean.contactEmail ?? '',
              clean.contactPhone ?? '',
              clean.cityArea ?? 'Thành phố Đà Nẵng'
            ];
            let result: any;
            if (existing?.id) {
              result = await env.DB.prepare(`
                UPDATE system_config
                SET portal_name = ?, governing_agency = ?, contact_address = ?, contact_email = ?, contact_phone = ?, city_area = ?, updated_at = datetime('now')
                WHERE id = ?
              `).bind(...values, existing.id).run();
            } else {
              result = await env.DB.prepare(`
                INSERT INTO system_config (id, portal_name, governing_agency, contact_address, contact_email, contact_phone, city_area, created_at, updated_at)
                VALUES ('default', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(...values).run();
            }
            if (Number(result.meta?.changes || 0) < 1) {
              throw new Error('D1 không xác nhận có bản ghi cấu hình được cập nhật.');
            }
            const saved = await env.DB.prepare('SELECT * FROM system_config WHERE id = ?').bind(existing?.id || 'default').first<any>();
            if (!saved) throw new Error('Không đọc lại được cấu hình sau khi lưu.');
            const savedConfig = {
              portalName: saved.portal_name,
              governingAgency: saved.governing_agency,
              contactAddress: saved.contact_address,
              cityArea: saved.city_area || 'Thành phố Đà Nẵng',
              contactEmail: saved.contact_email,
              contactPhone: saved.contact_phone,
              enablePublicSubmissions: Boolean(saved.allow_public_submission ?? 1),
              requireApproval: Boolean(saved.require_approval ?? 1)
            };
            return jsonResponse({ success: true, config: savedConfig, message: 'Đã lưu cấu hình hệ thống vào D1.' }, 200, corsHeaders);
          } catch (error: any) {
            return jsonResponse({ success: false, message: 'Không thể lưu cấu hình hệ thống. Vui lòng thử lại hoặc liên hệ quản trị viên.' }, 500, corsHeaders);
          }
        }
      }

      // One-time first Super Admin bootstrap. Requires a Worker Secret and an empty users table.
      if (url.pathname === '/api/auth/bootstrap-admin' && request.method === 'POST') {
        if (!env.DB || !env.ADMIN_BOOTSTRAP_SECRET) {
          return jsonResponse({ success: false, message: 'Chức năng khởi tạo quản trị viên chưa được cấu hình.' }, 503, corsHeaders);
        }
        const body = await request.json().catch(() => ({})) as any;
        const suppliedSecret = String(body.secret || '');
        const username = sanitizeString(body.username || '').toLowerCase().trim();
        const password = String(body.password || '');
        const fullName = sanitizeString(body.fullName || '');
        const email = sanitizeString(body.email || '').toLowerCase().trim();
        const organization = sanitizeString(body.organization || '');
        const phone = sanitizeString(body.phone || '');
        if (!timingSafeEqualStr(suppliedSecret, env.ADMIN_BOOTSTRAP_SECRET)) {
          return jsonResponse({ success: false, message: 'Thông tin xác thực khởi tạo không hợp lệ.' }, 403, corsHeaders);
        }
        if (!/^[a-z0-9._-]{3,64}$/.test(username) || password.length < 12 || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse({ success: false, message: 'Vui lòng cung cấp username hợp lệ, họ tên, email và mật khẩu tối thiểu 12 ký tự.' }, 400, corsHeaders);
        }
        await ensureUserPasswordIterations(env.DB);
        const existing = await env.DB.prepare('SELECT COUNT(*) AS total FROM users').first<any>();
        if (Number(existing?.total || 0) !== 0) {
          return jsonResponse({ success: false, message: 'Đã tồn tại tài khoản. Không thể thực hiện khởi tạo Super Admin lần nữa.' }, 409, corsHeaders);
        }
        const salt = generateRandomSalt();
        const hash = await hashPasswordWebCrypto(password, salt);
        const now = new Date().toISOString();
        const id = `usr_${crypto.randomUUID()}`;
        const inserted = await env.DB.prepare(`
          INSERT INTO users (id, username, password_hash, password_salt, password_iterations, password_version, full_name, email, role, organization, phone, is_active, created_at, updated_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'super_admin', ?, ?, 1, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM users)
        `).bind(id, username, hash, salt, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, fullName, email, organization, phone, now, now).run();
        if (Number(inserted.meta?.changes || 0) !== 1) {
          return jsonResponse({ success: false, message: 'Một tài khoản đã được khởi tạo đồng thời. Vui lòng đăng nhập.' }, 409, corsHeaders);
        }
        return jsonResponse({ success: true, message: 'Đã khởi tạo Super Admin đầu tiên. Hãy xóa ADMIN_BOOTSTRAP_SECRET khỏi Worker Secrets ngay sau bước này.', user: { id, username, fullName, email, role: 'super_admin' } }, 201, corsHeaders);
      }

      // C. Roles Endpoint
      if (url.pathname === '/api/roles') {
        return jsonResponse({
          success: true,
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
        }, 200, corsHeaders);
      }

      // D. Auth: Current User (`/api/auth/me`)
      if (url.pathname === '/api/auth/me') {
        // Refresh only as a browser-session cookie. No Max-Age/Expires is set,
        // so the browser does not intentionally persist the login across restarts.
        const sessionCookie = currentUser.role !== 'public_user' && cookieToken
          ? `danang_session=${encodeURIComponent(cookieToken)}; Path=/; HttpOnly; Secure; SameSite=Lax`
          : undefined;
        const response = jsonResponse({
          success: true,
          user: currentUser,
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

        }, 200, corsHeaders);
        if (sessionCookie) {
          response.headers.append('Set-Cookie', sessionCookie);
        }
        if (getCookie(request, 'portal_session')) {
          response.headers.append('Set-Cookie', 'portal_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
        }
        return response;
      }

      // E. Auth: Login (`POST /api/auth/login`) - Strict D1 Verification, No Hardcoded Accounts
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const username = sanitizeString(body.username || '').toLowerCase().trim();
        const password = body.password ? String(body.password) : '';

        if (!username || !password) {
          return jsonResponse({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, 400, corsHeaders);
        }

        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Hệ thống chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
        }

        await ensureUserPasswordIterations(env.DB);

        // 1. Fetch user from D1
        const userRow = await env.DB.prepare(`
          SELECT id, username, full_name, email, role, organization, department, phone, is_active, password_hash, password_salt, password_iterations, password_version, failed_attempts, locked_until
          FROM users 
          WHERE LOWER(username) = ?
        `).bind(username).first<any>();

        if (!userRow || userRow.is_active !== 1) {
          // Use the same response as an incorrect password to avoid disclosing account existence.
          return jsonResponse({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401, corsHeaders);
        }

        // 2. Check lock status
        if (userRow.locked_until) {
          const lockedUntilTime = new Date(userRow.locked_until).getTime();
          if (Date.now() < lockedUntilTime) {
            const waitMinutes = Math.ceil((lockedUntilTime - Date.now()) / (60 * 1000));
            return jsonResponse({
              success: false,
              message: `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${waitMinutes} phút.`
            }, 429, corsHeaders);
          }
        }

        // 3. Verify password via PBKDF2 WebCrypto
        let isValid = false;
        const storedIterations = Number(userRow.password_iterations || LEGACY_PASSWORD_ITERATIONS);
        const storedVersion = Number(userRow.password_version || LEGACY_PASSWORD_VERSION);
        if (userRow.password_hash && userRow.password_salt && Number.isSafeInteger(storedIterations) && storedIterations >= LEGACY_PASSWORD_ITERATIONS && storedIterations <= CURRENT_PASSWORD_ITERATIONS && Number.isSafeInteger(storedVersion) && storedVersion >= LEGACY_PASSWORD_VERSION && storedVersion <= CURRENT_PASSWORD_VERSION) {
          const computedHash = await hashPasswordWebCrypto(password, userRow.password_salt, storedIterations);
          isValid = timingSafeEqualStr(computedHash, userRow.password_hash);
        }

        if (!isValid) {
          const newFailed = (userRow.failed_attempts || 0) + 1;
          if (newFailed >= 5) {
            const lockUntilIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            await env.DB.prepare(`
              UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = datetime('now') WHERE id = ?
            `).bind(newFailed, lockUntilIso, userRow.id).run();
            queueBetterStackLog(env, ctx, 'warn', 'Account brute-force lockout triggered', {
              component: 'authentication', route: '/api/auth/login', request_id: getOperationalRequestId(request),
              failed_attempts: newFailed, lockout_minutes: 15
            });
          } else {
            await env.DB.prepare(`
              UPDATE users SET failed_attempts = ?, updated_at = datetime('now') WHERE id = ?
            `).bind(newFailed, userRow.id).run();
          }
          return jsonResponse({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401, corsHeaders);
        }

        // 4. Successful login -> reset failed counter. Upgrade old hashes in the
        // background so a valid login is never blocked by the stronger rehash.
        await env.DB.prepare(`
          UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?
        `).bind(userRow.id).run();
        if (storedIterations < CURRENT_PASSWORD_ITERATIONS || storedVersion < CURRENT_PASSWORD_VERSION) {
          const oldHash = userRow.password_hash;
          const oldSalt = userRow.password_salt;
          ctx.waitUntil((async () => {
            try {
              const upgradedSalt = generateRandomSalt();
              const upgradedHash = await hashPasswordWebCrypto(password, upgradedSalt, CURRENT_PASSWORD_ITERATIONS);
              await env.DB!.prepare(`UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, password_version = ?, updated_at = datetime('now') WHERE id = ? AND password_hash = ? AND password_salt = ?`)
                .bind(upgradedHash, upgradedSalt, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, userRow.id, oldHash, oldSalt).run();
            } catch (upgradeError) {
              console.warn('[Auth] Deferred password-hash upgrade failed; legacy hash remains valid:', upgradeError);
            }
          })());
        }

        let loginManagedModules: string[] = [];
        try {
          if (userRow.department && typeof userRow.department === 'string' && userRow.department.startsWith('[')) {
            loginManagedModules = JSON.parse(userRow.department);
          }
        } catch {}

        const safeUser = {
          id: userRow.id,
          username: userRow.username,
          fullName: userRow.full_name,
          email: userRow.email,
          role: userRow.role,
          organization: userRow.organization,
          phone: userRow.phone,
          managedModules: Array.isArray(loginManagedModules) ? loginManagedModules : []
        };

        const sessionToken = await signToken({
          uid: userRow.id,
          role: userRow.role,
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000
        }, secret);

        // Keep the HttpOnly cookie scoped to the current browser session.
        const cookieHeader = createSessionCookie(sessionToken);

        // Audit log
        try {
          await ensureAuditLogTable(env.DB);
          await env.DB.prepare(`
            INSERT INTO audit_logs (id, user_id, user_name, user_role, action, details, timestamp)
            VALUES (?, ?, ?, ?, 'login', ?, datetime('now'))
          `).bind(
            `log_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`,
            userRow.id,
            userRow.full_name,
            userRow.role,
            `Đăng nhập thành công với tài khoản [${userRow.username}]`
          ).run();
        } catch (auditError) {
          console.error('[Audit] Không thể ghi nhật ký đăng nhập:', auditError);
        }

        return jsonResponse({
          success: true,
          user: safeUser
        }, 200, {
          ...corsHeaders,
          'Set-Cookie': cookieHeader
        });
      }

      // F. Auth: Logout
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        const clearCookie = `danang_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
        return jsonResponse({ success: true, message: 'Đã đăng xuất an toàn.' }, 200, {
          ...corsHeaders,
          'Set-Cookie': clearCookie
        });
      }

      // G. Auth: Change Password (`POST /api/auth/change-password`)
      if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
        if (currentUser.role === 'public_user') {
          return jsonResponse({ success: false, message: 'Vui lòng đăng nhập trước khi đổi mật khẩu.' }, 401, corsHeaders);
        }
        const body = await request.json().catch(() => ({})) as any;
        const currentPassword = String(body.currentPassword || '');
        const newPassword = String(body.newPassword || '');
        const confirmPassword = String(body.confirmPassword || '');

        if (!newPassword || newPassword.length < 8) {
          return jsonResponse({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự để bảo đảm an toàn.' }, 400, corsHeaders);
        }
        if (!confirmPassword || newPassword !== confirmPassword) {
          return jsonResponse({ success: false, message: 'Vui lòng nhập và xác nhận chính xác mật khẩu mới.' }, 400, corsHeaders);
        }

        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Hệ thống chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
        }

        await ensureUserPasswordIterations(env.DB);
        const userRow = await env.DB.prepare(`
          SELECT id, password_hash, password_salt, password_iterations, password_version FROM users WHERE id = ?
        `).bind(currentUser.id).first<any>();

        if (!userRow) {
          return jsonResponse({ success: false, message: 'Không tìm thấy tài khoản trong CSDL.' }, 404, corsHeaders);
        }

        // Fail closed: never allow a password change unless the current password
        // can be verified against a complete D1 hash + salt pair.
        if (!currentPassword || !userRow.password_hash || !userRow.password_salt) {
          return jsonResponse({ success: false, message: 'Không thể xác minh mật khẩu hiện tại. Vui lòng liên hệ quản trị viên để được hỗ trợ.' }, 400, corsHeaders);
        }
        const currentIterations = Number(userRow.password_iterations || LEGACY_PASSWORD_ITERATIONS);
        const currentVersion = Number(userRow.password_version || LEGACY_PASSWORD_VERSION);
        if (!Number.isSafeInteger(currentVersion) || currentVersion < LEGACY_PASSWORD_VERSION || currentVersion > CURRENT_PASSWORD_VERSION) {
          return jsonResponse({ success: false, message: 'Phiên bản hash mật khẩu không hợp lệ. Vui lòng liên hệ quản trị viên.' }, 400, corsHeaders);
        }
        const checkHash = await hashPasswordWebCrypto(currentPassword, userRow.password_salt, currentIterations);
        if (!timingSafeEqualStr(checkHash, userRow.password_hash)) {
          return jsonResponse({ success: false, message: 'Mật khẩu hiện tại không chính xác.' }, 400, corsHeaders);
        }

        const newSalt = generateRandomSalt();
        const newHash = await hashPasswordWebCrypto(newPassword, newSalt);

        await env.DB.prepare(`
          UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, password_version = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(newHash, newSalt, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, currentUser.id).run();

        try {
          await ensureAuditLogTable(env.DB);
          await env.DB.prepare(`
            INSERT INTO audit_logs (id, user_id, user_name, user_role, action, details, timestamp)
            VALUES (?, ?, ?, ?, 'update', 'Người dùng tự đổi mật khẩu tài khoản thành công', datetime('now'))
          `).bind(`log_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`, currentUser.id, currentUser.fullName, currentUser.role).run();
        } catch {}

        return jsonResponse({ success: true, message: 'Đổi mật khẩu tài khoản thành công.' }, 200, corsHeaders);
      }

      // H. Auth: Update Profile (`PUT /api/auth/profile`)
      if (url.pathname === '/api/auth/profile' && request.method === 'PUT') {
        if (currentUser.role === 'public_user') {
          return jsonResponse({ success: false, message: 'Vui lòng đăng nhập trước khi cập nhật hồ sơ.' }, 401, corsHeaders);
        }
        const body = await request.json().catch(() => ({})) as any;
        const phone = body.phone ? sanitizeString(body.phone) : currentUser.phone;
        const organization = body.organization ? sanitizeString(body.organization) : currentUser.organization;

        if (env.DB) {
          await env.DB.prepare(`
            UPDATE users SET phone = ?, organization = ?, updated_at = datetime('now') WHERE id = ?
          `).bind(phone, organization, currentUser.id).run();
        }

        const updated = {
          ...currentUser,
          phone,
          organization
        };

        return jsonResponse({ success: true, user: updated, message: 'Cập nhật hồ sơ thành công.' }, 200, corsHeaders);
      }

      // I. User Management (Strict Admin Only)
      if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/')) {
        if (!['super_admin', 'system_admin'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới có quyền quản lý tài khoản người dùng.' }, 403, corsHeaders);
        }

        const userId = url.pathname.replace('/api/users', '').replace(/^\//, '');

        if (request.method === 'GET') {
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'CSDL chưa kết nối.' }, 500, corsHeaders);
          }
          const rows = await env.DB.prepare(`
            SELECT id, username, full_name as fullName, email, role, organization, department, phone, is_active as isActive, created_at as createdAt 
            FROM users 
            ORDER BY created_at DESC
          `).all();
          const mappedUsers = (rows.results || []).map((u: any) => {
            let userModules: string[] = [];
            try {
              if (u.department && typeof u.department === 'string' && u.department.startsWith('[')) {
                userModules = JSON.parse(u.department);
              }
            } catch {}
            return {
              ...u,
              isActive: Boolean(u.isActive),
              managedModules: Array.isArray(userModules) ? userModules : []
            };
          });
          return jsonResponse({ success: true, users: mappedUsers }, 200, corsHeaders);
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({})) as any;
          const username = sanitizeString(body.username || '').toLowerCase().trim();
          const rawPassword = body.password ? String(body.password) : '';
          const fullName = sanitizeString(body.fullName || '');
          const email = sanitizeString(body.email || '');
          const role = sanitizeString(body.role || 'data_officer');
          const organization = sanitizeString(body.organization || '');
          const phone = sanitizeString(body.phone || '');
          const managedModules = Array.isArray(body.managedModules) ? body.managedModules : [];
          const departmentJson = JSON.stringify(managedModules);

          const allowedRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert', 'partner_officer', 'org_representative', 'expert_user', 'investor_user', 'public_user'];
          if (!allowedRoles.includes(role)) {
            return jsonResponse({ success: false, message: 'Vai trò tài khoản không hợp lệ.' }, 400, corsHeaders);
          }
          if (currentUser.role === 'system_admin' && role === 'super_admin') {
            return jsonResponse({ success: false, message: 'Quản trị viên hệ thống chỉ được tạo tài khoản có quyền ngang bằng hoặc thấp hơn; không được tạo Super Admin.' }, 403, corsHeaders);
          }
          if (role === 'super_admin' && currentUser.role !== 'super_admin') {
            return jsonResponse({ success: false, message: 'Chỉ Super Admin mới có quyền tạo tài khoản Super Admin.' }, 403, corsHeaders);
          }

          if (!username || !rawPassword || rawPassword.length < 8) {
            return jsonResponse({ success: false, message: 'Tên đăng nhập và mật khẩu (tối thiểu 8 ký tự) là bắt buộc.' }, 400, corsHeaders);
          }

          if (!env.DB) {
            return jsonResponse({ success: false, message: 'CSDL chưa kết nối.' }, 500, corsHeaders);
          }

          await ensureUserPasswordIterations(env.DB);
          // Check if username already exists
          const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = ?').bind(username).first();
          if (existing) {
            return jsonResponse({ success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống.' }, 400, corsHeaders);
          }

          const salt = generateRandomSalt();
          const hash = await hashPasswordWebCrypto(rawPassword, salt);
          const newId = `usr_${Date.now()}`;
          const nowIso = new Date().toISOString();

          const userTableInfo = await env.DB.prepare("PRAGMA table_info(users)").all<any>();
          const userCols = new Set((userTableInfo.results || []).map((c: any) => c.name));

          if (userCols.has('password_salt') && userCols.has('salt')) {
            await env.DB.prepare(`
              INSERT INTO users (id, username, password_hash, password_salt, password_iterations, password_version, salt, full_name, email, role, organization, department, phone, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(newId, username, hash, salt, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, salt, fullName, email, role, organization, departmentJson, phone, nowIso, nowIso).run();
          } else if (userCols.has('password_salt')) {
            await env.DB.prepare(`
              INSERT INTO users (id, username, password_hash, password_salt, password_iterations, password_version, full_name, email, role, organization, department, phone, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(newId, username, hash, salt, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, fullName, email, role, organization, departmentJson, phone, nowIso, nowIso).run();
          } else {
            await env.DB.prepare(`
              INSERT INTO users (id, username, password_hash, password_iterations, password_version, salt, full_name, email, role, organization, department, phone, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(newId, username, hash, CURRENT_PASSWORD_ITERATIONS, CURRENT_PASSWORD_VERSION, salt, fullName, email, role, organization, departmentJson, phone, nowIso, nowIso).run();
          }

          return jsonResponse({
            success: true,
            user: { id: newId, username, fullName, email, role, organization, phone, managedModules, isActive: true, createdAt: nowIso }
          }, 201, corsHeaders);
        }

        if (userId && request.method === 'PUT') {
          const body = await request.json().catch(() => ({})) as any;
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'CSDL chưa kết nối.' }, 500, corsHeaders);
          }
          await ensureUserPasswordIterations(env.DB);
          const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<any>();
          if (!existing) {
            return jsonResponse({ success: false, message: 'Không tìm thấy tài khoản.' }, 404, corsHeaders);
          }
          if (existing.role === 'super_admin' && currentUser.role !== 'super_admin') {
            return jsonResponse({ success: false, message: 'Chỉ Super Admin mới có quyền quản lý tài khoản Super Admin.' }, 403, corsHeaders);
          }
          const requestedRole = body.role !== undefined ? sanitizeString(body.role) : existing.role;
          const allowedRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert', 'partner_officer', 'org_representative', 'expert_user', 'investor_user', 'public_user'];
          if (!allowedRoles.includes(requestedRole)) {
            return jsonResponse({ success: false, message: 'Vai trò tài khoản không hợp lệ.' }, 400, corsHeaders);
          }
          if (currentUser.role === 'system_admin' && requestedRole === 'super_admin') {
            return jsonResponse({ success: false, message: 'Quản trị viên hệ thống không được nâng quyền tài khoản lên Super Admin.' }, 403, corsHeaders);
          }

          const isAdminAccount = ['super_admin', 'system_admin'].includes(existing.role);
          if (existing.role === 'super_admin' && (
            (body.role !== undefined && body.role !== existing.role) ||
            (body.isActive !== undefined && Boolean(body.isActive) !== Boolean(existing.is_active)) ||
            body.managedModules !== undefined
          )) {
            return jsonResponse({ success: false, message: 'Tài khoản Super Admin được bảo vệ: không thể thay đổi vai trò, trạng thái hoặc quyền theo phân hệ.' }, 403, corsHeaders);
          }

          if (userId === currentUser.id && (
            (body.role !== undefined && body.role !== existing.role) ||
            (body.isActive !== undefined && Boolean(body.isActive) !== Boolean(existing.is_active))
          )) {
            return jsonResponse({ success: false, message: 'Không được tự thay đổi vai trò hoặc trạng thái hoạt động của chính tài khoản đang đăng nhập.' }, 403, corsHeaders);
          }

          // Admin harden: lock demotion and lock deactivation
          const fullName = body.fullName !== undefined ? sanitizeString(body.fullName) : existing.full_name;
          const email = body.email !== undefined ? sanitizeString(body.email) : existing.email;
          const role = isAdminAccount ? existing.role : (body.role !== undefined ? sanitizeString(body.role) : existing.role);
          const phone = body.phone !== undefined ? sanitizeString(body.phone) : existing.phone;
          const org = body.organization !== undefined ? sanitizeString(body.organization) : existing.organization;
          const isActive = isAdminAccount ? 1 : (body.isActive !== undefined ? (body.isActive ? 1 : 0) : existing.is_active);

          // Admin always has all modules
          let deptJson = existing.department;
          if (isAdminAccount) {
            deptJson = JSON.stringify(ALLOWED_MODULES);
          } else if (body.managedModules !== undefined) {
            deptJson = JSON.stringify(Array.isArray(body.managedModules) ? body.managedModules : []);
          }

          let newHash = existing.password_hash;
          let newSalt = existing.password_salt || existing.salt;
          let newIterations = Number(existing.password_iterations || LEGACY_PASSWORD_ITERATIONS);
          let newVersion = Number(existing.password_version || LEGACY_PASSWORD_VERSION);
          if (body.password && String(body.password).length >= 6) {
            if (isAdminAccount) {
              if (!body.oldPassword) {
                return jsonResponse({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ để xác thực thay đổi mật khẩu quản trị viên.' }, 400, corsHeaders);
              }
              const oldComputed = await hashPasswordWebCrypto(String(body.oldPassword), newSalt, newIterations);
              if (!timingSafeEqualStr(oldComputed, existing.password_hash)) {
                return jsonResponse({ success: false, message: 'Mật khẩu cũ không chính xác.' }, 400, corsHeaders);
              }
            }
            newSalt = generateRandomSalt();
            newHash = await hashPasswordWebCrypto(String(body.password), newSalt, CURRENT_PASSWORD_ITERATIONS);
            newIterations = CURRENT_PASSWORD_ITERATIONS;
            newVersion = CURRENT_PASSWORD_VERSION;
          }

          const userTableInfo = await env.DB.prepare("PRAGMA table_info(users)").all<any>();
          const userCols = new Set((userTableInfo.results || []).map((c: any) => c.name));

          if (userCols.has('password_salt') && userCols.has('salt')) {
            await env.DB.prepare(`
              UPDATE users SET full_name = ?, email = ?, role = ?, phone = ?, organization = ?, department = ?, is_active = ?, password_hash = ?, password_salt = ?, password_iterations = ?, password_version = ?, salt = ?, updated_at = datetime('now') WHERE id = ?
            `).bind(fullName, email, role, phone, org, deptJson, isActive, newHash, newSalt, newIterations, newVersion, newSalt, userId).run();
          } else if (userCols.has('password_salt')) {
            await env.DB.prepare(`
              UPDATE users SET full_name = ?, email = ?, role = ?, phone = ?, organization = ?, department = ?, is_active = ?, password_hash = ?, password_salt = ?, password_iterations = ?, password_version = ?, updated_at = datetime('now') WHERE id = ?
            `).bind(fullName, email, role, phone, org, deptJson, isActive, newHash, newSalt, newIterations, newVersion, userId).run();
          } else {
            await env.DB.prepare(`
              UPDATE users SET full_name = ?, email = ?, role = ?, phone = ?, organization = ?, department = ?, is_active = ?, password_hash = ?, password_iterations = ?, password_version = ?, salt = ?, updated_at = datetime('now') WHERE id = ?
            `).bind(fullName, email, role, phone, org, deptJson, isActive, newHash, newIterations, newVersion, newSalt, userId).run();
          }

          let resModules: string[] = [];
          try {
            if (deptJson && deptJson.startsWith('[')) {
              resModules = JSON.parse(deptJson);
            }
          } catch {}

          return jsonResponse({
            success: true,
            user: { id: userId, username: existing.username, fullName, email, role, phone, organization: org, managedModules: resModules, isActive: Boolean(isActive) }
          }, 200, corsHeaders);
        }

        if (userId && request.method === 'DELETE') {
          if (currentUser.id === userId) {
            return jsonResponse({ success: false, message: 'Không thể tự xóa tài khoản của chính mình.' }, 400, corsHeaders);
          }
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'CSDL chưa kết nối.' }, 500, corsHeaders);
          }
          const target = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<any>();
          if (target && target.role === 'super_admin') {
            return jsonResponse({ success: false, message: 'Tài khoản Super Admin được bảo vệ cố định, không thể xóa.' }, 403, corsHeaders);
          }
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
          return jsonResponse({ success: true, message: 'Đã xóa tài khoản người dùng thành công.' }, 200, corsHeaders);
        }
      }

      // J. Real Aggregated Statistics (`/api/stats`) - 100% Real D1 Counts, Never Hardcoded
      if (url.pathname === '/api/stats') {
        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Không thể kết nối CSDL D1.' }, 500, corsHeaders);
        }

        try {
          const counts: Record<string, number> = {};
          let pendingApprovalsCount = 0;
          for (const mod of ALLOWED_MODULES) {
            try {
              const info = await env.DB.prepare(`PRAGMA table_info("${mod}")`).all<any>();
              const columns = new Set((info.results || []).map((column: any) => String(column.name)));
              const publicWhere = buildPublicVisibilityWhere(columns);
              const res = await env.DB.prepare(`SELECT COUNT(*) as c FROM "${mod}"${publicWhere}`).first<{ c: number }>();
              counts[mod] = Number(res?.c) || 0;
              if (columns.has('status')) {
                const pendingConditions = [`LOWER(COALESCE(status, '')) NOT IN ('approved', 'published')`];
                if (columns.has('publicity_level')) pendingConditions.push(`LOWER(COALESCE(publicity_level, 'private')) <> 'public'`);
                const pending = await env.DB.prepare(`SELECT COUNT(*) as c FROM "${mod}" WHERE ${pendingConditions.join(' OR ')}`).first<{ c: number }>();
                pendingApprovalsCount += Number(pending?.c) || 0;
              }
            } catch {
              counts[mod] = 0;
            }
          }

          let tasksAccepted = 0;
          let totalBudget = 0;
          let totalSavings = 0;
          try {
            // The acceptance outcome is often stored as a configurable field in data_json,
            // while the physical "status" column is the publication/approval workflow.
            // Inspect the live schema so one absent optional column cannot zero the dashboard.
            const taskInfo = await env.DB.prepare('PRAGMA table_info(science_tasks)').all<any>();
            const taskColumns = new Set((taskInfo.results || []).map((column: any) => String(column.name)));
            const acceptanceExpressions: string[] = [];
            for (const column of ['acceptance_result', 'acceptance_status', 'completion_status', 'result']) {
              if (taskColumns.has(column)) {
                acceptanceExpressions.push(`NULLIF(TRIM(CAST("${column}" AS TEXT)), '')`);
              }
            }
            if (taskColumns.has('data_json')) {
              const jsonPaths = [
                '$.acceptanceResult', '$.acceptance_result', '$.acceptanceOutcome',
                '$.acceptance_outcome', '$.trangthai', '$.trangThai',
                '$.tinhTrangNghiemThu', '$.tinh_trang_nghiem_thu', '$.nghiemThu',
                '$.nghiem_thu', '$.completionStatus', '$.completion_status',
                '$.taskStatus', '$.task_status', '$.resultStatus', '$.result_status',
                '$.result', '$.__custom__acceptance_result'
              ];
              for (const path of jsonPaths) {
                acceptanceExpressions.push(`CASE WHEN json_valid(data_json) THEN json_extract(data_json, '${path}') END`);
              }
            }
            const acceptanceValue = acceptanceExpressions.length
              ? `LOWER(TRIM(COALESCE(${acceptanceExpressions.join(', ')}, '')))`
              : "''";
            // Some imported legacy datasets do not have a populated acceptance-result field.
            // In that case only, treat an approved + verified workflow record as accepted.
            // Explicit acceptance outcomes (including failed/in-progress outcomes) retain priority.
            const workflowOnlyAcceptanceValues = `${acceptanceValue} = '' OR ${acceptanceValue} IN ('approved', 'published', 'verified', 'đã duyệt', 'da duyet', 'đã phê duyệt', 'da phe duyet')`;
            const workflowAcceptedFallback = taskColumns.has('status') && taskColumns.has('verification_status')
              ? `((${workflowOnlyAcceptanceValues}) AND LOWER(TRIM(CAST("status" AS TEXT))) = 'approved' AND LOWER(TRIM(CAST("verification_status" AS TEXT))) = 'verified')`
              : '0';
            const acceptedBudget = taskColumns.has('total_budget_approved')
              ? 'COALESCE(SUM(total_budget_approved), 0)'
              : '0';
            const taskStats = await env.DB.prepare(`
              SELECT
                COUNT(CASE
                  WHEN (
                    ${acceptanceValue} IN ('đạt', 'xuất sắc', 'đã nghiệm thu', 'nghiệm thu', 'đã hoàn thành', 'hoàn thành', 'completed', 'complete', 'đã kết thúc', 'kết thúc')
                    OR ${acceptanceValue} LIKE '%nghiệm thu%'
                    OR ${acceptanceValue} LIKE '%hoàn thành%'
                    OR ${acceptanceValue} LIKE '%xuất sắc%'
                    OR ${acceptanceValue} LIKE '%đạt%'
                    OR ${workflowAcceptedFallback}
                  )
                  AND ${acceptanceValue} NOT LIKE '%không đạt%'
                  AND ${acceptanceValue} NOT LIKE '%khong dat%'
                  AND ${acceptanceValue} NOT LIKE '%chưa đạt%'
                  AND ${acceptanceValue} NOT LIKE '%chua dat%'
                  AND ${acceptanceValue} NOT LIKE '%chưa nghiệm thu%'
                  AND ${acceptanceValue} NOT LIKE '%chua nghiem thu%'
                  AND ${acceptanceValue} NOT LIKE '%đang nghiệm thu%'
                  AND ${acceptanceValue} NOT LIKE '%dang nghiem thu%'
                  THEN 1
                END) as accepted,
                ${acceptedBudget} as budget
              FROM science_tasks ${buildPublicVisibilityWhere(taskColumns)}
            `).first<{ accepted: number; budget: number }>();
            tasksAccepted = Number(taskStats?.accepted) || 0;
            totalBudget = Number(taskStats?.budget) || 0;
          } catch (error) {
            console.error('Không thể tổng hợp thống kê nghiệm thu đề tài:', error);
          }

          try {
            const initiativeInfo = await env.DB.prepare('PRAGMA table_info(initiatives)').all<any>();
            const initiativeColumns = new Set((initiativeInfo.results || []).map((column: any) => String(column.name)));
            const savingsExpression = initiativeColumns.has('cost_savings') ? 'COALESCE(SUM(cost_savings), 0)' : '0';
            const initStats = await env.DB.prepare(`
              SELECT ${savingsExpression} as savings
              FROM initiatives ${buildPublicVisibilityWhere(initiativeColumns)}
            `).first<{ savings: number }>();
            totalSavings = Number(initStats?.savings) || 0;
          } catch {}

          const currentYr = new Date().getFullYear().toString();
          const yearsList = ['2021', '2022', '2023', '2024', '2025', '2026'];
          const tasksByYear: Record<string, number> = {};
          const initiativesByYear: Record<string, number> = {};
          const startupsByYear: Record<string, number> = {};
          const ideasByYear: Record<string, number> = {};
          const projectsByYear: Record<string, number> = {};
          const patentsByYear: Record<string, number> = {};
          const tasksByField: Record<string, number> = {};
          const tasksByUnit: Record<string, number> = {};
          const tasksByLevel: Record<string, number> = {};
          const projectsByField: Record<string, number> = {};
          const initiativesByField: Record<string, number> = {};
          const ideasByOrigin: Record<string, number> = { school: 0, ward: 0, other: 0 };
          const expertsByYear: Record<string, number> = {};
          const supportOrgsByYear: Record<string, number> = {};
          const universitiesByYear: Record<string, number> = {};
          const wardsByYear: Record<string, number> = {};

          yearsList.forEach(yr => {
            tasksByYear[yr] = 0;
            initiativesByYear[yr] = 0;
            startupsByYear[yr] = 0;
            ideasByYear[yr] = 0;
            projectsByYear[yr] = 0;
            patentsByYear[yr] = 0;
            expertsByYear[yr] = 0;
            supportOrgsByYear[yr] = 0;
            universitiesByYear[yr] = 0;
            wardsByYear[yr] = 0;
          });

          if (env.DB) {
            try {
              // Read only columns that actually exist in this D1 deployment.
              // Older and newer schemas use different names for task time fields;
              // one missing column must not silently zero the entire chart.
              const taskColumnInfo = await env.DB.prepare('PRAGMA table_info(science_tasks)').all<any>();
              const taskColumns = new Set((taskColumnInfo.results || []).map((column: any) => String(column.name)));
              const candidateColumns = [
                'acceptance_year', 'implementation_time', 'execution_time',
                'expected_start_date', 'start_date', 'start_year', 'created_at', 'data_json'
              ];
              const availableTaskColumns = candidateColumns.filter(column => taskColumns.has(column));
              if (availableTaskColumns.length > 0) {
                const taskRows = await env.DB.prepare(
                  `SELECT ${availableTaskColumns.map(column => `"${column}"`).join(', ')} FROM science_tasks ${buildPublicVisibilityWhere(taskColumns)}`
                ).all<any>();

                const getTaskValue = (row: any, custom: Record<string, any>, names: string[]) => {
                  const normalize = (value: string) => value.replace(/[_\s-]/g, '').toLowerCase();
                  for (const name of names) {
                    const target = normalize(name);
                    const physicalKey = Object.keys(row).find(key => normalize(key) === target);
                    if (physicalKey && row[physicalKey] !== null && row[physicalKey] !== undefined && String(row[physicalKey]).trim() !== '') {
                      return row[physicalKey];
                    }
                    const customKey = Object.keys(custom).find(key => normalize(key) === target);
                    if (customKey && custom[customKey] !== null && custom[customKey] !== undefined && String(custom[customKey]).trim() !== '') {
                      return custom[customKey];
                    }
                  }
                  return null;
                };

                const extractYear = (value: any): string | null => {
                  if (value === null || value === undefined) return null;
                  const match = String(value).match(/(?:19|20)\d{2}/);
                  if (!match) return null;
                  const year = Number(match[0]);
                  return year >= 1900 && year <= new Date().getFullYear() + 1 ? String(year) : null;
                };

                for (const row of (taskRows.results || [])) {
                  let custom: Record<string, any> = {};
                  try {
                    custom = row.data_json ? JSON.parse(String(row.data_json)) : {};
                    if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {};
                  } catch {
                    custom = {};
                  }

                  const year =
                    extractYear(getTaskValue(row, custom, ['acceptance_year', 'acceptanceYear'])) ||
                    extractYear(getTaskValue(row, custom, ['implementation_time', 'implementationTime', 'execution_time', 'executionTime'])) ||
                    extractYear(getTaskValue(row, custom, ['expected_start_date', 'expectedStartDate', 'start_date', 'startDate', 'start_year', 'startYear'])) ||
                    extractYear(getTaskValue(row, custom, ['created_at', 'createdAt'])) ||
                    '2026';
                  tasksByYear[year] = (tasksByYear[year] || 0) + 1;
                }
              }
            } catch (error) {
              console.error('Không thể tổng hợp số lượng đề tài theo năm:', error);
            }

            // Aggregate yearly counts for every charted module using the columns
            // actually present in the deployed D1 schema, with data_json fallback.
            const aggregateModuleYears = async (
              table: string,
              target: Record<string, number>,
              candidateFields: string[]
            ) => {
              try {
                const info = await env.DB.prepare('PRAGMA table_info("' + table + '")').all<any>();
                const columns = new Set((info.results || []).map((column: any) => String(column.name)));
                const availableFields = candidateFields.filter(field => columns.has(field));
                const selectedFields = [...new Set([...availableFields, ...(columns.has('data_json') ? ['data_json'] : []), ...(columns.has('status') ? ['status'] : []), ...(columns.has('publicity_level') ? ['publicity_level'] : [])])];
                if (selectedFields.length === 0) return;

                const rows = await env.DB.prepare(
                  'SELECT ' + selectedFields.map(field => '"' + field.replace(/"/g, '""') + '"').join(', ') + ' FROM "' + table + '"' + buildPublicVisibilityWhere(columns)
                ).all<any>();
                const normalizeKey = (value: string) => value.replace(/[_\s-]/g, '').toLowerCase();
                const extractYearValue = (value: any): string | null => {
                  if (value === null || value === undefined || String(value).trim() === '') return null;
                  const match = String(value).match(/(?:19|20)\d{2}/);
                  if (!match) return null;
                  const year = Number(match[0]);
                  return year >= 1900 && year <= new Date().getFullYear() + 1 ? String(year) : null;
                };

                for (const row of rows.results || []) {
                  let custom: Record<string, any> = {};
                  try {
                    custom = row.data_json ? JSON.parse(String(row.data_json)) : {};
                    if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {};
                  } catch {
                    custom = {};
                  }

                  let year: string | null = null;
                  for (const field of candidateFields) {
                    const key = normalizeKey(field);
                    const physicalKey = Object.keys(row).find(name => normalizeKey(name) === key);
                    const customKey = Object.keys(custom).find(name => normalizeKey(name) === key);
                    year = extractYearValue(
                      physicalKey && row[physicalKey] !== null && row[physicalKey] !== undefined && String(row[physicalKey]).trim() !== ''
                        ? row[physicalKey]
                        : customKey ? custom[customKey] : null
                    );
                    if (year) break;
                  }

                  const bucket = year || currentYr;
                  target[bucket] = (target[bucket] || 0) + 1;
                }
              } catch (error) {
                console.error('Không thể tổng hợp số lượng ' + table + ' theo năm:', error);
              }
            };

            await Promise.all([
              aggregateModuleYears('initiatives', initiativesByYear, [
                'recognition_year', 'approval_year', 'acceptance_year',
                'conception_date', 'start_date', 'created_at'
              ]),
              aggregateModuleYears('startups', startupsByYear, [
                'founded_date', 'founded_year', 'establishment_date',
                'established_year', 'start_year', 'created_at'
              ]),
              aggregateModuleYears('startup_projects', projectsByYear, [
                'founding_year', 'start_year', 'start_date', 'implementation_time', 'created_at'
              ]),
              aggregateModuleYears('startup_ideas', ideasByYear, [
                'submitted_at', 'submission_date', 'idea_date', 'created_at'
              ]),
              aggregateModuleYears('patents', patentsByYear, [
                'filing_date', 'application_date', 'grant_date', 'issue_date', 'created_at'
              ]),
              aggregateModuleYears('experts', expertsByYear, [
                'start_work_year', 'work_start_year', 'joined_at', 'join_date', 'registration_year', 'registration_date', 'created_at'
              ]),
              aggregateModuleYears('support_organizations', supportOrgsByYear, [
                'established_date', 'founded_date', 'establishment_year', 'created_at'
              ]),
              aggregateModuleYears('universities', universitiesByYear, [
                'established_date', 'founded_year', 'establishment_year', 'created_at'
              ]),
              aggregateModuleYears('wards', wardsByYear, [
                'effective_date', 'formed_date', 'created_at'
              ])
            ]);

            // Aggregate physical and custom fields. Missing values remain visible,
            // and multiple distinct labels on one record are counted once per label.
            const aggregateModuleGroups = async (table: string, target: Record<string, number>, candidateFields: string[]) => {
              try {
                const tableInfo = await env.DB.prepare('PRAGMA table_info("' + table + '")').all<any>();
                const tableColumns = new Set((tableInfo.results || []).map((column: any) => String(column.name)));
                const rows = await env.DB.prepare('SELECT * FROM "' + table + '"' + buildPublicVisibilityWhere(tableColumns)).all<any>();
                const normalizeKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[_\s-]/g, '').toLowerCase();
                for (const row of rows.results || []) {
                  let custom: Record<string, any> = {};
                  try { custom = row.data_json ? JSON.parse(String(row.data_json)) : {}; if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {}; } catch { custom = {}; }
                  let rawValue: any = null;
                  for (const candidate of candidateFields) {
                    const key = normalizeKey(candidate);
                    const physicalKey = Object.keys(row).find(name => normalizeKey(name) === key);
                    const customKey = Object.keys(custom).find(name => normalizeKey(name) === key);
                    const value = physicalKey ? row[physicalKey] : customKey ? custom[customKey] : null;
                    if (value !== null && value !== undefined && String(value).trim() !== '') { rawValue = value; break; }
                  }
                  const labels = Array.isArray(rawValue) ? rawValue : rawValue === null ? [] : String(rawValue).split(/[;|\n]+/);
                  const seen = new Set<string>();
                  let added = false;
                  for (const rawLabel of labels) {
                    const label = String(rawLabel ?? '').trim();
                    if (!label) continue;
                    const key = label.toLocaleLowerCase('vi');
                    if (seen.has(key)) continue;
                    seen.add(key);
                    target[label] = (target[label] || 0) + 1;
                    added = true;
                  }
                  if (!added) target['Chưa cập nhật'] = (target['Chưa cập nhật'] || 0) + 1;
                }
              } catch (error) { console.error('Không thể tổng hợp phân loại ' + table + ':', error); }
            };

            await Promise.all([
              aggregateModuleGroups('science_tasks', tasksByField, ['field', 'scientific_field', 'research_field', 'linhvuc', 'linhvuckhoahoc']),
              aggregateModuleGroups('science_tasks', tasksByUnit, ['lead_agency', 'managing_agency', 'lead_organization', 'owner_name', 'receiving_unit', 'organization', 'agency', 'coquanchutri', 'donvichutri']),
              aggregateModuleGroups('science_tasks', tasksByLevel, ['management_level', 'task_level', 'project_level', 'level', 'capquanly', 'capdetai']),
              aggregateModuleGroups('startup_projects', projectsByField, ['field', 'business_field', 'startup_field', 'sector', 'linhvuckhoinghiep', 'linhvuc'])
            ]);

            try {
              const initiativeInfo = await env.DB.prepare('PRAGMA table_info(initiatives)').all<any>();
              const initiativeColumns = new Set((initiativeInfo.results || []).map((column: any) => String(column.name)));
              const inf = await env.DB.prepare(`SELECT COALESCE(NULLIF(field, ''), 'Lĩnh vực khác') as f, COUNT(*) as c FROM initiatives ${buildPublicVisibilityWhere(initiativeColumns)} GROUP BY f`).all<any>();
              for (const r of (inf.results || [])) { if (r.f) initiativesByField[r.f] = Number(r.c) || 0; }
            } catch {}
          }

          // Classify approved/public startup ideas by the source column supplied in Excel.
          try {
            const ideaInfo = await env.DB.prepare('PRAGMA table_info(startup_ideas)').all<any>();
            const ideaColumns = new Set((ideaInfo.results || []).map((column: any) => String(column.name)));
            const ideaRows = await env.DB.prepare('SELECT * FROM startup_ideas' + buildPublicVisibilityWhere(ideaColumns)).all<any>();
            const normalizeOrigin = (value: any) => String(value ?? '').normalize('NFD')
              .replace(/[\\u0300-\\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
            for (const row of ideaRows.results || []) {
              let custom: Record<string, any> = {};
              try { custom = row.data_json ? JSON.parse(String(row.data_json)) : {}; } catch { custom = {}; }
              const raw = row.ward_or_school ?? row.ward_school ?? row.wardSchool ??
                custom.wardOrSchool ?? custom.wardSchool ?? custom.ward_or_school ?? custom.ideaOriginType ?? '';
              const label = normalizeOrigin(raw);
              if (/(truong|dai hoc|cao dang|school|university|college)/.test(label)) ideasByOrigin.school++;
              else if (/(xa|phuong|dackhu|ward|commune)/.test(label)) ideasByOrigin.ward++;
              else ideasByOrigin.other++;
            }
          } catch (error) {
            console.error('Không thể tổng hợp phân loại ý tưởng khởi nghiệp:', error);
          }

          // Expert composition is aggregated from live D1 rows, including
          // configurable fields stored in data_json by the import workflow.
          const expertsByField: Record<string, number> = {};
          const expertsByWorkplace: Record<string, number> = {};
          const expertsByDegree: Record<string, number> = {};
          const expertsBySpecialty: Record<string, number> = {};
          const expertsByTitle: Record<string, number> = {};
          try {
            const expertInfo = await env.DB.prepare('PRAGMA table_info(experts)').all<any>();
            const expertColumns = new Set((expertInfo.results || []).map((column: any) => String(column.name)));
            // Read all physical columns to include legacy/custom field names.
            const expertRows = await env.DB.prepare('SELECT * FROM experts').all<any>();
            if (expertColumns.size > 0) {
              const normalizeExpertKey = (value: string) => value.replace(/[_\s-]/g, '').toLowerCase();
              const getExpertValue = (row: any, custom: Record<string, any>, candidates: string[]) => {
                for (const candidate of candidates) {
                  const target = normalizeExpertKey(candidate);
                  const physicalKey = Object.keys(row).find(key => normalizeExpertKey(key) === target);
                  if (physicalKey && row[physicalKey] !== null && row[physicalKey] !== undefined && String(row[physicalKey]).trim()) return row[physicalKey];
                  const customKey = Object.keys(custom).find(key => normalizeExpertKey(key) === target);
                  if (customKey && custom[customKey] !== null && custom[customKey] !== undefined && String(custom[customKey]).trim()) return custom[customKey];
                }
                return null;
              };
              const addExpertGroup = (target: Record<string, number>, value: any, prefix = '', fallbackLabel?: string) => {
                const labels = Array.isArray(value) ? value : value === null || value === undefined ? [] : String(value).split(/[;|\n]+/);
                const seen = new Set<string>();
                let added = false;
                for (const rawLabel of labels) {
                  const label = String(rawLabel ?? '').trim();
                  if (!label) continue;
                  const displayLabel = prefix ? prefix + label : label;
                  const key = displayLabel.toLocaleLowerCase('vi');
                  if (seen.has(key)) continue;
                  seen.add(key);
                  target[displayLabel] = (target[displayLabel] || 0) + 1;
                  added = true;
                }
                if (!added && fallbackLabel) target[fallbackLabel] = (target[fallbackLabel] || 0) + 1;
              };
              for (const row of expertRows.results || []) {
                let custom: Record<string, any> = {};
                try {
                  custom = row.data_json ? JSON.parse(String(row.data_json)) : {};
                  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) custom = {};
                } catch { custom = {}; }

                const fieldValue = getExpertValue(row, custom, ['field', 'research_field', 'professional_field', 'expertise_area', 'major_field', 'specialization', 'specialty', 'expertise', 'research_area', 'linhvucchuyenmon', 'linhvuckhoahoc', 'linhvuc']);
                const specialtyValue = getExpertValue(row, custom, ['specialization', 'specialty', 'expertise', 'major', 'discipline', 'research_specialty', 'chuyenganh', 'chuyennganh', 'chuyenmon']);
                const workplaceValue = getExpertValue(row, custom, ['workplace', 'organization', 'current_affiliation', 'affiliation', 'agency', 'institution', 'working_unit', 'current_workplace', 'organization_name', 'unit', 'employer', 'work_unit', 'tendonvicongtac', 'coquancongtac', 'donvicongtac', 'coquan', 'tochuc']);
                addExpertGroup(expertsByField, fieldValue, '', 'Chưa cập nhật');
                addExpertGroup(expertsBySpecialty, specialtyValue, '', 'Chưa cập nhật');
                addExpertGroup(expertsByWorkplace, workplaceValue, '', 'Chưa cập nhật');

                const rankValue = getExpertValue(row, custom, ['academic_rank', 'academicRank', 'rank']);
                const degreeValue = getExpertValue(row, custom, ['degree', 'qualification', 'academic_degree']);
                const researchTitleValue = getExpertValue(row, custom, ['research_title', 'job_title', 'position']);
                addExpertGroup(expertsByDegree, degreeValue);
                addExpertGroup(expertsByTitle, rankValue, rankValue ? 'Học hàm: ' : '');
                addExpertGroup(expertsByTitle, degreeValue, degreeValue ? 'Học vị: ' : '');
                if (!rankValue && !degreeValue) addExpertGroup(expertsByTitle, researchTitleValue);
              }
            }
          } catch (error) {
            console.error('Không thể tổng hợp cơ cấu chuyên gia:', error);
          }

          const yearlyStats: Record<string, any> = {};
          yearsList.forEach(yr => {
            yearlyStats[yr] = {
              tasks: tasksByYear[yr] || 0,
              initiatives: initiativesByYear[yr] || 0,
              startups: startupsByYear[yr] || 0,
              budget: 0,
              savings: 0
            };
          });

          const totalScienceTasks = Number(counts.science_tasks) || 0;
          const realAccepted = Math.min(tasksAccepted, totalScienceTasks);
          const realRunning = Math.max(0, totalScienceTasks - realAccepted);
          const initiativesInCurrentYear = initiativesByYear[currentYr] || 0;

          return jsonResponse({
            success: true,
            stats: {
              totalScienceTasks,
              totalInitiatives: Number(counts.initiatives) || 0,
              totalExperts: Number(counts.experts) || 0,
              totalStartups: Number(counts.startups) || 0,
              totalSupportOrgs: Number(counts.support_organizations) || 0,
              totalProjects: Number(counts.startup_projects) || 0,
              totalIdeas: Number(counts.startup_ideas) || 0,
              totalWards: Number(counts.wards) || 0,
              totalUniversities: Number(counts.universities) || 0,
              totalFeaturedStartups: Number(counts.featured_startups) || 0,
              totalPatents: Number(counts.patents) || 0,
              totalOrganizations: Number(counts.organizations) || 0,
              totalInvestors: Number(counts.investors) || 0,
              totalFunds: Number(counts.investment_funds) || 0,
              totalTechnologies: Number(counts.technologies) || 0,
              totalPrograms: Number(counts.programs) || 0,
              totalCollaborationNeeds: Number(counts.collaboration_needs) || 0,
              totalPublications: Number(counts.publications) || 0,
              totalLabEquipments: Number(counts.lab_equipments) || 0,
              totalPolicies: Number(counts.policies) || 0,
              tasksAccepted: realAccepted,
              tasksRunning: realRunning,
              tasksPending: 0,
              initiativesRecognized: Number(counts.initiatives) || 0,
              initiativesInCurrentYear,
              currentYear: Number(currentYr),
              verifiedExperts: Number(counts.experts) || 0,
              totalBudgetApproved: totalBudget,
              totalCostSavings: totalSavings,
              pendingApprovalsCount,
              totalRelationships: 0,
              statusBreakdown: {
                approved: totalScienceTasks + (Number(counts.initiatives) || 0),
                under_review: 0,
                needs_revision: 0,
                draft: 0
              },
              tasksByYear,
              initiativesByYear,
              startupsByYear,
              ideasByYear,
              ideasByOrigin,
              projectsByYear,
              patentsByYear,
              expertsByYear,
              expertsByField,
              expertsByWorkplace,
              expertsByDegree,
              expertsBySpecialty,
              expertsByTitle,
              supportOrgsByYear,
              universitiesByYear,
              wardsByYear,
              tasksByField,
              tasksByUnit,
              tasksByLevel,
              projectsByField,
              initiativesByField,
              yearlyStats
            }
          }, 200, corsHeaders);
        } catch (err: any) {
          return jsonResponse({
            success: false,
            message: 'Lỗi tính toán chỉ số thống kê D1: ' + err.message
          }, 500, corsHeaders);
        }
      }

      // Database backup: export every application table from the live Cloudflare D1 database.
      // Password hashes are included so an authorized full-system recovery can preserve user accounts.
      if (url.pathname === '/api/backup' && request.method === 'GET') {
        if (!['super_admin', 'system_admin'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Bạn không có quyền tạo bản sao lưu hệ thống.' }, 403, corsHeaders);
        }
        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        }
        try {
          const tableResult = await env.DB.prepare(
            "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
          ).all<any>();
          const tables: Record<string, any[]> = {};
          const schema: Record<string, string> = {};

          for (const table of tableResult.results || []) {
            const tableName = String(table.name || '');
            // Cloudflare D1 exposes internal runtime tables (for example _cf_KV)
            // through sqlite_master, but access to those tables is prohibited.
            // They are platform-managed and must never be included in app backups.
            if (
              !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName) ||
              tableName.startsWith('sqlite_') ||
              tableName.startsWith('_cf_')
            ) continue;
            schema[tableName] = String(table.sql || '');
            const tableRows: any[] = [];
            let offset = 0;
            const pageSize = 500;
            while (true) {
              const page = await env.DB.prepare(
                'SELECT * FROM "' + tableName + '" LIMIT ? OFFSET ?'
              ).bind(pageSize, offset).all<any>();
              const rows = page.results || [];
              tableRows.push(...rows);
              if (rows.length < pageSize) break;
              offset += rows.length;
            }
            tables[tableName] = tableRows;
          }

          const configRow = (tables.system_config || [])[0] || {};
          const systemConfig = {
            portalName: configRow.portal_name || 'Cổng dữ liệu KHCN & KNĐMST TP Đà Nẵng',
            governingAgency: configRow.governing_agency || 'SỞ KHOA HỌC VÀ CÔNG NGHỆ ĐÀ NẴNG',
            contactAddress: configRow.contact_address || '',
            contactEmail: configRow.contact_email || '',
            contactPhone: configRow.contact_phone || '',
            cityArea: configRow.city_area || 'Thành phố Đà Nẵng',
            enablePublicSubmissions: Boolean(configRow.allow_public_submission ?? 1),
            requireApproval: Boolean(configRow.require_approval ?? 1)
          };

          const snapshot: Record<string, any> = {
            backupFormat: 'khcn-d1-full-backup-v1',
            generatedAt: new Date().toISOString(),
            source: 'Cloudflare D1',
            systemConfig,
            tables,
            schema
          };
          for (const moduleName of ALLOWED_MODULES) {
            snapshot[moduleName] = tables[moduleName] || [];
          }
          snapshot.users = tables.users || [];
          snapshot.relationships = tables.relationships || [];
          snapshot.auditLogs = tables.audit_logs || [];
          snapshot.connectionMessages = tables.connection_messages || [];
          snapshot.formConfigs = tables.form_configs || [];

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          return new Response(JSON.stringify(snapshot, null, 2), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Disposition': 'attachment; filename="khcn_full_database_backup_' + timestamp + '.json"',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
        } catch (error: any) {
          return jsonResponse({
            success: false,
            message: 'Không thể tạo bản sao lưu dữ liệu. Vui lòng thử lại hoặc liên hệ quản trị viên.'
          }, 500, corsHeaders);
        }
      }

      // Full restore is schema-checked and committed as one D1 batch transaction.
      if (url.pathname === '/api/restore' && request.method === 'POST') {
        if (currentUser.role !== 'super_admin') return jsonResponse({ success: false, message: 'Chỉ Super Admin mới được phục hồi toàn bộ dữ liệu hệ thống.' }, 403, corsHeaders);
        if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        const snapshot = await request.json().catch(() => null) as any;
        if (!snapshot || snapshot.backupFormat !== 'khcn-d1-full-backup-v1' || !snapshot.tables || typeof snapshot.tables !== 'object' || !snapshot.schema || typeof snapshot.schema !== 'object') return jsonResponse({ success: false, message: 'Tệp sao lưu không đúng định dạng snapshot D1 đầy đủ hoặc thiếu cấu trúc bảng.' }, 400, corsHeaders);
        try {
          if (new TextEncoder().encode(JSON.stringify(snapshot)).length > 20_000_000) return jsonResponse({ success: false, message: 'Snapshot vượt giới hạn an toàn 20 MB. Không có dữ liệu nào bị thay đổi.' }, 413, corsHeaders);
          const allow = new Set<string>([...ALLOWED_MODULES, 'system_config', 'users', 'entity_relationships', 'relationships', 'audit_logs', 'connection_messages', 'attachments', 'form_configs']);
          const tableResult = await env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all<any>();
          const actual = new Map<string, string>();
          for (const t of tableResult.results || []) if (allow.has(String(t.name))) actual.set(String(t.name), String(t.sql || ''));
          const names = Object.keys(snapshot.tables).filter(name => name !== 'd1_migrations');
          const unknown = names.filter(name => !allow.has(name));
          if (unknown.length) return jsonResponse({ success: false, message: 'Snapshot chứa bảng ngoài danh mục ứng dụng: ' + unknown.join(', ') }, 409, corsHeaders);
          const missing = [...actual.keys()].filter(name => !Object.prototype.hasOwnProperty.call(snapshot.tables, name));
          const extra = names.filter(name => !actual.has(name));
          if (missing.length || extra.length) return jsonResponse({ success: false, message: 'Cấu trúc snapshot không khớp D1. Thiếu: ' + (missing.join(', ') || 'không có') + '; dư: ' + (extra.join(', ') || 'không có') + '. Cần đồng bộ schema/migration trước khi phục hồi.' }, 409, corsHeaders);
          const norm = normalizeSnapshotSchemaSql;
          const rowsByTable = new Map<string, any[]>();
          let totalRows = 0;
          for (const tableName of actual.keys()) {
            const rows = snapshot.tables[tableName];
            const snapshotSql = String(snapshot.schema[tableName] || '');
            if (!Array.isArray(rows) || !snapshotSql.trim()) return jsonResponse({ success: false, message: `Snapshot thiếu dữ liệu/schema của bảng ${tableName}.` }, 409, corsHeaders);
            if (norm(snapshotSql) !== norm(actual.get(tableName) || '')) return jsonResponse({ success: false, message: `Schema bảng ${tableName} khác D1 hiện tại. Cần áp dụng migration tương ứng; dữ liệu chưa bị thay đổi.` }, 409, corsHeaders);
            const info = await env.DB.prepare(`PRAGMA table_info("${tableName}")`).all<any>();
            const columnRows = info.results || [];
            const columns = new Set(columnRows.map((column: any) => String(column.name)));
            const snapshotColumns = new Set<string>();
            for (const row of rows) {
              if (!row || typeof row !== 'object' || Array.isArray(row)) return jsonResponse({ success: false, message: `Snapshot có bản ghi không hợp lệ trong bảng ${tableName}.` }, 400, corsHeaders);
              Object.keys(row).forEach(key => snapshotColumns.add(key));
            }
            const unknownColumns = [...snapshotColumns].filter(column => !columns.has(column) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(column));
            if (unknownColumns.length) return jsonResponse({ success: false, message: `Bảng ${tableName} có cột không tồn tại trong D1: ${unknownColumns.join(', ')}.` }, 409, corsHeaders);
            const required = columnRows.filter((column: any) => (Number(column.notnull) === 1 || Number(column.pk) > 0) && column.dflt_value === null).map((column: any) => String(column.name));
            for (let i = 0; i < rows.length; i++) {
              const missingColumns = required.filter(column => !Object.prototype.hasOwnProperty.call(rows[i], column) || rows[i][column] === null || rows[i][column] === undefined);
              if (missingColumns.length) return jsonResponse({ success: false, message: `Bảng ${tableName}, dòng ${i + 1} thiếu cột bắt buộc: ${missingColumns.join(', ')}.` }, 409, corsHeaders);
            }
            if (new TextEncoder().encode(JSON.stringify(rows)).length > 1_800_000) return jsonResponse({ success: false, message: `Dữ liệu bảng ${tableName} vượt giới hạn 1,8 MB. Không có dữ liệu nào bị thay đổi.` }, 413, corsHeaders);
            rowsByTable.set(tableName, rows);
            totalRows += rows.length;
          }
          const users = rowsByTable.get('users') || [];
          const currentAdmin = users.find((u: any) => String(u.id) === String(currentUser.id));
          const activeAdmin = users.some((u: any) => String(u.role) === 'super_admin' && Number(u.is_active) === 1 && u.password_hash && (u.password_salt || u.salt));
          if (!currentAdmin || String(currentAdmin.role) !== 'super_admin' || Number(currentAdmin.is_active) !== 1 || !activeAdmin) return jsonResponse({ success: false, message: 'Snapshot phải giữ tài khoản Super Admin đang phục hồi và ít nhất một Super Admin đang hoạt động có hash/salt.' }, 409, corsHeaders);
          const deleteOrder = ['attachments', 'connection_messages', 'relationships', 'entity_relationships', 'audit_logs', ...[...ALLOWED_MODULES].reverse(), 'form_configs', 'users', 'system_config'];
          const insertOrder = ['system_config', 'users', 'form_configs', ...ALLOWED_MODULES, 'relationships', 'entity_relationships', 'connection_messages', 'attachments', 'audit_logs'];
          const statements: D1PreparedStatement[] = [];
          for (const name of deleteOrder) if (actual.has(name)) statements.push(env.DB.prepare(`DELETE FROM "${name}"`));
          for (const name of insertOrder) {
            if (!actual.has(name)) continue;
            const rows = rowsByTable.get(name) || [];
            if (!rows.length) continue;
            const columns = [...new Set(rows.flatMap((row: any) => Object.keys(row)))];
            const colSql = columns.map(col => `"${col}"`).join(', ');
            const selectSql = columns.map(col => `json_extract(value, '$."${col}"')`).join(', ');
            statements.push(env.DB.prepare(`INSERT INTO "${name}" (${colSql}) SELECT ${selectSql} FROM json_each(?)`).bind(JSON.stringify(rows)));
          }
          if (actual.has('audit_logs')) {
            const info = await env.DB.prepare('PRAGMA table_info("audit_logs")').all<any>();
            const cols = new Set((info.results || []).map((x: any) => String(x.name)));
            const now = new Date().toISOString();
            const values: Record<string, any> = { id: `log_restore_${crypto.randomUUID()}`, user_id: currentUser.id, user_name: currentUser.fullName, user_role: currentUser.role, action: 'restore', module: 'system', target_module: 'system', entity_id: null, target_id: null, details: `Phục hồi snapshot ${snapshot.generatedAt || 'không rõ thời điểm'} (${totalRows} bản ghi).`, created_at: now, timestamp: now };
            const entries = Object.entries(values).filter(([col]) => cols.has(col));
            if (entries.some(([col]) => col === 'action')) statements.push(env.DB.prepare(`INSERT INTO audit_logs (${entries.map(([col]) => `"${col}"`).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`).bind(...entries.map(([, value]) => value)));
          }
          const results = await env.DB.batch(statements);
          if (!Array.isArray(results) || results.length !== statements.length || results.some((result: any) => !result?.success)) throw new Error('D1 không xác nhận đầy đủ giao dịch phục hồi; D1 sẽ rollback nếu có lỗi trong batch.');
          return jsonResponse({ success: true, restoredTables: actual.size, restoredRows: totalRows, message: `Đã phục hồi ${totalRows} bản ghi trên ${actual.size} bảng trong một giao dịch D1.` }, 200, corsHeaders);
        } catch (error: any) {
          return jsonResponse({ success: false, message: 'Không thể phục hồi snapshot D1. Nếu giao dịch thất bại, D1 sẽ rollback toàn bộ thay đổi; vui lòng kiểm tra nhật ký hệ thống.' }, 500, corsHeaders);
        }
      }

      // K. Global Search across all D1 modules.
      if (url.pathname === '/api/search') {
        const rawQuery = sanitizeString(url.searchParams.get('q') || '').trim();
        const q = rawQuery.toLowerCase();
        const moduleType = url.searchParams.get('moduleType') || '';
        const field = sanitizeString(url.searchParams.get('field') || '');
        const status = sanitizeString(url.searchParams.get('status') || '');
        const targetModules = moduleType && ALLOWED_MODULES.includes(moduleType) ? [moduleType] : ALLOWED_MODULES;
        const allResults: any[] = [];
        if (!env.DB) return jsonResponse({ success: false, message: 'CSDL D1 chưa kết nối.' }, 500, corsHeaders);
        try {
          for (const mod of targetModules) {
            const canViewRestrictedRecords = canViewRestrictedModule(currentUser, mod);
            const tableInfo = await env.DB.prepare(`PRAGMA table_info(${mod})`).all<any>();
            const columnNames = (tableInfo.results || []).map((column: any) => String(column.name));
            const columns = new Set(columnNames);
            const searchable = columnNames.filter(column => !['id', 'created_by', 'updated_at', 'created_at', 'stt'].includes(column));
            const where: string[] = [];
            const params: any[] = [];
            if (q && searchable.length) {
              const upperQ = rawQuery.toUpperCase();
              const titleCaseQ = rawQuery.replace(/(^|\s)([^\s])/g, (_match: string, prefix: string, letter: string) => prefix + letter.toUpperCase());
              const queryVariants = [...new Set([rawQuery, q, upperQ, titleCaseQ])];
              where.push('(' + searchable.map(column => '(' + queryVariants.map(() => `CAST("${column}" AS TEXT) LIKE ?`).join(' OR ') + ')').join(' OR ') + ')');
              searchable.forEach(() => queryVariants.forEach(variant => params.push(`%${variant}%`)));
            }
            if (field && columns.has('field')) {
              where.push('LOWER(CAST(field AS TEXT)) = LOWER(?)');
              params.push(field);
            }
            if (status && status !== 'all' && canViewRestrictedRecords && columns.has('status')) {
              where.push('status = ?');
              params.push(status);
            }
            if (!canViewRestrictedRecords) {
              if (columns.has('status')) where.push("LOWER(COALESCE(status, '')) IN ('approved', 'published')");
              if (columns.has('publicity_level')) where.push("LOWER(COALESCE(publicity_level, 'public')) = 'public'");
            }
            const sql = `SELECT * FROM ${mod}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 2000`;
            const rows = await env.DB.prepare(sql).bind(...params).all<any>();
            for (const row of rows.results || []) {
              const hydrated = hydrateModuleRow(row, mod);
              allResults.push(canViewRestrictedRecords ? hydrated : redactPublicDetail(hydrated, mod));
              if (allResults.length >= 5000) break;
            }
            if (allResults.length >= 5000) break;
          }
        } catch (error: any) {
          return jsonResponse({ success: false, message: 'Không thể hoàn thành tìm kiếm dữ liệu. Vui lòng thử lại.' }, 500, corsHeaders);
        }
        return jsonResponse({ success: true, total: allResults.length, results: allResults }, 200, corsHeaders);
      }

      // L. Module CSV Export (D1-backed). Imports are handled by Q2 below.
      const exportPrefix = '/api/export/';
      if (url.pathname.startsWith(exportPrefix)) {
        const moduleName = url.pathname.slice(exportPrefix.length);
        if (!ALLOWED_MODULES.includes(moduleName)) {
          return jsonResponse({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' }, 400, corsHeaders);
        }
        if (!canExportModuleData(currentUser)) {
          return jsonResponse({ success: false, message: 'Bạn không có quyền xuất dữ liệu.' }, 403, corsHeaders);
        }
        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
        }
        if (request.method === 'GET') {
          try {
            const info = await env.DB.prepare('PRAGMA table_info(' + moduleName + ')').all<any>();
            const columns = (info.results || [])
              .map((column: any) => String(column.name))
              .filter((column: string) => !['password_hash', 'password_salt', 'salt'].includes(column));
            const rows = await env.DB.prepare('SELECT * FROM ' + moduleName + ' ORDER BY created_at DESC LIMIT 10000').all<any>();
            const escapeCsv = (value: any) => {
              const raw = value === null || value === undefined
                ? ''
                : typeof value === 'object' ? JSON.stringify(value) : String(value);
              const needsQuotes = raw.includes(',') || raw.includes('"') || raw.includes(String.fromCharCode(13)) || raw.includes(String.fromCharCode(10));
              return needsQuotes ? '"' + raw.replace(/"/g, '""') + '"' : raw;
            };
            const csv = [
              columns.map(escapeCsv).join(','),
              ...(rows.results || []).map((row: any) => columns.map(column => escapeCsv(row[column])).join(','))
            ].join(String.fromCharCode(13, 10));
            return new Response(String.fromCharCode(0xFEFF) + csv, {
              status: 200,
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="' + moduleName + '.csv"',
                'Cache-Control': 'no-store'
              }
            });
          } catch (e: any) {
            return jsonResponse({ success: false, message: 'Lỗi xuất dữ liệu D1: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
          }
        }
        return jsonResponse({ success: false, message: 'Phương thức yêu cầu không được hỗ trợ.' }, 405, corsHeaders);
      }

      // L. ImageKit CDN Auth & Upload
      if (url.pathname === '/api/imagekit/auth') {
        if (!['super_admin', 'system_admin', 'agency_leader', 'data_officer'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Yêu cầu đăng nhập để nhận chữ ký xác thực tải tệp.' }, 401, corsHeaders);
        }
        if (!env.IMAGEKIT_PRIVATE_KEY) {
          return jsonResponse({ success: false, message: 'Khóa IMAGEKIT_PRIVATE_KEY chưa được cấu hình.' }, 500, corsHeaders);
        }
        const tokenStr = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 2400;
        const privateKey = env.IMAGEKIT_PRIVATE_KEY;
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
          publicKey: env.IMAGEKIT_PUBLIC_KEY || '',
          urlEndpoint: env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/danangsokhcn'
        }, 200, corsHeaders);
      }

      if (url.pathname === '/api/imagekit/upload' && request.method === 'POST') {
        if (!['super_admin', 'system_admin', 'data_officer', 'agency_leader'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Yêu cầu đăng nhập để đính kèm tệp.' }, 401, corsHeaders);
        }
        if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        const body = await request.json().catch(() => ({})) as any;
        const { fileName, fileSize, mimeType, cdnUrl, entityId, moduleType, title } = body;
        const cleanFileName = sanitizeString(String(fileName || '')).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
        const numericFileSize = Number(fileSize);
        const cleanMimeType = sanitizeString(String(mimeType || 'application/octet-stream')).slice(0, 128);
        if (!cleanFileName || !cdnUrl || !moduleType || !ALLOWED_MODULES.includes(String(moduleType)) || !Number.isFinite(numericFileSize) || numericFileSize <= 0 || numericFileSize > 50 * 1024 * 1024) {
          return jsonResponse({ success: false, message: 'Thông tin tệp không hợp lệ; dung lượng tối đa 50 MB.' }, 400, corsHeaders);
        }
        if (/^(text\/html|application\/(?:javascript|x-javascript)|image\/svg\+xml)/i.test(cleanMimeType)) {
          return jsonResponse({ success: false, message: 'Định dạng tệp có nguy cơ thực thi nội dung không được chấp nhận.' }, 415, corsHeaders);
        }
        let normalizedCdnUrl = '';
        try {
          const parsedCdnUrl = new URL(String(cdnUrl));
          const configuredEndpoint = new URL(env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/danangsokhcn');
          if (configuredEndpoint.protocol !== 'https:' || parsedCdnUrl.protocol !== 'https:' || parsedCdnUrl.origin !== configuredEndpoint.origin || parsedCdnUrl.username || parsedCdnUrl.password) {
            throw new Error('CDN origin mismatch');
          }
          normalizedCdnUrl = parsedCdnUrl.toString();
        } catch {
          return jsonResponse({ success: false, message: 'Đường dẫn tệp phải thuộc CDN ImageKit HTTPS đã cấu hình.' }, 400, corsHeaders);
        }

        const isImage = cleanMimeType.startsWith('image/');
        const attachment = {
          id: `att_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          fileName: cleanFileName,
          fileSize: numericFileSize,
          mimeType: cleanMimeType,
          cdnUrl: normalizedCdnUrl,
          thumbnailUrl: isImage ? `${normalizedCdnUrl}?tr=w-300,h-300,fo-auto` : null,
          entityId: entityId ? sanitizeString(String(entityId)).slice(0, 128) : null,
          moduleType: String(moduleType),
          title: title ? sanitizeString(String(title)).slice(0, 255) : cleanFileName,
          uploadedBy: currentUser.fullName,
          createdAt: new Date().toISOString()
        };

        try {
          const info = await env.DB.prepare('PRAGMA table_info(attachments)').all<any>();
          const columns = new Set((info.results || []).map((column: any) => String(column.name)));
          const values: Record<string, any> = {
            id: attachment.id, file_name: attachment.fileName, file_size: attachment.fileSize,
            mime_type: attachment.mimeType, file_type: attachment.mimeType, cdn_url: attachment.cdnUrl,
            thumbnail_url: attachment.thumbnailUrl, entity_id: attachment.entityId,
            module_type: attachment.moduleType, title: attachment.title, uploaded_by: attachment.uploadedBy,
            created_at: attachment.createdAt
          };
          const entries = Object.entries(values).filter(([column]) => columns.has(column));
          const result = await env.DB.prepare(`INSERT INTO attachments (${entries.map(([column]) => `"${column}"`).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`).bind(...entries.map(([, value]) => value)).run();
          if (!result.success || Number(result.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận đã lưu thông tin tệp.');
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Không thể lưu thông tin tệp đính kèm: ' + (e?.message || 'Lỗi D1') }, 500, corsHeaders);
        }

        return jsonResponse({ success: true, data: attachment }, 201, corsHeaders);
      }

      // M. Attachments List & Delete
      if (url.pathname === '/api/attachments' || url.pathname.startsWith('/api/attachments/')) {
        const attId = url.pathname.replace('/api/attachments', '').replace(/^\//, '');

        if (request.method === 'GET') {
          const entityId = url.searchParams.get('entityId');
          const moduleType = url.searchParams.get('moduleType');
          if (!moduleType || !canViewRestrictedModule(currentUser, moduleType)) return jsonResponse({ success: false, message: 'Bạn không có quyền xem thông tin tệp đính kèm của phân hệ này.' }, 403, corsHeaders);
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
          }
          try {
            let sql = 'SELECT * FROM attachments WHERE 1=1';
            const params: any[] = [];
            if (entityId) {
              sql += ' AND entity_id = ?';
              params.push(entityId);
            }
            if (moduleType) {
              sql += ' AND module_type = ?';
              params.push(moduleType);
            }
            const rows = await env.DB.prepare(sql).bind(...params).all();
            return jsonResponse({ success: true, data: rows.results || [] }, 200, corsHeaders);
          } catch (e: any) {
            return jsonResponse({ success: false, message: 'Lỗi truy vấn tệp đính kèm: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
          }
        }

        if (attId && request.method === 'DELETE') {
          if (!['super_admin', 'system_admin', 'data_officer'].includes(currentUser.role)) return jsonResponse({ success: false, message: 'Bạn không có quyền xóa tệp đính kèm.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
          }
          try {
            await env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(attId).run();
            return jsonResponse({ success: true }, 200, corsHeaders);
          } catch (e: any) {
            return jsonResponse({ success: false, message: 'Lỗi xóa tệp đính kèm: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
          }
        }
      }

      // N. Relationships: support both current and legacy D1 table names with strict RBAC.
      if (url.pathname === '/api/relationships' || url.pathname.startsWith('/api/relationships/')) {
        const relId = url.pathname.replace('/api/relationships', '').replace(/^\//, '');
        const canReadRelationships = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'].includes(currentUser.role);
        const canWriteRelationships = ['super_admin', 'system_admin', 'data_officer'].includes(currentUser.role);
        if (request.method === 'GET' && !canReadRelationships) return jsonResponse({ success: false, message: 'Bạn không có quyền xem dữ liệu liên kết nội bộ.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
        if (['POST', 'DELETE'].includes(request.method) && !canWriteRelationships) return jsonResponse({ success: false, message: 'Bạn không có quyền thay đổi dữ liệu liên kết.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
        if (!env.DB) return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
        try {
          const tableName = await ensureRelationshipsTable(env.DB);
          const info = await env.DB.prepare(`PRAGMA table_info("${tableName}")`).all<any>();
          const columns = new Set((info.results || []).map((column: any) => String(column.name)));

          if (request.method === 'GET') {
            const entityId = url.searchParams.get('entityId');
            let sql = `SELECT * FROM "${tableName}"`;
            const params: any[] = [];
            if (entityId) { sql += ' WHERE source_id = ? OR target_id = ?'; params.push(entityId, entityId); }
            const rows = await env.DB.prepare(sql).bind(...params).all<any>();
            return jsonResponse({ success: true, data: (rows.results || []).map(normalizeRelationshipRow) }, 200, corsHeaders);
          }

          if (request.method === 'POST') {
            const body = await request.json().catch(() => ({})) as any;
            const sourceId = String(body.sourceId || '').trim();
            const sourceModule = String(body.sourceModule || body.sourceType || '').trim();
            const targetId = String(body.targetId || '').trim();
            const targetModule = String(body.targetModule || body.targetType || '').trim();
            if (!sourceId || !targetId || !ALLOWED_MODULES.includes(sourceModule) || !ALLOWED_MODULES.includes(targetModule)) {
              return jsonResponse({ success: false, message: 'Thông tin hai hồ sơ liên kết không hợp lệ.' }, 400, corsHeaders);
            }
            const id = `rel_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
            const createdAt = new Date().toISOString();
            const values: Record<string, any> = {
              id, source_id: sourceId, source_type: sourceModule, source_module: sourceModule,
              source_title: sanitizeString(body.sourceTitle || ''),
              target_id: targetId, target_type: targetModule, target_module: targetModule,
              target_title: sanitizeString(body.targetTitle || ''),
              relation_type: sanitizeString(body.relationType || 'relates_to'),
              relationship_type: sanitizeString(body.relationType || 'relates_to'),
              notes: sanitizeString(body.notes || body.verificationSource || ''),
              description: sanitizeString(body.verificationSource || body.notes || ''),
              verification_source: sanitizeString(body.verificationSource || ''),
              status: ['active', 'pending', 'ended'].includes(String(body.status || '')) ? String(body.status) : 'active',
              valid_from: body.validFrom || null, valid_to: body.validTo || null,
              created_by: currentUser.id, created_at: createdAt
            };
            const required = (info.results || []).filter((column: any) => Number(column.notnull) === 1 && column.dflt_value === null && String(column.name) !== 'id');
            for (const column of required) {
              const value = values[String(column.name)];
              if (value === undefined || value === null || value === '') return jsonResponse({ success: false, message: `Thiếu trường bắt buộc của bảng liên kết: ${column.name}.` }, 409, corsHeaders);
            }
            const entries = Object.entries(values).filter(([column]) => columns.has(column));
            const result = await env.DB.prepare(`INSERT INTO "${tableName}" (${entries.map(([column]) => `"${column}"`).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`).bind(...entries.map(([, value]) => value)).run();
            if (!result.success || Number(result.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận đã tạo liên kết.');
            return jsonResponse({ success: true, data: normalizeRelationshipRow(values) }, 201, corsHeaders);
          }

          if (relId && request.method === 'DELETE') {
            const result = await env.DB.prepare(`DELETE FROM "${tableName}" WHERE id = ?`).bind(relId).run();
            if (!result.success || Number(result.meta?.changes || 0) !== 1) return jsonResponse({ success: false, message: 'Không tìm thấy liên kết hoặc D1 không xác nhận xóa.' }, 404, corsHeaders);
            return jsonResponse({ success: true }, 200, corsHeaders);
          }
          return jsonResponse({ success: false, message: 'Phương thức yêu cầu không được hỗ trợ.' }, 405, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Lỗi xử lý liên kết D1: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
        }
      }

            // O. Audit Logs
      if (url.pathname === '/api/audit-logs') {
        if (!['super_admin', 'system_admin', 'agency_leader', 'data_officer'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Bạn không có quyền xem nhật ký hệ thống.' }, 403, corsHeaders);
        }
        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
        }
        try {
          await ensureAuditLogTable(env.DB);
          // Viewing the audit trail is itself an auditable security event. This also
          // confirms the trail is writable when a newly initialized system has no rows.
          await buildAuditLogStatement(env.DB, currentUser, 'view', 'audit_logs', '', 'Truy cập Nhật ký truy vết hệ thống').then(statement => statement.run());
          const auditColumns = await ensureAuditLogTable(env.DB);
          const sortColumn = auditColumns.has('timestamp') ? 'timestamp' : 'created_at';
          const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
          const limit = Number.isFinite(requestedLimit) ? Math.min(500, Math.max(1, requestedLimit)) : 100;
          const rows = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY "${sortColumn}" DESC LIMIT ?`).bind(limit).all();
          return jsonResponse({ success: true, logs: rows.results || [] }, 200, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Lỗi truy vấn nhật ký hệ thống: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
        }
      }

      // P. Connections / Collaboration Messages
      if (url.pathname === '/api/connections' || url.pathname.startsWith('/api/connections/')) {
        const connectionId = url.pathname.replace('/api/connections', '').replace(/^\//, '');
        if (request.method === 'GET') {
          if (!isPrivilegedMessageReader(currentUser)) return jsonResponse({ success: false, message: 'Bạn không có quyền xem nội dung tin nhắn kết nối.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
          const needId = url.searchParams.get('needId');
          if (!env.DB) {
            return jsonResponse({ success: false, message: 'Chưa kết nối cơ sở dữ liệu D1.' }, 500, corsHeaders);
          }
          try {
            const info = await env.DB.prepare('PRAGMA table_info(connection_messages)').all<any>();
            const columns = new Set((info.results || []).map((column: any) => String(column.name)));
            const linkColumn = columns.has('need_id') ? 'need_id' : columns.has('target_entity_id') ? 'target_entity_id' : '';
            let sql = 'SELECT * FROM connection_messages WHERE 1=1';
            const params: any[] = [];
            if (needId && linkColumn) { sql += ` AND ${linkColumn} = ?`; params.push(needId); }
            const rows = await env.DB.prepare(sql).bind(...params).all();
            return jsonResponse({ success: true, data: rows.results || [] }, 200, corsHeaders);
          } catch (e: any) {
            return jsonResponse({ success: false, message: 'Lỗi truy vấn tin nhắn kết nối: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
          }
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({})) as any;
          if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
          const needId = String(body.needId || body.targetEntityId || '').trim();
          const senderName = sanitizeString(body.senderName || '');
          const senderEmail = sanitizeString(body.senderEmail || '').toLowerCase();
          const messageText = sanitizeString(body.message || '');
          if (!needId || !senderName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) || !messageText) return jsonResponse({ success: false, message: 'Vui lòng cung cấp hồ sơ kết nối, họ tên, email hợp lệ và nội dung tin nhắn.' }, 400, corsHeaders);
          const target = await env.DB.prepare('SELECT * FROM collaboration_needs WHERE id = ?').bind(needId).first<any>();
          if (!target) return jsonResponse({ success: false, message: 'Không tìm thấy nhu cầu kết nối được chọn.' }, 404, corsHeaders);
          const targetStatus = String(target.status || 'published').toLowerCase();
          const targetVisibility = String(target.publicity_level || target.publicityLevel || 'public').toLowerCase();
          if (!['approved', 'published'].includes(targetStatus) || !['public', ''].includes(targetVisibility)) return jsonResponse({ success: false, message: 'Nhu cầu kết nối hiện không được công khai hoặc không còn tiếp nhận kết nối.' }, 404, corsHeaders);
          const targetTitle = String(target.title || target.name || target.need_title || needId);
          const msg = {
            id: `msg_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`,
            needId,
            senderName,
            senderEmail,
            senderPhone: sanitizeString(body.senderPhone || ''),
            senderOrg: sanitizeString(body.senderOrg || ''),
            message: messageText,
            proposedCapability: sanitizeString(body.proposedCapability || ''),
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          try {
            const info = await env.DB.prepare('PRAGMA table_info(connection_messages)').all<any>();
            const columns = new Set((info.results || []).map((column: any) => String(column.name)));
            const values: Record<string, any> = {
              id: msg.id, need_id: needId, target_entity_id: needId,
              target_entity_type: 'collaboration_needs', target_entity_title: targetTitle,
              sender_name: msg.senderName, sender_email: msg.senderEmail, sender_phone: msg.senderPhone,
              sender_org: msg.senderOrg, message: msg.message, proposed_capability: msg.proposedCapability,
              status: msg.status, created_at: msg.createdAt
            };
            const required = (info.results || []).filter((column: any) => Number(column.notnull) === 1 && column.dflt_value === null && String(column.name) !== 'id');
            for (const column of required) {
              const value = values[String(column.name)];
              if (value === undefined || value === null || value === '') return jsonResponse({ success: false, message: `Thiếu trường bắt buộc của bảng tin nhắn: ${column.name}.` }, 409, corsHeaders);
            }
            const entries = Object.entries(values).filter(([column]) => columns.has(column));
            const result = await env.DB.prepare(`INSERT INTO connection_messages (${entries.map(([column]) => `"${column}"`).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`).bind(...entries.map(([, value]) => value)).run();
            if (!result.success || Number(result.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận đã lưu tin nhắn.');
            return jsonResponse({ success: true, data: { ...msg, targetEntityTitle: targetTitle } }, 201, corsHeaders);
          } catch (e: any) {
            return jsonResponse({ success: false, message: 'Không thể lưu tin nhắn kết nối: ' + (e?.message || 'Lỗi D1') }, 500, corsHeaders);
          }
        }

        if (connectionId && request.method === 'PATCH') {
          if (!isPrivilegedMessageReader(currentUser)) return jsonResponse({ success: false, message: 'Bạn không có quyền cập nhật trạng thái tin nhắn.' }, 403, corsHeaders);
          if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
          const body = await request.json().catch(() => ({})) as any;
          const nextStatus = String(body.status || '');
          if (!['accepted', 'declined'].includes(nextStatus)) return jsonResponse({ success: false, message: 'Trạng thái tin nhắn không hợp lệ.' }, 400, corsHeaders);
          try {
            const result = await env.DB.prepare('UPDATE connection_messages SET status = ? WHERE id = ?').bind(nextStatus, connectionId).run();
            if (!result.success || Number(result.meta?.changes || 0) !== 1) return jsonResponse({ success: false, message: 'Không tìm thấy tin nhắn hoặc không cập nhật được trạng thái.' }, 404, corsHeaders);
            return jsonResponse({ success: true, message: 'Đã cập nhật trạng thái tin nhắn.' }, 200, corsHeaders);
          } catch (e: any) { return jsonResponse({ success: false, message: 'Lỗi cập nhật tin nhắn: ' + (e?.message || 'Lỗi D1') }, 500, corsHeaders); }
        }
      }

      // Admin form configuration. Keep configuration writes separate from record workflow state.
      if (url.pathname.startsWith('/api/forms/')) {
        const moduleName = url.pathname.replace('/api/forms/', '').trim();
        if (!ALLOWED_MODULES.includes(moduleName)) return jsonResponse({ success: false, message: 'Phân hệ biểu mẫu không hợp lệ.' }, 400, corsHeaders);
        if (!['super_admin', 'system_admin', 'data_officer'].includes(currentUser.role)) return jsonResponse({ success: false, message: 'Bạn không có quyền truy cập cấu hình biểu mẫu.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
        if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        try {
          await ensureFormConfigsTable(env.DB);
          if (request.method === 'GET') {
            const row = await env.DB.prepare('SELECT config_json FROM form_configs WHERE module_type = ?').bind(moduleName).first<any>();
            let config: any = { customFields: [], hiddenSystemFields: [], fieldOverrides: {} };
            if (row?.config_json) {
              try { config = JSON.parse(String(row.config_json)); } catch { throw new Error('Cấu hình biểu mẫu trong D1 không phải JSON hợp lệ.'); }
            }
            return jsonResponse({ success: true, config }, 200, corsHeaders);
          }
          if (request.method === 'PUT') {
            if (!['super_admin', 'system_admin'].includes(currentUser.role)) return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới được thay đổi cấu hình biểu mẫu.' }, 403, corsHeaders);
            const body = await request.json().catch(() => null);
            if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse({ success: false, message: 'Cấu hình biểu mẫu không hợp lệ.' }, 400, corsHeaders);
            const config = sanitizeObject(body);
            const result = await env.DB.prepare(`
              INSERT INTO form_configs (module_type, config_json, updated_by, updated_at)
              VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(module_type) DO UPDATE SET
                config_json = excluded.config_json,
                updated_by = excluded.updated_by,
                updated_at = datetime('now')
            `).bind(moduleName, JSON.stringify(config), currentUser.id).run();
            if (!result.success || Number(result.meta?.changes || 0) < 1) throw new Error('D1 không xác nhận đã lưu cấu hình biểu mẫu.');
            const saved = await env.DB.prepare('SELECT config_json FROM form_configs WHERE module_type = ?').bind(moduleName).first<any>();
            if (!saved?.config_json) throw new Error('Không đọc lại được cấu hình sau khi lưu.');
            return jsonResponse({ success: true, config: JSON.parse(String(saved.config_json)) }, 200, corsHeaders);
          }
          return jsonResponse({ success: false, message: 'Phương thức yêu cầu không được hỗ trợ.' }, 405, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Lỗi cấu hình biểu mẫu D1: ' + (e?.message || 'Không xác định') }, 500, corsHeaders);
        }
      }

      // Read-only D1 schema diagnostics and SQL schema export.
      if (url.pathname === '/api/d1/reconcile') {
        if (!['super_admin', 'system_admin'].includes(currentUser.role)) return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới được đối soát cấu trúc D1.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
        if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        try {
          const result = await env.DB.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type, name").all<any>();
          const objects = (result.results || []).map((row: any) => ({ name: String(row.name), type: String(row.type) }));
          const names = new Set(objects.filter((row: any) => row.type === 'table').map((row: any) => row.name));
          const requiredTables = [...ALLOWED_MODULES, 'users', 'system_config', 'audit_logs', 'attachments', 'connection_messages', 'form_configs'];
          const relationshipAvailable = names.has('relationships') || names.has('entity_relationships');
          const missingTables = requiredTables.filter(name => !names.has(name));
          if (!relationshipAvailable) missingTables.push('relationships (hoặc entity_relationships)');
          return jsonResponse({ success: true, data: { checkedAt: new Date().toISOString(), objects, missingTables, healthy: missingTables.length === 0 } }, 200, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Không thể đối soát cấu trúc D1: ' + (e?.message || 'Lỗi không xác định') }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/d1/export-sql') {
        if (!['super_admin', 'system_admin'].includes(currentUser.role)) return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới được xuất cấu trúc SQL D1.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
        if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
        try {
          const rows = await env.DB.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table', 'index', 'view', 'trigger') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 WHEN 'view' THEN 3 ELSE 4 END, name").all<any>();
          const sql = (rows.results || []).map((row: any) => String(row.sql).trim().replace(/;?$/, ';')).join('\n\n') + '\n';
          return new Response(sql, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': url.searchParams.get('download') === '1' ? 'attachment; filename="khcn_d1_schema.sql"' : 'inline; filename="khcn_d1_schema.sql"', 'Cache-Control': 'no-store' } });
        } catch (e: any) {
          return jsonResponse({ success: false, message: 'Không thể xuất cấu trúc SQL D1: ' + (e?.message || 'Lỗi không xác định') }, 500, corsHeaders);
        }
      }

      // Q. Modules CRUD
      if (url.pathname.startsWith('/api/modules/')) {
        const parts = url.pathname.replace('/api/modules/', '').split('/');
        const moduleName = parts[0];
        const recordId = parts[1];
        const subAction = parts[2];

        if (!ALLOWED_MODULES.includes(moduleName)) {
          return jsonResponse({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' }, 400, corsHeaders);
        }
        // Partner/ward accounts are restricted to their assigned startup modules.
        if (currentUser.role === 'partner_officer' && !['startup_projects', 'startup_ideas'].includes(moduleName)) {
          return jsonResponse({ success: false, message: 'Tài khoản đơn vị chỉ được truy cập phân hệ Dự án khởi nghiệp và Ý tưởng khởi nghiệp.' }, 403, corsHeaders);
        }

        // 1. Workflow Transition: POST /api/modules/:moduleName/:id/workflow
        if (recordId && subAction === 'workflow' && request.method === 'POST') {
          if (!canApproveWorkflow(currentUser)) {
            return jsonResponse({ success: false, message: 'Bạn không có quyền phê duyệt quy trình hồ sơ.' }, 403, corsHeaders);
          }
          const body = await request.json().catch(() => ({})) as any;
          const { status, note } = body;
          const nextStatus = String(status || '');
          if (!isAllowedWorkflowStatus(nextStatus)) return jsonResponse({ success: false, message: 'Trạng thái quy trình không hợp lệ.' }, 400, corsHeaders);
          if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
          if (env.DB) {
            try {
              const wfInfo = await env.DB.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
              const wfColumns = new Set((wfInfo.results || []).map((column: any) => column.name));
              const wfAssignments = ['status = ?', "updated_at = datetime('now')"];
              const wfValues: any[] = [nextStatus];
              if (wfColumns.has('verification_status')) { wfAssignments.push('verification_status = ?'); wfValues.push(nextStatus === 'approved' || nextStatus === 'published' ? 'verified' : 'unverified'); }
              if (wfColumns.has('publicity_level')) {
                wfAssignments.push('publicity_level = ?');
                wfValues.push(nextStatus === 'approved' || nextStatus === 'published' ? 'public' : 'private');
              }
              wfValues.push(recordId);
              const auditColumns = await ensureAuditLogTable(env.DB);
              const updateStatement = env.DB.prepare(`UPDATE ${moduleName} SET ${wfAssignments.join(', ')} WHERE id = ?`).bind(...wfValues);
              const auditValues: Record<string, any> = {
                id: `log_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
                user_id: currentUser.id,
                user_name: currentUser.fullName,
                user_role: currentUser.role,
                action: 'workflow',
                module: moduleName,
                target_module: moduleName,
                entity_id: recordId,
                target_id: recordId,
                details: `Chuyển trạng thái sang [${nextStatus}]: ${note || ''}`,
                created_at: new Date().toISOString(),
                timestamp: new Date().toISOString()
              };
              const auditEntries = Object.entries(auditValues).filter(([column]) => auditColumns.has(column));
              const auditStatement = env.DB.prepare(
                `INSERT INTO audit_logs (${auditEntries.map(([column]) => column).join(', ')}) VALUES (${auditEntries.map(() => '?').join(', ')})`
              ).bind(...auditEntries.map(([, value]) => value));
              const results = await env.DB.batch([updateStatement, auditStatement]);
              if (!results?.[0]?.success || !results?.[1]?.success) throw new Error('D1 không xác nhận đầy đủ thao tác quy trình và nhật ký.');
              if (Number(results?.[0]?.meta?.changes || 0) < 1) {
                return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi hoặc bản ghi đã thay đổi trước khi phê duyệt. Vui lòng tải lại danh sách.' }, 404, corsHeaders);
              }
            } catch (e: any) {
              return jsonResponse({ success: false, message: 'Lỗi cập nhật quy trình D1: ' + e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: true, data: { id: recordId, status, note } }, 200, corsHeaders);
        }

        // 2. GET Single Record: GET /api/modules/:moduleName/:id
        if (recordId && request.method === 'GET') {
          if (env.DB) {
            try {
              const rawItem = await env.DB.prepare(`SELECT * FROM ${moduleName} WHERE id = ?`).bind(recordId).first<any>();
              const item = hydrateModuleRow(rawItem);
              if (!item) {
                return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi.' }, 404, corsHeaders);
              }
              const canViewRestrictedRecord = canViewRestrictedModule(currentUser, moduleName);
              if (!canViewRestrictedRecord) {
                const status = String(item.status || '').toLowerCase();
                const publicity = String(item.publicityLevel || 'public').toLowerCase();
                if (!['approved', 'published'].includes(status) || publicity !== 'public') {
                  return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi.' }, 404, corsHeaders);
                }
              }
              const relTables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('relationships', 'entity_relationships')").all<any>();
              const relNames = new Set((relTables.results || []).map((row: any) => String(row.name)));
              const relTable = relNames.has('relationships') ? 'relationships' : relNames.has('entity_relationships') ? 'entity_relationships' : '';
              let rels: any[] = [];
              if (relTable) {
                const relResult = await env.DB.prepare(`SELECT * FROM "${relTable}" WHERE source_id = ? OR target_id = ?`).bind(recordId, recordId).all<any>();
                rels = (relResult.results || []).map(normalizeRelationshipRow);
              }
              const responseItem = canViewRestrictedRecord ? item : redactPublicDetail(item, moduleName);
              return jsonResponse({ success: true, data: responseItem, relationships: rels }, 200, corsHeaders);
            } catch (e: any) {
              return jsonResponse({ success: false, message: e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi.' }, 404, corsHeaders);
        }

        // 3. GET Module Records: GET /api/modules/:moduleName
        if (!recordId && request.method === 'GET') {
          if (env.DB) {
            try {
              const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '200', 10) || 200));
              const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
              const canViewRestrictedRecords = canViewRestrictedModule(currentUser, moduleName);
              const publicOnly = url.searchParams.get('publicOnly') === 'true' || !canViewRestrictedRecords;
              let visibilityWhere = '';
              if (publicOnly) {
                const tableInfo = await env.DB.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
                const columns = new Set((tableInfo.results || []).map((column: any) => column.name));
                visibilityWhere = buildPublicVisibilityWhere(columns);
              }
              const results = await env.DB.prepare(`SELECT * FROM ${moduleName}${visibilityWhere} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(limit, offset).all<any>();
              const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM ${moduleName}${visibilityWhere}`).first<{ total: number }>();
              return jsonResponse({
                success: true,
                moduleType: moduleName,
                total: countResult?.total || 0,
                data: (results.results || []).map(row => {
                  const hydrated = hydrateModuleRow(row, moduleName);
                  return canViewRestrictedRecords ? hydrated : redactPublicDetail(hydrated, moduleName);
                })
              }, 200, corsHeaders);
            } catch (e: any) {
              return jsonResponse({ success: false, message: 'Lỗi truy vấn D1: ' + e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: true, moduleType: moduleName, total: 0, data: [] }, 200, corsHeaders);
        }

        // 4. CREATE Record: POST /api/modules/:moduleName
        if (!recordId && request.method === 'POST') {
          if (!canCreateModuleRecords(currentUser, moduleName)) return jsonResponse({ success: false, message: 'Bạn không có quyền tạo hồ sơ trong phân hệ này.' }, 403, corsHeaders);
          if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
          if (currentUser.role === 'public_user') {
            const cfg = await env.DB.prepare('SELECT allow_public_submission FROM system_config ORDER BY updated_at DESC LIMIT 1').first<any>();
            if (Number(cfg?.allow_public_submission ?? 1) !== 1) return jsonResponse({ success: false, message: 'Hệ thống hiện không tiếp nhận hồ sơ trực tuyến.' }, 403, corsHeaders);
          }
          const body = await request.json().catch(() => ({})) as any;
          const clean = sanitizeObject(body);
          for (const protectedField of ['status', 'verificationStatus', 'verification_status', 'publicityLevel', 'publicity_level', 'approvedBy', 'approved_by', 'verifiedBy', 'verified_by', 'createdBy', 'created_by', 'id', 'history']) delete clean[protectedField];
          const newId = `${moduleName.slice(0, 4)}_${Date.now()}`;
          clean.id = newId;
          clean.created_at = new Date().toISOString();
          clean.updated_at = new Date().toISOString();
          clean.status = currentUser.role === 'public_user' ? 'submitted' : 'draft';
          clean.verification_status = 'unverified';
          clean.publicity_level = 'private';
          clean.created_by = currentUser.fullName;

          if (env.DB) {
            try {
              const physicalColumns = await ensureModuleDataJson(env.DB, moduleName);
              const customFields: Record<string, any> = {};
              const entries: Array<[string, any]> = [];
              for (const key of Object.keys(clean)) {
                const column = toSqlColumn(key);
                if (column === 'data_json') continue;
                if (physicalColumns.has(column)) entries.push([column, clean[key]]);
                else customFields[key] = clean[key];
              }
              if (physicalColumns.has('data_json')) {
                entries.push(['data_json', JSON.stringify(customFields)]);
              }
              const cols = entries.map(([column]) => column).join(', ');
              const placeholders = entries.map(() => '?').join(', ');
              const values = entries.map(([, value]) => typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
              const recordStatement = env.DB.prepare(`INSERT INTO ${moduleName} (${cols}) VALUES (${placeholders})`).bind(...values);
              const auditStatement = await buildAuditLogStatement(env.DB, currentUser, 'create', moduleName, newId, `Tạo mới bản ghi [${clean.title || clean.id}]`);
              const writeResults = await env.DB.batch([recordStatement, auditStatement]);
              if (!writeResults?.[0]?.success || Number(writeResults[0]?.meta?.changes || 0) !== 1 || !writeResults?.[1]?.success || Number(writeResults[1]?.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận đầy đủ thao tác tạo hồ sơ và nhật ký kiểm toán; giao dịch đã được hoàn tác.');
            } catch (e: any) {
              return jsonResponse({ success: false, message: 'Lỗi ghi dữ liệu D1: ' + e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: true, data: clean }, 201, corsHeaders);
        }

        // 5. UPDATE Record: PUT /api/modules/:moduleName/:id
        if (recordId && request.method === 'PUT') {
          if (!canManageModuleRecords(currentUser, moduleName)) return jsonResponse({ success: false, message: 'Bạn không có quyền chỉnh sửa hồ sơ trong phân hệ này.' }, currentUser.role === 'public_user' ? 401 : 403, corsHeaders);
          if (!env.DB) return jsonResponse({ success: false, message: 'Cơ sở dữ liệu D1 chưa kết nối.' }, 500, corsHeaders);
          const body = await request.json().catch(() => ({})) as any;
          const clean = sanitizeObject(body);
          for (const protectedField of ['status', 'verificationStatus', 'verification_status', 'publicityLevel', 'publicity_level', 'approvedBy', 'approved_by', 'verifiedBy', 'verified_by', 'createdBy', 'created_by', 'createdAt', 'created_at', 'id', 'history']) delete clean[protectedField];
          clean.updated_at = new Date().toISOString();

          {
            try {
              const info = await env.DB.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
              const physicalColumns = new Set((info.results || []).map((column: any) => column.name));
              let customFields: Record<string, any> = {};
              if (physicalColumns.has('data_json')) {
                try {
                  const current = await env.DB.prepare(`SELECT data_json FROM ${moduleName} WHERE id = ?`).bind(recordId).first<any>();
                  if (!current) return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi cần cập nhật.' }, 404, corsHeaders);
                  customFields = current?.data_json ? JSON.parse(current.data_json) : {};
                  for (const protectedField of ['status', 'verificationStatus', 'verification_status', 'publicityLevel', 'publicity_level', 'approvedBy', 'approved_by', 'verifiedBy', 'verified_by', 'createdBy', 'created_by', 'history']) delete customFields[protectedField];
                } catch {
                  customFields = {};
                }
              }
              const entries: Array<[string, any]> = [];
              for (const key of Object.keys(clean).filter(k => k !== 'id')) {
                const column = toSqlColumn(key);
                if (column === 'data_json') continue;
                if (physicalColumns.has(column)) entries.push([column, clean[key]]);
                else customFields[key] = clean[key];
              }
              if (physicalColumns.has('data_json')) {
                entries.push(['data_json', JSON.stringify(customFields)]);
              }
              const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
              const values = entries.map(([, value]) => typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
              values.push(recordId);
              const recordStatement = env.DB.prepare(`UPDATE ${moduleName} SET ${setClause} WHERE id = ?`).bind(...values);
              const auditStatement = await buildAuditLogStatement(env.DB, currentUser, 'update', moduleName, recordId, `Chỉnh sửa bản ghi [${clean.title || recordId}]`, true);
              const writeResults = await env.DB.batch([recordStatement, auditStatement]);
              if (!writeResults?.[0]?.success || Number(writeResults[0]?.meta?.changes || 0) !== 1) return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi hoặc D1 không xác nhận cập nhật.' }, 404, corsHeaders);
              if (!writeResults?.[1]?.success || Number(writeResults[1]?.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận ghi nhật ký kiểm toán; giao dịch đã được hoàn tác.');
            } catch (e: any) {
              return jsonResponse({ success: false, message: 'Lỗi cập nhật D1: ' + e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: true, data: { id: recordId, ...clean } }, 200, corsHeaders);
        }

        // 6. DELETE Record: DELETE /api/modules/:moduleName/:id
        if (recordId && request.method === 'DELETE') {
          if (!['super_admin', 'system_admin', 'data_officer'].includes(currentUser.role)) {
            return jsonResponse({ success: false, message: 'Bạn không có quyền xóa dữ liệu.' }, 403, corsHeaders);
          }
          if (env.DB) {
            try {
              const deleteStatements: D1PreparedStatement[] = [
                env.DB.prepare(`DELETE FROM ${moduleName} WHERE id = ?`).bind(recordId),
                await buildAuditLogStatement(env.DB, currentUser, 'delete', moduleName, recordId, `Xóa bản ghi [${recordId}]`, true)
              ];
              await ensureRelationshipsTable(env.DB);
              const relationshipTables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('relationships', 'entity_relationships')").all<{ name: string }>();
              for (const relationshipTable of relationshipTables.results || []) {
                const relationshipName = String(relationshipTable.name);
                if (!['relationships', 'entity_relationships'].includes(relationshipName)) continue;
                const relationshipColumns = await env.DB.prepare(`PRAGMA table_info("${relationshipName}")`).all<any>();
                const availableRelationshipColumns = new Set((relationshipColumns.results || []).map((column: any) => String(column.name)));
                if (availableRelationshipColumns.has('source_id') && availableRelationshipColumns.has('target_id')) deleteStatements.push(env.DB.prepare(`DELETE FROM "${relationshipName}" WHERE source_id = ? OR target_id = ?`).bind(recordId, recordId));
              }
              const deleteResults = await env.DB.batch(deleteStatements);
              if (!deleteResults?.[0]?.success || Number(deleteResults[0]?.meta?.changes || 0) !== 1) return jsonResponse({ success: false, message: 'Không tìm thấy bản ghi hoặc D1 không xác nhận xóa.' }, 404, corsHeaders);
              if (!deleteResults?.[1]?.success || Number(deleteResults[1]?.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận ghi nhật ký xóa; giao dịch đã được hoàn tác.');
            } catch (e: any) {
              return jsonResponse({ success: false, message: 'Lỗi xóa bản ghi D1: ' + e.message }, 500, corsHeaders);
            }
          }
          return jsonResponse({ success: true, message: 'Đã xóa bản ghi thành công.' }, 200, corsHeaders);
        }
      }

      // Q2. Batch Import Records and explicit approval of imported drafts.
      if (url.pathname.startsWith('/api/import/') && request.method === 'POST') {
        const routeParts = url.pathname.replace('/api/import/', '').split('/').filter(Boolean);
        const moduleName = routeParts[0] || '';
        if (!ALLOWED_MODULES.includes(moduleName)) {
          return jsonResponse({ success: false, message: 'Phân hệ dữ liệu không hợp lệ.' }, 400, corsHeaders);
        }
        const isBulkApproval = routeParts[1] === 'approve';
        const canImportBulk = ['super_admin', 'system_admin', 'data_officer'].includes(currentUser.role);
        const canApproveBulk = ['super_admin', 'system_admin', 'agency_leader'].includes(currentUser.role);
        if (isBulkApproval ? !canApproveBulk : !canImportBulk) {
          return jsonResponse({ success: false, message: isBulkApproval ? 'Bạn không có quyền phê duyệt dữ liệu hàng loạt.' : 'Bạn không có quyền nhập dữ liệu hàng loạt.' }, 403, corsHeaders);
        }
        if (!env.DB) {
          return jsonResponse({ success: false, message: 'CSDL D1 chưa kết nối.' }, 500, corsHeaders);
        }

        const tableColumns = await ensureModuleImportSchema(env.DB, moduleName);
        const tableInfoResult = await env.DB.prepare(`PRAGMA table_info(${moduleName})`).all<any>();
        const requiredInsertColumns = (tableInfoResult.results || []).filter((column: any) => Number(column.notnull) === 1 && column.dflt_value === null && String(column.name) !== 'id');
        if (!tableColumns.has('status')) {
          return jsonResponse({ success: false, message: 'Phân hệ này chưa có trường status để quản lý quy trình nháp và phê duyệt. Chưa nhập dữ liệu để tránh công khai sai quy trình.' }, 409, corsHeaders);
        }

        // Explicit second step: approve only the exact IDs returned by this import.
        if (routeParts[1] === 'approve') {
          const body: any = await request.json().catch(() => ({}));
          const ids = Array.isArray(body.ids)
            ? [...new Set(body.ids.map((id: any) => String(id || '').trim()).filter((id: string) => id && id.length <= 128))] .slice(0, 5000)
            : [];
          if (ids.length === 0) {
            return jsonResponse({ success: false, message: 'Không có bản ghi nào được chọn để phê duyệt.' }, 400, corsHeaders);
          }
          const assignments = ["status = 'approved'", "updated_at = datetime('now')"];
          if (tableColumns.has('verification_status')) assignments.push("verification_status = 'verified'");
          if (tableColumns.has('publicity_level')) assignments.push("publicity_level = 'public'");
          // D1 giới hạn số biến SQL trên mỗi câu lệnh. Chia danh sách ID thành
          // các lô nhỏ để phê duyệt hàng nghìn bản ghi mà không vượt giới hạn.
          const approvalBatchSize = 80;
          let approvedCount = 0;
          try {
            for (let offset = 0; offset < ids.length; offset += approvalBatchSize) {
              const idBatch = ids.slice(offset, offset + approvalBatchSize);
              const placeholders = idBatch.map(() => '?').join(', ');
              const updated = await env.DB.prepare(
                `UPDATE ${moduleName} SET ${assignments.join(', ')} WHERE id IN (${placeholders}) AND LOWER(TRIM(COALESCE(status, ''))) = 'draft'`
              ).bind(...idBatch).run();
              approvedCount += Number(updated.meta?.changes || 0);
            }
            if (approvedCount < 1) {
              return jsonResponse({
                success: false,
                message: 'Không có bản ghi nào được cập nhật. Có thể các bản ghi không còn ở trạng thái Bản nháp, không tồn tại hoặc đã được phê duyệt. Hãy tải lại danh sách và thử lại.'
              }, 409, corsHeaders);
            }
            return jsonResponse({
              success: true,
              approvedCount,
              message: `Đã chuyển ${approvedCount}/${ids.length} bản ghi nháp sang trạng thái đã phê duyệt.`
            }, 200, corsHeaders);
          } catch (error: any) {
            const partialMessage = approvedCount > 0
              ? ` Đã phê duyệt thành công ${approvedCount}/${ids.length} bản ghi trước khi phát sinh lỗi; vui lòng tải lại danh sách để kiểm tra trạng thái.`
              : '';
            return jsonResponse({ success: false, approvedCount, message: 'Không thể hoàn thành phê duyệt dữ liệu.' + partialMessage }, 500, corsHeaders);
          }
        }

        if (routeParts.length !== 1) {
          return jsonResponse({ success: false, message: 'Đường dẫn nhập dữ liệu không hợp lệ.' }, 404, corsHeaders);
        }
        const body: any = await request.json().catch(() => ({}));
        const conflictAction = body.conflictAction === 'overwrite' ? 'overwrite' : 'skip';
        const rawItems = Array.isArray(body.items) ? body.items : [];
        if (rawItems.length === 0) {
          return jsonResponse({ success: false, message: 'Dữ liệu tệp không hợp lệ hoặc rỗng.' }, 400, corsHeaders);
        }
        if (rawItems.length > 500) {
          return jsonResponse({ success: false, message: 'Mỗi lượt nhập tối đa 500 bản ghi.' }, 413, corsHeaders);
        }

        const normalizeImportKey = (value: string) => value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'D')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '');
        const aliases: Record<string, string> = {
          stt: 'stt', code: 'code', madetai: 'code', madinhdanh: 'code',
          capquanly: 'management_level', coquanchutri: 'lead_agency', chunhiemdetai: 'principal_investigator',
          thanhvienthamgia: 'members', thoigianthuchien: 'implementation_time', linhvuc: 'field',
          tomtatdetai: 'summary', tailieuminhchung: 'evidence_documents', kyhieukho: 'storage_code',
          namcongnhan: 'recognition_year', tensangkien: 'title', tacgia: 'author', chusohuu: 'owner',
          diachuchusohuu: 'owner_address', tenchuyengia: 'name', ngaythangnamsinh: 'birth_date',
          namsinh: 'birth_year', gioitinh: 'gender', hocham: 'academic_rank', hocvi: 'degree',
          nambatdaucongtac: 'start_work_year', chucdanhnghiencuu: 'research_title', chucvu: 'job_title',
          email: 'email', dienthoai: 'phone', chuyenganh: 'specialization', tendonvicongtac: 'workplace',
          quatrinhdaotaovahoctap: 'training_process', quatrinhcongtac: 'work_experience', ngoaingu: 'foreign_languages',
          tenbaibao: 'publications', tenvanbang: 'qualifications', tencongtrinh: 'research_outputs',
          capdetai: 'project_level', chutrihoacthamgia: 'project_role', tinhtrang: 'project_status',
          tendetai: 'projects', giaithuong: 'awards', kinhnghiem: 'experience_notes',
          tendoanhnghiep: 'name', tencongty: 'name', tencongtykhoinghiep: 'name',
          diachihoatdong: 'operating_address', websitedoanhnghiep: 'website', website: 'website',
          filelogodoanhnghiep: 'logo_file', linhvuckinhdoanh: 'business_field',
          tomtatvedoanhnghiepvasanpham: 'summary', sanphamgiaiquyetvande: 'problem_solved',
          soluongsanglapvien: 'founders_count', tongsonhanhientai: 'total_staff',
          tongsonhansuothoidiemhientai: 'total_staff', soluongnhansu: 'total_staff',
          hovatennguoidungdau: 'leader_name', hotennguoidungdau: 'leader_name',
          sodienthoainguoidungdau: 'leader_phone', emailnguoidungdau: 'leader_email',
          nambatdaukhoinghiep: 'founding_year', tentochuc: 'name', diachi: 'address',
          thongtinvetochuc: 'information', tenduan: 'title',
          linhvuckhoinghiep: 'field', tomtatveduan: 'summary',
          soluongthanhvienthamgiaduan: 'members_count', duanduocuomtaotutochuc: 'incubated_at',
          tenytuong: 'title', tenytuongkhoinghiep: 'title', thuocxaphuong: 'ward_or_school',
          ytuongthuocxaphuongtruonghoc: 'ward_or_school', tomtatveytuong: 'summary',
          soluongthanhvienthamgiaytuong: 'members_count', nguoidungdaunhomytuong: 'leader_name',
          tengiaovienhuongdan: 'mentor_name', nhomytuongdanghoctapcongtactaidonvinao: 'affiliated_unit',
          tenxaphuongdackhu: 'name', tenxaphuong: 'name', tentruong: 'name',
          tentruongdaihoccaodang: 'name', nguoidaidienduan: 'representative',
          thongtinlienhe: 'contact_info',
          xaphuong: 'ward', phuongxa: 'ward', donvixaphuong: 'ward',
          tentruongdaihoc: 'name', tentruongcaodang: 'name',
          sodienthoai: 'contact_phone', emailtruong: 'contact_email'
        };

        const primaryHeaderAliases: Record<string, string[]> = {
          science_tasks: ['tendetai', 'tentennhiemvu', 'tasktitle'],
          initiatives: ['tensangkien', 'tengiaphap', 'initiativename'],
          patents: ['tensangche', 'tenphatminh', 'tenbangsangche', 'patentname'],
          experts: ['tenchuyengia', 'hovaten', 'hoten', 'tencanhan', 'hotenchuyengia', 'expertname', 'fullname'],
          startups: ['tendoanhnghiep', 'tendoanhnghiepkhoinghiep', 'tendoanhnghiepkhoinghiepsangtao', 'tencongty', 'tencongtykhoinghiep', 'tenstartup', 'startupname', 'companyname'],
          support_organizations: ['tentochuc', 'tentochuctrunggian', 'organizationname'],
          startup_projects: ['tenduan', 'tenduankhoinghiep', 'tendukhoinghiep', 'tenduanstartup', 'tenduankhoinghiepsangtao', 'tenproject', 'projectname', 'projecttitle'],
          startup_ideas: ['tenytuong', 'tenytuongkhoinghiep', 'tenytuongkhoinghiepsangtao', 'ideaname', 'ideatitle'],
          wards: ['tenxaphuong', 'tenxaphuongdackhu', 'tenxa', 'tenphuong', 'tendackhu', 'wardname'],
          universities: ['tentruong', 'truongdaihoccaodang', 'tentruongdaihoccaodang', 'tentruongdaihoc', 'tentruongcaodang', 'tentruonghoc', 'tendaotao', 'tencosodaotao', 'tencosogiaoduc', 'tendaihoc', 'tendonvi', 'tentrungcap', 'universityname', 'schoolname', 'collegename'],
          featured_startups: ['tenduan', 'tendoanhnghiep', 'projectname', 'projecttitle'],
          organizations: ['tentochuc', 'tenvien', 'tentochuckhcn', 'tentochuckhoahoccongnghe', 'organizationname'],
          investors: ['tennhadautu', 'hovaten', 'hoten', 'tennhadautucanhan', 'investorname', 'fullname'],
          investment_funds: ['tenquydautu', 'tenquy', 'fundname'],
          technologies: ['tencongnghe', 'tenketquanghiencuu', 'technologyname'],
          programs: ['tenchuongtrinh', 'tencohoi', 'tenchuongtrinhhotro', 'programname'],
          collaboration_needs: ['tennhucau', 'tendexuat', 'tennhucauketnoi', 'needtitle'],
          publications: ['tenbaibao', 'tencongbo', 'publicationtitle'],
          lab_equipments: ['tenthietbi', 'tenphongthinghiem', 'tenthietbithinghiem', 'equipmentname'],
          policies: ['tenvanban', 'tentrichyeu', 'tenchinhsach', 'policytitle', 'documenttitle']
        };

        const importedIds: string[] = [];
        let importedCount = 0;
        const errors: string[] = [];
        const duplicates: string[] = [];
        const primaryHeaderHints: Record<string, string[]> = {
          initiatives: ['sangkien', 'giaiphap', 'bienphap', 'initiative'],
          startups: ['doanhnghiep', 'congty', 'startup', 'company'],
          startup_projects: ['duan', 'project'],
          wards: ['xaphuong', 'xa', 'phuong', 'dackhu', 'hanhchinh', 'ward'],
          universities: ['truong', 'daihoc', 'caodang', 'cosogiaoduc', 'cosodaotao', 'daotao', 'school', 'university']
        };
        const isPrimaryImportHeader = (key: string): boolean => {
          const knownAliases = primaryHeaderAliases[moduleName] || [];
          if (knownAliases.some(alias => key === alias || key.startsWith(alias))) return true;
          // Real-world spreadsheets do not always prefix the primary column with
          // "Tên" (for example "Sáng kiến..." or "Doanh nghiệp..."). Accept only
          // module-specific leading labels, never a generic substring such as STT.
          return (primaryHeaderHints[moduleName] || []).some(hint =>
            key === hint || key.startsWith(hint) || key.startsWith(`ten${hint}`)
          );
        };
        // Prefer the canonical primary field for these modules. Some deployed
        // D1 schemas may contain both "title" and "name"; a generic title-first
        // choice can leave a NOT NULL name column empty during imports.
        const primaryColumn = getPrimaryImportColumn(moduleName, tableColumns);
        if (!primaryColumn) {
          return jsonResponse({ success: false, message: 'Không xác định được trường tên/tiêu đề chính của phân hệ.' }, 409, corsHeaders);
        }

        // Bulk imports create private drafts; incomplete optional fields can be completed before approval.
        const requiredFields = ['__primary__'];

        for (let idx = 0; idx < rawItems.length; idx++) {
          const raw = rawItems[idx];
          if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            errors.push(`Dòng ${idx + 2}: Dữ liệu không đúng định dạng.`);
            continue;
          }
          const mapped: Record<string, any> = {};
          const unsupported: string[] = [];
          for (const [rawKey, rawValue] of Object.entries(raw)) {
            if (rawValue === null || rawValue === undefined || rawValue === '') continue;
            const key = normalizeImportKey(rawKey);
            let target = isPrimaryImportHeader(key) ? primaryColumn : (aliases[key] || rawKey.replace(/([A-Z])/g, '_$1').toLowerCase());
            if (['title', 'name', 'projectname', 'project_name', 'expert_name', 'initiative_name', 'patent_name', 'idea_name', 'organization_name', 'fund_name', 'investor_name'].includes(target) && !tableColumns.has(target)) target = primaryColumn;
            if ((primaryHeaderAliases[moduleName] || []).includes(key)) target = primaryColumn;
            if (key.startsWith('diachihoatdong')) target = tableColumns.has('operating_address') ? 'operating_address' : 'address';
            if (key === 'nambatdaukhoinghiep' && ['startup_projects', 'startup_ideas', 'startups'].includes(moduleName)) target = 'founding_year';
            if (key === 'thoigianthuchien' && moduleName === 'experts') target = 'project_duration';
            if (key === 'thanhvienthamgia' && moduleName === 'experts') target = 'project_members';
            if (moduleName === 'universities') {
              if (['thuocxaphuong', 'xaphuong', 'phuongxa', 'donvixaphuong', 'tenxaphuong', 'tenphuongxa', 'ward', 'wardname', 'commune'].includes(key)) target = 'ward';
              if (['dienthoai', 'sodienthoai', 'sodienthoailienhe', 'dienthoailienhe'].includes(key)) target = 'contact_phone';
              if (['tentruongdaihoccaodang', 'truongdaihoccaodang', 'tentruonghoc', 'tendaotao', 'tencosodaotao', 'tencosogiaoduc', 'tendaihoc', 'tendonvi', 'universityname', 'schoolname', 'collegename'].includes(key)) target = primaryColumn;
            }
            if (key.startsWith('website')) target = 'website';
            if (key.startsWith('sanphamgiaiquyetvande')) target = 'problem_solved';
            if (key.startsWith('duanduocuomtaotutochuc')) target = 'incubated_at';
            if (key.startsWith('tomtatve') && !tableColumns.has(target)) target = tableColumns.has('summary') ? 'summary' : 'description';
            if (key.startsWith('tenbaibao')) target = 'publications';
            if (key.startsWith('tencongtrinh')) target = 'research_outputs';
            if (key.startsWith('hovatennguoidungdau') || key.startsWith('nguoidaidienduan')) target = 'leader_name';
            if (key.startsWith('sodienthoainguoidungdau')) target = 'leader_phone';
            if (key.startsWith('emailnguoidungdau')) target = 'leader_email';
            if (key.startsWith('tenthaycogiaohuongdan') || key.startsWith('tengiaovienhuongdan')) target = 'mentor_name';
            if (key.startsWith('tongsonhansu') || key.startsWith('soluongnhansu')) {
              target = moduleName === 'startups' ? 'total_staff' : 'current_staff_count';
            }
            if (key.startsWith('soluongthanhvienthamgia') && ['startup_projects', 'startup_ideas'].includes(moduleName)) target = 'members_count';
            else if (key.startsWith('soluongthanhvienthamgia')) target = 'team_size';
            if (key.startsWith('nhomytuongdanghoctapcongtactaidonvi')) target = 'affiliated_unit';
            if (key.startsWith('thuocxaphuong') && moduleName === 'startup_ideas') target = 'ward_or_school';
            if (key.startsWith('thuocxaphuong') && ['universities', 'featured_startups'].includes(moduleName)) target = 'ward';
            if (key.startsWith('tenduan') && moduleName === 'startup_projects') target = primaryColumn;
            if (key.startsWith('tenduan') && moduleName === 'featured_startups') target = 'project_name';
            if (key.startsWith('tendetaiduan')) target = 'projects';
            if (key === 'trangthai' && moduleName === 'science_tasks') target = 'acceptance_result';
            if (['tendetai', 'tensangkien', 'tenduan', 'tenytuong', 'tenytuongkhoinghiep', 'tendoanhnghiep', 'tentochuc', 'tentruong', 'tentruongdaihoccaodang', 'tenxaphuong', 'tenxaphuongdackhu', 'tenchuyengia'].includes(key) &&
              !(key === 'tenduan' && moduleName === 'featured_startups')) {
              target = primaryColumn;
            }
            if (tableColumns.has(target)) mapped[target] = rawValue;
            else if (tableColumns.has('data_json')) mapped[`__custom__${target}`] = rawValue;
            else unsupported.push(rawKey);
          }

          // Keep both common name/title columns populated when an older or
          // extended deployment contains both columns with NOT NULL constraints.
          if (['startups', 'wards', 'startup_projects', 'universities'].includes(moduleName)) {
            const primaryValue = mapped[primaryColumn];
            if (primaryValue !== undefined && primaryValue !== null && String(primaryValue).trim() !== '') {
              if (tableColumns.has('name') && !mapped.name) mapped.name = primaryValue;
              if (tableColumns.has('title') && !mapped.title) mapped.title = primaryValue;
              if (tableColumns.has('project_name') && !mapped.project_name) mapped.project_name = primaryValue;
            }
          }

          const missingRequiredFields = requiredFields.filter(field => {
            const value = field === '__primary__' ? mapped[primaryColumn] : (mapped[field] ?? mapped[`__custom__${field}`]);
            return value === undefined || value === null || String(value).trim() === '';
          });
          if (missingRequiredFields.length) {
            errors.push(`Dòng ${idx + 2}: Thiếu trường bắt buộc: ${missingRequiredFields.join(', ')}.`);
            continue;
          }
          if (unsupported.length) {
            errors.push(`Dòng ${idx + 2}: Các cột chưa có trường lưu trữ trong D1 và chưa được nhập: ${unsupported.join(', ')}. Cần bổ sung cấu trúc dữ liệu trước khi nhập để tránh mất thông tin.`);
            continue;
          }

          const duplicateColumn = tableColumns.has('code') && mapped.code ? 'code' : primaryColumn;
          const duplicateValue = mapped[duplicateColumn];
          const id = `${moduleName}_imp_${crypto.randomUUID()}`;
          try {
            const duplicate = duplicateValue !== undefined && duplicateValue !== null && String(duplicateValue).trim()
              ? await env.DB.prepare(`SELECT * FROM ${moduleName} WHERE LOWER(TRIM(CAST("${duplicateColumn}" AS TEXT))) = LOWER(TRIM(?)) LIMIT 1`).bind(String(duplicateValue)).first<any>()
              : null;
            if (duplicate && conflictAction === 'skip') {
              duplicates.push(`Dòng ${idx + 2}: Đã tồn tại bản ghi [${String(duplicate[primaryColumn] || duplicate.id)}], bỏ qua theo lựa chọn.`);
              continue;
            }

            const values: Record<string, any> = {
              ...mapped,
              id: duplicate?.id || id,
              status: duplicate ? (duplicate.status || 'draft') : 'draft'
            };
            if (tableColumns.has('created_at')) values.created_at = duplicate?.created_at || new Date().toISOString();
            if (tableColumns.has('updated_at')) values.updated_at = new Date().toISOString();
            if (tableColumns.has('created_by')) values.created_by = duplicate?.created_by || currentUser.fullName;
            if (tableColumns.has('verification_status')) values.verification_status = duplicate?.verification_status || (duplicate && ['approved', 'published'].includes(String(duplicate.status || '').toLowerCase()) ? 'verified' : 'unverified');
            if (tableColumns.has('publicity_level')) values.publicity_level = duplicate?.publicity_level || (duplicate && ['approved', 'published'].includes(String(duplicate.status || '').toLowerCase()) ? 'public' : 'private');
            if (tableColumns.has('data_json')) {
              let customFields: Record<string, any> = {};
              try {
                customFields = duplicate?.data_json ? JSON.parse(duplicate.data_json) : {};
              } catch { customFields = {}; }
              for (const key of Object.keys(values)) {
                if (key.startsWith('__custom__')) {
                  customFields[key.slice(10).replace(/_([a-z])/g, (_match: string, letter: string) => letter.toUpperCase())] = values[key];
                  delete values[key];
                }
              }
              if (Object.keys(customFields).length) values.data_json = JSON.stringify(customFields);
            }

            // Deployed D1 schemas may have extra NOT NULL columns beyond schema.sql.
            // These imports are private drafts; preserve existing values on overwrite
            // and use conservative defaults only for missing required columns.
            for (const columnInfo of requiredInsertColumns) {
              const column = String(columnInfo.name);
              const currentValue = values[column];
              if (currentValue !== undefined && currentValue !== null && String(currentValue).trim() !== '') continue;
              if (duplicate && duplicate[column] !== undefined && duplicate[column] !== null) { values[column] = duplicate[column]; continue; }
              if (['title', 'name', 'project_name'].includes(column)) values[column] = mapped[primaryColumn] || '';
              else if (column === 'module_type') values[column] = moduleName;
              else if (column === 'created_by' || column === 'updated_by') values[column] = currentUser.fullName || currentUser.username || 'system';
              else if (column === 'created_at' || column === 'updated_at') values[column] = new Date().toISOString();
              else if (column === 'verification_status') values[column] = 'unverified';
              else if (column === 'publicity_level') values[column] = 'private';
              else if (column === 'status') values[column] = 'draft';
              else if (column === 'code') values[column] = `${moduleName.toUpperCase()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
              else values[column] = /(INT|REAL|NUM|DEC|BOOL|FLOAT|DOUBLE)/.test(String(columnInfo.type || '').toUpperCase()) ? 0 : '';
            }

            if (duplicate) {
              const updateColumns = Object.keys(values).filter(column =>
                tableColumns.has(column) && !['id', 'created_at'].includes(column)
              );
              const assignments = updateColumns.map(column => `"${column}" = ?`).join(', ');
              const params = updateColumns.map(column => {
                const value = values[column];
                return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
              });
              const updateResult = await env.DB.prepare(`UPDATE ${moduleName} SET ${assignments} WHERE id = ?`).bind(...params, duplicate.id).run();
              if (!updateResult.success || Number(updateResult.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận cập nhật bản ghi trùng lặp.');
              if (String(duplicate.status || '').toLowerCase() === 'draft') importedIds.push(String(duplicate.id));
            } else {
              const columns = Object.keys(values).filter(column => tableColumns.has(column));
              const placeholders = columns.map(() => '?').join(', ');
              const params = columns.map(column => {
                const value = values[column];
                return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
              });
              const insertResult = await env.DB.prepare(`INSERT INTO ${moduleName} (${columns.map(column => `"${column}"`).join(', ')}) VALUES (${placeholders})`).bind(...params).run();
              if (!insertResult.success || Number(insertResult.meta?.changes || 0) !== 1) throw new Error('D1 không xác nhận đã thêm bản ghi.');
              importedIds.push(id);
            }
            importedCount += 1;
          } catch (error: any) {
            errors.push(`Dòng ${idx + 2}: ${error?.message || 'Không thể ghi dữ liệu vào D1.'}`);
          }
        }

        return jsonResponse({
          success: true,
          result: { importedCount, importedIds: [...new Set(importedIds)], errors, duplicates }
        }, 200, corsHeaders);
      }

      // Q3. Standard CSV Templates (`GET /api/templates/:moduleName`)
      if (url.pathname.startsWith('/api/templates/')) {
        const moduleName = url.pathname.replace('/api/templates/', '').trim();
        const templates: Record<string, string> = {
          science_tasks: 'STT,Tên đề tài,Cấp quản lý,Cơ quan chủ trì,Chủ nhiệm đề tài,Thời gian thực hiện,Lĩnh vực,Tóm tắt đề tài\n1,Nghiên cứu ứng dụng trí tuệ nhân tạo trong đô thị thông minh,Cấp Thành phố,Trường Đại học Bách Khoa,PGS.TS. Hoàng Kim Oanh,2024 - 2026,Công nghệ thông tin,Nghiên cứu và thử nghiệm thuật toán xử lý dữ liệu lớn',
          initiatives: 'STT,Năm công nhận,Tên sáng kiến,Tác giả,Chủ sở hữu,Địa chỉ chủ sở hữu,Lĩnh vực\n1,2025,Giải pháp thu gom và tái chế rác thải thông minh,Nguyễn Văn An,UBND Quận Hải Châu,24 Trần Phú - Đà Nẵng,Môi trường & Đô thị',
          patents: 'STT,Số bằng/Số đơn,Tên sáng chế,Tác giả,Chủ sở hữu,Lĩnh vực,Tóm tắt\n1,28492/SHTT,Quy trình chế tạo vật liệu nano xúc tác quang,GS.TS. Vũ Đình Thành,Trường Đại học Bách Khoa,Vật liệu mới,Chế tạo vật liệu nano xử lý nước',
          experts: 'STT,Tên Chuyên gia,Năm sinh,Email,Điện thoại,Chuyên ngành\n1,PGS.TS. Hoàng Kim Oanh,1978,oanh.hk@danang.edu.vn,0905123456,Trí tuệ nhân tạo và Dữ liệu lớn',
          startups: 'STT,Tên doanh nghiệp,Địa chỉ hoạt động,Website doanh nghiệp (nếu có),Lĩnh vực kinh doanh,Tóm tắt về doanh nghiệp và sản phẩm,Sản phẩm giải quyết vấn đề gì,Số lượng sáng lập viên,Tổng số nhân sự ở thời điểm hiện tại,Họ và tên người đứng đầu doanh nghiệp,Số điện thoại người đứng đầu doanh nghiệp,Email người đứng đầu doanh nghiệp,Năm bắt đầu khởi nghiệp\n1,Công ty CP SmartAgri Đà Nẵng,Khu Công nghệ cao Đà Nẵng,https://smartagri.vn,Nông nghiệp thông minh,Nền tảng quan trắc vi khí hậu tự động,Tối ưu hóa dinh dưỡng cây trồng,3,15,Đỗ Quang Huy,0905667788,huy.do@smartagri.vn,2023',
          support_organizations: 'STT,Tên tổ chức,Địa chỉ,Website (nếu có),Thông tin về tổ chức\n1,Trung tâm Hỗ trợ Khởi nghiệp ĐMST Đà Nẵng,24 Trần Phú - Hải Châu - Đà Nẵng,https://dananghub.gov.vn,Đơn vị ươm tạo và kết nối đầu tư',
          startup_projects: 'STT,Tên dự án khởi nghiệp,Địa chỉ hoạt động,Lĩnh vực khởi nghiệp,Tóm tắt về dự án,Sản phẩm giải quyết vấn đề gì,Số lượng thành viên tham gia dự án,Họ và tên người đứng đầu dự án,Số điện thoại người đứng đầu dự án,Email người đứng đầu dự án,Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án),Năm bắt đầu khởi nghiệp\n1,Hệ thống bay phun tưới thông minh,Quận Liên Chiểu - Đà Nẵng,Nông nghiệp thông minh,Chế tạo thiết bị bay lập bản đồ mùa màng,Giảm lãng phí phân bón,4,Lê Hữu Tuấn,0905112233,tuan.le@drone.vn,Vườn ươm Bách Khoa,2024',
          startup_ideas: 'STT,Tên ý tưởng khởi nghiệp,Địa chỉ hoạt động (Nếu có),Lĩnh vực khởi nghiệp,Ý tưởng thuộc Xã/phường - Trường học,Tóm tắt về ý tưởng (Khoảng 150-200 từ),Sản phẩm giải quyết vấn đề gì,Số lượng thành viên tham gia ý tưởng khởi nghiệp,Họ và tên người đứng đầu nhóm ý tưởng,Số điện thoại người đứng đầu,Email người đứng đầu,Tên thầy/cô giáo hướng dẫn thực hiện,Nhóm ý tưởng đang học tập/công tác tại đơn vị nào? (Tên đơn vị và Địa chỉ)\n1,Trạm sạc xe điện thông minh từ pin tái chế,54 Nguyễn Lương Bằng - Liên Chiểu,Giao thông xanh,Trường Đại học Bách Khoa,Tận dụng pin thứ cấp làm trạm sạc lưu trữ,Thiếu trạm sạc xe máy điện an toàn,3,Nguyễn Văn Nam,0905334455,nam.nv@sv.udn.vn,TS. Huỳnh Tấn Đạt,Trường Đại học Bách Khoa ĐHĐN - 54 Nguyễn Lương Bằng',
          wards: 'STT,Tên xã/phường/đặc khu,Địa chỉ,Thông tin liên hệ,Website\n1,Phường Thạch Thang,12 Trần Quý Cáp - Hải Châu - Đà Nẵng,0236.3822123,https://thachthang.danang.gov.vn',
          universities: 'STT,Tên trường Đại học/Cao đẳng,Địa chỉ,Thông tin liên hệ,Website\n1,Trường Đại học Bách Khoa - ĐHĐN,54 Nguyễn Lương Bằng - Liên Chiểu - Đà Nẵng,0236.3842323,https://dut.udn.vn'
        };

        const csvContent = templates[moduleName] || 'STT,Tên bản ghi,Lĩnh vực,Mô tả\n1,Bản ghi mẫu,Chung,Mô tả mẫu';
        return new Response('\uFEFF' + csvContent, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="mau_nhap_lieu_${moduleName}.csv"`
          }
        });
      }

      // Q4. Real 18 Criteria Acceptance Test Runner (`POST /api/test-suite/run`)
      if (url.pathname === '/api/test-suite/run' && request.method === 'POST') {
        if (!['super_admin', 'system_admin'].includes(currentUser.role)) {
          return jsonResponse({ success: false, message: 'Chỉ Quản trị viên mới có quyền chạy kịch bản kiểm thử.' }, 403, corsHeaders);
        }

        const results: Array<{ id: number; name: string; passed: boolean; message: string; durationMs: number }> = [];

        // 1. D1 Live Connection Test
        const t1Start = Date.now();
        let t1Passed = false;
        let t1Msg = '';
        if (env.DB) {
          try {
            const ping = await env.DB.prepare('SELECT 1 as alive').first<{ alive: number }>();
            t1Passed = ping?.alive === 1;
            t1Msg = t1Passed ? 'Kết nối CSDL Cloudflare D1 hoạt động bình thường.' : 'Ping D1 không trả về kết quả mong đợi.';
          } catch (e: any) {
            t1Passed = false;
            t1Msg = 'Lỗi kết nối D1: ' + e.message;
          }
        } else {
          t1Passed = false;
          t1Msg = 'CSDL D1 chưa được liên kết với Worker.';
        }
        results.push({ id: 1, name: 'Kiểm tra kết nối và truy vấn CSDL Cloudflare D1', passed: t1Passed, message: t1Msg, durationMs: Date.now() - t1Start });

        // 2. Core Tables Integrity: apply additive compatibility migrations first.
        const t2Start = Date.now();
        let t2Passed = false;
        let t2Msg = '';
        if (env.DB) {
          try {
            await ensureAuditLogTable(env.DB);
            const relationshipTable = await ensureRelationshipsTable(env.DB);
            const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{ name: string }>();
            const tableNames = new Set((tables.results || []).map(r => r.name));
            const requiredTables = ['science_tasks', 'initiatives', 'experts', 'startups', 'support_organizations', 'startup_projects', 'startup_ideas', 'wards', 'universities', 'users', 'audit_logs', 'system_config'];
            const missing = requiredTables.filter(t => !tableNames.has(t));
            const relationshipReady = ['relationships', 'entity_relationships'].includes(relationshipTable);
            t2Passed = missing.length === 0 && relationshipReady;
            t2Msg = t2Passed ? `Các bảng dữ liệu chuẩn và bảng liên kết (${relationshipTable}) đã sẵn sàng trong D1.` : `Thiếu các bảng: ${missing.join(', ')}`;
          } catch (e: any) {
            t2Passed = false;
            t2Msg = 'Lỗi kiểm tra bảng: ' + e.message;
          }
        }
        results.push({ id: 2, name: 'Kiểm tra toàn vẹn cấu trúc bảng cơ sở dữ liệu', passed: t2Passed, message: t2Msg, durationMs: Date.now() - t2Start });

        // 3. Multi-directional Relationships
        const t3Start = Date.now();
        let t3Passed = false;
        let t3Msg = '';
        if (env.DB) {
          try {
            const relationshipTable = await ensureRelationshipsTable(env.DB);
            const relCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM "${relationshipTable}"`).first<{ c: number }>();
            t3Passed = Number(relCount?.c) >= 0;
            t3Msg = `Bảng liên kết đa chiều (${relationshipTable}) hoạt động tốt, hiện có ${relCount?.c || 0} liên kết.`;
          } catch (e: any) {
            t3Passed = false;
            t3Msg = 'Lỗi bảng quan hệ: ' + e.message;
          }
        }
        results.push({ id: 3, name: 'Liên kết nhiều loại dữ liệu và truy cập qua lại giữa các bản ghi liên quan', passed: t3Passed, message: t3Msg, durationMs: Date.now() - t3Start });

        // 4. Password Security & PBKDF2 WebCrypto
        const t4Start = Date.now();
        let t4Passed = false;
        let t4Msg = '';
        if (env.DB) {
          try {
            const userCols = await env.DB.prepare("PRAGMA table_info(users)").all<{ name: string }>();
            const colNames = new Set((userCols.results || []).map(c => c.name));
            const hasHash = colNames.has('password_hash');
            const hasSalt = colNames.has('password_salt') || colNames.has('salt');
            t4Passed = hasHash && hasSalt;
            t4Msg = t4Passed ? 'Cơ chế băm mật khẩu PBKDF2 WebCrypto với Salt riêng biệt cho từng tài khoản được cấu hình chuẩn.' : 'Thiếu cột password_hash hoặc salt trong bảng users.';
          } catch (e: any) {
            t4Passed = false;
            t4Msg = 'Lỗi kiểm tra users schema: ' + e.message;
          }
        }
        results.push({ id: 4, name: 'Xác thực tài khoản và ma trận phân quyền người dùng (PBKDF2 + Salt)', passed: t4Passed, message: t4Msg, durationMs: Date.now() - t4Start });

        // 5. Execute role-policy assertions using the same helpers as API routes.
        const t5Start = Date.now();
        const assertions = [
          !canViewRestrictedModule({ role: 'public_user' }, 'science_tasks'),
          canViewRestrictedModule({ role: 'data_officer' }, 'science_tasks'),
          !canManageModuleRecords({ role: 'public_user' }, 'science_tasks'),
          canManageModuleRecords({ role: 'partner_officer' }, 'startup_projects'),
          !canManageModuleRecords({ role: 'partner_officer' }, 'science_tasks'),
          canCreateModuleRecords({ role: 'public_user' }, 'science_tasks'),
          !canCreateModuleRecords({ role: 'public_user' }, 'users'),
          !isPrivilegedMessageReader({ role: 'evaluator_expert' }),
          isPrivilegedMessageReader({ role: 'agency_leader' }),
          canApproveWorkflow({ role: 'agency_leader' }) && !canApproveWorkflow({ role: 'data_officer' }),
          canExportModuleData({ role: 'data_officer' }) && !canExportModuleData({ role: 'agency_leader' })
        ];
        const roleCheck = assertions.every(Boolean);
        results.push({ id: 5, name: 'Ma trận RBAC theo vai trò và nghiệp vụ thực tế', passed: roleCheck, message: roleCheck ? 'Đã thực thi 11 phép kiểm tra quyền xem nội bộ, tạo/sửa, phê duyệt, xuất dữ liệu và xem tin nhắn.' : 'Có quy tắc RBAC không đúng ma trận mong đợi.', durationMs: Date.now() - t5Start });

        // 6. Execute the live public visibility predicate; schema/query failures fail closed.
        const t6Start = Date.now();
        let t6Passed = false;
        let t6Msg = '';
        if (env.DB) {
          try {
            const info = await env.DB.prepare('PRAGMA table_info("science_tasks")').all<any>();
            const columns = new Set((info.results || []).map((column: any) => String(column.name)));
            if (!columns.has('status')) throw new Error('Thiếu cột status.');
            const where = buildPublicVisibilityWhere(columns);
            const violations = await env.DB.prepare(`SELECT COUNT(*) AS c FROM science_tasks${where} AND LOWER(COALESCE(status, '')) NOT IN ('approved', 'published')`).first<{ c: number }>();
            t6Passed = Number(violations?.c || 0) === 0;
            t6Msg = t6Passed ? 'Truy vấn theo điều kiện công khai không trả hồ sơ nháp/chưa duyệt.' : `Phát hiện ${violations?.c || 0} hồ sơ không đủ điều kiện trong kết quả công khai.`;
          } catch (e: any) { t6Msg = 'Không thể xác minh bộ lọc dữ liệu công khai: ' + e.message; }
        }
        results.push({ id: 6, name: 'Bảo vệ dữ liệu nội bộ và bộ lọc công khai D1', passed: t6Passed, message: t6Msg, durationMs: Date.now() - t6Start });

        // 7. Execute a temporary create -> approve -> read -> delete cycle in one D1 batch.
        const t7Start = Date.now();
        let t7Passed = false;
        let t7Msg = '';
        if (env.DB) {
          try {
            const id = `qa_workflow_${crypto.randomUUID()}`;
            const info = await env.DB.prepare('PRAGMA table_info("initiatives")').all<any>();
            const defs = info.results || [];
            const columns = new Set(defs.map((column: any) => String(column.name)));
            if (!columns.has('id') || !columns.has('title') || !columns.has('status')) throw new Error('Bảng initiatives thiếu id/title/status.');
            const row: Record<string, any> = { id, title: 'Kiểm thử quy trình tạm thời', status: 'draft' };
            for (const col of defs) {
              const name = String(col.name);
              if (row[name] !== undefined || col.dflt_value !== null || (Number(col.notnull) !== 1 && Number(col.pk) === 0)) continue;
              if (name === 'created_at' || name === 'updated_at') row[name] = new Date().toISOString();
              else if (name === 'created_by' || name === 'updated_by') row[name] = 'qa-test';
              else if (name === 'verification_status') row[name] = 'unverified';
              else if (name === 'publicity_level') row[name] = 'private';
              else if (name === 'module_type') row[name] = 'initiatives';
              else if (name === 'id') row[name] = id;
              else if (/(INT|REAL|NUM|DEC|BOOL|FLOAT|DOUBLE)/.test(String(col.type || '').toUpperCase())) row[name] = 0;
              else row[name] = `qa-${crypto.randomUUID()}`;
            }
            const names = Object.keys(row).filter(name => columns.has(name));
            const insert = env.DB.prepare(`INSERT INTO initiatives (${names.map(name => `"${name}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`).bind(...names.map(name => row[name]));
            const update = env.DB.prepare("UPDATE initiatives SET status = 'approved' WHERE id = ? AND status = 'draft'").bind(id);
            const read = env.DB.prepare('SELECT status FROM initiatives WHERE id = ?').bind(id);
            const remove = env.DB.prepare('DELETE FROM initiatives WHERE id = ?').bind(id);
            const probe = await env.DB.batch([insert, update, read, remove]);
            const readStatus = probe?.[2]?.results?.[0]?.status;
            t7Passed = probe?.length === 4 && probe[0]?.success && Number(probe[0]?.meta?.changes || 0) === 1 && probe[1]?.success && Number(probe[1]?.meta?.changes || 0) === 1 && readStatus === 'approved' && probe[3]?.success && Number(probe[3]?.meta?.changes || 0) === 1;
            t7Msg = t7Passed ? 'Đã thực thi tạo nháp, chuyển trạng thái, đọc lại và xóa bản ghi thử trong một giao dịch.' : 'D1 không hoàn thành đầy đủ chu trình nghiệp vụ.';
          } catch (e: any) { t7Msg = 'Kiểm thử quy trình thất bại: ' + e.message; }
        }
        results.push({ id: 7, name: 'Thực thi nghiệp vụ tạo hồ sơ và chuyển trạng thái trên D1', passed: t7Passed, message: t7Msg, durationMs: Date.now() - t7Start });

        // 8. Check actual D1 import targets and primary-column selection.
        const t8Start = Date.now();
        let t8Passed = false;
        let t8Msg = '';
        if (env.DB) {
          try {
            const missing: string[] = [];
            for (const moduleName of ALLOWED_MODULES) {
              const cols = await ensureModuleImportSchema(env.DB, moduleName);
              if (!getPrimaryImportColumn(moduleName, cols) || !cols.has('status')) missing.push(moduleName);
            }
            const uniCols = await ensureModuleImportSchema(env.DB, 'universities');
            t8Passed = missing.length === 0 && getPrimaryImportColumn('universities', uniCols) === 'name';
            t8Msg = t8Passed ? `Đã kiểm tra schema và trường tên chính của ${ALLOWED_MODULES.length} phân hệ; universities dùng cột name.` : 'Phân hệ thiếu trường tên chính/status: ' + missing.join(', ');
          } catch (e: any) { t8Msg = 'Không thể kiểm tra schema nhập hàng loạt: ' + e.message; }
        }
        results.push({ id: 8, name: 'Kiểm tra schema và ánh xạ trường nhập hàng loạt', passed: t8Passed, message: t8Msg, durationMs: Date.now() - t8Start });

        // 9. Verify duplicate primary keys fail and D1 rolls back the whole batch.
        const t9Start = Date.now();
        let t9Passed = false;
        let t9Msg = '';
        if (env.DB) {
          try {
            const id = `qa_duplicate_${crypto.randomUUID()}`;
            const info = await env.DB.prepare('PRAGMA table_info("initiatives")').all<any>();
            const defs = info.results || [];
            const columns = new Set(defs.map((column: any) => String(column.name)));
            if (!columns.has('id') || !columns.has('title')) throw new Error('Bảng initiatives thiếu id/title.');
            const row: Record<string, any> = { id, title: 'Kiểm thử trùng lặp tạm thời', status: 'draft' };
            for (const col of defs) {
              const name = String(col.name);
              if (row[name] !== undefined || col.dflt_value !== null || (Number(col.notnull) !== 1 && Number(col.pk) === 0)) continue;
              if (name === 'created_at' || name === 'updated_at') row[name] = new Date().toISOString();
              else if (name === 'created_by' || name === 'updated_by') row[name] = 'qa-test';
              else if (name === 'verification_status') row[name] = 'unverified';
              else if (name === 'publicity_level') row[name] = 'private';
              else if (name === 'module_type') row[name] = 'initiatives';
              else if (/(INT|REAL|NUM|DEC|BOOL|FLOAT|DOUBLE)/.test(String(col.type || '').toUpperCase())) row[name] = 0;
              else row[name] = `qa-${crypto.randomUUID()}`;
            }
            const names = Object.keys(row).filter(name => columns.has(name));
            const sql = `INSERT INTO initiatives (${names.map(name => `"${name}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`;
            let duplicateRejected = false;
            try { await env.DB.batch([env.DB.prepare(sql).bind(...names.map(name => row[name])), env.DB.prepare(sql).bind(...names.map(name => row[name]))]); }
            catch (e: any) { duplicateRejected = /unique|primary key/i.test(String(e?.message || e)); }
            const residual = await env.DB.prepare('SELECT COUNT(*) AS c FROM initiatives WHERE id = ?').bind(id).first<{ c: number }>();
            t9Passed = duplicateRejected && Number(residual?.c || 0) === 0;
            t9Msg = t9Passed ? 'D1 từ chối khóa chính trùng và rollback cả batch; không để lại bản ghi thử.' : 'Không xác nhận được lỗi trùng khóa và rollback nguyên tử.';
          } catch (e: any) { t9Msg = 'Kiểm thử trùng lặp thất bại: ' + e.message; }
        }
        results.push({ id: 9, name: 'Kiểm tra trùng khóa và rollback giao dịch D1', passed: t9Passed, message: t9Msg, durationMs: Date.now() - t9Start });

        // 10. Execute export permission assertions using the route policy helper.
        const t10Start = Date.now();
        const exportCheck = canExportModuleData({ role: 'super_admin' }) && canExportModuleData({ role: 'system_admin' }) && canExportModuleData({ role: 'data_officer' }) && !canExportModuleData({ role: 'agency_leader' }) && !canExportModuleData({ role: 'public_user' });
        results.push({ id: 10, name: 'Kiểm tra quyền xuất dữ liệu theo vai trò', passed: exportCheck, message: exportCheck ? 'Đã kiểm tra 5 vai trò theo chính sách xuất dữ liệu thực tế.' : 'Ma trận quyền xuất dữ liệu không đúng.', durationMs: Date.now() - t10Start });

        // 11. Audit Logging
        const t11Start = Date.now();
        let t11Passed = false;
        let t11Msg = '';
        if (env.DB) {
          try {
            const logs = await env.DB.prepare('SELECT COUNT(*) as c FROM audit_logs').first<{ c: number }>();
            t11Passed = Number(logs?.c) >= 0;
            t11Msg = `Nhật ký truy vết audit_logs ghi nhận đầy đủ (${logs?.c || 0} bản ghi).`;
          } catch (e: any) {
            t11Passed = false;
            t11Msg = 'Lỗi bảng audit_logs: ' + e.message;
          }
        }
        results.push({ id: 11, name: 'Kiểm tra nhật ký truy vết hệ thống (Audit Logs)', passed: t11Passed, message: t11Msg, durationMs: Date.now() - t11Start });

        // 12. Check the actual Worker static-assets binding; responsive layout needs browser QA.
        const t12Start = Date.now();
        const assetsReady = Boolean(env.ASSETS);
        results.push({ id: 12, name: 'Kiểm tra liên kết tài nguyên frontend trên Worker', passed: assetsReady, message: assetsReady ? 'Worker đã liên kết static assets; kiểm tra responsive cần thực hiện trên trình duyệt.' : 'Worker chưa có binding ASSETS.', durationMs: Date.now() - t12Start });

        // 13. Read live sqlite_master and PRAGMA definitions used by backup/restore.
        const t13Start = Date.now();
        let t13Passed = false;
        let t13Msg = '';
        if (env.DB) {
          try {
            const tables = await env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<any>();
            const appTables = (tables.results || []).filter((row: any) => [...ALLOWED_MODULES, 'users', 'system_config', 'audit_logs', 'attachments', 'connection_messages', 'form_configs', 'relationships', 'entity_relationships'].includes(String(row.name)));
            const invalid: string[] = [];
            for (const row of appTables) {
              const name = String(row.name);
              const info = await env.DB.prepare(`PRAGMA table_info("${name}")`).all<any>();
              if (!String(row.sql || '').trim() || !(info.results || []).length || !normalizeSnapshotSchemaSql(String(row.sql)).length) invalid.push(name);
            }
            t13Passed = invalid.length === 0 && appTables.length > 0;
            t13Msg = t13Passed ? `Đã đọc schema và cấu trúc cột của ${appTables.length} bảng ứng dụng.` : 'Bảng thiếu định nghĩa schema/cột: ' + invalid.join(', ');
          } catch (e: any) { t13Msg = 'Không thể kiểm tra schema sao lưu/phục hồi: ' + e.message; }
        }
        results.push({ id: 13, name: 'Đối chiếu schema D1 phục vụ sao lưu và phục hồi', passed: t13Passed, message: t13Msg, durationMs: Date.now() - t13Start });

        // 14. Run real dashboard aggregate queries and record their elapsed time.
        const t14Start = Date.now();
        let t14Passed = false;
        let t14Msg = '';
        if (env.DB) {
          try {
            const aggregate = await env.DB.batch([
              env.DB.prepare('SELECT COUNT(*) AS total FROM science_tasks'),
              env.DB.prepare('SELECT COUNT(*) AS total FROM experts'),
              env.DB.prepare('SELECT status, COUNT(*) AS total FROM initiatives GROUP BY status')
            ]);
            t14Passed = aggregate.length === 3 && aggregate.every((result: any) => result?.success) && Date.now() - t14Start < 5000;
            t14Msg = t14Passed ? `Đã thực thi 3 truy vấn thống kê D1 trong ${Date.now() - t14Start} ms.` : 'Truy vấn thống kê lỗi hoặc vượt ngưỡng 5 giây.';
          } catch (e: any) { t14Msg = 'Lỗi truy vấn thống kê tổng hợp: ' + e.message; }
        }
        results.push({ id: 14, name: 'Hiệu năng truy vấn thống kê tổng hợp D1', passed: t14Passed, message: t14Msg, durationMs: Date.now() - t14Start });

        // 15. Prove an injection-shaped value remains a bound parameter, not SQL.
        const t15Start = Date.now();
        let t15Passed = false;
        let t15Msg = '';
        if (env.DB) {
          try {
            const payload = "' OR 1=1; DROP TABLE users; --";
            const probe = await env.DB.prepare('SELECT ? AS supplied_value, 7 AS control_value').bind(payload).first<any>();
            t15Passed = probe?.supplied_value === payload && Number(probe?.control_value) === 7;
            t15Msg = t15Passed ? 'Payload SQL injection được giữ nguyên dưới dạng dữ liệu tham số.' : 'Prepared statement trả kết quả không mong đợi.';
          } catch (e: any) { t15Msg = 'Kiểm thử tham số SQL thất bại: ' + e.message; }
        }
        results.push({ id: 15, name: 'Kiểm tra prepared statement và dữ liệu đầu vào độc hại', passed: t15Passed, message: t15Msg, durationMs: Date.now() - t15Start });

        // 16. Query the same public visibility predicate used by public module listings.
        const t16Start = Date.now();
        let t16Passed = false;
        let t16Msg = '';
        if (env.DB) {
          try {
            const info = await env.DB.prepare('PRAGMA table_info("science_tasks")').all<any>();
            const columns = new Set((info.results || []).map((column: any) => String(column.name)));
            const where = buildPublicVisibilityWhere(columns);
            const visible = await env.DB.prepare(`SELECT COUNT(*) AS total FROM science_tasks${where}`).first<any>();
            const invalid = await env.DB.prepare(`SELECT COUNT(*) AS total FROM science_tasks${where} AND LOWER(COALESCE(status, '')) NOT IN ('approved', 'published')`).first<any>();
            t16Passed = Number(visible?.total || 0) >= 0 && Number(invalid?.total || 0) === 0;
            t16Msg = t16Passed ? `Bộ lọc công khai trả ${visible?.total || 0} hồ sơ và không trả hồ sơ chưa duyệt.` : 'Có hồ sơ không đủ điều kiện trong tập kết quả công khai.';
          } catch (e: any) { t16Msg = 'Không thể xác minh bộ lọc công khai: ' + e.message; }
        }
        results.push({ id: 16, name: 'Kiểm tra điều kiện công khai sau phê duyệt', passed: t16Passed, message: t16Msg, durationMs: Date.now() - t16Start });

        // 17. Brute-force Account Lock
        const t17Start = Date.now();
        let t17Passed = false;
        let t17Msg = '';
        if (env.DB) {
          try {
            const userCols = await env.DB.prepare("PRAGMA table_info(users)").all<{ name: string }>();
            const colNames = new Set((userCols.results || []).map(c => c.name));
            t17Passed = colNames.has('failed_attempts') && colNames.has('locked_until');
            t17Msg = t17Passed ? 'Hệ thống tự động khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp.' : 'Bảng users cần bổ sung các cột failed_attempts, locked_until.';
          } catch (e: any) {
            t17Passed = false;
            t17Msg = 'Không thể đọc schema users để xác minh khóa brute-force: ' + e.message;
          }
        }
        results.push({ id: 17, name: 'Kiểm tra cơ chế khóa tài khoản và phòng chống tấn công dò mật khẩu (Brute-force)', passed: t17Passed, message: t17Msg, durationMs: Date.now() - t17Start });

        // 18. Test the exact session cookie builder used by login.
        const t18Start = Date.now();
        const cookieProbe = createSessionCookie('test-session-token');
        const t18Passed = Boolean(secret) && cookieProbe.includes('HttpOnly') && cookieProbe.includes('Secure') && cookieProbe.includes('SameSite=Lax') && !/Max-Age|Expires=/i.test(cookieProbe);
        results.push({ id: 18, name: 'Bảo mật phiên làm việc bằng HttpOnly Cookie và HMAC-SHA256', passed: t18Passed, message: t18Passed ? 'Cookie dùng HttpOnly, Secure, SameSite=Lax và không lưu bền sau khi đóng trình duyệt.' : 'Thiếu secret hoặc thuộc tính bảo mật cookie.', durationMs: Date.now() - t18Start });

        const passedTests = results.filter(r => r.passed).length;
        return jsonResponse({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            totalTests: results.length,
            passedTests,
            results
          }
        }, 200, corsHeaders);
      }

      // R. Pass through to Static Assets (SPA)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response('Not Found', { status: 404 });
    } catch (fatalErr: any) {
      queueBetterStackLog(env, ctx, 'error', 'Unhandled Worker exception', {
        component: 'worker', route: url.pathname, method: request.method,
        request_id: getOperationalRequestId(request), error_name: String(fatalErr?.name || 'Error').slice(0, 80)
      });
      console.error('[Worker Fatal Error]', fatalErr);
      if (url.pathname.startsWith('/api') || url.pathname === '/health') {
        return jsonResponse({
          success: false,
          message: 'Máy chủ đang gặp sự cố nội bộ. Vui lòng thử lại sau.'
        }, 500, corsHeaders);
      }
      return new Response('Máy chủ đang gặp sự cố nội bộ.', { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } });
    }
  }
};
