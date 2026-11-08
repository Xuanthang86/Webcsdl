import React, { useState } from 'react';
import { ModuleType, User, SystemConfig, AggregatedStats, BaseEntity } from '../types';
import { DashboardView } from './admin/DashboardView';
import { ModuleCrudView, MODULE_NAMES } from './admin/ModuleCrudView';
import { RelationshipManager } from './admin/RelationshipManager';
import { ImportExportStudio } from './admin/ImportExportStudio';
import { AuditLogView } from './admin/AuditLogView';
import { SystemConfigView } from './admin/SystemConfigView';
import { TestSuiteView } from './admin/TestSuiteView';
import { BackupRestoreView } from './admin/BackupRestoreView';
import { FormConfigView } from './admin/FormConfigView';
import { UserManagerView } from './admin/UserManagerView';
import { Footer } from './Footer';
import { 
  LayoutDashboard, 
  Database, 
  Link as LinkIcon, 
  Upload, 
  ShieldCheck, 
  Settings, 
  Building2,
  MapPin,
  School,
  Star,
  Target,
  FileCheck, 
  MessageSquare, 
  Menu, 
  X,
  ArrowLeft,
  Sliders,
  Users,
  LogOut,
  FileText,
  Lightbulb,
  Award,
  GraduationCap,
  Rocket
} from 'lucide-react';

