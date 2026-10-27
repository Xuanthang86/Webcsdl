/**
 * Schema types for the City Science, Technology, Innovation and Startup Portal
 * Cổng Dữ liệu Tổng hợp KH&CN, Đổi mới sáng tạo và Khởi nghiệp thành phố
 */

export type UserRole =
  | 'super_admin'       // Quản trị kỹ thuật & cấu hình toàn hệ thống
  | 'system_admin'      // Quản lý người dùng, cấu hình và dữ liệu
  | 'agency_leader'     // Lãnh đạo cơ quan (xem báo cáo, phê duyệt)
  | 'data_officer'      // Cán bộ quản lý dữ liệu (tiếp nhận, kiểm tra, xử lý)
  | 'evaluator_expert'  // Chuyên gia thẩm định (đánh giá chuyên môn)
  | 'partner_officer'   // Cán bộ đơn vị cung cấp dữ liệu
  | 'org_representative'// Đại diện doanh nghiệp / tổ chức
  | 'expert_user'       // Chuyên gia / nhà khoa học
  | 'investor_user'     // Nhà đầu tư
  | 'public_user';      // Người dùng công khai

export type ApprovalStatus =
  | 'draft'               // Bản nháp
  | 'submitted'           // Gửi duyệt
  | 'under_review'        // Tiếp nhận & kiểm tra
  | 'needs_revision'      // Yêu cầu bổ sung hồ sơ
  | 'approved'            // Đã phê duyệt
  | 'rejected'            // Từ chối phê duyệt
  | 'archived';           // Lưu trữ / hết hiệu lực

export type VerificationStatus =
  | 'unverified'          // Chưa xác minh
  | 'pending'             // Đang xác minh
  | 'verified'            // Đã xác minh chính thức
  | 'disputed';           // Đang có kiến nghị / khiếu nại

export type PublicityLevel =
  | 'public'              // Công khai toàn dân
  | 'restricted'          // Hạn chế / Chỉ đăng nhập
  | 'internal';           // Nội bộ cơ quan quản lý

export type ModuleType =
  | 'science_tasks'       // 1. Nhiệm vụ, đề tài KH&CN
  | 'initiatives'         // 2. Sáng kiến có tác động thành phố
  | 'experts'             // 3. Chuyên gia, nhà khoa học
  | 'organizations'       // 4. Tổ chức KH&CN
  | 'startups'            // 5. Doanh nghiệp khởi nghiệp ĐMST
  | 'startup_projects'    // 6. Dự án khởi nghiệp
  | 'startup_ideas'       // 7. Ý tưởng khởi nghiệp & ĐMST
  | 'investors'           // 8. Nhà đầu tư
  | 'investment_funds'    // 9. Quỹ đầu tư
  | 'support_organizations' // 10. Tổ chức hỗ trợ hệ sinh thái
  | 'technologies'        // 11. Công nghệ & kết quả nghiên cứu
  | 'programs'            // 12. Chương trình, cuộc thi & cơ hội hỗ trợ
  | 'collaboration_needs' // 13. Nhu cầu & đề xuất kết nối
  | 'patents'             // 14.1 Sáng chế & Sở hữu trí tuệ
  | 'publications'        // 14.2 Bài báo & Công bố khoa học
  | 'lab_equipments'      // 14.3 Thiết bị & Phòng thí nghiệm
  | 'policies';           // 14.4 Chính sách, Văn bản & Quy định

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
}

