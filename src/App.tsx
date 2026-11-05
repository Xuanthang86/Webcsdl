/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { 
  BaseEntity, 
  User, 
  SystemConfig, 
  AggregatedStats, 
  EntityRelationship 
} from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { BrowseView } from './components/BrowseView';
import { AdminLayout } from './components/AdminLayout';
import { DetailModal } from './components/DetailModal';
import { PublicSubmitModal } from './components/PublicSubmitModal';
import { ConnectionModal } from './components/ConnectionModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdvancedSearchModal } from './components/AdvancedSearchModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'admin'>('home');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [availableRoles, setAvailableRoles] = useState<Array<{ role: string; label: string }>>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    portalName: 'Cổng dữ liệu Tổng hợp khoa học, công nghệ & khởi nghiệp đổi mới sáng tạo',
    governingAgency: 'ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
    cityArea: 'Thành phố Đà Nẵng',
    contactEmail: 'sokhcn@danang.gov.vn',
    contactPhone: '0236.3822.459 / 0236.3830.214',
    contactAddress: 'Trung tâm Đổi mới sáng tạo Đà Nẵng',
    websiteDomain: 'dost.danang.gov.vn',
    primaryColor: '#0f766e',
    enablePublicSubmissions: true,
    maintenanceMode: false,
    defaultLanguage: 'vi'
  });

  const INITIAL_STATS: AggregatedStats = {
    totalScienceTasks: 18,
    tasksRunning: 12,
    tasksAccepted: 15,
    tasksPending: 3,
    totalInitiatives: 15,
    initiativesRecognized: 14,
    initiativesInCurrentYear: 14,
    currentYear: new Date().getFullYear(),
    totalPatents: 8,
    totalExperts: 32,
    verifiedExperts: 28,
    totalStartups: 14,
    totalSupportOrgs: 5,
    totalProjects: 10,
    totalIdeas: 12,
    totalWards: 56,
    totalUniversities: 8,
    totalFeaturedStartups: 7,
    totalOrganizations: 16,
    totalInvestors: 6,
    totalFunds: 4,
    totalPrograms: 7,
    totalPublications: 45,
    totalTechnologies: 18,
    totalCollaborationNeeds: 9,
    totalLabEquipments: 12,
    totalPolicies: 15,
    totalRelationships: 38,
    pendingApprovalsCount: 2,
    fieldBreakdown: { 'Công nghệ thông tin, Chuyển đổi số & AI': 6 },
    statusBreakdown: { approved: 15, under_review: 3 },
    totalBudgetApproved: 32500000000,
    totalCostSavings: 8400000000,
    tasksByField: {
      'Công nghệ thông tin, Chuyển đổi số & AI': 6,
      'Y Dược & Công nghệ sinh học': 4,
      'Nông nghiệp công nghệ cao': 3,
      'Môi trường, Năng lượng & Biến đổi khí hậu': 3,
      'Cơ khí tự động hóa & Vật liệu mới': 2
    },
    tasksByYear: { '2023': 4, '2024': 6, '2025': 6, '2026': 2 },
    initiativesByYear: { '2023': 3, '2024': 5, '2025': 5, '2026': 2 },
    startupsByYear: { '2023': 3, '2024': 6, '2025': 4, '2026': 1 }
  };

  const [stats, setStats] = useState<AggregatedStats | null>(INITIAL_STATS);

  // 10 Core & Ecosystem featured items (each showing top 3 newest)
  const [featuredTasks, setFeaturedTasks] = useState<BaseEntity[]>([]);
  const [featuredInitiatives, setFeaturedInitiatives] = useState<BaseEntity[]>([]);
  const [featuredPatents, setFeaturedPatents] = useState<BaseEntity[]>([]);
  const [featuredExperts, setFeaturedExperts] = useState<BaseEntity[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<BaseEntity[]>([]);
  const [featuredSupportOrgs, setFeaturedSupportOrgs] = useState<BaseEntity[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<BaseEntity[]>([]);
  const [featuredIdeas, setFeaturedIdeas] = useState<BaseEntity[]>([]);
  const [featuredWards, setFeaturedWards] = useState<BaseEntity[]>([]);
  const [featuredUniversities, setFeaturedUniversities] = useState<BaseEntity[]>([]);
  const [featuredPopularStartups, setFeaturedPopularStartups] = useState<BaseEntity[]>([]);
  const [featuredNeeds, setFeaturedNeeds] = useState<BaseEntity[]>([]);
  const [featuredPolicies, setFeaturedPolicies] = useState<BaseEntity[]>([]);

  // Browse search parameters
  const [browseParams, setBrowseParams] = useState<{
    q: string;
    moduleType?: string;
    field?: string;
  }>({ q: '', moduleType: 'all' });

  // Detail Modal state
  const [activeDetailEntity, setActiveDetailEntity] = useState<BaseEntity | null>(null);
  const [activeRelationships, setActiveRelationships] = useState<EntityRelationship[]>([]);

  // Action Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectEntityTarget, setConnectEntityTarget] = useState<BaseEntity | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  const initAppData = async () => {
    try {
      // 1. Load User & Check Tab/Browser Session Freshness
      const isTabSessionActive = typeof window !== 'undefined' && sessionStorage.getItem('portal_tab_active') === 'true';
      const userRes = await api.getCurrentUser();

      if (userRes?.user && userRes.user.role !== 'public_user' && !isTabSessionActive) {
        // User closed tab/browser and reopened: automatically clear stale session
        await api.logout().catch(() => {});
        setCurrentUser({
          id: 'usr_guest',
          username: 'guest',
          fullName: 'Khách vãng lai',
          email: 'guest@danang.gov.vn',
          role: 'public_user',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      } else {
        setCurrentUser(userRes.user);
        if (userRes?.user && userRes.user.role !== 'public_user' && typeof window !== 'undefined') {
          sessionStorage.setItem('portal_tab_active', 'true');
        }
      }
      setAvailableRoles(userRes.availableRoles || []);

      // 2. Load Config & Stats
      const [configData, statsData] = await Promise.all([
        api.getConfig(),
        api.getStats()
      ]);
      setSystemConfig(configData);
      setStats(statsData);

      // 3. Load Featured Showcase Data for all 10 types (top 3 each)
      const [
        tasks,
        inits,
        patents,
        experts,
        startups,
        supportOrgs,
        projects,
        ideas,
        wards,
        universities,
        popStartups,
        needs,
        pols
      ] = await Promise.all([
        api.getModuleRecords('science_tasks'),
        api.getModuleRecords('initiatives'),
        api.getModuleRecords('patents'),
        api.getModuleRecords('experts'),
        api.getModuleRecords('startups'),
        api.getModuleRecords('support_organizations'),
        api.getModuleRecords('startup_projects'),
        api.getModuleRecords('startup_ideas'),
        api.getModuleRecords('wards'),
        api.getModuleRecords('universities'),
        api.getModuleRecords('featured_startups'),
        api.getModuleRecords('collaboration_needs'),
        api.getModuleRecords('policies')
      ]);

      setFeaturedTasks(tasks.slice(0, 3));
      setFeaturedInitiatives(inits.slice(0, 3));
      setFeaturedPatents(patents.slice(0, 3));
      setFeaturedExperts(experts.slice(0, 3));
      setFeaturedStartups(startups.slice(0, 3));
      setFeaturedSupportOrgs(supportOrgs.slice(0, 3));
      setFeaturedProjects(projects.slice(0, 3));
      setFeaturedIdeas(ideas.slice(0, 3));
      setFeaturedWards(wards.slice(0, 3));
      setFeaturedUniversities(universities.slice(0, 3));
      setFeaturedPopularStartups(popStartups.slice(0, 3));
      setFeaturedNeeds(needs.slice(0, 3));
      setFeaturedPolicies(pols.slice(0, 3));
    } catch (err) {
      console.error('Lỗi khởi tạo cổng dữ liệu:', err);
    }
  };

  useEffect(() => {
    initAppData();

    const handleAuthExpired = () => {
      handleLogout();
    };
    window.addEventListener('portal:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('portal:auth-expired', handleAuthExpired);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('portal_tab_active');
        localStorage.removeItem('portal_auth_token');
      }
      try {
        const guestData = await api.getCurrentUser();
        setCurrentUser(guestData.user);
      } catch {
        setCurrentUser({
          id: 'usr_guest',
          username: 'guest',
          fullName: 'Khách vãng lai',
          email: 'guest@danang.gov.vn',
          role: 'public_user',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
      setCurrentView('home');
      // Toast removed per Section VII.7
    }
  };

  const handleSwitchRole = async (role: string) => {
    try {
      const user = await api.switchRole(role);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('portal_tab_active', 'true');
      }
      setCurrentUser(user);
      setSuccessToast(`Đã chuyển đổi sang vai trò: ${user.fullName} (${user.role})`);
      setTimeout(() => setSuccessToast(null), 3000);
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (err: any) {
      showError(err.message || 'Lỗi chuyển đổi vai trò');
    }
  };

  const handleOpenDetail = async (entity: BaseEntity) => {
    try {
      const full = await api.getRecordById(entity.moduleType, entity.id);
      setActiveDetailEntity(full.data || entity);
      setActiveRelationships(full.relationships || []);
    } catch (err) {
      setActiveDetailEntity(entity);
      setActiveRelationships([]);
    }
  };

  const handleOpenRelatedEntity = async (moduleType: string, id: string) => {
    try {
      const full = await api.getRecordById(moduleType as any, id);
      setActiveDetailEntity(full.data);
      setActiveRelationships(full.relationships || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchFromHero = (params: { q: string; moduleType?: string; field?: string }) => {
    setBrowseParams(params);
    setCurrentView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateBrowseWithCategory = (category = 'all') => {
    setBrowseParams({ q: '', moduleType: category });
    setCurrentView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenConnectModal = (entity: BaseEntity) => {
    setConnectEntityTarget(entity);
    setShowConnectModal(true);
  };

  const handleSubmissionSuccess = (code: string) => {
    setShowSubmitModal(false);
    setSuccessToast(`Nộp hồ sơ thành công! Mã hồ sơ theo dõi: ${code}`);
    setTimeout(() => setSuccessToast(null), 5000);
    initAppData();
  };

  const handleAdminLoginSuccess = (user: User) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('portal_tab_active', 'true');
    }
    setCurrentUser(user);
    setShowAdminLoginModal(false);
    // Khi đăng nhập sẽ kiểm tra quyền tài khoản để chuyển giao diện truy cập phù hợp
    const administrativeRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'];
    if (administrativeRoles.includes(user.role)) {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
  };

  const handleApplyAdvancedSearch = (params: any) => {
    setShowAdvancedSearchModal(false);
    setBrowseParams({
      q: params.q || '',
      moduleType: params.moduleType || 'all',
      field: params.field || ''
    });
    setCurrentView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-700 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-20 right-4 z-50 bg-rose-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-rose-700 animate-in fade-in slide-in-from-top-2">
          <span>⚠</span>
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Top Header */}
      {currentView !== 'admin' && (
        <Header
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          availableRoles={availableRoles}
          systemConfig={systemConfig}
          onOpenSubmitModal={() => setShowSubmitModal(true)}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          onSelectCategory={(category) => handleNavigateBrowseWithCategory(category)}
          onLogout={handleLogout}
          onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
        />
      )}

      {/* View Routing */}
      {currentView === 'home' && (
        <main className="flex-1">
          <HomeView
            stats={stats}
            featuredTasks={featuredTasks}
            featuredInitiatives={featuredInitiatives}
            featuredPatents={featuredPatents}
            featuredExperts={featuredExperts}
            featuredStartups={featuredStartups}
            featuredSupportOrgs={featuredSupportOrgs}
            featuredProjects={featuredProjects}
            featuredIdeas={featuredIdeas}
            featuredWards={featuredWards}
            featuredUniversities={featuredUniversities}
            featuredPopularStartups={featuredPopularStartups}
            featuredNeeds={featuredNeeds}
            featuredPolicies={featuredPolicies}
            systemConfig={systemConfig}
            onSearch={handleSearchFromHero}
            onNavigateBrowse={handleNavigateBrowseWithCategory}
            onViewDetail={handleOpenDetail}
            onOpenSubmitModal={() => setShowSubmitModal(true)}
            onOpenConnectModal={handleOpenConnectModal}
            onOpenAdvancedSearch={() => setShowAdvancedSearchModal(true)}
          />
        </main>
      )}

      {currentView === 'browse' && (
        <main className="flex-1">
          <BrowseView
            key={`${browseParams.moduleType || 'all'}_${browseParams.q || ''}_${browseParams.field || ''}`}
            initialSearchQuery={browseParams.q}
            initialModule={browseParams.moduleType}
            initialField={browseParams.field}
            onViewDetail={handleOpenDetail}
            onOpenSubmitModal={() => setShowSubmitModal(true)}
          />
        </main>
      )}

      {currentView === 'admin' && (
        <AdminLayout
          currentUser={currentUser}
          systemConfig={systemConfig}
          stats={stats}
          onConfigUpdated={(newCfg) => setSystemConfig(newCfg)}
          onViewDetail={handleOpenDetail}
          onBackToPublic={() => setCurrentView('home')}
          onLogout={handleLogout}
        />
      )}

      {/* Main Footer (Hidden inside admin view for full dashboard canvas) */}
      {currentView !== 'admin' && (
        <Footer config={systemConfig} />
      )}

      {/* Detail Modal */}
      {activeDetailEntity && (
        <DetailModal
          entity={activeDetailEntity}
          relationships={activeRelationships}
          currentUser={currentUser}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          onClose={() => setActiveDetailEntity(null)}
          onOpenEntity={handleOpenRelatedEntity}
          onOpenConnectModal={handleOpenConnectModal}
        />
      )}

      {/* Public Submission Modal */}
      {showSubmitModal && (
        <PublicSubmitModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {/* Connection Modal */}
      {showConnectModal && connectEntityTarget && (
        <ConnectionModal
          entity={connectEntityTarget}
          onClose={() => {
            setShowConnectModal(false);
            setConnectEntityTarget(null);
          }}
        />
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearchModal && (
        <AdvancedSearchModal
          onClose={() => setShowAdvancedSearchModal(false)}
          onApplySearch={handleApplyAdvancedSearch}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

    </div>
  );
}
