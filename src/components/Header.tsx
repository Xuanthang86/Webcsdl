import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2
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
  onLogout?: () => void;
  onUserUpdated?: (user: User) => void;
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
  onSelectCategory,
  onLogout,
  onUserUpdated
}) => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [ecosystemSubmenuOpen, setEcosystemSubmenuOpen] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);

  // Profile edit state
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editOrg, setEditOrg] = useState(currentUser?.organization || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setEditPhone(currentUser.phone || '');
      setEditOrg(currentUser.organization || '');
    }
  }, [currentUser]);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await api.updateProfile({
        phone: editPhone,
        organization: editOrg
      });
      if (res.user && onUserUpdated) {
        onUserUpdated(res.user);
      }
      setProfileSuccess('Cập nhật thông tin thành công!');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Lỗi cập nhật thông tin');
    } finally {
      setIsSavingProfile(false);
    }
  };

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
    if (onLogout) {
      onLogout();
    } else {
      try {
        await api.logout();
      } catch (err) {
        console.error(err);
      }
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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    setIsChangingPw(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (res && res.success) {
        setPwSuccess('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePasswordSection(false);
          setPwSuccess(null);
        }, 2000);
      } else {
        setPwError(res?.message || 'Lỗi đổi mật khẩu.');
      }
    } catch (err: any) {
      setPwError(err.message || 'Lỗi đổi mật khẩu.');
    } finally {
      setIsChangingPw(false);
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
          
          {/* Zone 1: Logo & Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* Logo and Brand Name - Click navigates to Home */}
            <div 
              onClick={() => onNavigate('home')} 
              className="cursor-pointer flex items-center gap-2 sm:gap-2.5 min-w-0 group"
              title="Trở về Trang chủ Cổng Dữ Liệu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs sm:text-base shadow-xs group-hover:bg-teal-700 transition-colors shrink-0">
                ĐN
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-xs font-black tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors uppercase leading-none">
                  CỔNG DỮ LIỆU
                </span>
                <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-teal-800 tracking-tight group-hover:text-teal-900 transition-colors truncate mt-0.5 leading-tight">
                  KHCN & KNĐMST TP ĐÀ NẴNG
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links: Trang chủ; Danh mục Cơ sở dữ liệu; Đăng nhập */}
          <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors whitespace-nowrap hover:text-slate-900 py-1 cursor-pointer ${
                currentView === 'home' ? 'text-teal-800 font-semibold border-b-2 border-teal-800' : ''
              }`}
            >
              Trang chủ
            </button>

            {/* Danh mục Cơ sở dữ liệu with Desktop Hover Menu & Submenu */}
            <div className="relative group/dropdown py-4">
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'browse' ? 'text-teal-800 font-semibold' : ''
                }`}
              >
                <span>Danh mục Cơ sở dữ liệu</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/dropdown:rotate-180 transition-transform" />
              </button>

              {/* Main Category Dropdown Menu */}
              <div className="absolute left-0 top-full -mt-1 hidden group-hover/dropdown:block w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => handleChooseCategory('science_tasks')}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>1. Đề tài, nhiệm vụ KH&CN</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => handleChooseCategory('initiatives')}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => handleChooseCategory('patents')}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>3. Sáng chế & Sở hữu trí tuệ</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => handleChooseCategory('experts')}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-medium flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>4. Chuyên gia & Nhà khoa học</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>

                {/* 5. Dữ liệu Hệ sinh thái - Hover reveals child sub-categories */}
                <div className="relative group/eco">
                  <button
                    onClick={() => handleChooseCategory('startups')}
                    className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-slate-800 font-medium flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-rose-600" />
                      <span>5. Dữ liệu Hệ sinh thái</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                  </button>

                  {/* Submenu on hover */}
                  <div className="absolute left-full top-0 hidden group-hover/eco:block w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 -ml-1 text-xs animate-in fade-in duration-100">
                    <div className="px-3.5 py-1 text-[11px] font-bold text-teal-800 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Các loại dữ liệu Hệ sinh thái
                    </div>
                    <button
                      onClick={() => handleChooseCategory('startups')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Doanh nghiệp khởi nghiệp sáng tạo</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('support_organizations')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Tổ chức trung gian</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_projects')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Dự án khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_ideas')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Ý tưởng khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('wards')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Danh sách xã/phường</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('universities')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Trường Đại học/Cao đẳng trên địa bàn</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('featured_startups')}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 text-slate-700 flex items-center justify-between"
                    >
                      <span>• Doanh nghiệp khởi nghiệp tiêu biểu</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100"></div>

                <button
                  onClick={() => handleChooseCategory('all')}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 text-teal-800 font-semibold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-700" />
                    <span>Xem tất cả cơ sở dữ liệu</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                </button>
              </div>
            </div>

            {/* Quick access to Admin Portal if authenticated with admin privileges */}
            {isAdminRole && (
              <button
                onClick={handleAdminClick}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin' ? 'text-teal-800 font-semibold border-b-2 border-teal-800 pb-1' : ''
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-700" />
                <span>Cổng quản trị</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Login Button / User Account with Role Check */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* If NOT authenticated (Guest / public user): Show prominent Đăng nhập (Login) button */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Đăng nhập tài khoản hệ thống"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              /* Authenticated: Account Icon + Role Button -> Click opens account info modal with password change and role transition */
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs max-w-[155px] sm:max-w-[210px] pr-2 sm:pr-2.5 mr-0.5"
                title="Xem thông tin tài khoản, đổi mật khẩu & quản trị"
              >
                <div className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left leading-tight min-w-0">
                  <span className="font-bold text-slate-900 text-[11px] sm:text-xs truncate block">
                    {currentUser?.fullName}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-teal-800 font-semibold truncate block">
                    {getRoleDisplayName(currentUser)}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
              </button>
            )}

            {currentView === 'admin' && (
              <button
                onClick={() => onNavigate('home')}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
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

              {/* 5. Dữ liệu Hệ sinh thái (with 7 sub-items, KHÔNG làm viền bao quanh) */}
              <div className="mt-0.5">
                <button
                  onClick={() => setEcosystemSubmenuOpen(!ecosystemSubmenuOpen)}
                  className="w-full text-left p-2.5 rounded-lg text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Rocket className="w-4 h-4 text-rose-600" />
                    <span>5. Dữ liệu Hệ sinh thái</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${ecosystemSubmenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu containing ecosystem child modules requested */}
                {ecosystemSubmenuOpen && (
                  <div className="ml-4 pl-2 space-y-0.5 mt-0.5">
                    <button
                      onClick={() => handleChooseCategory('startups')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Doanh nghiệp khởi nghiệp sáng tạo</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('support_organizations')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Tổ chức trung gian</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_projects')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Dự án khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('startup_ideas')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Ý tưởng khởi nghiệp</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('wards')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Danh sách xã/phường</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('universities')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Trường Đại học/Cao đẳng trên địa bàn</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleChooseCategory('featured_startups')}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-teal-800 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>• Doanh nghiệp khởi nghiệp tiêu biểu</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end text-[11px] text-slate-500">
              <button
                onClick={() => {
                  setMenuDrawerOpen(false);
                  onNavigate('browse');
                }}
                className="text-teal-800 font-bold hover:underline"
              >
                Tra cứu chi tiết CSDL →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive User Account Modal with Profile, Password Change & Admin Switch */}
      {showAccountModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            onClick={() => setShowAccountModal(false)}
            className="fixed inset-0"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] z-10">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{currentUser.fullName}</h3>
                  <span className="text-[11px] text-teal-300 font-semibold">{getRoleDisplayName(currentUser)}</span>
                </div>
              </div>
              <button
                onClick={() => { setShowAccountModal(false); setShowChangePasswordSection(false); }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              
              {/* User Details & Profile Edit Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-teal-700" />
                    <span>Hồ sơ người dùng & Phân quyền</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      setProfileError(null);
                      setProfileSuccess(null);
                    }}
                    className="text-[11px] text-teal-800 font-semibold hover:underline cursor-pointer"
                  >
                    {isEditingProfile ? 'Đóng chỉnh sửa' : 'Cập nhật thông tin'}
                  </button>
                </div>

                {profileSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    {profileError}
                  </div>
                )}
                
                {!isEditingProfile ? (
                  <div className="grid grid-cols-2 gap-2.5 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5">Tài khoản:</span>
                      <span className="font-semibold text-slate-900 font-mono">{currentUser.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5">Quyền hạn:</span>
                      <span className="inline-block font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                        {getRoleDisplayName(currentUser)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] mb-0.5">Email công vụ:</span>
                      <span className="font-medium text-slate-800">{currentUser.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">{currentUser.phone || '(Chưa cập nhật)'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] mb-0.5">Cơ quan / Đơn vị:</span>
                      <span className="font-medium text-slate-800">{currentUser.organization || '(Chưa cập nhật)'}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Ví dụ: 0988.889.999"
                        className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cơ quan / Đơn vị công tác
                      </label>
                      <input
                        type="text"
                        value={editOrg}
                        onChange={(e) => setEditOrg(e.target.value)}
                        placeholder="Nhập tên cơ quan, phòng ban hoặc viện trường"
                        className="w-full h-8 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action: Switch to Admin Portal */}
              {isAdminRole && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    onNavigate('admin');
                  }}
                  className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Chuyển sang giao diện quản trị</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Change Password Collapsible Section */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-4 h-4 text-teal-700" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordSection(!showChangePasswordSection)}
                    className="text-xs text-teal-800 font-semibold hover:underline cursor-pointer"
                  >
                    {showChangePasswordSection ? 'Thu gọn' : 'Đổi mật khẩu'}
                  </button>
                </div>

                {showChangePasswordSection && (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-2.5 pt-2 border-t border-slate-100">
                    {pwError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                        {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{pwSuccess}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full h-8 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mật khẩu mới (tối thiểu 6 ký tự)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full h-8 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-8 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPw}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {isChangingPw ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                )}
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(false);
                  handleLogout();
                }}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất khỏi hệ thống</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
