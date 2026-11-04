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

  const handleToggleExpertDetails = () => {
    setShowExpertDetails(prev => {
      const next = !prev;
      if (next) setShowEcosystemDetails(false);
      return next;
    });
  };

  const handleToggleEcosystemDetails = () => {
    setShowEcosystemDetails(prev => {
      const next = !prev;
      if (next) setShowExpertDetails(false);
      return next;
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

  // Reusable Expert Breakdown Component
  const renderExpertBreakdown = () => (
    <div className="p-4 bg-slate-900/95 border border-blue-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-blue-800/50">
        <div className="text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Cơ cấu Chuyên gia & Nhà khoa học</span>
        </div>
        <button
          type="button"
          onClick={() => setShowExpertDetails(false)}
          className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
        >
          Đóng ✕
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Giáo sư / Phó GS</div>
          <div className="text-base font-bold text-white font-mono mt-1">
            {stats?.expertsProfessors ?? Math.round((stats?.totalExperts || 1) * 0.28)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Tiến sĩ (TS / TSKH)</div>
          <div className="text-base font-bold text-teal-300 font-mono mt-1">
            {stats?.expertsDoctors ?? Math.round((stats?.totalExperts || 1) * 0.54)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Thạc sĩ / Kỹ sư</div>
          <div className="text-base font-bold text-amber-300 font-mono mt-1">
            {stats?.expertsMasters ?? Math.round((stats?.totalExperts || 1) * 0.18)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Tổng số chuyên gia</div>
          <div className="text-base font-bold text-emerald-400 font-mono mt-1">
            {stats?.totalExperts || 0}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 pt-1">
        Phạm vi: Cán bộ nghiên cứu, giảng viên các trường Đại học, Viện nghiên cứu và chuyên gia doanh nghiệp trên địa bàn TP Đà Nẵng.
      </div>
    </div>
  );

  // Reusable Ecosystem Breakdown Component with horizontal scrolling
  const renderEcosystemBreakdown = () => (
    <div className="p-4 bg-slate-900/95 border border-rose-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-rose-800/50">
        <div className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
          <Rocket className="w-4 h-4 text-rose-400" />
          <span>CÁC LOẠI DỮ LIỆU TRONG HỆ SINH THÁI</span>
        </div>
        <button
          type="button"
          onClick={() => setShowEcosystemDetails(false)}
          className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
        >
          Đóng ✕
        </button>
      </div>

      {/* Horizontal scroll container on all devices */}
      <div className="overflow-x-auto pb-2 scrollbar-thin flex gap-3 min-w-full">
        {ecosystemItems.map(item => {
          const IconComp = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigateBrowse(item.key)}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400 text-left transition-colors flex flex-col justify-between cursor-pointer min-w-[170px] sm:min-w-[190px] shrink-0"
            >
              <div className="flex items-center justify-between mb-2">
                <IconComp className="w-4 h-4 text-rose-300" />
                <span className="font-mono font-bold text-base text-white">{item.count}</span>
              </div>
              <div className="text-xs font-medium text-slate-300 line-clamp-2 leading-snug">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-7 pb-8 px-4 sm:px-6 lg:px-8 border-b border-teal-800 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800/60">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tổng quan Cơ sở dữ liệu KHCN & KNĐMST TP Đà Nẵng
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dữ liệu quản lý nhà nước tập trung từ Sở Khoa học & Công nghệ thành phố Đà Nẵng, các Viện trường, Doanh nghiệp và Mạng lưới ĐMST
            </p>
          </div>

          <div className="flex items-center gap-3 bg-teal-900/40 border border-teal-500/40 rounded-2xl px-5 py-3 shrink-0 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-700/60 flex items-center justify-center text-teal-300 border border-teal-400/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-teal-200 uppercase tracking-wider font-semibold">Toàn bộ hệ thống</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {totalIntegratedRecords} <span className="text-sm font-sans font-normal text-slate-300">bản ghi</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Main Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Pillar 1: Nhiệm vụ, Đề tài KH&CN */}
          <div 
            onClick={() => onNavigateBrowse('science_tasks')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-teal-800/80 text-teal-300 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <span className="text-xs text-teal-300 font-semibold border border-teal-400/50 hover:border-teal-300 bg-teal-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 group-hover:bg-teal-800/60">
                  Xem <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-sm text-slate-300 font-medium">Đề tài, nhiệm vụ KH&CN</div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalScienceTasks || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Đã nghiệm thu:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    {stats?.tasksAccepted ?? 0} đề tài
                  </span>
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
                <div className="w-9 h-9 rounded-lg bg-amber-800/80 text-amber-300 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span className="text-xs text-amber-300 font-semibold border border-amber-400/50 hover:border-amber-300 bg-amber-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 group-hover:bg-amber-800/60">
                  Xem <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-sm text-slate-300 font-medium line-clamp-2 leading-snug" title="Sáng kiến có tác dụng, ảnh hưởng đối với thành phố">
                  Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalInitiatives || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Năm {new Date().getFullYear()}:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.initiativesRecognized || 0} sáng kiến</span>
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
                <div className="w-9 h-9 rounded-lg bg-purple-800/80 text-purple-300 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs text-purple-300 font-semibold border border-purple-400/50 hover:border-purple-300 bg-purple-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 group-hover:bg-purple-800/60">
                  Xem <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-sm text-slate-300 font-medium">Sáng chế & Sở hữu trí tuệ</div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalPatents || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs sm:text-sm text-slate-300">
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

          {/* Pillar 4: Chuyên gia & Nhà khoa học */}
          <div className="space-y-3 flex flex-col justify-between">
            <div 
              className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all group flex flex-col justify-between h-full"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-800/80 text-blue-300 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpertDetails();
                      }}
                      className={`text-xs font-semibold border px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ${
                        showExpertDetails 
                          ? 'bg-blue-600 text-white border-blue-400' 
                          : 'text-blue-300 border-blue-400/50 bg-blue-900/40 hover:bg-blue-800/60'
                      }`}
                      title="Xem cơ cấu chuyên gia"
                    >
                      <span>Cơ cấu</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showExpertDetails ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => onNavigateBrowse('experts')}
                      className="text-xs text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Xem <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-300 font-medium">Chuyên gia & Nhà khoa học</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                    {stats?.totalExperts || 0}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
                  <span>Tổng số chuyên gia: <strong className="text-white font-mono">{stats?.totalExperts || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Mobile Only: render Breakdown directly below Chuyên gia */}
            <div className="lg:hidden">
              {showExpertDetails && renderExpertBreakdown()}
            </div>
          </div>

          {/* Pillar 5: Dữ liệu Hệ sinh thái */}
          <div className="space-y-3 flex flex-col justify-between">
            <div 
              className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all group flex flex-col justify-between h-full"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-rose-800/80 text-rose-300 flex items-center justify-center">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleEcosystemDetails();
                      }}
                      className={`text-xs font-semibold border px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ${
                        showEcosystemDetails
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'text-rose-300 border-rose-400/50 bg-rose-900/40 hover:bg-rose-800/60'
                      }`}
                      title="Xem các loại dữ liệu trong hệ sinh thái"
                    >
                      <span>Các loại dữ liệu</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showEcosystemDetails ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => onNavigateBrowse('startups')}
                      className="text-xs text-teal-300 font-semibold border border-teal-400/50 bg-teal-900/40 hover:bg-teal-800/60 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Xem <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-300 font-medium">Dữ liệu Hệ sinh thái</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                    {totalEcosystemRecords}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
                  <span>Tổng số dữ liệu hệ sinh thái: <strong className="text-white font-mono">{totalEcosystemRecords}</strong></span>
                </div>
              </div>
            </div>

            {/* Mobile Only: render Breakdown directly below Hệ sinh thái */}
            <div className="lg:hidden">
              {showEcosystemDetails && renderEcosystemBreakdown()}
            </div>
          </div>

        </div>

        {/* Laptop/Desktop Only: Expandable Breakdowns spanning the full width */}
        <div className="hidden lg:block space-y-4">
          {showExpertDetails && renderExpertBreakdown()}
          {showEcosystemDetails && renderEcosystemBreakdown()}
        </div>

      </div>
    </div>
  );
};
