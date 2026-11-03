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
  CheckCircle2,
  Building2,
  MapPin,
  School,
  Star,
  Target,
  Sparkles,
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

  // Ecosystem aggregate items
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

  // Expert domain breakdowns
  const expertFields = [
    { name: 'Công nghệ thông tin & Trí tuệ nhân tạo', count: 18 },
    { name: 'Khoa học Y Dược & Chăm sóc sức khỏe', count: 12 },
    { name: 'Nông nghiệp CNC & Công nghệ sinh học', count: 9 },
    { name: 'Môi trường, Năng lượng & Vật liệu mới', count: 8 },
    { name: 'Cơ khí, Tự động hóa & Điện tử', count: 7 }
  ];

  const expertUnits = [
    { name: 'Đại học Đà Nẵng & Các trường thành viên', count: 24 },
    { name: 'Viện Hàn lâm KH&CN Việt Nam (Khu vực MT)', count: 11 },
    { name: 'Sở KH&CN và các Trung tâm Nghiên cứu', count: 9 },
    { name: 'Các Doanh nghiệp KH&CN và Viện độc lập', count: 10 }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-7 pb-8 px-4 sm:px-6 lg:px-8 border-b border-teal-800 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard - Bỏ 'Bảng Chỉ Số Tổng Quan & Bức Tranh Dữ Liệu Thời Gian Thực' */}
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

        {/* 5 Main Pillars in exact requested sequence:
            1. Đề tài, nhiệm vụ KH&CN (với thống kê đã nghiệm thu)
            2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
            3. Sáng chế & Sở hữu trí tuệ
            4. Chuyên gia & Nhà khoa học (thống kê theo lĩnh vực, đơn vị...)
            5. Dữ liệu Hệ sinh thái (thống kê theo từng loại dữ liệu con)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Pillar 1: Nhiệm vụ, Đề tài KH&CN - Có thống kê đã nghiệm thu */}
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

          {/* Pillar 2: Sáng kiến có tác dụng, ảnh hưởng đối với thành phố */}
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
                <div className="flex justify-between">
                  <span>Công nhận cấp TP:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.initiativesRecognized || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Làm lợi hàng năm:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatVND(stats?.totalCostSavings)}</span>
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

          {/* Pillar 4: Chuyên gia & Nhà khoa học - Thống kê theo lĩnh vực, theo đơn vị */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExpertDetails(!showExpertDetails);
                    }}
                    className="text-[10px] text-blue-300 font-semibold border border-blue-400/50 bg-blue-900/40 hover:bg-blue-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5"
                    title="Xem cơ cấu theo lĩnh vực & đơn vị"
                  >
                    <span>Cơ cấu</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showExpertDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => onNavigateBrowse('experts')}
                    className="text-[10px] text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5"
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

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Đã xác minh:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{stats?.verifiedExperts || 0} chuyên gia</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Theo lĩnh vực:</span>
                  <span className="text-teal-300 font-medium">5 ngành chủ lực</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Theo đơn vị:</span>
                  <span className="text-blue-300 font-medium">Viện trường & ĐMST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 5: Dữ liệu Hệ sinh thái - Thống kê chi tiết theo từng loại dữ liệu con */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEcosystemDetails(!showEcosystemDetails);
                    }}
                    className="text-[10px] text-rose-300 font-semibold border border-rose-400/50 bg-rose-900/40 hover:bg-rose-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5"
                    title="Xem chi tiết 7 loại dữ liệu con"
                  >
                    <span>7 Loại con</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showEcosystemDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => onNavigateBrowse('startups')}
                    className="text-[10px] text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5"
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

              <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>DN khởi nghiệp:</span>
                  <span className="font-mono text-white font-semibold">{stats?.totalStartups || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổ chức trung gian:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{stats?.totalSupportOrgs || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dự án & Ý tưởng:</span>
                  <span className="font-mono text-amber-300 font-semibold">{(stats?.totalProjects || 0) + (stats?.totalIdeas || 0)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Expandable Breakdown for Pillar 4: Chuyên gia theo Lĩnh vực & Đơn vị */}
        {showExpertDetails && (
          <div className="p-4 bg-slate-900/90 border border-blue-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-800/50">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Thống kê Chuyên gia theo Lĩnh vực & Cơ quan công tác</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExpertDetails(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="font-semibold text-slate-200 mb-1 text-[11px] uppercase tracking-wider text-teal-300">
                  Phân bố theo Lĩnh vực chuyên ngành:
                </div>
                {expertFields.map(f => (
                  <div key={f.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-slate-300 truncate max-w-[280px]">{f.name}</span>
                    <span className="font-mono font-bold text-teal-300">{f.count} chuyên gia</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="font-semibold text-slate-200 mb-1 text-[11px] uppercase tracking-wider text-blue-300">
                  Phân bố theo Đơn vị / Cơ quan chủ quản:
                </div>
                {expertUnits.map(u => (
                  <div key={u.name} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-slate-300 truncate max-w-[280px]">{u.name}</span>
                    <span className="font-mono font-bold text-blue-300">{u.count} chuyên gia</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expandable Breakdown for Pillar 5: Dữ liệu Hệ sinh thái theo từng loại dữ liệu con */}
        {showEcosystemDetails && (
          <div className="p-4 bg-slate-900/90 border border-rose-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-800/50">
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-rose-400" />
                <span>Thống kê chi tiết Dữ liệu Hệ sinh thái theo 7 loại dữ liệu con</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEcosystemDetails(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              {ecosystemItems.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigateBrowse(item.key)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400 text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <IconComp className="w-4 h-4 text-rose-300" />
                      <span className="font-mono font-bold text-sm text-white">{item.count}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 line-clamp-2 leading-tight">
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