// 1. Nhiệm vụ, đề tài KH&CN
export interface ScienceTask extends BaseEntity {
  moduleType: 'science_tasks';
  taskType: 'Nghiên cứu cơ bản' | 'Nghiên cứu ứng dụng' | 'Phát triển công nghệ' | 'Sản xuất thử nghiệm' | 'Chuyển giao công nghệ';
  necessityObjectives: string;
  mainContents: string;
  keywords: string[];
  location: string;
  managingAgency: string;      // Cơ quan quản lý
  leadOrganization: string;    // Cơ quan chủ trì
  partnerOrganizations: string[];
  principalInvestigator: string; // Chủ nhiệm nhiệm vụ
  members: string[];
  experts: string[];
  selectionMethod: 'Tuyển chọn' | 'Giao trực tiếp' | 'Đặt hàng';
  fundingProgram: string;
  totalBudgetApproved: number;  // VND
  stateBudget: number;         // VND
  counterpartBudget: number;   // VND
  expectedStartDate: string;
  expectedEndDate: string;
  actualDuration?: string;
  milestones: string[];
  expectedOutputs: string;
  kpiTargets: string;
  executionProgress: number;   // 0 - 100%
  acceptanceResult?: 'Xuất sắc' | 'Đạt' | 'Không đạt' | 'Chờ nghiệm thu';
  approvalDecisionNumber?: string;
  acceptanceDecisionNumber?: string;
  scientificProducts?: string[];
  receivingUnit?: string;
  applicationLevel?: 'Thử nghiệm' | 'Ứng dụng rộng rãi' | 'Đã chuyển giao';
  impactAssessment?: string;
  commercializationFeasibility?: string;
  attachments?: Array<{ name: string; url: string; size: string }>;
}

// 2. Sáng kiến có tác động thành phố
export interface Initiative extends BaseEntity {
  moduleType: 'initiatives';
  problemSolved: string;
  solutionDetails: string;
  noveltyPoints: string;
  authors: string[];
  proposingOrg: string;
  implementingLead: string;
  applicationArea: string;
  beneficiaries: string;
  conceptionDate: string;
  implementationDate: string;
  receivingAgency: string;
  reviewCouncil?: string;
  recognitionDecision?: string;
  proposedScope: 'Cấp đơn vị' | 'Cấp thành phố' | 'Toàn quốc';
  recognizedScope?: 'Cấp đơn vị' | 'Cấp thành phố' | 'Toàn quốc' | 'Chưa công nhận';
  beforeAfterComparison: string;
  investmentCost: number;      // VND
  costSavings: number;         // VND tiết kiệm
  economicImpact: string;
  socialImpact: string;
  adminImpact: string;
  environmentalImpact?: string;
  beneficiaryCount: number;
  scalabilityPotential: 'Cao' | 'Trung bình' | 'Đặc thù';
  appliedUnits: string[];
  interestedUnits: string[];
  attachments?: Array<{ name: string; url: string; size: string }>;
}

// 3. Chuyên gia, nhà khoa học
export interface Expert extends BaseEntity {
  moduleType: 'experts';
  academicTitle: 'GS' | 'PGS' | 'TS' | 'ThS' | 'Kỹ sư/Cử nhân';
  position: string;
  workplace: string;
  department: string;
  primaryField: string;
  secondaryFields: string[];
  specialtyKeywords: string[];
  educationLevel: string;
  careerTimeline: string;
  researchExperience: string;
  linkedTasksCount: number;
  headedTopicsCount: number;
  publicationsCount: number;
  patentsCount: number;
  advisoryExperience: string;
  startupMentoringExperience: string;
  councilsJoined: string[];
  availableRoles: string[];
  collaborationLocations: string[];
  collaborationReadiness: 'Sẵn sàng' | 'Bận' | 'Hạn chế';
  publicEmail: string;
  publicPhone?: string;
  consentPublic: boolean;
}

// 4. Tổ chức KH&CN
export interface OrganizationEntity extends BaseEntity {
  moduleType: 'organizations';
  abbreviation: string;
  orgType: 'Viện nghiên cứu' | 'Trường đại học' | 'Trung tâm R&D' | 'Phòng thí nghiệm trọng điểm' | 'Doanh nghiệp KH&CN';
  taxOrBusinessCode: string;
  governingBody: string;
  representative: string;
  headquarters: string;
  operationalArea: string;
  researchCapacity: string;
  labEquipment: string;
  scientificStaffCount: number;
  patentsCount: number;
  techTransferCapacity: string;
  collaborationNeeds: string;
  website: string;
  publicEmail: string;
  publicPhone: string;
}

