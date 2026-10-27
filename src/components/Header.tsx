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
  Layers, 
  Sparkles,
  Database,
  Rocket
} from 'lucide-react';

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

  const handleAdminClick = () => {
    if (isAdminRole) {
      onNavigate('admin');
    } else {
      onOpenAdminLogin();
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
    if (!user) return 'Công dân & Khách vãng lai';
    switch (user.role) {
      case 'super_admin': return 'Super Admin';
      case 'system_admin': return 'Quản trị hệ thống';
      case 'agency_leader': return 'Lãnh đạo cơ quan';
      case 'data_officer': return 'Cán bộ quản lý DL';
      case 'evaluator_expert': return 'Chuyên gia thẩm định';
      case 'partner_officer': return 'Cán bộ phối hợp';
      case 'org_representative': return 'Đại diện Doanh nghiệp';
      case 'expert_user': return 'Chuyên gia KH&CN';
      case 'investor_user': return 'Nhà đầu tư / Quỹ';
      case 'public_user':
      default:
        return 'Công dân & Khách vãng lai';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: 3-bar menu + Logo & Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            {/* 3 horizontal lines button (3 gạch ngang) kế bên logo để chọn loại dữ liệu */}
            <button
              onClick={() => setMenuDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 group"
              title="Danh mục các loại cơ sở dữ liệu"
              aria-label="Danh mục dữ liệu"
            >
              <Menu className="w-5 h-5 text-slate-700 group-hover:text-teal-800" />
              <span className="hidden lg:inline text-xs font-semibold text-slate-600 group-hover:text-teal-800">
                Phân hệ dữ liệu
              </span>
            </button>

            {/* Logo and Brand Name - Click navigates to Home */}
            <div 
              onClick={() => onNavigate('home')} 
              className="cursor-pointer flex items-center gap-2.5 whitespace-nowrap group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-teal-700 transition-colors">
                K
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
                  CỔNG DỮ LIỆU KH&CN & ĐMST
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Hệ thống Dữ liệu Tập trung Cấp Thành phố
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                currentView === 'home' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                currentView === 'browse' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              Tra cứu dữ liệu
            </button>
            <button
              onClick={onOpenSubmitModal}
              className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 text-slate-600"
            >
              Nộp sáng kiến trực tuyến
            </button>
            <button
              onClick={handleAdminClick}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 ${
                currentView === 'admin' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-700" />
              Cổng quản trị
            </button>
          </nav>

          {/* Zone 3: Role Switcher & Action CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Persona Switcher cleanly styled */}
            <div className="relative group">
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors max-w-[170px] sm:max-w-[210px]">
                <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="truncate">{currentUser?.fullName || 'Khách vãng lai'}</span>
                <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0">
                  {getRoleDisplayName(currentUser)}
                </span>
              </div>
              
              {/* Persona Switcher Dropdown */}
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 hidden group-hover:block z-50 animate-in fade-in">
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
                        {item.role === 'public_user' ? 'Công dân & Khách vãng lai' : item.label}
                      </span>
                      {currentUser?.role === item.role && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentView !== 'admin' ? (
              <button
                onClick={handleAdminClick}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm"
              >
                <span>Khu vực Quản trị</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('home')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Về Cổng công khai</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Slide-over Drawer for Data Categories Menu (Triggered by 3 horizontal lines button) */}
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
                  K
                </div>
                <div>
                  <h3 className="font-bold text-xs">DANH MỤC CƠ SỞ DỮ LIỆU</h3>
                  <p className="text-[10px] text-teal-300">Chọn loại dữ liệu để tra cứu tức thì</p>
                </div>
              </div>
              <button
                onClick={() => setMenuDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category List */}
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
                Các Phân Hệ Chính
              </div>

              {/* 1. Nhiệm vụ KH&CN */}
              <button
                onClick={() => handleChooseCategory('science_tasks')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>1. Nhiệm vụ, đề tài KH&CN</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 2. Sáng kiến cấp thành phố */}
              <button
                onClick={() => handleChooseCategory('initiatives')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>2. Sáng kiến cấp thành phố</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 3. Chuyên gia & Nhà khoa học */}
              <button
                onClick={() => handleChooseCategory('experts')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>3. Chuyên gia & Nhà khoa học</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 4. Tổ chức KH&CN */}
              <button
                onClick={() => handleChooseCategory('organizations')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>4. Tổ chức KH&CN, Viện trường</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* PARENT: Dữ Liệu Hệ Sinh Thái Khởi Nghiệp Đổi Mới Sáng Tạo */}
              <div className="border border-teal-200/80 bg-teal-50/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setEcosystemSubmenuOpen(!ecosystemSubmenuOpen)}
                  className="w-full text-left p-2.5 font-bold text-teal-950 flex items-center justify-between hover:bg-teal-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-teal-700" />
                    <span>Dữ Liệu Hệ Sinh Thái ĐMST</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-teal-700 transition-transform ${ecosystemSubmenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu containing 7 child modules */}
                {ecosystemSubmenuOpen && (
                  <div className="bg-white border-t border-teal-100 divide-y divide-slate-100 pl-3">
                    <button
                      onClick={() => handleChooseCategory('startups')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(1) Doanh nghiệp khởi nghiệp ĐMST</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_projects')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(2) Dự án khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_ideas')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(3) Ý tưởng khởi nghiệp & ĐMST</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('investors')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(4) Nhà đầu tư</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('investment_funds')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(5) Quỹ đầu tư</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('support_organizations')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(6) Tổ chức hỗ trợ, Vườn ươm</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('programs')}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:text-teal-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>(7) Chương trình hỗ trợ & Cơ hội</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                )}
              </div>

              {/* Other modules */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2 px-1">
                Công Nghệ & Thị Trường
              </div>

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

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2 px-1">
                Tài Sản Trí Tuệ & Hạ Tầng
              </div>

              <button
                onClick={() => handleChooseCategory('patents')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Sáng chế & Sở hữu trí tuệ</span>
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
                onClick={() => handleChooseCategory('lab_equipments')}
                className="w-full text-left p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span>Thiết bị & Phòng thí nghiệm</span>
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
              <span>Đầy đủ 17 phân hệ dữ liệu</span>
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
