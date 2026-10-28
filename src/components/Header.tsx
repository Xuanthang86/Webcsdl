import React, { useState } from 'react';
import { User, SystemConfig } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  LayoutDashboard, 
  Globe, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Database,
  Rocket,
  LogIn,
  LogOut,
  FileText,
  Award,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  currentView: 'home' | 'browse' | 'admin';
  onNavigate: (view: 'home' | 'browse' | 'admin') => void;
  currentUser?: User;
  onSwitchRole: (role: string) => void;
  availableRoles: Array<{ role: string; label: string }>;
  systemConfig: SystemConfig;
  onOpenSubmitModal: () => void;
  onOpenAdminLogin: () => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onSwitchRole,
  availableRoles,
  systemConfig,
  onOpenSubmitModal,
  onOpenAdminLogin,
  onSelectCategory
}) => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [ecosystemSubmenuOpen, setEcosystemSubmenuOpen] = useState(true);

  // Administrative roles check
  const isAdminRole = currentUser && ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'].includes(currentUser.role);
  const isAuthenticated = currentUser && currentUser.role !== 'public_user';

  const handleAdminClick = () => {
    if (isAdminRole) {
      onNavigate('admin');
    } else {
      onOpenAdminLogin();
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      onSwitchRole('public_user');
    } catch {
      onSwitchRole('public_user');
    }
  };

  const handleChooseCategory = (mod: string) => {
    setMenuDrawerOpen(false);
    if (onSelectCategory) {
      onSelectCategory(mod);
    } else {
      onNavigate('browse');
    }
  };

  // Human-friendly role display label
  const getRoleDisplayName = (user?: User) => {
    if (!user || user.role === 'public_user') return 'Khách vãng lai';
    switch (user.role) {
      case 'super_admin': return 'Super Admin';
      case 'system_admin': return 'Quản trị hệ thống';
      case 'agency_leader': return 'Lãnh đạo cơ quan';
      case 'data_officer': return 'Cán bộ QL dữ liệu';
      case 'evaluator_expert': return 'Chuyên gia thẩm định';
      case 'partner_officer': return 'Cán bộ đơn vị';
      case 'org_representative': return 'Đại diện Doanh nghiệp';
      case 'expert_user': return 'Chuyên gia KH&CN';
      case 'investor_user': return 'Nhà đầu tư / Quỹ';
      default:
        return 'Công dân';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Zone 1: 3-bar menu + Logo & Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* 3 horizontal lines button (3 gạch ngang) nằm bên trái logo để chọn loại dữ liệu */}
            <button
              onClick={() => setMenuDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 group shrink-0"
              title="Danh mục 5 nhóm cơ sở dữ liệu chính"
              aria-label="Danh mục dữ liệu"
            >
              <Menu className="w-5 h-5 text-slate-800 group-hover:text-teal-800" />
              <span className="hidden xl:inline text-xs font-semibold text-slate-700 group-hover:text-teal-800">
                Phân hệ dữ liệu
              </span>
            </button>

            {/* Logo and Brand Name - Click navigates to Home */}
            <div 
              onClick={() => onNavigate('home')} 
              className="cursor-pointer flex items-center gap-2 sm:gap-2.5 truncate group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-teal-700 transition-colors shrink-0">
                ĐN
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors truncate">
                  CỔNG DỮ LIỆU KH&CN & ĐMST ĐÀ NẴNG
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden md:inline truncate">
                  Hệ thống Dữ liệu Tổng hợp Cấp Thành phố
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-600 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                currentView === 'home' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                currentView === 'browse' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              Tra cứu dữ liệu
            </button>
            <button
              onClick={onOpenSubmitModal}
              className="transition-colors whitespace-nowrap hover:text-slate-900 text-slate-600"
            >
              Nộp hồ sơ trực tuyến
            </button>
            <button
              onClick={handleAdminClick}
              className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${
                currentView === 'admin' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-700" />
              Cổng quản trị
            </button>
          </nav>

          {/* Zone 3: Login Button / User Profile & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* If NOT authenticated (Guest / public user): Show prominent Đăng nhập (Login) button */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenAdminLogin}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
                title="Đăng nhập tài khoản hệ thống"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              /* Authenticated User info & Logout */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium max-w-[140px] sm:max-w-[200px]">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">{currentUser?.fullName}</span>
                  <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0 hidden sm:inline">
                    {getRoleDisplayName(currentUser)}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Đăng xuất khỏi hệ thống"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Persona Switcher for Evaluation / Demos */}
            <div className="relative group">
              <button
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Chuyển đổi vai trò trải nghiệm"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Đổi vai trò trải nghiệm hệ thống:
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {availableRoles.map(item => (
                    <button
                      key={item.role}
                      onClick={() => onSwitchRole(item.role)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currentUser?.role === item.role ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">
                        {item.role === 'public_user' ? 'Khách vãng lai / Công dân' : item.label}
                      </span>
                      {currentUser?.role === item.role && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin navigation shortcut if not currently in admin */}
            {currentView !== 'admin' && isAdminRole && (
              <button
                onClick={handleAdminClick}
                className="hidden sm:flex px-2.5 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap items-center gap-1"
              >
                <span>Quản trị</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentView === 'admin' && (
              <button
                onClick={() => onNavigate('home')}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Về Cổng công khai</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Slide-over Drawer for Standardized Data Categories (3 horizontal lines) */}
      {menuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setMenuDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  ĐN
                </div>
                <div>
                  <h3 className="font-bold text-xs">DANH MỤC CƠ SỞ DỮ LIỆU</h3>
                  <p className="text-[10px] text-teal-300">5 Phân hệ dữ liệu chuẩn hoá</p>
                </div>
              </div>
              <button
                onClick={() => setMenuDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category List - Standardized to the 5 user groups */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
              
              {/* Tất cả dữ liệu */}
              <button
                onClick={() => handleChooseCategory('all')}
                className="w-full text-left p-2.5 rounded-lg font-semibold bg-teal-50 text-teal-900 hover:bg-teal-100 flex items-center justify-between transition-colors border border-teal-200"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>Tất cả cơ sở dữ liệu</span>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-600" />
              </button>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2 px-1">
                5 Phân Hệ Chuẩn Hoá
              </div>

              {/* 1. Nhiệm vụ, Đề tài KH&CN */}
              <button
                onClick={() => handleChooseCategory('science_tasks')}
                className="w-full text-left p-2.5 rounded-lg text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>1. Nhiệm vụ, Đề tài KH&CN</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố */}
              <button
                onClick={() => handleChooseCategory('initiatives')}
                className="w-full text-left p-2.5 rounded-lg text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 3. Sáng chế & Sở hữu trí tuệ */}
              <button
                onClick={() => handleChooseCategory('patents')}
                className="w-full text-left p-2.5 rounded-lg text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>3. Sáng chế & Sở hữu trí tuệ</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 4. Chuyên gia & Nhà khoa học */}
              <button
                onClick={() => handleChooseCategory('experts')}
                className="w-full text-left p-2.5 rounded-lg text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2 font-medium">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>4. Chuyên gia & Nhà khoa học</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 5. Dữ liệu Hệ sinh thái (with 7 sub-items) */}
              <div className="border border-teal-200/90 bg-teal-50/40 rounded-xl overflow-hidden mt-1">
                <button
                  onClick={() => setEcosystemSubmenuOpen(!ecosystemSubmenuOpen)}
                  className="w-full text-left p-2.5 font-bold text-teal-950 flex items-center justify-between hover:bg-teal-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-teal-700" />
                    <span>5. Dữ liệu Hệ sinh thái</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-teal-700 transition-transform ${ecosystemSubmenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu containing 7 child modules requested */}
                {ecosystemSubmenuOpen && (
                  <div className="bg-white border-t border-teal-100 divide-y divide-slate-100 pl-3">
                    <button
                      onClick={() => handleChooseCategory('startups')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Doanh nghiệp khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_projects')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Dự án khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_ideas')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Ý tưởng khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('investors')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Nhà đầu tư</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('investment_funds')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Quỹ đầu tư</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('support_organizations')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Tổ chức hỗ trợ, Vườn ươm</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('programs')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>• Chương trình hỗ trợ & Cơ hội hỗ trợ</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bổ trợ khác */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-3 px-1">
                Các Phân Hệ Bổ Trợ
              </div>

              <button
                onClick={() => handleChooseCategory('organizations')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Tổ chức KH&CN, Viện trường</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleChooseCategory('publications')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Bài báo & Công bố khoa học</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleChooseCategory('technologies')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Công nghệ & Kết quả nghiên cứu</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleChooseCategory('collaboration_needs')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Nhu cầu kết nối & Đặt hàng TP</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleChooseCategory('policies')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Chính sách, Văn bản & Quy định</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Hệ thống cơ sở dữ liệu Đà Nẵng</span>
              <button
                onClick={onOpenSubmitModal}
                className="text-teal-800 font-bold hover:underline"
              >
                + Nộp hồ sơ mới
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
