-- Initial Cloudflare D1 schema for Webcsdl.
-- Creates 20 business tables and 6 system tables; no sample/demo data.
PRAGMA foreign_keys = ON;

-- ============================================================================
-- CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP TP ĐÀ NẴNG
-- Cloudflare D1 (SQLite Engine) Schema Definition
-- ============================================================================

-- Bảng Cấu hình hệ thống
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
);

-- Bảng Người dùng & Phân quyền (10 Vai trò)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    organization TEXT,
    department TEXT,
    is_active INTEGER DEFAULT 1,
    failed_attempts INTEGER DEFAULT 0,
    locked_until INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 1. ĐỀ TÀI, NHIỆM VỤ KH&CN
-- Các trường chuẩn: STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thời gian thực hiện, Lĩnh vực
CREATE TABLE IF NOT EXISTS science_tasks (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    code TEXT,
    title TEXT NOT NULL,
    management_level TEXT,
    lead_agency TEXT,
    principal_investigator TEXT,
    implementation_time TEXT,
    field TEXT,
    budget_vnd REAL DEFAULT 0,
    acceptance_year INTEGER,
    status TEXT DEFAULT 'pending_review',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_field ON science_tasks(field);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON science_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON science_tasks(management_level);

-- 2. SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ
-- Các trường chuẩn: STT, Năm công nhận, Tên sáng kiến, Tác giả, Chủ sở hữu, Địa chỉ chủ sở hữu, Lĩnh vực
CREATE TABLE IF NOT EXISTS initiatives (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    code TEXT,
    recognition_year INTEGER,
    title TEXT NOT NULL,
    author TEXT,
    owner TEXT,
    owner_address TEXT,
    field TEXT,
    decision_number TEXT,
    status TEXT DEFAULT 'pending_review',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_initiatives_year ON initiatives(recognition_year);
CREATE INDEX IF NOT EXISTS idx_initiatives_field ON initiatives(field);

-- 3. CHUYÊN GIA & NHÀ KHOA HỌC
-- Các trường chuẩn: STT, Tên Chuyên gia, Năm sinh, Email, Điện thoại, Chuyên ngành
CREATE TABLE IF NOT EXISTS experts (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    name TEXT NOT NULL,
    birth_year INTEGER,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    workplace TEXT,
    degree TEXT,
    field TEXT,
    profile_summary TEXT,
    status TEXT DEFAULT 'published',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_experts_field ON experts(field);
CREATE INDEX IF NOT EXISTS idx_experts_specialization ON experts(specialization);

-- 4. DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO
-- Các trường chuẩn: STT, Tên doanh nghiệp, Địa chỉ hoạt động, Website doanh nghiệp, File logo, Lĩnh vực kinh doanh, Tóm tắt, Sản phẩm giải quyết vấn đề gì, Số lượng sáng lập viên, Tổng số nhân sự, Họ tên người đứng đầu, SĐT người đứng đầu, Email người đứng đầu, Năm bắt đầu
CREATE TABLE IF NOT EXISTS startups (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    name TEXT NOT NULL,
    operating_address TEXT,
    website TEXT,
    logo_file TEXT,
    business_field TEXT,
    field TEXT,
    summary TEXT,
    problem_solved TEXT,
    founders_count INTEGER DEFAULT 1,
    total_staff INTEGER DEFAULT 1,
    leader_name TEXT,
    leader_phone TEXT,
    leader_email TEXT,
    founding_year INTEGER,
    status TEXT DEFAULT 'published',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_startups_field ON startups(field);
CREATE INDEX IF NOT EXISTS idx_startups_year ON startups(founding_year);

-- 5. TỔ CHỨC TRUNG GIAN
-- Các trường chuẩn: STT, Tên tổ chức, Địa chỉ
CREATE TABLE IF NOT EXISTS support_organizations (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    name TEXT NOT NULL,
    address TEXT,
    organization_type TEXT,
    field TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    status TEXT DEFAULT 'published',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_support_orgs_name ON support_organizations(name);

-- 6. DỰ ÁN KHỞI NGHIỆP
-- Các trường chuẩn: STT, Tên dự án, Địa chỉ, Lĩnh vực, Tóm tắt, Sản phẩm giải quyết vấn đề gì, Số lượng thành viên, Họ tên người đứng đầu, SĐT, Email, Ươm tạo từ tổ chức nào, Năm bắt đầu
CREATE TABLE IF NOT EXISTS startup_projects (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    title TEXT NOT NULL,
    operating_address TEXT,
    field TEXT,
    summary TEXT,
    problem_solved TEXT,
    members_count INTEGER DEFAULT 1,
    leader_name TEXT,
    leader_phone TEXT,
    leader_email TEXT,
    incubated_at TEXT,
    founding_year INTEGER,
    stage TEXT,
    status TEXT DEFAULT 'published',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_field ON startup_projects(field);

-- 7. Ý TƯỞNG KHỞI NGHIỆP
-- Các trường chuẩn: STT, Tên ý tưởng, Địa chỉ hoạt động, Lĩnh vực, Ý tưởng thuộc Xã/phường - Trường học, Tóm tắt, Sản phẩm giải quyết vấn đề gì, Số lượng thành viên, Người đứng đầu, SĐT, Email, Tên thầy/cô hướng dẫn, Đang học tập/công tác tại đơn vị nào
CREATE TABLE IF NOT EXISTS startup_ideas (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    title TEXT NOT NULL,
    operating_address TEXT,
    field TEXT,
    ward_or_school TEXT,
    summary TEXT,
    problem_solved TEXT,
    members_count INTEGER DEFAULT 1,
    leader_name TEXT,
    leader_phone TEXT,
    leader_email TEXT,
    mentor_name TEXT,
    affiliated_unit TEXT,
    status TEXT DEFAULT 'pending_review',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ideas_field ON startup_ideas(field);

-- 8. DANH SÁCH XÃ/PHƯỜNG
-- Các trường chuẩn: STT, Tên xã/phường, Địa chỉ
CREATE TABLE IF NOT EXISTS wards (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    name TEXT NOT NULL,
    address TEXT,
    district TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 9. TRƯỜNG ĐẠI HỌC/CAO ĐẲNG TRÊN ĐỊA BÀN
-- Các trường chuẩn: STT, Tên trường, Xã/phường, Địa chỉ
CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    name TEXT NOT NULL,
    ward TEXT,
    address TEXT,
    website TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 10. DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU
-- Các trường chuẩn: STT, Tên dự án, Link website
CREATE TABLE IF NOT EXISTS featured_startups (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    project_name TEXT NOT NULL,
    website_link TEXT,
    field TEXT,
    highlight_achievement TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 11. SÁNG CHẾ & SỞ HỮU TRÍ TUỆ
CREATE TABLE IF NOT EXISTS patents (
    id TEXT PRIMARY KEY,
    stt INTEGER,
    code TEXT,
    title TEXT NOT NULL,
    application_number TEXT,
    grant_number TEXT,
    patent_type TEXT,
    filing_date TEXT,
    grant_date TEXT,
    inventor TEXT,
    assignee TEXT,
    field TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Bảng Mối quan hệ liên kết dữ liệu (Graph Connections)
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY, source_id TEXT NOT NULL, source_type TEXT NOT NULL,
    target_id TEXT NOT NULL, target_type TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'relates_to', notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_id, target_type);

-- Bảng Nhật ký kiểm toán (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, user_role TEXT,
    action TEXT NOT NULL, target_module TEXT, target_id TEXT, details TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(target_module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(timestamp);

-- Bảng Yêu cầu Kết nối & Hợp tác Công nghệ
CREATE TABLE IF NOT EXISTS connection_messages (
    id TEXT PRIMARY KEY, need_id TEXT, sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL, sender_phone TEXT, sender_org TEXT,
    message TEXT NOT NULL, proposed_capability TEXT,
    status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now'))
);

-- Bảng Quản lý Tệp Đính kèm & ImageKit Assets
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY, entity_id TEXT, module_type TEXT,
    file_name TEXT NOT NULL, file_size INTEGER DEFAULT 0, mime_type TEXT,
    cdn_url TEXT NOT NULL, thumbnail_url TEXT, title TEXT, uploaded_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_id, module_type);


-- Additional business modules missing from the legacy schema.
CREATE TABLE IF NOT EXISTS organizations (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE TABLE IF NOT EXISTS investors (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
CREATE TABLE IF NOT EXISTS investment_funds (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_investment_funds_status ON investment_funds(status);
CREATE TABLE IF NOT EXISTS technologies (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_technologies_status ON technologies(status);
CREATE TABLE IF NOT EXISTS programs (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE TABLE IF NOT EXISTS collaboration_needs (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_collaboration_needs_status ON collaboration_needs(status);
CREATE TABLE IF NOT EXISTS publications (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_publications_status ON publications(status);
CREATE TABLE IF NOT EXISTS lab_equipments (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_equipments_status ON lab_equipments(status);
CREATE TABLE IF NOT EXISTS policies (
 id TEXT PRIMARY KEY, stt INTEGER, code TEXT, title TEXT, name TEXT, description TEXT,
 field TEXT, owner_name TEXT, source TEXT, status TEXT DEFAULT 'draft',
 verification_status TEXT DEFAULT 'unverified', publicity_level TEXT DEFAULT 'public',
 history TEXT, data_json TEXT DEFAULT '{}', created_by TEXT, updated_by TEXT,
 created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

-- Common API fields and storage for configurable/custom form fields.
ALTER TABLE science_tasks ADD COLUMN description TEXT;
ALTER TABLE science_tasks ADD COLUMN owner_name TEXT;
ALTER TABLE science_tasks ADD COLUMN source TEXT;
ALTER TABLE science_tasks ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE science_tasks ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE science_tasks ADD COLUMN history TEXT;
ALTER TABLE science_tasks ADD COLUMN acceptance_result TEXT;
ALTER TABLE science_tasks ADD COLUMN total_budget_approved REAL DEFAULT 0;
ALTER TABLE science_tasks ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE science_tasks ADD COLUMN updated_by TEXT;
ALTER TABLE initiatives ADD COLUMN description TEXT;
ALTER TABLE initiatives ADD COLUMN owner_name TEXT;
ALTER TABLE initiatives ADD COLUMN source TEXT;
ALTER TABLE initiatives ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE initiatives ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE initiatives ADD COLUMN history TEXT;
ALTER TABLE initiatives ADD COLUMN cost_savings REAL DEFAULT 0;
ALTER TABLE initiatives ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE initiatives ADD COLUMN updated_by TEXT;
ALTER TABLE experts ADD COLUMN code TEXT;
ALTER TABLE experts ADD COLUMN title TEXT;
ALTER TABLE experts ADD COLUMN description TEXT;
ALTER TABLE experts ADD COLUMN owner_name TEXT;
ALTER TABLE experts ADD COLUMN source TEXT;
ALTER TABLE experts ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE experts ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE experts ADD COLUMN history TEXT;
ALTER TABLE experts ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE experts ADD COLUMN updated_by TEXT;
ALTER TABLE startups ADD COLUMN code TEXT;
ALTER TABLE startups ADD COLUMN title TEXT;
ALTER TABLE startups ADD COLUMN description TEXT;
ALTER TABLE startups ADD COLUMN owner_name TEXT;
ALTER TABLE startups ADD COLUMN source TEXT;
ALTER TABLE startups ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE startups ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE startups ADD COLUMN history TEXT;
ALTER TABLE startups ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE startups ADD COLUMN updated_by TEXT;
ALTER TABLE support_organizations ADD COLUMN code TEXT;
ALTER TABLE support_organizations ADD COLUMN title TEXT;
ALTER TABLE support_organizations ADD COLUMN description TEXT;
ALTER TABLE support_organizations ADD COLUMN owner_name TEXT;
ALTER TABLE support_organizations ADD COLUMN source TEXT;
ALTER TABLE support_organizations ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE support_organizations ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE support_organizations ADD COLUMN history TEXT;
ALTER TABLE support_organizations ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE support_organizations ADD COLUMN updated_by TEXT;
ALTER TABLE startup_projects ADD COLUMN code TEXT;
ALTER TABLE startup_projects ADD COLUMN description TEXT;
ALTER TABLE startup_projects ADD COLUMN owner_name TEXT;
ALTER TABLE startup_projects ADD COLUMN source TEXT;
ALTER TABLE startup_projects ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE startup_projects ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE startup_projects ADD COLUMN history TEXT;
ALTER TABLE startup_projects ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE startup_projects ADD COLUMN updated_by TEXT;
ALTER TABLE startup_ideas ADD COLUMN code TEXT;
ALTER TABLE startup_ideas ADD COLUMN description TEXT;
ALTER TABLE startup_ideas ADD COLUMN owner_name TEXT;
ALTER TABLE startup_ideas ADD COLUMN source TEXT;
ALTER TABLE startup_ideas ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE startup_ideas ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE startup_ideas ADD COLUMN history TEXT;
ALTER TABLE startup_ideas ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE startup_ideas ADD COLUMN updated_by TEXT;
ALTER TABLE wards ADD COLUMN code TEXT;
ALTER TABLE wards ADD COLUMN title TEXT;
ALTER TABLE wards ADD COLUMN description TEXT;
ALTER TABLE wards ADD COLUMN field TEXT;
ALTER TABLE wards ADD COLUMN owner_name TEXT;
ALTER TABLE wards ADD COLUMN source TEXT;
ALTER TABLE wards ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE wards ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE wards ADD COLUMN history TEXT;
ALTER TABLE wards ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE wards ADD COLUMN updated_by TEXT;
ALTER TABLE universities ADD COLUMN code TEXT;
ALTER TABLE universities ADD COLUMN title TEXT;
ALTER TABLE universities ADD COLUMN description TEXT;
ALTER TABLE universities ADD COLUMN field TEXT;
ALTER TABLE universities ADD COLUMN owner_name TEXT;
ALTER TABLE universities ADD COLUMN source TEXT;
ALTER TABLE universities ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE universities ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE universities ADD COLUMN history TEXT;
ALTER TABLE universities ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE universities ADD COLUMN updated_by TEXT;
ALTER TABLE featured_startups ADD COLUMN code TEXT;
ALTER TABLE featured_startups ADD COLUMN title TEXT;
ALTER TABLE featured_startups ADD COLUMN description TEXT;
ALTER TABLE featured_startups ADD COLUMN owner_name TEXT;
ALTER TABLE featured_startups ADD COLUMN source TEXT;
ALTER TABLE featured_startups ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE featured_startups ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE featured_startups ADD COLUMN history TEXT;
ALTER TABLE featured_startups ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE featured_startups ADD COLUMN updated_by TEXT;
ALTER TABLE patents ADD COLUMN description TEXT;
ALTER TABLE patents ADD COLUMN owner_name TEXT;
ALTER TABLE patents ADD COLUMN source TEXT;
ALTER TABLE patents ADD COLUMN verification_status TEXT DEFAULT 'unverified';
ALTER TABLE patents ADD COLUMN publicity_level TEXT DEFAULT 'public';
ALTER TABLE patents ADD COLUMN history TEXT;
ALTER TABLE patents ADD COLUMN data_json TEXT DEFAULT '{}';
ALTER TABLE patents ADD COLUMN updated_by TEXT;

-- Default portal configuration (system setting, not sample business data).
INSERT INTO system_config (
  id, portal_name, governing_agency, contact_address, contact_email,
  contact_phone, city_area, allow_public_submission, require_approval
) VALUES (
  'default',
  'Cổng dữ liệu KHCN & KNĐMST TP Đà Nẵng',
  'ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
  'Trung tâm Đổi mới sáng tạo Đà Nẵng, 24 Trần Phú, Hải Châu, Đà Nẵng',
  'sokhcn@danang.gov.vn',
  '(0236) 3822 851',
  'Thành phố Đà Nẵng',
  1,
  1
);
