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
  const [ecosystemDropdownOpen, setEcosystemDropdownOpen] = useState(true);
  const [auxiliaryDropdownOpen, setAuxiliaryDropdownOpen] = useState(false);
  const [selectedEntityForRel, setSelectedEntityForRel] = useState<BaseEntity | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden bg-slate-900 text-white p-3 flex items-center justify-between border-b border-slate-800">
        <div 
          onClick={onBackToPublic}
          className="flex items-center gap-2 cursor-pointer group"
          title="Trở về Trang chủ Cổng Dữ Liệu"
        >
          <div className="w-6 h-6 rounded bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center font-bold text-xs transition-colors">
            K
          </div>
          <span className="font-bold text-xs group-hover:text-teal-300 transition-colors">Cổng Quản Trị KHCN & KNĐMST TP Đà Nẵng</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
          title={sidebarOpen ? "Đóng thanh công cụ" : "Mở thanh công cụ"}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:min-h-screen shrink-0 flex flex-col justify-between border-r border-slate-800
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-4 overflow-y-auto">
          
          {/* Brand & Close Button */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div 
              onClick={onBackToPublic}
              className="flex items-center gap-2 cursor-pointer group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center font-bold text-sm transition-colors">
                K
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-tight group-hover:text-teal-300 transition-colors">Cổng Quản Trị</div>
                <div className="text-[10px] text-teal-300 font-semibold">KHCN & KNĐMST TP Đà Nẵng</div>
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

            {/* Section: 5 NHÓM CƠ SỞ DỮ LIỆU CHUẨN HOÁ */}
            <div className="pt-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                5 Nhóm Dữ Liệu Chuẩn Hoá
              </div>

              {/* 1. Nhiệm vụ, Đề tài KH&CN */}
              <button
                onClick={() => handleSelectModule('science_tasks')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'module_crud' && activeModule === 'science_tasks'
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="truncate">1. Nhiệm vụ, Đề tài KH&CN</span>
                </div>
              </button>

              {/* 2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố */}
              <button
                onClick={() => handleSelectModule('initiatives')}
                className={`w-full flex items-start justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  activeTab === 'module_crud' && activeModule === 'initiatives'
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5 text-left">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="whitespace-normal leading-snug text-left">2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                </div>
              </button>

              {/* 3. Sáng chế & Sở hữu trí tuệ */}
              <button
                onClick={() => handleSelectModule('patents')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'module_crud' && activeModule === 'patents'
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Award className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">3. Sáng chế & Sở hữu trí tuệ</span>
                </div>
              </button>

              {/* 4. Chuyên gia & Nhà khoa học */}
              <button
                onClick={() => handleSelectModule('experts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'module_crud' && activeModule === 'experts'
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">4. Chuyên gia & Nhà khoa học</span>
                </div>
              </button>

              {/* 5. Dữ liệu Hệ sinh thái KNĐMST */}
              <div className="pt-1">
                <button
                  onClick={() => setEcosystemDropdownOpen(!ecosystemDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Rocket className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">5. Dữ liệu Hệ sinh thái</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${ecosystemDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {ecosystemDropdownOpen && (
                  <div className="mt-0.5 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                    {[
                      { mod: 'startups' as ModuleType, label: 'Doanh nghiệp khởi nghiệp' },
                      { mod: 'startup_projects' as ModuleType, label: 'Dự án khởi nghiệp' },
                      { mod: 'startup_ideas' as ModuleType, label: 'Ý tưởng khởi nghiệp' },
                      { mod: 'investors' as ModuleType, label: 'Nhà đầu tư' },
                      { mod: 'investment_funds' as ModuleType, label: 'Quỹ đầu tư' },
                      { mod: 'support_organizations' as ModuleType, label: 'Tổ chức hỗ trợ, Vườn ươm' },
                      { mod: 'programs' as ModuleType, label: 'Chương trình hỗ trợ & Cơ hội hỗ trợ' }
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
              </div>

              {/* Phân hệ Bổ trợ & Tri thức */}
              <div className="pt-1">
                <button
                  onClick={() => setAuxiliaryDropdownOpen(!auxiliaryDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Các Phân Hệ Bổ Trợ</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${auxiliaryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {auxiliaryDropdownOpen && (
                  <div className="mt-0.5 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                    {[
                      { mod: 'organizations' as ModuleType, label: 'Tổ chức KH&CN, Viện trường' },
                      { mod: 'publications' as ModuleType, label: 'Bài báo & Công bố khoa học' },
                      { mod: 'technologies' as ModuleType, label: 'Công nghệ & Kết quả nghiên cứu' },
                      { mod: 'collaboration_needs' as ModuleType, label: 'Tra cứu nhu cầu kết nối & đặt hàng' },
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
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <button
                onClick={() => { setActiveTab('relationships'); setSidebarOpen(false); }}
                className={`w-full flex items-start text-left justify-start gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'relationships' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="whitespace-normal text-left leading-snug">Quản lý tất tả quan hệ liên kết toàn hệ thống</span>
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
                  <span className="whitespace-normal text-left leading-snug">Quản lý người dùng & Phân quyền</span>
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
                <span className="whitespace-normal text-left leading-snug">Bộ kiểm thử nghiệm thu & an toàn bảo mật (Section XVI acceptance & security test suite)</span>
              </button>
            </div>

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">Hệ thống Quản trị CSDL TP Đà Nẵng</span>
            <button
              onClick={onBackToPublic}
              className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Trở về Cổng tra cứu công khai"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cổng công khai</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-600">Phiên bản Hệ thống 1.0 (Modular Monolith)</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
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
