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
  Users
} from 'lucide-react';

interface AdminLayoutProps {
  currentUser?: User;
  systemConfig: SystemConfig;
  stats: AggregatedStats | null;
  onConfigUpdated: (newConfig: SystemConfig) => void;
  onViewDetail: (entity: BaseEntity) => void;
  onBackToPublic: () => void;
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
  onBackToPublic
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeModule, setActiveModule] = useState<ModuleType>('science_tasks');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(true);
  const [selectedEntityForRel, setSelectedEntityForRel] = useState<BaseEntity | null>(null);

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
          <span className="font-bold text-xs group-hover:text-teal-300 transition-colors">Cổng Quản Trị Tập Trung</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-300 hover:text-white"
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
          
          {/* Brand & Back Button */}
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
                <div className="text-[10px] text-slate-400">KH&CN, Sáng kiến & ĐMST</div>
              </div>
            </div>

            <button
              onClick={onBackToPublic}
              title="Về cổng công khai"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
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

            {/* 13 Data Modules Accordion */}
            <div className="pt-2">
              <button
                onClick={() => setModulesDropdownOpen(!modulesDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-white"
              >
                <span>17 Phân Hệ Dữ Liệu</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${modulesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {modulesDropdownOpen && (
                <div className="mt-1 pl-2 space-y-0.5">
                  {(Object.entries(MODULE_NAMES) as [ModuleType, string][]).map(([mod, name]) => (
                    <button
                      key={mod}
                      onClick={() => handleSelectModule(mod)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] truncate transition-colors ${
                        activeTab === 'module_crud' && activeModule === mod
                          ? 'bg-teal-900/60 text-teal-200 font-semibold'
                          : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-1">
              <button
                onClick={() => { setActiveTab('relationships'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'relationships' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Liên kết dữ liệu đa chiều</span>
              </button>

              <button
                onClick={() => { setActiveTab('import_export'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'import_export' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Nhập & Xuất Excel / CSV</span>
              </button>

              <button
                onClick={() => { setActiveTab('form_config'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'form_config' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Cấu hình biểu mẫu & Ẩn/Hiện</span>
              </button>

              <button
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Users className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Quản lý người dùng & Phân quyền</span>
              </button>

              <button
                onClick={() => { setActiveTab('audit_logs'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'audit_logs' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nhật ký truy vết (Audit)</span>
              </button>

              <button
                onClick={() => { setActiveTab('system_config'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'system_config' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Nhận diện & Cấu hình</span>
              </button>

              <button
                onClick={() => { setActiveTab('test_suite'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'test_suite' ? 'bg-teal-800 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <FileCheck className="w-4 h-4 text-green-400 shrink-0" />
                <span>Kiểm thử nghiệm thu (16 TC)</span>
              </button>
            </div>

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-400 truncate">{currentUser?.fullName}</div>
          <div className="capitalize">{currentUser?.role.replace('_', ' ')}</div>
          <div className="text-[10px] text-slate-600 pt-1">Phiên bản Hệ thống 1.0 (Modular Monolith)</div>
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
              <UserManagerView currentUser={currentUser} />
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