interface AdminLayoutProps {
  currentUser?: User;
  systemConfig: SystemConfig;
  stats: AggregatedStats | null;
  onConfigUpdated: (newConfig: SystemConfig) => void;
  onViewDetail: (entity: BaseEntity) => void;
  onBackToPublic: () => void;
  onLogout?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'module_crud'
  | 'relationships'
  | 'import_export'
  | 'form_config'
  | 'users'
  | 'audit_logs'
  | 'system_config'
  | 'test_suite'
  | 'backup_restore';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  systemConfig,
  stats,
  onConfigUpdated,
  onViewDetail,
  onBackToPublic,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeModule, setActiveModule] = useState<ModuleType>('science_tasks');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coreListOpen, setCoreListOpen] = useState(true);
  const [selectedEntityForRel, setSelectedEntityForRel] = useState<BaseEntity | null>(null);
  const adminContentRef = React.useRef<HTMLElement | null>(null);

  const goToAdminOverview = () => {
    setActiveTab('dashboard');
    setSidebarOpen(false);
    requestAnimationFrame(() => adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const isWardOfficer = currentUser?.role === 'partner_officer';
  const canManageUsers = currentUser?.role === 'super_admin' || currentUser?.role === 'system_admin';
  const canManageBackups = ['super_admin', 'system_admin'].includes(currentUser?.role || '');
  const canRestoreBackup = currentUser?.role === 'super_admin';

  const handleSelectModule = (mod: ModuleType) => {
    setActiveModule(mod);
    setActiveTab('module_crud');
    setSidebarOpen(false);
  };

  const handleOpenRelationsForEntity = (entity: BaseEntity) => {
    setSelectedEntityForRel(entity);
    setActiveTab('relationships');
  };

  const handleOpenImport = (mod: ModuleType) => {
    setActiveModule(mod);
    setActiveTab('import_export');
  };

  const topCoreModules: { mod: ModuleType; label: string; icon: any; color: string }[] = [
    { mod: 'science_tasks', label: 'Đề tài, nhiệm vụ KH&CN', icon: FileText, color: 'text-teal-400' },
    { mod: 'initiatives', label: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố', icon: Lightbulb, color: 'text-amber-400' },
    { mod: 'patents', label: 'Sáng chế & Sở hữu trí tuệ', icon: Award, color: 'text-purple-400' },
    { mod: 'experts', label: 'Chuyên gia & Nhà khoa học', icon: GraduationCap, color: 'text-blue-400' }
  ];

  const ecosystemModules: { mod: ModuleType; label: string; icon: any; color: string }[] = [
    { mod: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', icon: Rocket, color: 'text-rose-400' },
    { mod: 'support_organizations', label: 'Tổ chức trung gian', icon: Building2, color: 'text-cyan-400' },
    { mod: 'startup_projects', label: 'Dự án khởi nghiệp', icon: Target, color: 'text-emerald-400' },
    { mod: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', icon: Lightbulb, color: 'text-yellow-400' },
    { mod: 'wards', label: 'Danh sách xã/phường', icon: MapPin, color: 'text-indigo-400' },
    { mod: 'universities', label: 'Trường Đại học/Cao đẳng trên địa bàn', icon: School, color: 'text-violet-400' },
    { mod: 'featured_startups', label: 'Doanh nghiệp khởi nghiệp tiêu biểu', icon: Star, color: 'text-amber-300' },
    { mod: 'investors', label: 'Nhà đầu tư', icon: Users, color: 'text-cyan-300' },
    { mod: 'investment_funds', label: 'Quỹ đầu tư', icon: Building2, color: 'text-indigo-300' },
  ];

  const allModulesList = [...topCoreModules, ...ecosystemModules];

  const isRestrictedOfficer = isWardOfficer || (
    Boolean(currentUser?.managedModules && currentUser.managedModules.length > 0 && !['super_admin', 'system_admin'].includes(currentUser?.role || ''))
  );

  const allowedModules = isRestrictedOfficer
    ? (currentUser?.managedModules || ['startup_projects', 'startup_ideas'])
    : allModulesList.map(m => m.mod);

  const visibleTopModules = topCoreModules.filter(m => allowedModules.includes(m.mod));
  const visibleEcosystemModules = ecosystemModules.filter(m => allowedModules.includes(m.mod));
  React.useEffect(() => {
    if (isRestrictedOfficer && allowedModules.length > 0) {
      if (!allowedModules.includes(activeModule)) {
        setActiveModule(allowedModules[0] as ModuleType);
        setActiveTab('module_crud');
      }
    }
  }, [isRestrictedOfficer, allowedModules, activeModule]);

  return (
    <div className="min-h-screen lg:h-screen lg:min-h-0 lg:overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* Mobile & Tablet Header with Toggle */}
      <div className="lg:hidden bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white p-3.5 flex items-center justify-between border-b border-sky-700/60 sticky top-0 z-30 shadow-md">
        <div 
          onClick={goToAdminOverview}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') goToAdminOverview(); }}
          className="flex items-center gap-2 cursor-pointer group"
          title="Về Tổng quan & Chỉ số"
        >
          <div className="w-8 h-8 rounded-lg bg-white text-sky-900 flex items-center justify-center font-black text-xs transition-colors shrink-0 shadow-xs">
            ĐN
          </div>
          <div className="min-w-0 max-w-[225px]">
            <div className="font-black text-xs tracking-tight text-white uppercase leading-none">CỔNG DỮ LIỆU</div>
            <div className="text-[9px] text-sky-200 font-bold uppercase mt-0.5 leading-tight tracking-[-0.02em] whitespace-nowrap">VỀ KHOA HỌC, CÔNG NGHỆ</div>
            <div className="text-[9px] text-sky-200 font-bold uppercase leading-tight tracking-[-0.035em] whitespace-nowrap">VÀ KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO TP ĐÀ NẴNG</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-sky-200 hover:text-white cursor-pointer rounded-lg hover:bg-sky-800 transition-colors"
          title={sidebarOpen ? "Đóng thanh công cụ" : "Mở thanh công cụ"}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for tablet & mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-700 text-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 shrink-0 flex flex-col justify-between border-r border-slate-700
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          
          {/* Brand & Title */}
          <div className="pb-3 border-b border-slate-700 flex items-center justify-between">
            <div 
              onClick={onBackToPublic}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Truy cập Trang chủ"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 group-hover:bg-sky-500 text-white flex items-center justify-center font-black text-sm transition-colors shrink-0 shadow-sm">
                ĐN
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-tight group-hover:text-sky-300 transition-colors">
                  Quản trị dữ liệu KHCN & KNĐMST
                </div>
                <div className="text-[11px] text-sky-400 font-semibold">
                  Thành phố Đà Nẵng
                </div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              title="Đóng thanh điều hướng"
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Standalone highlighted button: Truy cập Trang chủ */}
          <button
            onClick={onBackToPublic}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-800/80 hover:bg-sky-700 text-sky-200 hover:text-white border border-sky-500/60 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            title="Truy cập Trang chủ"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="whitespace-nowrap">Truy cập Trang chủ</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-sm">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === 'dashboard' ? 'bg-sky-700/80 text-white shadow-xs' : 'hover:bg-slate-700 text-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Tổng quan & Chỉ số</span>
            </button>

            {/* Section: Top Module categories */}
            {visibleTopModules.length > 0 && (
              <div className="pt-2 space-y-1">
                {visibleTopModules.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === 'module_crud' && activeModule === item.mod;
                  return (
                    <button
                      key={item.mod}
                      onClick={() => handleSelectModule(item.mod)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-sky-700/80 text-white font-bold shadow-xs'
                          : 'hover:bg-slate-700 text-slate-100'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${item.color} shrink-0`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Section: Dữ liệu Hệ sinh thái */}
            {visibleEcosystemModules.length > 0 && (
              <div className="pt-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                  <Rocket className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dữ liệu Hệ sinh thái</span>
                </div>
                <div className="space-y-1 pl-1">
                  {visibleEcosystemModules.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === 'module_crud' && activeModule === item.mod;
                    return (
                      <button
                        key={item.mod}
                        onClick={() => handleSelectModule(item.mod)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          isActive
                            ? 'bg-sky-700/80 text-white font-bold shadow-xs'
                            : 'hover:bg-slate-700 text-slate-100'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${item.color} shrink-0`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isRestrictedOfficer && <div className="pt-2 space-y-1">
              <button
                onClick={() => { setActiveTab('relationships'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'relationships' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Quản lý quan hệ liên kết toàn hệ thống</span>
              </button>

              <button
                onClick={() => { setActiveTab('import_export'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'import_export' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Nhập dữ liệu hàng loạt từ Excel / CSV</span>
              </button>

              <button
                onClick={() => { setActiveTab('form_config'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'form_config' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Tùy biến trường & thiết lập ẩn / hiện dữ liệu</span>
              </button>

              {canManageUsers && (
                <button
                  onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'users' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Quản lý tài khoản & phân quyền người dùng</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('audit_logs'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'audit_logs' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Nhật ký truy vết hệ thống (Audit Logs)</span>
              </button>

              <button
                onClick={() => { setActiveTab('system_config'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'system_config' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Cấu hình nhận diện thương hiệu & cơ quan chủ quản</span>
              </button>

              {canManageBackups && (
                <button
                  onClick={() => { setActiveTab('backup_restore'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'backup_restore' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <Database className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Sao lưu và phục hồi dữ liệu</span>
                </button>
              )}
              <button
                onClick={() => { setActiveTab('test_suite'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'test_suite' ? 'bg-sky-700/80 text-white font-bold shadow-xs' : 'hover:bg-slate-700 text-slate-100'
                }`}
              >
                <FileCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Bộ kiểm thử nghiệm thu & an toàn bảo mật</span>
              </button>
            </div>}

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-700 space-y-2">
          {onLogout && (
            <button
              type="button"
              onClick={() => { setSidebarOpen(false); onLogout(); }}
              className="lg:hidden w-full min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border border-rose-400/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          )}
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Cổng Quản trị Dữ liệu KHCN</span>
            <span className="font-mono text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-sky-400">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen lg:min-h-0 bg-slate-50">
        
        {/* Desktop Admin Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white border-b border-sky-700/60 shadow-sm shrink-0">
          <div onClick={goToAdminOverview} className="cursor-pointer" title="Về Tổng quan & Chỉ số">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-none">CỔNG DỮ LIỆU</h1>
            <p className="mt-1.5 text-[11px] xl:text-xs 2xl:text-sm font-bold text-sky-200 tracking-tight uppercase leading-tight whitespace-nowrap">VỀ KHOA HỌC, CÔNG NGHỆ VÀ KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO THÀNH PHỐ ĐÀ NẴNG</p>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="text-right">
                <div className="text-sm font-bold text-white">{currentUser.fullName}</div>
                <div className="text-xs text-sky-300 font-semibold capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </header>

        <main ref={adminContentRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="lg:min-h-full lg:flex lg:flex-col">
            <div className="max-w-7xl mx-auto w-full lg:flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                currentUser={currentUser}
                systemConfig={systemConfig}
                onNavigateModule={(mod) => handleSelectModule(mod as ModuleType)}
                onOpenTestRunner={() => setActiveTab('test_suite')}
              />
            )}

            {activeTab === 'module_crud' && (
              <ModuleCrudView
                moduleType={activeModule}
                currentUser={currentUser}
                onViewDetail={onViewDetail}
                onOpenImport={handleOpenImport}
                onManageRelations={handleOpenRelationsForEntity}
              />
            )}

            {activeTab === 'relationships' && (
              <RelationshipManager
                initialEntity={selectedEntityForRel}
                onClose={() => setSelectedEntityForRel(null)}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'import_export' && (
              <ImportExportStudio
                initialModule={activeModule}
                currentUser={currentUser}
                onImportComplete={() => {}}
              />
            )}

            {activeTab === 'form_config' && (
              <FormConfigView />
            )}

            {activeTab === 'users' && (
              canManageUsers ? (
                <UserManagerView currentUser={currentUser} />
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
                  Bạn không có quyền truy cập chức năng Quản lý người dùng & Phân quyền.
                </div>
              )
            )}

            {activeTab === 'audit_logs' && (
              <AuditLogView />
            )}

            {activeTab === 'system_config' && (
              <SystemConfigView
                config={systemConfig}
                onConfigUpdated={onConfigUpdated}
              />
            )}

            {activeTab === 'test_suite' && (
              <TestSuiteView />
            )}

            {activeTab === 'backup_restore' && canManageBackups && (
              <BackupRestoreView canRestore={canRestoreBackup} />
            )}

            </div>
            <div className="hidden lg:block lg:mt-auto">
              <Footer config={systemConfig} />
            </div>
          </div>
        </main>
        <div className="lg:hidden">
          <Footer config={systemConfig} />
        </div>
      </div>

    </div>
  );
};
