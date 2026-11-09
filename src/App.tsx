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

class DetailModalErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DetailModal] Render failure isolated:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div role="alert" className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Không thể hiển thị hồ sơ</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Dữ liệu của hồ sơ có trường chưa tương thích với giao diện. Lỗi đã được ghi nhận; vui lòng thử lại hoặc liên hệ quản trị viên.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => this.setState({ hasError: false })} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Thử hiển thị lại
              </button>
              <button type="button" onClick={this.props.onClose} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                Đóng
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AUTH_TAB_CHANNEL = 'webcsdl-auth-tab-session';

async function hasAnotherActiveAuthTab(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return false;
  return new Promise(resolve => {
    const channel = new BroadcastChannel(AUTH_TAB_CHANNEL);
    let found = false;
    channel.onmessage = event => {
      if (event.data === 'active') found = true;
    };
    channel.postMessage('probe');
    window.setTimeout(() => {
      channel.close();
      resolve(found);
    }, 160);
  });
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      // The hash is only a route hint, never an authentication credential.
      // Restore the admin screen even if iOS discarded sessionStorage; the server
      // still validates the HttpOnly session and the UI will request login if needed.
      if (hash === 'admin') return 'admin';
      if (hash === 'browse' || hash === 'home') return hash;
      const saved = window.sessionStorage.getItem('portal_current_view');
      if (saved === 'admin') return 'admin';
      if (saved === 'browse' || saved === 'home') return saved;
    }
    return 'home';
  });

  // Keep the view only for this browser tab session; never persist an admin route across restarts.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('portal_current_view', currentView);
      window.localStorage.removeItem('portal_current_view');
      if (currentView === 'home') {
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.location.hash = currentView;
      }
    }
  }, [currentView]);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  // The server's HttpOnly session cookie is the sole source of authentication.
  // Do not restore an authenticated user from persistent browser storage.
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [availableRoles, setAvailableRoles] = useState<Array<{ role: string; label: string }>>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    portalName: 'Cổng dữ liệu Tổng hợp khoa học, công nghệ & khởi nghiệp đổi mới sáng tạo',
    governingAgency: 'ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
    cityArea: 'Thành phố Đà Nẵng',
    contactEmail: 'sokhcn@danang.gov.vn',
    contactPhone: '0236.3822.459 / 0236.3830.214',
    contactAddress: 'Trung tâm Đổi mới sáng tạo Đà Nẵng, 24 Trần Phú, Hải Châu, Đà Nẵng',
    websiteDomain: 'dost.danang.gov.vn',
    primaryColor: '#0f766e',
    enablePublicSubmissions: true,
    maintenanceMode: false,
    defaultLanguage: 'vi'
  });

  const INITIAL_STATS: AggregatedStats = {
    totalScienceTasks: 0,
    tasksRunning: 0,
    tasksAccepted: 0,
    tasksPending: 0,
    totalInitiatives: 0,
    initiativesRecognized: 0,
    initiativesInCurrentYear: 0,
    currentYear: new Date().getFullYear(),
    totalPatents: 0,
    totalExperts: 0,
    verifiedExperts: 0,
    totalStartups: 0,
    totalSupportOrgs: 0,
    totalProjects: 0,
    totalIdeas: 0,
    totalWards: 0,
    totalUniversities: 0,
    totalFeaturedStartups: 0,
    totalOrganizations: 0,
    totalInvestors: 0,
    totalFunds: 0,
    totalPrograms: 0,
    totalPublications: 0,
    totalTechnologies: 0,
    totalCollaborationNeeds: 0,
    totalLabEquipments: 0,
    totalPolicies: 0,
    totalRelationships: 0,
    pendingApprovalsCount: 0,
    fieldBreakdown: {},
    statusBreakdown: { approved: 0, under_review: 0, draft: 0, needs_revision: 0 },
    totalBudgetApproved: 0,
    totalCostSavings: 0,
    tasksByField: {},
    tasksByYear: {},
    initiativesByYear: {},
    startupsByYear: {}
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
  const [featuredInvestors, setFeaturedInvestors] = useState<BaseEntity[]>([]);
  const [featuredFunds, setFeaturedFunds] = useState<BaseEntity[]>([]);
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
      // A session cookie is shared by tabs. A fresh tab must not silently inherit
      // an old login unless another currently open tab confirms the same session.
      if (typeof window !== 'undefined') {
        const tabMarker = window.sessionStorage.getItem('portal_tab_active') === 'true';
        const closingMarker = window.sessionStorage.getItem('portal_tab_closing') === 'true';
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const isReload = navigation?.type === 'reload';
        if (closingMarker && isReload && tabMarker) {
          window.sessionStorage.removeItem('portal_tab_closing');
        } else if (!tabMarker || closingMarker) {
          const peerTabIsActive = await hasAnotherActiveAuthTab();
          if (peerTabIsActive) {
            window.sessionStorage.setItem('portal_tab_active', 'true');
            window.sessionStorage.removeItem('portal_tab_closing');
          } else {
            await api.logout().catch(() => {});
            window.sessionStorage.removeItem('portal_tab_active');
            window.sessionStorage.removeItem('portal_tab_closing');
          }
        }
      }

      // 1. Load User
      const userRes = await api.getCurrentUser();
      const administrativeRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'];
      if (userRes?.user && (currentView !== 'admin' || administrativeRoles.includes(userRes.user.role))) {
        setCurrentUser(userRes.user);
      } else if (currentView === 'admin') {
        // Keep the requested admin route after a reload, but never restore an
        // authenticated identity from browser storage. Require a fresh login.
        setCurrentUser(undefined);
        setShowAdminLoginModal(true);
      }
      setAvailableRoles(userRes.availableRoles || []);

      // 2. Load Config & Stats
      const [configData, statsData] = await Promise.all([
        api.getConfig(),
        api.getStats()
      ]);
      setSystemConfig(configData);
      setStats(statsData);

      // 3. Load Featured Showcase Data for all 10 types (top 3 each, public approved only)
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
        investors,
        funds,
        needs,
        pols
      ] = await Promise.all([
        api.getModuleRecords('science_tasks', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'science_tasks' as any }))),
        api.getModuleRecords('initiatives', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'initiatives' as any }))),
        api.getModuleRecords('patents', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'patents' as any }))),
        api.getModuleRecords('experts', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'experts' as any }))),
        api.getModuleRecords('startups', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'startups' as any }))),
        api.getModuleRecords('support_organizations', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'support_organizations' as any }))),
        api.getModuleRecords('startup_projects', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'startup_projects' as any }))),
        api.getModuleRecords('startup_ideas', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'startup_ideas' as any }))),
        api.getModuleRecords('wards', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'wards' as any }))),
        api.getModuleRecords('universities', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'universities' as any }))),
        api.getModuleRecords('featured_startups', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'featured_startups' as any }))),
        api.getModuleRecords('investors', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'investors' as any }))).catch(() => [] as BaseEntity[]),
        api.getModuleRecords('investment_funds', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'investment_funds' as any }))).catch(() => [] as BaseEntity[]),
        api.getModuleRecords('collaboration_needs', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'collaboration_needs' as any }))),
        api.getModuleRecords('policies', undefined, undefined, true).then(l => l.map(r => ({ ...r, moduleType: 'policies' as any })))
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
      setFeaturedInvestors(investors.slice(0, 3));
      setFeaturedFunds(funds.slice(0, 3));
      setFeaturedNeeds(needs.slice(0, 3));
      setFeaturedPolicies(pols.slice(0, 3));
    } catch (err) {
      console.error('Lỗi khởi tạo cổng dữ liệu:', err);
    }
  };

  useEffect(() => {
    initAppData();

    // Probe/answer channel lets an additional tab reuse a session only while
    // another tab is still open; a closed tab leaves no sessionStorage marker.
    let authChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      authChannel = new BroadcastChannel(AUTH_TAB_CHANNEL);
      authChannel.onmessage = event => {
        if (event.data === 'probe' &&
            window.sessionStorage.getItem('portal_tab_active') === 'true' &&
            window.sessionStorage.getItem('portal_tab_closing') !== 'true') {
          authChannel?.postMessage('active');
        }
      };
    }
    const markTabClosing = () => {
      if (window.sessionStorage.getItem('portal_tab_active') === 'true') {
        window.sessionStorage.setItem('portal_tab_closing', 'true');
      }
    };
    window.addEventListener('pagehide', markTabClosing);

    const handleAuthExpired = () => {
      const adminWasOpen = window.sessionStorage.getItem('portal_current_view') === 'admin' || window.location.hash === '#admin';
      setCurrentUser(undefined);
      if (adminWasOpen) {
        // Preserve the admin screen after an iOS/WebKit tab restore. The API remains
        // protected by the HttpOnly cookie; require re-authentication before data access.
        window.sessionStorage.setItem('portal_tab_active', 'true');
        setCurrentView('admin');
        setShowAdminLoginModal(true);
      }
    };
    window.addEventListener('portal:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('portal:auth-expired', handleAuthExpired);
      window.removeEventListener('pagehide', markTabClosing);
      authChannel?.close();
    };
  }, []);

  // iOS Safari may suspend or restore a tab without remounting the React app.
  // Revalidate the server session when an admin tab becomes visible again.
  useEffect(() => {
    if (currentView !== 'admin') return;
    const administrativeRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'];
    let wasHidden = document.visibilityState === 'hidden';
    const revalidateAdminSession = async () => {
      try {
        const response = await api.getCurrentUser();
        if (response?.user && administrativeRoles.includes(response.user.role)) {
          setCurrentUser(response.user);
        } else {
          setCurrentUser(undefined);
          setShowAdminLoginModal(true);
        }
      } catch {
        setCurrentUser(undefined);
        setShowAdminLoginModal(true);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
      } else if (wasHidden) {
        wasHidden = false;
        void revalidateAdminSession();
      }
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void revalidateAdminSession();
    };
    // Keep the sliding token alive while the admin tab remains visible and in use.
    // Hidden tabs do not refresh; closing the last tab removes the tab-scoped marker.
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') void revalidateAdminSession();
    }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [currentView]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('portal_tab_active');
        sessionStorage.removeItem('portal_tab_closing');
        localStorage.removeItem('portal_auth_token');
        localStorage.removeItem('portal_cached_user');
        localStorage.removeItem('portal_current_view');
        window.location.hash = '';
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

  const handleOpenDetail = async (entity: BaseEntity) => {
    if (!entity || !entity.id) return;
    const modType = entity.moduleType || 'science_tasks';
    try {
      const full = await api.getRecordById(modType as any, entity.id);
      const record = full?.data && typeof full.data === 'object' && !Array.isArray(full.data)
        ? full.data
        : entity;
      setActiveDetailEntity({ ...record, moduleType: modType });
      setActiveRelationships(Array.isArray(full?.relationships) ? full.relationships : []);
    } catch (err) {
      console.error('[Dashboard] Không tải được hồ sơ chi tiết:', { moduleType: modType, recordId: entity.id, error: err });
      // Keep the selected list record visible as a safe fallback instead of crashing or opening a blank page.
      setActiveDetailEntity({ ...entity, moduleType: modType });
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
      sessionStorage.removeItem('portal_tab_closing');
    }
    setCurrentUser(user);
    setShowAdminLoginModal(false);
    // Khi đăng nhập sẽ kiểm tra quyền tài khoản để chuyển giao diện truy cập phù hợp
    const administrativeRoles = ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'];
    if (administrativeRoles.includes(user.role)) {
      setCurrentView('admin');
    } else {
      sessionStorage.removeItem('portal_tab_active');
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
            featuredInvestors={featuredInvestors}
            featuredFunds={featuredFunds}
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
        <DetailModalErrorBoundary
          key={`${activeDetailEntity.moduleType || 'science_tasks'}:${activeDetailEntity.id || 'record'}`}
          onClose={() => setActiveDetailEntity(null)}
        >
          <DetailModal
            entity={activeDetailEntity}
            relationships={activeRelationships}
            currentUser={currentUser}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
            onClose={() => setActiveDetailEntity(null)}
            onOpenEntity={handleOpenRelatedEntity}
            onOpenConnectModal={handleOpenConnectModal}
          />
        </DetailModalErrorBoundary>
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