// 5. Doanh nghiệp khởi nghiệp ĐMST
export interface Startup extends BaseEntity {
  moduleType: 'startups';
  brandName: string;
  businessCode: string;
  foundedDate: string;
  legalType: 'Công ty Cổ phần' | 'Công ty TNHH' | 'Doanh nghiệp tư nhân';
  representative: string;
  headquarters: string;
  operationalArea: string;
  website: string;
  publicEmail: string;
  publicPhone: string;
  coreTech: string;
  businessModel: string;
  targetMarket: string;
  targetCustomers: string;
  developmentStage: 'Ý tưởng' | 'MVP' | 'Tăng trưởng sơ khởi' | 'Mở rộng' | 'Thành thục';
  teamSize: string;
  growthMetrics?: string;
  fundingNeeds: number;        // VND
  fundraisingRounds: string[];
  linkedInvestors: string[];
  programsJoined: string[];
  awards: string[];
  ipRights: string;
}

// 6. Dự án khởi nghiệp
export interface StartupProject extends BaseEntity {
  moduleType: 'startup_projects';
  problemSolved: string;
  solution: string;
  productService: string;
  techUsed: string;
  innovationAngle: string;
  targetSegment: string;
  marketSize: string;
  revenueModel: string;
  foundingTeam: string[];
  owningStartupName?: string;
  stage: 'Ý tưởng' | 'Chế tạo mẫu' | 'Thử nghiệm thị trường' | 'Thương mại hóa';
  prototypeStatus: string;
  marketValidation: string;
  capitalNeeded: number;       // VND
  capitalRaised: number;       // VND
  advisoryNeeds: string;
  techNeeds: string;
  supportPrograms: string[];
  pitchDeckUrl?: string;
}

// 7. Ý tưởng khởi nghiệp & ĐMST
export interface StartupIdea extends BaseEntity {
  moduleType: 'startup_ideas';
  problemSolved: string;
  solution: string;
  uniqueValue: string;
  proposer: string;
  teamMembers: string[];
  beneficiaries: string;
  targetUsers: string;
  maturityLevel: 'Sơ khai' | 'Đã khảo sát' | 'Mô hình hóa';
  needsAdvisory: boolean;
  needsCapital: boolean;
  needsTechPartner: boolean;
  competitionsJoined: string[];
  evaluationScore?: number;
  supportRecommendation?: string;
  convertedToProjectId?: string;
}

// 8. Nhà đầu tư
export interface Investor extends BaseEntity {
  moduleType: 'investors';
  investorType: 'Nhà đầu tư thiên thần' | 'Nhà đầu tư tổ chức' | 'Doanh nghiệp đầu tư';
  linkedOrganization?: string;
  operatingCountry: string;
  sectorsOfInterest: string[];
  stagesOfInterest: string[];
  ticketMin: number;           // USD or VND
  ticketMax: number;
  investmentMode: string;
  selectionCriteria: string;
  geographicFocus: string;
  publicPortfolio: string[];
  publicEmail: string;
  publicPhone?: string;
}

// 9. Quỹ đầu tư
export interface InvestmentFund extends BaseEntity {
  moduleType: 'investment_funds';
  fundType: 'Quỹ mạo hiểm (VC)' | 'Quỹ vốn tư nhân (PE)' | 'Quỹ tác động' | 'Quỹ đầu tư ĐMST thành phố';
  fundManagerOrg: string;
  headquarters: string;
  targetSectors: string[];
  targetStages: string[];
  fundSizeApprox: number;      // VND
  ticketPerDeal: string;
  criteria: string;
  publicPortfolio: string[];
  managementTeam: string[];
  applicationProcess: string;
  website: string;
  contactEmail: string;
}

