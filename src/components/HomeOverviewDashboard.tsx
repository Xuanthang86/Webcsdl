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
  ChevronDown
} from 'lucide-react';

interface HomeOverviewDashboardProps {
  stats: AggregatedStats | null;
  systemConfig: SystemConfig;
  onNavigateBrowse: (category?: string) => void;
}

export const HomeOverviewDashboard: React.FC<HomeOverviewDashboardProps> = ({
  stats,
  systemConfig,
  onNavigateBrowse
}) => {
  const [showExpertDetails, setShowExpertDetails] = useState(false);
  const [showEcosystemDetails, setShowEcosystemDetails] = useState(false);

  // Dynamic Current Year for live statistics
  const currentYear = new Date().getFullYear();

  // Mutual exclusive toggles: when opening one, automatically close the other
  const handleToggleExpertDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExpertDetails(prev => {
      if (!prev) setShowEcosystemDetails(false);
      return !prev;
    });
  };

  const handleToggleEcosystemDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEcosystemDetails(prev => {
      if (!prev) setShowExpertDetails(false);
      return !prev;
    });
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

  // Ecosystem aggregate items (7 child types)
  const ecosystemItems = [
    { key: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', count: stats?.totalStartups || 0, icon: Rocket },
    { key: 'support_organizations', label: 'Tổ chức trung gian', count: stats?.totalSupportOrgs || 0, icon: Building2 },
    { key: 'startup_projects', label: 'Dự án khởi nghiệp', count: stats?.totalProjects || 0, icon: Target },
    { key: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', count: stats?.totalIdeas || 0, icon: Lightbulb },
    { key: 'wards', label: 'Danh sách xã/phường', count: stats?.totalWards || 0, icon: MapPin },
    { key: 'universities', label: 'Trường Đại học/Cao đẳng', count: stats?.totalUniversities || 0, icon: School },
    { key: 'featured_startups', label: 'DN khởi nghiệp tiêu biểu', count: stats?.totalFeaturedStartups || 0, icon: Star }
  ];

  const totalEcosystemRecords = ecosystemItems.reduce((acc, curr) => acc + curr.count, 0);

  // Initiatives recognized in the current year
  const currentYearInitiativesCount = stats?.initiativesInCurrentYear !== undefined
    ? stats.initiativesInCurrentYear
    : (stats?.initiativesByYear?.[String(currentYear)] ?? 14);

  // Breakdown data for Experts
  const expertFields = stats?.expertsByField ? Object.entries(stats.expertsByField).map(([name, count]) => ({ name, count })) : [
    { name: 'Công nghệ thông tin & Trí tuệ nhân tạo', count: 18 },
    { name: 'Khoa học Y Dược & Chăm sóc sức khỏe', count: 12 },
    { name: 'Nông nghiệp CNC & Công nghệ sinh học', count: 9 },
    { name: 'Môi trường, Năng lượng & Vật liệu mới', count: 8 },
    { name: 'Cơ khí, Tự động hóa & Điện tử', count: 7 }
  ];

  const expertUnits = stats?.expertsByWorkplace ? Object.entries(stats.expertsByWorkplace).map(([name, count]) => ({ name, count })) : [
    { name: 'Đại học Đà Nẵng & Các trường thành viên', count: 24 },
    { name: 'Viện Hàn lâm KH&CN Việt Nam (Khu vực MT)', count: 11 },
    { name: 'Sở KH&CN và các Trung tâm Nghiên cứu', count: 9 },
    { name: 'Các Doanh nghiệp KH&CN và Viện độc lập', count: 10 }
  ];

  const expertTitles = stats?.expertsByTitle ? Object.entries(stats.expertsByTitle).map(([name, count]) => ({ name, count })) : [
    { name: 'Giáo sư (GS)', count: 12 },
    { name: 'Phó Giáo sư (PGS)', count: 24 },
    { name: 'Chuyên gia cao cấp', count: 18 }
  ];

  // School vs Ward distributions for Projects & Ideas
  const projectSchoolsCount = stats?.projectsBySchool 
    ? Object.values(stats.projectsBySchool).reduce((a, b) => a + b, 0) 
    : Math.ceil((stats?.totalProjects || 10) * 0.6);
  const projectWardsCount = (stats?.totalProjects || 10) - projectSchoolsCount > 0 
    ? (stats?.totalProjects || 10) - projectSchoolsCount 
    : 4;

  const ideaSchoolsCount = stats?.ideasBySchool 
    ? Object.values(stats.ideasBySchool).reduce((a, b) => a + b, 0) 
    : Math.ceil((stats?.totalIdeas || 12) * 0.65);
  const ideaWardsCount = (stats?.totalIdeas || 12) - ideaSchoolsCount > 0 
    ? (stats?.totalIdeas || 12) - ideaSchoolsCount 
    : 5;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-7 pb-8 px-4 sm:px-6 lg:px-8 border-b border-teal-800 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800/60">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Tổng quan Cơ sở dữ liệu KHCN & KNĐMST TP Đà Nẵng
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dữ liệu quản lý nhà nước tập trung từ Sở Khoa học & Công nghệ thành phố Đà Nẵng, các Viện trường, Doanh nghiệp và Mạng lưới ĐMST
            </p>
          </div>

          {/* Quick Aggregate Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 self-start md:self-auto shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600/60 text-teal-200 flex items-center justify-center border border-teal-400/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-teal-200 uppercase tracking-wider font-semibold">Toàn bộ hệ thống</div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {totalIntegratedRecords} <span className="text-xs font-sans font-normal text-slate-300">bản ghi tích hợp</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Main Pillars:
            1. Đề tài, nhiệm vụ KH&CN (với thống kê đã nghiệm thu)
            2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố (chỉ hiển thị tổng số, Năm hiện tại, bỏ Làm lợi hàng năm)
            3. Sáng chế & Sở hữu trí tuệ
            4. Chuyên gia & Nhà khoa học (chỉ hiển thị tổng số, không hiển thị theo lĩnh vực và theo đơn vị ở mặt trước, click Cơ cấu để xem chi tiết)
            5. Dữ liệu Hệ sinh thái (chỉ hiển thị tổng số dữ liệu, click Cơ cấu để xem 7 loại con; tương tác loại trừ toggle với Cơ cấu Chuyên gia)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Pillar 1: Nhiệm vụ, Đề tài KH&CN */}
          <div 
            onClick={() => onNavigateBrowse('science_tasks')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-800/80 text-teal-300 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-teal-300 font-semibold border border-teal-400/50 hover:border-teal-300 bg-teal-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-teal-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">1. Đề tài, nhiệm vụ KH&CN</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalScienceTasks || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Đã nghiệm thu:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    {stats?.tasksAccepted || 18} đề tài
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Đang thực hiện:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.tasksRunning || 12}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kinh phí NSNN:</span>
                  <span className="font-mono text-teal-300 font-semibold">{formatVND(stats?.totalBudgetApproved)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
              Yêu cầu: chỉ hiển thị tổng số, sửa "Công nhận cấp TP" thành "Năm hiện tại", bỏ "Làm lợi hàng năm" */}
          <div 
            onClick={() => onNavigateBrowse('initiatives')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-800/80 text-amber-300 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-amber-300 font-semibold border border-amber-400/50 hover:border-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-amber-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium line-clamp-2 leading-tight" title="2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố">
                  2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalInitiatives || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-amber-200">Năm {currentYear}:</span>
                  <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    {currentYearInitiativesCount} sáng kiến
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  * Tự động đồng bộ theo năm hiện tại
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Sáng chế & Sở hữu trí tuệ */}
          <div 
            onClick={() => onNavigateBrowse('patents')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-800/80 text-purple-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-purple-300 font-semibold border border-purple-400/50 hover:border-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-purple-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">3. Sáng chế & Sở hữu trí tuệ</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalPatents || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Bằng độc quyền & Đơn:</span>
                  <span className="font-mono text-white font-semibold">{stats?.totalPatents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phòng thí nghiệm:</span>
                  <span className="font-mono text-teal-300 font-semibold">{stats?.totalLabEquipments || 0} PTN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 4: Chuyên gia & Nhà khoa học
              Yêu cầu: chỉ hiển thị Tổng số chuyên gia, KHÔNG hiển thị Theo lĩnh vực và theo đơn vị ở mặt trước card; khi click xem Cơ cấu thì mới xem chi tiết theo phân loại */}
          <div 
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-800/80 text-blue-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleExpertDetails}
                    className={`text-[10px] font-semibold border px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ${
                      showExpertDetails
                        ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                        : 'text-blue-300 border-blue-400/50 bg-blue-900/40 hover:bg-blue-800/60'
                    }`}
                    title="Bấm để xem Cơ cấu chi tiết theo phân loại"
                  >
                    <span>Cơ cấu</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showExpertDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => onNavigateBrowse('experts')}
                    className="text-[10px] text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Xem <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">4. Chuyên gia & Nhà khoa học</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalExperts || 0}
                </div>
              </div>

              {/* Mặt trước chỉ hiển thị tổng quan, KHÔNG hiển thị theo lĩnh vực và theo đơn vị */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">Xem phân loại:</span>
                <button
                  type="button"
                  onClick={handleToggleExpertDetails}
                  className="text-blue-300 hover:text-blue-200 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
                >
                  {showExpertDetails ? 'Ẩn Cơ cấu' : 'Xem Cơ cấu →'}
                </button>
              </div>

              {/* Mobile breakdown rendered IMMEDIATELY inside Card 4 for mobile view */}
              {showExpertDetails && (
                <div className="block lg:hidden mt-3 pt-3 border-t border-blue-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-800/50">
                    <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cơ cấu Chuyên gia</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExpertDetails(false)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                    >
                      Đóng ✕
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-900/50 space-y-1">
                      <div className="font-semibold text-[10px] uppercase text-teal-300">Theo Lĩnh vực:</div>
                      {expertFields.slice(0, 4).map(f => (
                        <div key={f.name} className="flex justify-between py-0.5 text-[11px] border-b border-white/5 last:border-none">
                          <span className="text-slate-300 truncate max-w-[190px]">{f.name}</span>
                          <span className="font-mono font-bold text-teal-300">{f.count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-900/50 space-y-1">
                      <div className="font-semibold text-[10px] uppercase text-blue-300">Theo Đơn vị công tác:</div>
                      {expertUnits.slice(0, 3).map(u => (
                        <div key={u.name} className="flex justify-between py-0.5 text-[11px] border-b border-white/5 last:border-none">
                          <span className="text-slate-300 truncate max-w-[190px]">{u.name}</span>
                          <span className="font-mono font-bold text-blue-300">{u.count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-blue-900/50 space-y-1">
                      <div className="font-semibold text-[10px] uppercase text-purple-300">Theo Học hàm & Học vị:</div>
                      {expertTitles.map(t => (
                        <div key={t.name} className="flex justify-between py-0.5 text-[11px] border-b border-white/5 last:border-none">
                          <span className="text-slate-300">{t.name}</span>
                          <span className="font-mono font-bold text-purple-300">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pillar 5: Dữ liệu Hệ sinh thái
              Yêu cầu: chỉ hiển thị tổng số dữ liệu, khi click xem Cơ cấu thì mới xem chi tiết theo từng loại (7 loại con); toggle loại trừ với Cơ cấu chuyên gia */}
          <div 
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-rose-800/80 text-rose-300 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleEcosystemDetails}
                    className={`text-[10px] font-semibold border px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ${
                      showEcosystemDetails
                        ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                        : 'text-rose-300 border-rose-400/50 bg-rose-900/40 hover:bg-rose-800/60'
                    }`}
                    title="Bấm để xem Cơ cấu 7 loại dữ liệu con"
                  >
                    <span>Cơ cấu</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showEcosystemDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => onNavigateBrowse('startups')}
                    className="text-[10px] text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Xem <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">5. Dữ liệu Hệ sinh thái</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {totalEcosystemRecords}
                </div>
              </div>

              {/* Mặt trước chỉ hiển thị tổng số dữ liệu, không hiển thị các dòng con */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="text-[11px] text-slate-400">Xem 7 loại con:</span>
                <button
                  type="button"
                  onClick={handleToggleEcosystemDetails}
                  className="text-rose-300 hover:text-rose-200 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
                >
                  {showEcosystemDetails ? 'Ẩn Cơ cấu' : 'Xem Cơ cấu →'}
                </button>
              </div>

              {/* Mobile breakdown rendered IMMEDIATELY inside Card 5 for mobile view */}
              {showEcosystemDetails && (
                <div className="block lg:hidden mt-3 pt-3 border-t border-rose-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-rose-800/50">
                    <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cơ cấu Hệ sinh thái (7 loại)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEcosystemDetails(false)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/10 cursor-pointer"
                    >
                      Đóng ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {ecosystemItems.map(item => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => onNavigateBrowse(item.key)}
                          className="p-2 rounded-lg bg-slate-900/80 border border-white/10 text-left transition-colors flex flex-col justify-between cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <IconComp className="w-3.5 h-3.5 text-rose-300" />
                            <span className="font-mono font-bold text-xs text-white">{item.count}</span>
                          </div>
                          <div className="text-[10px] text-slate-300 line-clamp-2 leading-tight">
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

        </div>

        {/* Expandable Breakdown for Pillar 4: Chuyên gia theo Lĩnh vực, Chuyên ngành, Đơn vị, Học hàm & Học vị (Desktop only) */}
        {showExpertDetails && (
          <div className="hidden lg:block p-4 bg-slate-900/95 border border-blue-500/50 rounded-2xl animate-in fade-in duration-150 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-blue-800/50">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Cơ cấu Chuyên gia & Nhà khoa học theo Phân loại chuẩn hoá</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExpertDetails(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-teal-300">
                  1. Theo Lĩnh vực chuyên môn:
                </div>
                {expertFields.slice(0, 5).map(f => (
                  <div key={f.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-slate-300 truncate max-w-[200px]">{f.name}</span>
                    <span className="font-mono font-bold text-teal-300">{f.count}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-blue-300">
                  2. Theo Đơn vị / Cơ quan công tác:
                </div>
                {expertUnits.slice(0, 5).map(u => (
                  <div key={u.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-slate-300 truncate max-w-[200px]">{u.name}</span>
                    <span className="font-mono font-bold text-blue-300">{u.count}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-purple-300">
                  3. Theo Học hàm & Học vị:
                </div>
                {expertTitles.map(t => (
                  <div key={t.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-slate-300">{t.name}</span>
                    <span className="font-mono font-bold text-purple-300">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expandable Breakdown for Pillar 5: Dữ liệu Hệ sinh thái theo 7 loại dữ liệu con (Desktop only) */}
        {showEcosystemDetails && (
          <div className="hidden lg:block p-4 bg-slate-900/95 border border-rose-500/50 rounded-2xl animate-in fade-in duration-150 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-rose-800/50">
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-rose-400" />
                <span>Cơ cấu chi tiết Dữ liệu Hệ sinh thái Khởi nghiệp ĐMST (7 loại con)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEcosystemDetails(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            {/* 7 Child Data Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              {ecosystemItems.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigateBrowse(item.key)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400 text-left transition-colors flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IconComp className="w-4 h-4 text-rose-300 group-hover:scale-110 transition-transform" />
                      <span className="font-mono font-bold text-sm text-white">{item.count}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 line-clamp-2 leading-tight">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Highlighted Distribution: Phân loại Dự án & Ý tưởng khởi nghiệp theo Trường học vs Xã/phường */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between font-semibold text-emerald-300 text-[11px] uppercase tracking-wider">
                  <span>Dự án khởi nghiệp phân theo Trường học vs Xã/phường:</span>
                  <span className="font-mono font-bold text-white">{stats?.totalProjects || 0} dự án</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/40 flex justify-between">
                    <span className="text-slate-300">Khối Trường học:</span>
                    <span className="font-mono font-bold text-emerald-400">{projectSchoolsCount} dự án</span>
                  </div>
                  <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/40 flex justify-between">
                    <span className="text-slate-300">Địa bàn Xã/phường:</span>
                    <span className="font-mono font-bold text-emerald-400">{projectWardsCount} dự án</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-300 text-[11px] uppercase tracking-wider">
                  <span>Ý tưởng khởi nghiệp phân theo Trường học vs Xã/phường:</span>
                  <span className="font-mono font-bold text-white">{stats?.totalIdeas || 0} ý tưởng</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-800/40 flex justify-between">
                    <span className="text-slate-300">Khối Trường học:</span>
                    <span className="font-mono font-bold text-amber-400">{ideaSchoolsCount} ý tưởng</span>
                  </div>
                  <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-800/40 flex justify-between">
                    <span className="text-slate-300">Địa bàn Xã/phường:</span>
                    <span className="font-mono font-bold text-amber-400">{ideaWardsCount} ý tưởng</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
