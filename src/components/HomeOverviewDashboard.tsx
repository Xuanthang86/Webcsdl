import React, { useState } from 'react';
import { AggregatedStats, SystemConfig } from '../types';
import { 
  FlaskConical, 
  Lightbulb, 
  Award, 
  Users, 
  Rocket, 
  Database, 
  ArrowRight,
  Building2,
  MapPin,
  School,
  Star,
  Target,
  ChevronDown,
  BriefcaseBusiness,
  Wallet
} from 'lucide-react';

interface HomeOverviewDashboardProps {
  stats: AggregatedStats | null;
  systemConfig: SystemConfig;
  onNavigateBrowse: (category?: string) => void;
  onRetry?: () => void;
  showIntro?: boolean;
  showEcosystemDetailBreakdown?: boolean;
}

export const HomeOverviewDashboard: React.FC<HomeOverviewDashboardProps> = ({
  stats,
  systemConfig,
  onNavigateBrowse,
  onRetry,
  showIntro = true,
  showEcosystemDetailBreakdown = true
}) => {
  const [showEcosystemDetails, setShowEcosystemDetails] = useState(false);

  // Dynamic Current Year for live statistics
  const currentYear = new Date().getFullYear();

  const handleToggleEcosystemDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEcosystemDetails(prev => !prev);
  };

  // Format Vietnamese currency with dots: 6,5 tỷ đồng
  const formatVND = (num?: number) => {
    if (!num) return '0 đồng';
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đồng`;
    }
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đồng`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)} triệu đồng`;
    }
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đồng`;
  };

  const totalIntegratedRecords = stats ? (
    (stats.totalScienceTasks || 0) +
    (stats.totalInitiatives || 0) +
    (stats.totalPatents || 0) +
    (stats.totalExperts || 0) +
    (stats.totalStartups || 0) +
    (stats.totalProjects || 0) +
    (stats.totalIdeas || 0) +
    (stats.totalInvestors || 0) +
    (stats.totalFunds || 0) +
    (stats.totalSupportOrgs || 0) +
    (stats.totalPrograms || 0) +
    (stats.totalOrganizations || 0) +
    (stats.totalPublications || 0) +
    (stats.totalTechnologies || 0) +
    (stats.totalCollaborationNeeds || 0) +
    (stats.totalLabEquipments || 0) +
    (stats.totalPolicies || 0) +
    (stats.totalWards || 0) +
    (stats.totalUniversities || 0) +
    (stats.totalFeaturedStartups || 0)
  ) : 0;

  // Ecosystem aggregate items (9 child types)
  const ecosystemItems = [
    { key: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', count: stats?.totalStartups || 0, icon: Rocket },
    { key: 'investors', label: 'Nhà đầu tư', count: stats?.totalInvestors || 0, icon: BriefcaseBusiness },
    { key: 'investment_funds', label: 'Quỹ đầu tư', count: stats?.totalFunds || 0, icon: Wallet },
    { key: 'support_organizations', label: 'Tổ chức trung gian', count: stats?.totalSupportOrgs || 0, icon: Building2 },
    { key: 'startup_projects', label: 'Dự án khởi nghiệp', count: stats?.totalProjects || 0, icon: Target },
    { key: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', count: stats?.totalIdeas || 0, icon: Lightbulb },
    { key: 'wards', label: 'Danh sách xã/phường', count: stats?.totalWards || 0, icon: MapPin },
    { key: 'universities', label: 'Trường Đại học/Cao đẳng', count: stats?.totalUniversities || 0, icon: School },
    { key: 'featured_startups', label: 'DN khởi nghiệp tiêu biểu', count: stats?.totalFeaturedStartups || 0, icon: Star }
  ];

  const totalEcosystemRecords = ecosystemItems.reduce((acc, curr) => acc + curr.count, 0);

  // Initiatives recognized in the current year
  const currentYearInitiativesCount = stats?.initiativesInCurrentYear ?? 
    (stats?.initiativesByYear?.[String(currentYear)] ?? 0);

  // Breakdown data for Experts from real stats
  const toBreakdown = (source?: Record<string, number>) => Object.entries(source || {}).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const projectYears = toBreakdown(stats?.projectsByYear);
  const projectFields = toBreakdown(stats?.projectsByField);

  // School vs Ward distributions for Projects & Ideas
  const projectSchoolsCount = stats?.projectsBySchool 
    ? Object.values(stats.projectsBySchool).reduce((a, b) => a + b, 0) 
    : 0;
  const projectWardsCount = stats?.projectsByWard 
    ? Object.values(stats.projectsByWard).reduce((a, b) => a + b, 0) 
    : 0;

  const ideaSchoolsCount = stats?.ideasBySchool 
    ? Object.values(stats.ideasBySchool).reduce((a, b) => a + b, 0) 
    : 0;
  const ideaWardsCount = stats?.ideasByWard 
    ? Object.values(stats.ideasByWard).reduce((a, b) => a + b, 0) 
    : 0;

  const totalTasks = stats?.totalScienceTasks || 0;
  const acceptedTasks = Math.min(stats?.tasksAccepted ?? 0, totalTasks);
  const runningTasks = Math.max(0, totalTasks - acceptedTasks);

  return (
    <div className="bg-gradient-to-b from-[#EBF5FB] via-[#F3F9FD] to-[#E9F3FA] text-slate-800 pt-7 pb-8 px-4 sm:px-6 lg:px-8 border-b border-sky-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sky-200">
          {showIntro && (<div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
              Tổng quan Cơ sở dữ liệu KHCN & KNĐMST TP Đà Nẵng
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Dữ liệu quản lý nhà nước tập trung từ Sở Khoa học & Công nghệ thành phố Đà Nẵng, các Viện trường, Doanh nghiệp và Mạng lưới ĐMST
            </p>
          </div>)}

          {/* Quick Aggregate Badge */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-200 shadow-2xs self-start md:self-auto shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-teal-800 uppercase tracking-wider font-bold">Toàn bộ hệ thống</div>
              <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                {totalIntegratedRecords} <span className="text-xs font-sans font-normal text-slate-600">bản ghi tích hợp</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Main Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Pillar 1: Nhiệm vụ, Đề tài KH&CN */}
          <div 
            onClick={() => onNavigateBrowse('science_tasks')}
            className={`bg-white hover:bg-sky-50/50 border border-sky-200/90 hover:border-sky-400 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs `}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-teal-800 font-semibold border border-teal-300 bg-teal-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                    Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 tracking-tight leading-snug">1. Đề tài, nhiệm vụ KH&CN</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {totalTasks}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Đã nghiệm thu:</span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {acceptedTasks} đề tài
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Đang thực hiện:</span>
                  <span className="font-mono text-amber-700 font-semibold">{runningTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kinh phí NSNN:</span>
                  <span className="font-mono text-teal-800 font-semibold">{formatVND(stats?.totalBudgetApproved)}</span>
                </div>
              </div>
            </div>
          </div>


          {/* Pillar 2: Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
              Yêu cầu: chỉ hiển thị tổng số, sửa "Công nhận cấp TP" thành "Năm hiện tại", bỏ "Làm lợi hàng năm" */}
          <div 
            onClick={() => onNavigateBrowse('initiatives')}
            className="bg-white hover:bg-sky-50/50 border border-sky-200/90 hover:border-sky-400 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-amber-800 font-semibold border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 tracking-tight line-clamp-2 leading-snug" title="2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố">
                  2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {stats?.totalInitiatives || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Năm {currentYear}:</span>
                  <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {currentYearInitiativesCount} sáng kiến
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  * Tự động đồng bộ theo năm hiện tại
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Sáng chế & Sở hữu trí tuệ */}
          <div 
            onClick={() => onNavigateBrowse('patents')}
            className="bg-white hover:bg-sky-50/50 border border-sky-200/90 hover:border-sky-400 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-purple-800 font-semibold border border-purple-300 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 tracking-tight leading-snug">3. Sáng chế & Sở hữu trí tuệ</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {stats?.totalPatents || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Bằng độc quyền & Đơn:</span>
                  <span className="font-mono text-slate-900 font-semibold">{stats?.totalPatents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phòng thí nghiệm:</span>
                  <span className="font-mono text-teal-800 font-semibold">{stats?.totalLabEquipments || 0} PTN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 4: Chuyên gia & Nhà khoa học
              Yêu cầu: chỉ hiển thị Tổng số chuyên gia, KHÔNG hiển thị Theo lĩnh vực và theo đơn vị ở mặt trước card; khi click xem Cơ cấu thì mới xem chi tiết theo phân loại */}
          <div 
            className="bg-white hover:bg-sky-50/50 border border-sky-200/90 hover:border-sky-400 rounded-2xl p-4 transition-all group flex flex-col justify-between shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNavigateBrowse('experts')}
                    className="text-[10px] text-teal-800 font-semibold border border-teal-300 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Xem <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 tracking-tight leading-snug">4. Chuyên gia & Nhà khoa học</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {stats?.totalExperts || 0}
                </div>
              </div>



            </div>
          </div>

          {/* Pillar 5: Dữ liệu Hệ sinh thái
              Yêu cầu: chỉ hiển thị tổng số dữ liệu, khi click xem Cơ cấu thì mới xem chi tiết theo từng loại (9 loại con); toggle loại trừ với Cơ cấu chuyên gia */}
          <div 
            className="bg-white hover:bg-sky-50/50 border border-sky-200/90 hover:border-sky-400 rounded-2xl p-4 transition-all group flex flex-col justify-between shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleEcosystemDetails}
                    className={`text-[10px] font-semibold border px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ${
                      showEcosystemDetails
                        ? 'bg-rose-700 text-white border-rose-600 shadow-xs'
                        : 'text-rose-800 border-rose-300 bg-rose-50 hover:bg-rose-100'
                    }`}
                    title="Bấm để xem Cơ cấu 9 loại dữ liệu con"
                  >
                    <span>Cơ cấu</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showEcosystemDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => onNavigateBrowse('startups')}
                    className="text-[10px] text-teal-800 font-semibold border border-teal-300 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Xem <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 tracking-tight leading-snug">5. Dữ liệu Hệ sinh thái</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {totalEcosystemRecords}
                </div>
              </div>


            </div>
          </div>

        </div>

        {showEcosystemDetails && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-rose-100">
              <div className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-rose-700" />
                <span>Cơ cấu dữ liệu Hệ sinh thái</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEcosystemDetails(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              {ecosystemItems.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigateBrowse(item.key)}
                    className="min-h-[76px] p-3 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 text-left transition-colors flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <IconComp className="w-4 h-4 text-rose-700 shrink-0" />
                      <span className="font-mono font-bold text-sm text-slate-900">{item.count}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>


          </div>
        )}

      </div>
    </div>
  );
};