// 10. Tổ chức hỗ trợ hệ sinh thái
export interface SupportOrganization extends BaseEntity {
  moduleType: 'support_organizations';
  supportType: 'Vườn ươm (Incubator)' | 'Tổ chức tăng tốc (Accelerator)' | 'Trung tâm ĐMST' | 'Không gian làm việc chung' | 'Trung tâm chuyển giao CN' | 'Hiệp hội doanh nghiệp';
  governingBody: string;
  address: string;
  servicesProvided: string[];
  incubationPrograms: string[];
  intakeSchedule: string;
  facilities: string;
  mentorPoolCount: number;
  alumniStartupsCount: number;
  website: string;
  contactEmail: string;
}

// 11. Công nghệ & kết quả nghiên cứu
export interface TechnologyEntity extends BaseEntity {
  moduleType: 'technologies';
  objectType: 'Công nghệ' | 'Sản phẩm hoàn thiện' | 'Quy trình công nghệ' | 'Kết quả nghiên cứu khả thi';
  trlLevel: number;            // 1 - 9
  ownerOrgOrPerson: string;
  techOrigin: string;
  linkedScienceTaskCode?: string;
  patentInfo: string;
  testingResults: string;
  applicationPrerequisites: string;
  transferFeasibility: 'Sẵn sàng chuyển giao' | 'Cần hoàn thiện thêm' | 'Tìm đối tác đồng phát triển';
  transferPriceConditions?: string;
  technicalDocsUrl?: string;
}

// 12. Chương trình, cuộc thi & cơ hội hỗ trợ
export interface ProgramEntity extends BaseEntity {
  moduleType: 'programs';
  organizer: string;
  eligibility: string;
  priorityFields: string[];
  supportFormat: string[];
  supportValueEstimate: string;
  applicationDeadline: string;
  selectionProcess: string;
  contactPoint: string;
  programStatus: 'Mở nhận hồ sơ' | 'Đang xét chọn' | 'Đang triển khai' | 'Đã kết thúc';
  beneficiariesCount: number;
}

// 13. Nhu cầu & đề xuất kết nối
export interface CollaborationNeed extends BaseEntity {
  moduleType: 'collaboration_needs';
  needType: 'Đặt hàng nhiệm vụ KH&CN' | 'Nhu cầu chuyển giao công nghệ' | 'Cần chuyên gia tư vấn' | 'Thử nghiệm & kiểm định' | 'Tìm nhà đầu tư' | 'Đối tác kinh doanh' | 'Đề xuất giải quyết bài toán TP';
  posterType: 'Doanh nghiệp' | 'Viện trường' | 'Chuyên gia' | 'Cơ quan nhà nước' | 'Cá nhân';
  posterContact: string;
  detailedRequirements: string;
  deadline: string;
  processingState: 'Mới đăng' | 'Đang kết nối' | 'Đã ghép nối' | 'Tạm đóng';
  connectionRequestsCount: number;
}

export type AnyEntity =
  | ScienceTask
  | Initiative
  | Expert
  | OrganizationEntity
  | Startup
  | StartupProject
  | StartupIdea
  | Investor
  | InvestmentFund
  | SupportOrganization
  | TechnologyEntity
  | ProgramEntity
  | CollaborationNeed;

// Entity Relationship
export interface EntityRelationship {
  id: string;
  sourceModule: ModuleType;
  sourceId: string;
  sourceTitle: string;
  targetModule: ModuleType;
  targetId: string;
  targetTitle: string;
  relationType: string;        // 'chủ trì', 'tham gia', 'chuyển giao cho', 'đầu tư', 'ứng dụng', 'ươm tạo', 'cố vấn'
  validFrom?: string;
  validTo?: string;
  verificationSource?: string;
  status: 'active' | 'pending' | 'ended';
  createdAt: string;
}

// System User
export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  customPermissions?: string[];
  createdAt: string;
}

// Activity & Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'revise' | 'publish' | 'import' | 'export' | 'login' | 'system_config';
  targetModule?: ModuleType;
  targetId?: string;
  targetTitle?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// System Configuration
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

// Connection Request
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

// Form Field Management Configuration (Section VIII.3)
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
}

