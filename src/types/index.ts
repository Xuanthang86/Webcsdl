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
  | 'science_tasks'
  | 'initiatives'
  | 'experts'
  | 'organizations'
  | 'startups'
  | 'startup_projects'
  | 'startup_ideas'
  | 'investors'
  | 'investment_funds'
  | 'support_organizations'
  | 'technologies'
  | 'programs'
  | 'collaboration_needs'
  | 'patents'
  | 'publications'
  | 'lab_equipments'
  | 'policies';

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
  totalRelationships: number;
  pendingApprovalsCount: number;
  fieldBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

