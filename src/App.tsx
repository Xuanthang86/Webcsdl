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

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'admin'>('home');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [availableRoles, setAvailableRoles] = useState<Array<{ role: string; label: string }>>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    portalName: 'CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP',
    governingAgency: 'ỦY BAN NHÂN DÂN THÀNH PHỐ - SỞ KHOA HỌC VÀ CÔNG NGHỆ',
    cityArea: 'Thành phố Hà Nội & TP. Hồ Chí Minh',
    contactEmail: 'sokhcn@thanhpho.gov.vn',
    contactPhone: '024.3825.9999 / 028.3932.5555',
    contactAddress: 'Tòa nhà Trung tâm Hành chính Thành phố',
    websiteDomain: 'khcndmst.thanhpho.gov.vn',
    primaryColor: '#0f766e',
    enablePublicSubmissions: true,
    maintenanceMode: false,
    defaultLanguage: 'vi'
  });
  const [stats, setStats] = useState<AggregatedStats | null>(null);

  // Featured items for Home
  const [featuredInitiatives, setFeaturedInitiatives] = useState<BaseEntity[]>([]);
  const [featuredTasks, setFeaturedTasks] = useState<BaseEntity[]>([]);
  const [featuredExperts, setFeaturedExperts] = useState<BaseEntity[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<BaseEntity[]>([]);
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

  const initAppData = async () => {
    try {
      // 1. Load User & Roles
      const userRes = await api.getCurrentUser();
      setCurrentUser(userRes.user);
      setAvailableRoles(userRes.availableRoles || []);

      // 2. Load Config & Stats
      const [configData, statsData] = await Promise.all([
        api.getConfig(),
        api.getStats()
      ]);
      setSystemConfig(configData);
      setStats(statsData);

      // 3. Load Featured Showcase Data
      const [inits, tasks, experts, startups, needs, pols] = await Promise.all([
        api.getModuleRecords('initiatives'),
        api.getModuleRecords('science_tasks'),
        api.getModuleRecords('experts'),
        api.getModuleRecords('startups'),
        api.getModuleRecords('collaboration_needs'),
        api.getModuleRecords('policies')
      ]);

      setFeaturedInitiatives(inits.slice(0, 3));
      setFeaturedTasks(tasks.slice(0, 2));
      setFeaturedExperts(experts.slice(0, 3));
      setFeaturedStartups(startups.slice(0, 3));
      setFeaturedNeeds(needs.slice(0, 2));
      setFeaturedPolicies(pols.slice(0, 2));
    } catch (err) {
      console.error('Lỗi khởi tạo cổng dữ liệu:', err);
    }
  };

  useEffect(() => {
    initAppData();
  }, []);

  const handleSwitchRole = async (role: string) => {
    try {
      const user = await api.switchRole(role);
      setCurrentUser(user);
      setSuccessToast(`Đã chuyển đổi sang vai trò: ${user.fullName} (${user.role})`);
      setTimeout(() => setSuccessToast(null), 3000);
      // Reload stats
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển đổi vai trò');
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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-700 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{successToast}</span>
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
        />
      )}

      {/* View Routing */}
      {currentView === 'home' && (
        <main className="flex-1">
          <HomeView
            stats={stats}
            featuredInitiatives={featuredInitiatives}
            featuredTasks={featuredTasks}
            featuredExperts={featuredExperts}
            featuredStartups={featuredStartups}
            featuredNeeds={featuredNeeds}
            featuredPolicies={featuredPolicies}
            systemConfig={systemConfig}
            onSearch={handleSearchFromHero}
            onNavigateBrowse={handleNavigateBrowseWithCategory}
            onViewDetail={handleOpenDetail}
            onOpenSubmitModal={() => setShowSubmitModal(true)}
            onOpenConnectModal={handleOpenConnectModal}
          />
        </main>
      )}

      {currentView === 'browse' && (
        <main className="flex-1">
          <BrowseView
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

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAdminLoginModal(false);
            setCurrentView('admin');
            setSuccessToast(`Đăng nhập thành công với vai trò: ${user.fullName} (${user.role})`);
            setTimeout(() => setSuccessToast(null), 3000);
          }}
        />
      )}

    </div>
  );
}
