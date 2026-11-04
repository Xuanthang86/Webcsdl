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

  const isWardOfficer = currentUser?.role === 'partner_officer';
  const canManageUsers = currentUser?.role === 'super_admin' || currentUser?.role === 'system_admin';

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

  const coreModulesList: { mod: ModuleType; label: string; icon: any; color: string }[] = [
    { mod: 'science_tasks', label: 'Đề tài, nhiệm vụ KH&CN', icon: FileText, color: 'text-teal-400' },
    { mod: 'initiatives', label: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố', icon: Lightbulb, color: 'text-amber-400' },
    { mod: 'patents', label: 'Sáng chế & Sở hữu trí tuệ', icon: Award, color: 'text-purple-400' },
    { mod: 'experts', label: 'Chuyên gia & Nhà khoa học', icon: GraduationCap, color: 'text-blue-400' },
    { mod: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', icon: Rocket, color: 'text-rose-400' },
    { mod: 'support_organizations', label: 'Tổ chức trung gian', icon: Building2, color: 'text-cyan-400' },
    { mod: 'startup_projects', label: 'Dự án khởi nghiệp', icon: Target, color: 'text-emerald-400' },
    { mod: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', icon: Lightbulb, color: 'text-yellow-400' },
    { mod: 'wards', label: 'Danh sách xã/phường', icon: MapPin, color: 'text-indigo-400' },
    { mod: 'universities', label: 'Trường Đại học/Cao đẳng trên địa bàn', icon: School, color: 'text-violet-400' },
    { mod: 'featured_startups', label: 'Doanh nghiệp khởi nghiệp tiêu biểu', icon: Star, color: 'text-amber-300' }
  ];

  const isRestrictedOfficer = isWardOfficer || (
    Boolean(currentUser?.managedModules && currentUser.managedModules.length > 0 && !['super_admin', 'system_admin'].includes(currentUser?.role || ''))
  );

  const visibleCoreModulesList = isRestrictedOfficer
    ? coreModulesList.filter(item => (currentUser?.managedModules || ['startup_projects', 'startup_ideas']).includes(item.mod))
    : coreModulesList;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Mobile & Tablet Header with Toggle */}
      <div className="lg:hidden bg-[#0b1b2b] text-white p-3.5 flex items-center justify-between border-b border-slate-700/60 sticky top-0 z-30">
        <div 
          onClick={onBackToPublic}
          className="flex items-center gap-2 cursor-pointer group"
          title="Trở về Cổng tra cứu công khai"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center font-bold text-xs transition-colors shrink-0">
            K
          </div>
          <div>
            <div className="font-bold text-xs tracking-tight text-white uppercase">TRANG QUẢN TRỊ</div>
            <div className="text-[10px] text-teal-300 font-medium truncate max-w-[220px]">CƠ SỞ DỮ LIỆU KHCN & KNĐMST ĐÀ NẴNG</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-300 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800"
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
        fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:min-h-screen shrink-0 flex flex-col justify-between border-r border-slate-800
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-4 overflow-y-auto">
          
          {/* Brand & Title */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div 
              onClick={onBackToPublic}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center font-bold text-sm transition-colors shrink-0">
                K
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-tight group-hover:text-teal-300 transition-colors">
                  Quản trị dữ liệu KHCN & KNĐMST
                </div>
                <div className="text-[11px] text-teal-300 font-semibold">
                  Thành phố Đà Nẵng
                </div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              title="Đóng thanh điều hướng"
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Standalone highlighted Cổng công khai button */}
          <button
            onClick={onBackToPublic}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-teal-950/70 hover:bg-teal-900 text-teal-200 hover:text-white border border-teal-600/60 shadow-xs transition-all cursor-pointer"
            title="Trở về Cổng tra cứu công khai"
          >
            <ArrowLeft className="w-4 h-4 text-teal-300" />
            <span>Cổng tra cứu công khai</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Tổng quan & Chỉ số</span>
            </button>

            {/* Section: DANH MỤC CƠ SỞ DỮ LIỆU */}
            <div className="pt-2 space-y-1">
              {visibleCoreModulesList.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === 'module_crud' && activeModule === item.mod;
                return (
                  <button
                    key={item.mod}
                    onClick={() => handleSelectModule(item.mod)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-teal-800 text-white font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              {/* Phân hệ Bổ trợ & Tri thức */}
              {!isRestrictedOfficer && <div className="pt-2">
                <button
                  onClick={() => setAuxiliaryDropdownOpen(!auxiliaryDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Các Phân Hệ Bổ Sung</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${auxiliaryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {auxiliaryDropdownOpen && (
                  <div className="mt-0.5 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                    {[
                      { mod: 'investors' as ModuleType, label: 'Nhà đầu tư' },
                      { mod: 'investment_funds' as ModuleType, label: 'Quỹ đầu tư' },
                      { mod: 'organizations' as ModuleType, label: 'Tổ chức KH&CN, Viện trường' },
                      { mod: 'publications' as ModuleType, label: 'Bài báo & Công bố khoa học' },
                      { mod: 'technologies' as ModuleType, label: 'Công nghệ & Chuyển giao' },
                      { mod: 'collaboration_needs' as ModuleType, label: 'Nhu cầu kết nối & Đặt hàng' },
                      { mod: 'programs' as ModuleType, label: 'Chương trình & Cơ hội hỗ trợ' },
                      { mod: 'policies' as ModuleType, label: 'Chính sách, Văn bản & Biểu mẫu' },
                      { mod: 'lab_equipments' as ModuleType, label: 'Phòng thí nghiệm & Thiết bị' }
                    ].map(item => (
                      <button
                        key={item.mod}
                        onClick={() => handleSelectModule(item.mod)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] truncate transition-colors ${
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
              </div>}
            </div>

            {!isRestrictedOfficer && <div className="pt-2 space-y-1">
              <button
                onClick={() => { setActiveTab('relationships'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'relationships' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Quản lý quan hệ liên kết toàn hệ thống</span>
              </button>

              <button
                onClick={() => { setActiveTab('import_export'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'import_export' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Nhập dữ liệu hàng loạt từ Excel / CSV</span>
              </button>

              <button
                onClick={() => { setActiveTab('form_config'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'form_config' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Tùy biến trường & thiết lập ẩn / hiện dữ liệu</span>
              </button>

              {canManageUsers && (
                <button
                  onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                  className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'users' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal text-left leading-snug">Quản lý tài khoản & phân quyền người dùng</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('audit_logs'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'audit_logs' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Nhật ký truy vết hệ thống (Audit Logs)</span>
              </button>

              <button
                onClick={() => { setActiveTab('system_config'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'system_config' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Cấu hình nhận diện thương hiệu & cơ quan chủ quản</span>
              </button>

              <button
                onClick={() => { setActiveTab('test_suite'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'test_suite' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <FileCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Bộ kiểm thử nghiệm thu & an toàn bảo mật (Section XVI)</span>
              </button>
            </div>}

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono">Phiên bản Hệ thống 1.0 (Modular Monolith)</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-100">
        
        {/* Desktop Admin Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#0b1b2b] text-white border-b border-slate-700/60 shadow-sm shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              TRANG QUẢN TRỊ
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-teal-300 tracking-wide mt-0.5">
              CƠ SỞ DỮ LIỆU VỀ KHOA HỌC, CÔNG NGHỆ VÀ KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO THÀNH PHỐ ĐÀ NẴNG
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="text-right">
                <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                <div className="text-[11px] text-teal-300 font-medium capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
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
