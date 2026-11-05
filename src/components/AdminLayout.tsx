import React, { useState } from 'react';
import { ModuleType, User, SystemConfig, AggregatedStats, BaseEntity } from '../types';
import { DashboardView } from './admin/DashboardView';
import { ModuleCrudView, MODULE_NAMES } from './admin/ModuleCrudView';
import { RelationshipManager } from './admin/RelationshipManager';
import { ImportExportStudio } from './admin/ImportExportStudio';
import { AuditLogView } from './admin/AuditLogView';
import { SystemConfigView } from './admin/SystemConfigView';
import { TestSuiteView } from './admin/TestSuiteView';
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
  ChevronDown,
  Layers,
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
  | 'test_suite';

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
  const [auxiliaryDropdownOpen, setAuxiliaryDropdownOpen] = useState(false);
  const [selectedEntityForRel, setSelectedEntityForRel] = useState<BaseEntity | null>(null);

  const isSystemAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'system_admin';
  const canManageUsers = isSystemAdmin;
  const hasModuleRestrictions = !isSystemAdmin && !!(currentUser?.managedModules && currentUser.managedModules.length > 0);
  const userAllowedModules = hasModuleRestrictions ? currentUser.managedModules! : null;

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

  const [ecosystemOpen, setEcosystemOpen] = useState(true);

  const topCoreModules: { mod: ModuleType; label: string; icon: any; color: string }[] = [
    { mod: 'science_tasks', label: '1. Đề tài, nhiệm vụ KH&CN', icon: FileText, color: 'text-teal-400' },
    { mod: 'initiatives', label: '2. Sáng kiến có ảnh hưởng cấp TP', icon: Lightbulb, color: 'text-amber-400' },
    { mod: 'patents', label: '3. Sáng chế & Sở hữu trí tuệ', icon: Award, color: 'text-purple-400' },
    { mod: 'experts', label: '4. Chuyên gia & Nhà khoa học', icon: GraduationCap, color: 'text-blue-400' }
  ];

  const ecosystemModules: { mod: ModuleType; label: string; icon: any; color: string }[] = [
    { mod: 'startups', label: 'DN khởi nghiệp sáng tạo', icon: Rocket, color: 'text-rose-400' },
    { mod: 'support_organizations', label: 'Tổ chức trung gian', icon: Building2, color: 'text-cyan-400' },
    { mod: 'startup_projects', label: 'Dự án khởi nghiệp', icon: Target, color: 'text-emerald-400' },
    { mod: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', icon: Lightbulb, color: 'text-yellow-400' },
    { mod: 'wards', label: 'Danh sách xã/phường', icon: MapPin, color: 'text-indigo-400' },
    { mod: 'universities', label: 'Trường ĐH/Cao đẳng trên địa bàn', icon: School, color: 'text-violet-400' },
    { mod: 'featured_startups', label: 'DN khởi nghiệp tiêu biểu', icon: Star, color: 'text-amber-300' }
  ];

  const visibleTopCoreModules = userAllowedModules
    ? topCoreModules.filter(item => userAllowedModules.includes(item.mod))
    : topCoreModules;

  const visibleEcosystemModules = userAllowedModules
    ? ecosystemModules.filter(item => userAllowedModules.includes(item.mod))
    : ecosystemModules;

  const allAuxiliaryModules: { mod: ModuleType; label: string }[] = [
    { mod: 'investors', label: 'Nhà đầu tư' },
    { mod: 'investment_funds', label: 'Quỹ đầu tư' },
    { mod: 'organizations', label: 'Tổ chức KH&CN, Viện trường' },
    { mod: 'publications', label: 'Bài báo & Công bố khoa học' },
    { mod: 'technologies', label: 'Công nghệ & Chuyển giao' },
    { mod: 'collaboration_needs', label: 'Nhu cầu kết nối & Đặt hàng' },
    { mod: 'programs', label: 'Chương trình & Cơ hội hỗ trợ' },
    { mod: 'policies', label: 'Chính sách, Văn bản & Biểu mẫu' },
    { mod: 'lab_equipments', label: 'Phòng thí nghiệm & Thiết bị' }
  ];

  const visibleAuxiliaryModules = userAllowedModules
    ? allAuxiliaryModules.filter(item => userAllowedModules.includes(item.mod))
    : allAuxiliaryModules;

  // Ensure active module is in allowed list if user has restrictions
  React.useEffect(() => {
    if (userAllowedModules && userAllowedModules.length > 0 && !userAllowedModules.includes(activeModule)) {
      setActiveModule(userAllowedModules[0] as ModuleType);
    }
  }, [userAllowedModules, activeModule]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 lg:w-80 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:min-h-screen shrink-0 flex flex-col justify-between border-r border-slate-800 shadow-xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-4 overflow-y-auto">
          
          {/* Brand & Close Button */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div 
              onClick={onBackToPublic}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center font-bold text-sm transition-colors shadow-xs">
                ĐN
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm tracking-tight group-hover:text-teal-300 transition-colors leading-tight">Quản trị dữ liệu KHCN & KNĐMST</div>
                <div className="text-[11px] text-teal-300 font-semibold leading-tight mt-0.5">Thành phố Đà Nẵng</div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              title="Đóng thanh điều hướng"
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs sm:text-sm">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Tổng quan & Chỉ số</span>
            </button>

            {/* Top 4 Core Modules */}
            <div className="pt-2 space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Phân hệ dữ liệu chính
              </div>
              {visibleTopCoreModules.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === 'module_crud' && activeModule === item.mod;
                return (
                  <button
                    key={item.mod}
                    onClick={() => handleSelectModule(item.mod)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-teal-800 text-white font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              {/* 5. Dữ liệu Hệ sinh thái (Group containing the 7 ecosystem child modules) */}
              {visibleEcosystemModules.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setEcosystemOpen(!ecosystemOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                      visibleEcosystemModules.some(m => m.mod === activeModule) && activeTab === 'module_crud'
                        ? 'bg-slate-800/90 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Rocket className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="truncate font-medium">5. Dữ liệu Hệ sinh thái</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${ecosystemOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {ecosystemOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-1">
                      {visibleEcosystemModules.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === 'module_crud' && activeModule === item.mod;
                        return (
                          <button
                            key={item.mod}
                            onClick={() => handleSelectModule(item.mod)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left cursor-pointer ${
                              isActive
                                ? 'bg-teal-900/70 text-teal-200 font-semibold'
                                : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <IconComponent className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Phân hệ Bổ trợ & Tri thức - Only show if not restricted or has auxiliary modules */}
              {visibleAuxiliaryModules.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setAuxiliaryDropdownOpen(!auxiliaryDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">Các Phân Hệ Bổ Sung</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${auxiliaryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {auxiliaryDropdownOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                      {visibleAuxiliaryModules.map(item => (
                        <button
                          key={item.mod}
                          onClick={() => handleSelectModule(item.mod)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs truncate transition-colors cursor-pointer ${
                            activeTab === 'module_crud' && activeModule === item.mod
                              ? 'bg-teal-900/70 text-teal-200 font-semibold'
                              : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* System-wide Administration Tools - Hidden if user has module restrictions */}
            {!hasModuleRestrictions && (
              <div className="pt-2 space-y-1">
                <button
                  onClick={() => { setActiveTab('relationships'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'relationships' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Quản lý tất cả quan hệ liên kết toàn hệ thống</span>
                </button>

                <button
                  onClick={() => { setActiveTab('import_export'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'import_export' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Upload className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Nhập dữ liệu hàng loạt từ Excel / CSV</span>
                </button>

                <button
                  onClick={() => { setActiveTab('form_config'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'form_config' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Tùy biến trường & thiết lập ẩn / hiện dữ liệu</span>
                </button>

                {canManageUsers && (
                  <button
                    onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                    className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      activeTab === 'users' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="whitespace-normal text-left leading-snug">Quản lý tài khoản & phân quyền người dùng</span>
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('audit_logs'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'audit_logs' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Nhật ký truy vết hệ thống (Audit Logs)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('system_config'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'system_config' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Cấu hình nhận diện thương hiệu & cơ quan chủ quản</span>
                </button>

                <button
                  onClick={() => { setActiveTab('test_suite'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === 'test_suite' ? 'bg-teal-800 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <FileCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Bộ kiểm thử nghiệm thu & an toàn bảo mật</span>
                </button>
              </div>
            )}

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800 text-xs text-slate-500 space-y-2">
          {currentUser && (
            <div className="px-2.5 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
              <div className="truncate mr-2">
                <div className="font-semibold text-white truncate">{currentUser.fullName || currentUser.username}</div>
                <div className="text-teal-400 text-[10px] truncate">{currentUser.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={onBackToPublic}
            className="w-full py-2 px-3 bg-slate-800/90 hover:bg-slate-700/90 text-teal-300 hover:text-white border border-teal-500/30 hover:border-teal-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            title="Trở về Trang chủ Cổng Dữ Liệu"
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
            <span>Truy cập Trang chủ</span>
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                onLogout();
              }}
              className="w-full py-2 px-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              title="Đăng xuất khỏi tài khoản quản trị"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Admin Dedicated Top Header Bar */}
        <header className="bg-[#D4E8F8] border-b border-sky-300 px-4 sm:px-6 py-3.5 shrink-0 shadow-2xs">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Dấu 3 gạch ngang trên mobile mở menu admin, luôn hiển thị icon Menu */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 -ml-1 text-slate-800 hover:text-teal-900 hover:bg-sky-200/60 rounded-lg transition-colors flex items-center shrink-0 cursor-pointer"
                title="Mở danh mục quản trị"
                aria-label="Mở menu quản trị"
              >
                <Menu className="w-6 h-6 text-slate-800" />
              </button>

              <div className="flex flex-col justify-center min-w-0">
                <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase">
                  CỔNG DỮ LIỆU
                </span>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 tracking-tight leading-tight mt-0.5 uppercase">
                  VỀ KHOA HỌC, CÔNG NGHỆ
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 tracking-tight leading-tight mt-0.5 uppercase">
                  VÀ KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO THÀNH PHỐ ĐÀ NẴNG
                </span>
              </div>
            </div>

            {/* Trở về Cổng công khai on desktop */}
            <button
              onClick={onBackToPublic}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 hover:text-teal-900 border border-sky-300 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-800" />
              <span>Về Cổng công khai</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full">
          <div className="w-full space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                currentUser={currentUser}
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
          </div>
        </main>

        {/* Institutional Footer in Admin */}
        <Footer config={systemConfig} />
      </div>

    </div>
  );
};
