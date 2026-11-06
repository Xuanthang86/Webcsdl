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
    password_salt TEXT,
    salt TEXT,
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
CREATE TABLE IF NOT EXISTS entity_relationships (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_title TEXT,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_title TEXT,
    relationship_type TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON entity_relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_rel_target ON entity_relationships(target_id, target_type);

-- Bảng Nhật ký kiểm toán (Audit Logs)
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
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Bảng Yêu cầu Kết nối & Hợp tác Công nghệ
CREATE TABLE IF NOT EXISTS connection_messages (
    id TEXT PRIMARY KEY,
    target_entity_id TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_title TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_phone TEXT,
    sender_org TEXT,
    message TEXT NOT NULL,
    proposed_capability TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Bảng Quản lý Tệp Đính kèm & ImageKit Assets
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    entity_id TEXT,
    module_type TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER DEFAULT 0,
    cdn_url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_id, module_type);
