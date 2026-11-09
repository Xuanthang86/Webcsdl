export type UserRole =
  | 'super_admin'
  | 'system_admin'
  | 'agency_leader'
  | 'data_officer'
  | 'evaluator_expert'
  | 'partner_officer'
  | 'org_representative'
  | 'expert_user'
  | 'investor_user'
  | 'public_user';

export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_revision'
  | 'approved'
  | 'rejected'
  | 'archived';

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'disputed';

export type PublicityLevel =
  | 'public'
  | 'restricted'
  | 'internal';

export type ModuleType =
  | 'science_tasks'       // 1. Đề tài, nhiệm vụ KH&CN
  | 'initiatives'         // 2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
  | 'experts'             // 3. Chuyên gia
  | 'startups'            // 4. Doanh nghiệp khởi nghiệp sáng tạo
  | 'support_organizations' // 5. Tổ chức trung gian
  | 'startup_projects'    // 6. Dự án khởi nghiệp
  | 'startup_ideas'       // 7. Ý tưởng khởi nghiệp
  | 'wards'               // 8. Danh sách xã/phường
  | 'universities'        // 9. Trường Đại học/Cao đẳng trên địa bàn
  | 'featured_startups'   // 10. Doanh nghiệp khởi nghiệp tiêu biểu
  | 'organizations'       // Tổ chức KH&CN
  | 'investors'           // Nhà đầu tư
  | 'investment_funds'    // Quỹ đầu tư
  | 'technologies'        // Công nghệ & kết quả nghiên cứu
  | 'programs'            // Chương trình, cuộc thi & cơ hội hỗ trợ
  | 'collaboration_needs' // Nhu cầu & đề xuất kết nối
  | 'patents'             // Sáng chế & Sở hữu trí tuệ
  | 'publications'        // Bài báo & Công bố khoa học
  | 'lab_equipments'      // Thiết bị & Phòng thí nghiệm
  | 'policies';           // Chính sách, Văn bản & Quy định

export interface BaseEntity {
  id: string;
  code: string;
  title: string;
  moduleType: ModuleType;
  description: string;
  field: string;
  ownerName: string;
  source: string;
  status: ApprovalStatus;
  verificationStatus: VerificationStatus;
  publicityLevel: PublicityLevel;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  history?: Array<{
    timestamp: string;
    action: string;
    user: string;
    note?: string;
  }>;
  [key: string]: any;
}

export interface EntityRelationship {
  id: string;
  sourceModule: ModuleType;
  sourceId: string;
  sourceTitle: string;
  targetModule: ModuleType;
  targetId: string;
  targetTitle: string;
  relationType: string;
  validFrom?: string;
  validTo?: string;
  verificationSource?: string;
  status: 'active' | 'pending' | 'ended';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  customPermissions?: string[];
  managedModules?: string[];
  organizationScope?: string;
  createdAt: string;
}

export interface SystemConfig {
  portalName: string;
  governingAgency: string;
  cityArea: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  websiteDomain: string;
  primaryColor: string;
  enablePublicSubmissions: boolean;
  maintenanceMode: boolean;
  defaultLanguage: 'vi' | 'en';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetModule?: ModuleType;
  targetId?: string;
  targetTitle?: string;
  details: string;
  timestamp: string;
}

export interface ConnectionMessage {
  id: string;
  needId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderOrg: string;
  message: string;
  proposedCapability: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface CustomFieldConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
  isHidden?: boolean;
}

export interface ModuleFormConfig {
  customFields: CustomFieldConfig[];
  hiddenSystemFields?: string[];
  fieldOverrides?: Record<string, { label?: string; placeholder?: string; helpText?: string; options?: string[] }>;
}

export interface AggregatedStats {
  totalScienceTasks: number;
  tasksRunning: number;
  tasksAccepted: number;
  tasksPending: number;
  totalInitiatives: number;
  initiativesRecognized: number;
  totalCostSavings: number;
  totalBudgetApproved: number;
  totalExperts: number;
  verifiedExperts: number;
  totalOrganizations: number;
  totalStartups: number;
  totalProjects: number;
  totalIdeas: number;
  totalInvestors: number;
  totalFunds: number;
  totalSupportOrgs: number;
  totalTechnologies: number;
  totalPrograms: number;
  totalCollaborationNeeds: number;
  totalPatents?: number;
  totalPublications?: number;
  totalLabEquipments?: number;
  totalPolicies?: number;
  totalWards?: number;
  totalUniversities?: number;
  totalFeaturedStartups?: number;
  totalRelationships: number;
  pendingApprovalsCount: number;
  fieldBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  tasksByField?: Record<string, number>;
  tasksByYear?: Record<string, number>;
  initiativesByField?: Record<string, number>;
  initiativesByYear?: Record<string, number>;
  startupsByYear?: Record<string, number>;
  investorsByYear?: Record<string, number>;
  investmentFundsByYear?: Record<string, number>;
  yearlyStats?: Record<string, { tasks: number; initiatives: number; startups: number; budget: number; savings: number }>;
  expertsByField?: Record<string, number>;
  expertsByAcademicTitle?: Record<string, number>;
  expertsByWorkplace?: Record<string, number>;
  expertsByDegree?: Record<string, number>;
  expertsBySpecialty?: Record<string, number>;
  expertsByTitle?: Record<string, number>;
  expertsByYear?: Record<string, number>;
  initiativesInCurrentYear?: number;
  currentYear?: number;
  tasksByUnit?: Record<string, number>;
  tasksByLevel?: Record<string, number>;
  initiativesBySpecialty?: Record<string, number>;
  initiativesByUnit?: Record<string, number>;
  startupsByField?: Record<string, number>;
  startupsByWard?: Record<string, number>;
  startupsBySchool?: Record<string, number>;
  projectsByField?: Record<string, number>;
  projectsBySchool?: Record<string, number>;
  projectsByWard?: Record<string, number>;
  projectsByOrigin?: Record<string, number>;
  ideasByField?: Record<string, number>;
  ideasBySchool?: Record<string, number>;
  ideasByWard?: Record<string, number>;
  supportOrgsByField?: Record<string, number>;
  projectsByYear?: Record<string, number>;
  projectsBySchool?: Record<string, number>;
  projectsByWard?: Record<string, number>;
  ideasByField?: Record<string, number>;
  ideasByYear?: Record<string, number>;
  ideasBySchool?: Record<string, number>;
  ideasByWard?: Record<string, number>;
  wardsByAreaType?: Record<string, number>;
  universitiesByType?: Record<string, number>;
  featuredStartupsByField?: Record<string, number>;
  patentsByYear?: Record<string, number>;
  patentsByField?: Record<string, number>;
  supportOrgsByYear?: Record<string, number>;
  universitiesByYear?: Record<string, number>;
  wardsByYear?: Record<string, number>;
}

