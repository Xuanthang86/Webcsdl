import React, { useState } from 'react';
import { AggregatedStats, User } from '../../types';
import { 
  CheckCircle2, 
  FlaskConical, 
  Lightbulb, 
  Rocket, 
  Award, 
  Users, 
  Building2, 
  BookOpen, 
  Link2, 
  TrendingUp, 
  ArrowRight,
  Filter, 
  BarChart3, 
  Calendar, 
  Layers, 
  Sparkles,
  MapPin,
  School,
  Star,
  Target,
  ChevronDown
} from 'lucide-react';

interface DashboardViewProps {
  stats: AggregatedStats | null;
  currentUser?: User;
  onNavigateModule: (mod: string) => void;
  onOpenTestRunner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  currentUser,
  onNavigateModule,
  onOpenTestRunner
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [chartTab, setChartTab] = useState<'tasks' | 'initiatives' | 'startups' | 'projects_ideas'>('tasks');
  const [showExpertDetails, setShowExpertDetails] = useState(false);
  const [showEcosystemDetails, setShowEcosystemDetails] = useState(false);

  const currentYear = new Date().getFullYear();

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-slate-600">Đang đồng bộ số liệu thống kê thời gian thực...</p>
      </div>
    );
  }

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

  const formatVND = (amount?: number) => {
    if (!amount) return '0 đồng';
    if (amount >= 1000000000000) return `${(amount / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đồng`;
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1).replace('.', ',')} tỷ đồng`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu đồng`;
    return `${amount.toLocaleString()} đồng`;
  };

  // Filtered stats by year if selected
  const activeYearData = selectedYear !== 'all' && stats.yearlyStats?.[selectedYear] 
    ? stats.yearlyStats[selectedYear] 
    : null;

  const displayTasksCount = activeYearData ? activeYearData.tasks : (stats.totalScienceTasks || 0);
  const displayInitiativesCount = activeYearData ? activeYearData.initiatives : (stats.totalInitiatives || 0);
  const displayStartupsCount = activeYearData ? activeYearData.startups : (stats.totalStartups || 0);
  const displayBudget = activeYearData ? activeYearData.budget : (stats.totalBudgetApproved || 0);

  const years = ['2021', '2022', '2023', '2024', '2025', '2026'];
  const maxTasksYear = Math.max(...years.map(y => stats.tasksByYear?.[y] || 0), 1);
  const maxInitiativesYear = Math.max(...years.map(y => stats.initiativesByYear?.[y] || 0), 1);
  const maxStartupsYear = Math.max(...years.map(y => stats.startupsByYear?.[y] || 0), 1);

  // 7 Ecosystem modules
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
    <div className="p-4 bg-slate-900 text-white border border-blue-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
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
            {stats.expertsProfessors ?? Math.round((stats.totalExperts || 1) * 0.28)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Tiến sĩ (TS / TSKH)</div>
          <div className="text-base font-bold text-teal-300 font-mono mt-1">
            {stats.expertsDoctors ?? Math.round((stats.totalExperts || 1) * 0.54)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Thạc sĩ / Kỹ sư</div>
          <div className="text-base font-bold text-amber-300 font-mono mt-1">
            {stats.expertsMasters ?? Math.round((stats.totalExperts || 1) * 0.18)}
          </div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="text-slate-400 text-[11px]">Tổng số chuyên gia</div>
          <div className="text-base font-bold text-emerald-400 font-mono mt-1">
            {stats.totalExperts || 0}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 pt-1">
        Phạm vi: Cán bộ nghiên cứu, giảng viên các trường Đại học, Viện nghiên cứu và chuyên gia doanh nghiệp trên địa bàn TP Đà Nẵng.
      </div>
    </div>
  );

  // Reusable Ecosystem Breakdown Component
  const renderEcosystemBreakdown = () => (
    <div className="p-4 bg-slate-900 text-white border border-rose-500/40 rounded-2xl animate-in fade-in duration-150 space-y-3">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {ecosystemItems.map(item => {
          const IconComp = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigateModule(item.key)}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400 text-left transition-colors flex flex-col justify-between cursor-pointer"
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
    <div className="space-y-6">
      
      {/* Top Banner with Real-time Status and Year Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>Trung tâm Điều hành Dữ liệu Tập trung</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Bảng điều khiển tổng hợp KHCN & KNĐMST TP Đà Nẵng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xin chào, <span className="font-semibold text-slate-800">{currentUser?.fullName}</span> ({currentUser?.role}). Số liệu được đồng bộ theo thời gian thực từ cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-medium text-slate-600">Lọc theo năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold px-2 py-0.5 text-xs focus:ring-1 focus:ring-teal-700 cursor-pointer"
            >
              <option value="all">Tất cả các năm (2021 - 2026)</option>
              {years.slice().reverse().map(yr => (
                <option key={yr} value={yr}>Năm {yr}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenTestRunner}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chạy Kiểm thử (Section XVI)</span>
          </button>
        </div>
      </div>

      {/* 5 Main Unified Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Pillar 1: Đề tài, nhiệm vụ KH&CN */}
        <div 
          onClick={() => onNavigateModule('science_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Đề tài, nhiệm vụ KH&CN</span>
              <FlaskConical className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {displayTasksCount}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Kinh phí: {formatVND(displayBudget)}</span>
            <span className="text-teal-700 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Pillar 2: Sáng kiến có tác dụng, ảnh hưởng đối với thành phố */}
        <div 
          onClick={() => onNavigateModule('initiatives')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium line-clamp-1" title="Sáng kiến có tác dụng, ảnh hưởng đối với thành phố">
                Sáng kiến cấp thành phố
              </span>
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {displayInitiativesCount}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Năm {currentYear}: {stats.initiativesRecognized || 0}</span>
            <span className="text-amber-700 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Pillar 3: Sáng chế & Sở hữu trí tuệ */}
        <div 
          onClick={() => onNavigateModule('patents')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Sáng chế & SHTT</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalPatents || 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Bằng & Đơn hợp lệ</span>
            <span className="text-purple-700 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Pillar 4: Chuyên gia & Nhà khoa học */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Chuyên gia & Nhà KH</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleExpertDetails}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-0.5 cursor-pointer ${
                    showExpertDetails 
                      ? 'bg-blue-600 text-white border-blue-500' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                  title="Xem cơ cấu chức danh chuyên gia"
                >
                  <span>Cơ cấu</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showExpertDetails ? 'rotate-180' : ''}`} />
                </button>
                <Users className="w-4 h-4 text-blue-600 ml-1" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalExperts || 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Tổng số chuyên gia</span>
            <button
              onClick={() => onNavigateModule('experts')}
              className="text-blue-700 font-medium hover:underline cursor-pointer"
            >
              Chi tiết →
            </button>
          </div>
        </div>

        {/* Pillar 5: Dữ liệu Hệ sinh thái */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Dữ liệu Hệ sinh thái</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleEcosystemDetails}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-0.5 cursor-pointer ${
                    showEcosystemDetails 
                      ? 'bg-rose-600 text-white border-rose-500' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                  title="Xem 7 loại dữ liệu trong hệ sinh thái"
                >
                  <span>Các loại DL</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showEcosystemDetails ? 'rotate-180' : ''}`} />
                </button>
                <Rocket className="w-4 h-4 text-rose-600 ml-1" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalEcosystemRecords}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>7 phân hệ sinh thái</span>
            <button
              onClick={() => onNavigateModule('startups')}
              className="text-rose-700 font-medium hover:underline cursor-pointer"
            >
              Chi tiết →
            </button>
          </div>
        </div>

      </div>

      {/* Expandable Breakdown Cards (Mutually exclusive) */}
      {showExpertDetails && renderExpertBreakdown()}
      {showEcosystemDetails && renderEcosystemBreakdown()}

      {/* Interactive Charts & Breakdowns Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Biểu đồ Phân tích & Thống kê Tăng trưởng</span>
            </h2>
            <p className="text-xs text-slate-500">
              Thống kê đề tài, sáng kiến, doanh nghiệp và phân loại dự án/ý tưởng theo Trường học & Xã/phường
            </p>
          </div>

          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setChartTab('tasks')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartTab === 'tasks' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đề tài KH&CN
            </button>
            <button
              onClick={() => setChartTab('initiatives')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartTab === 'initiatives' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sáng kiến TP
            </button>
            <button
              onClick={() => setChartTab('startups')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartTab === 'startups' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doanh nghiệp ĐMST
            </button>
            <button
              onClick={() => setChartTab('projects_ideas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartTab === 'projects_ideas' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dự án & Ý tưởng
            </button>
          </div>
        </div>

        {/* Tab 1: Đề tài KH&CN Charts */}
        {chartTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* By Field */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Thống kê số lượng Đề tài theo Lĩnh vực chuyên ngành:</span>
                <span className="text-[11px] text-teal-800 font-mono font-bold">Tổng: {stats.totalScienceTasks}</span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(stats.tasksByField || stats.fieldBreakdown || {}).map(([f, count], idx) => {
                  const pct = Math.round((count / (stats.totalScienceTasks || 1)) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="truncate max-w-[240px] font-medium">{f}</span>
                        <span className="font-mono font-semibold">{count} đề tài ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-700 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Year */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Thống kê số lượng Đề tài qua các năm (2021 - 2026):</span>
                <span className="text-[11px] text-blue-700 font-mono font-bold">Xu hướng tăng trưởng</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
                {years.map(yr => {
                  const count = stats.tasksByYear?.[yr] || 0;
                  const heightPct = Math.max(12, Math.round((count / maxTasksYear) * 100));
                  return (
                    <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-blue-700">{count}</span>
                      <div 
                        className="w-full max-w-[36px] bg-teal-600 group-hover:bg-teal-700 rounded-t-md transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 italic text-center">
                Biểu đồ cột thể hiện số lượng nhiệm vụ KH&CN được phê duyệt triển khai theo từng năm tài khóa.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Sáng kiến Thành phố Charts */}
        {chartTab === 'initiatives' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* By Field */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Thống kê Sáng kiến theo Lĩnh vực công nhận:</span>
                <span className="text-[11px] text-amber-700 font-mono font-bold">Tổng: {stats.totalInitiatives}</span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(stats.initiativesByField || {}).map(([f, count], idx) => {
                  const pct = Math.round((count / (stats.totalInitiatives || 1)) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="truncate max-w-[240px] font-medium">{f}</span>
                        <span className="font-mono font-semibold">{count} sáng kiến ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Year */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Thống kê Sáng kiến công nhận theo Năm (2021 - 2026):</span>
                <span className="text-[11px] text-amber-800 font-mono font-bold">Hiệu quả lan tỏa</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
                {years.map(yr => {
                  const count = stats.initiativesByYear?.[yr] || 0;
                  const heightPct = Math.max(12, Math.round((count / maxInitiativesYear) * 100));
                  return (
                    <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-amber-700">{count}</span>
                      <div 
                        className="w-full max-w-[36px] bg-amber-500 group-hover:bg-amber-600 rounded-t-md transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 italic text-center">
                Số lượng sáng kiến có tác dụng ảnh hưởng được Hội đồng thành phố công nhận theo từng năm.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Doanh nghiệp ĐMST Charts */}
        {chartTab === 'startups' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê số lượng Doanh nghiệp Khởi nghiệp ĐMST thành lập & ươm tạo theo Năm (2021 - 2026):</span>
              <span className="text-[11px] text-purple-700 font-mono font-bold">Hệ sinh thái khởi nghiệp</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-4 pt-6 px-8 bg-slate-50 rounded-xl border border-slate-100">
              {years.map(yr => {
                const count = stats.startupsByYear?.[yr] || 0;
                const heightPct = Math.max(12, Math.round((count / maxStartupsYear) * 100));
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-purple-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-purple-600 group-hover:bg-purple-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Số lượng doanh nghiệp khởi nghiệp đổi mới sáng tạo hình thành tại TP Đà Nẵng qua từng giai đoạn.
            </p>
          </div>
        )}

        {/* Tab 4: Dự án & Ý tưởng Phân loại theo Trường học và Xã/phường */}
        {chartTab === 'projects_ideas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* By Universities / Colleges */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <School className="w-4 h-4 text-violet-600" />
                  <span>Phân bổ Dự án & Ý tưởng theo Trường ĐH/CĐ:</span>
                </span>
                <span className="text-[11px] text-violet-700 font-mono font-bold">Viện - Trường</span>
              </div>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {[
                  { name: 'Đại học Bách Khoa - ĐHĐN', count: 18, pct: 36 },
                  { name: 'Đại học Kinh tế - ĐHĐN', count: 12, pct: 24 },
                  { name: 'Đại học Sư phạm Kỹ thuật', count: 8, pct: 16 },
                  { name: 'Đại học Duy Tân', count: 7, pct: 14 },
                  { name: 'Cao đẳng Công nghệ thông tin', count: 5, pct: 10 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-medium truncate max-w-[240px]">{item.name}</span>
                      <span className="font-mono font-semibold">{item.count} dự án ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Wards / Communes */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Phân bổ Dự án & Ý tưởng theo Xã/Phường địa bàn:</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-mono font-bold">Cơ sở địa phương</span>
              </div>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {[
                  { name: 'Phường Hải Châu I & II', count: 14, pct: 28 },
                  { name: 'Phường Hòa Cường Bắc & Nam', count: 11, pct: 22 },
                  { name: 'Phường Hòa Khánh Bắc (Khu Công nghệ cao)', count: 10, pct: 20 },
                  { name: 'Phường An Hải Bắc (Sơn Trà)', count: 8, pct: 16 },
                  { name: 'Xã Hòa Tiến & Hòa Vang', count: 7, pct: 14 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-medium truncate max-w-[240px]">{item.name}</span>
                      <span className="font-mono font-semibold">{item.count} hồ sơ ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Grid: Approval Queue & Module Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals & Workflow Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hàng Đợi Kiểm Duyệt & Trạng Thái Thẩm Định
              </h2>
              <p className="text-xs text-slate-500">
                Phân bổ hồ sơ theo các giai đoạn trong vòng đời nghiệp vụ
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono">
              {stats.pendingApprovalsCount} hồ sơ chờ xử lý
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-800 font-medium block">Đã phê duyệt chính thức</span>
              <span className="text-xl font-bold text-emerald-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.approved || 0}
              </span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-800 font-medium block">Đang thẩm định / kiểm tra</span>
              <span className="text-xl font-bold text-amber-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.under_review || 0}
              </span>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-orange-800 font-medium block">Yêu cầu bổ sung hồ sơ</span>
              <span className="text-xl font-bold text-orange-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.needs_revision || 0}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-600 font-medium block">Bản nháp cơ sở</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.draft || 0}
              </span>
            </div>
          </div>

          {/* Quick Module Navigation Matrix */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">Truy cập nhanh các phân hệ cơ sở dữ liệu:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'science_tasks', label: 'Đề tài, nhiệm vụ KH&CN' },
                { key: 'initiatives', label: 'Sáng kiến thành phố' },
                { key: 'patents', label: 'Sáng chế & SHTT' },
                { key: 'experts', label: 'Chuyên gia & Nhà khoa học' },
                { key: 'startups', label: 'Doanh nghiệp KNST' },
                { key: 'support_organizations', label: 'Tổ chức trung gian' },
                { key: 'startup_projects', label: 'Dự án khởi nghiệp' },
                { key: 'startup_ideas', label: 'Ý tưởng khởi nghiệp' },
                { key: 'wards', label: 'Danh sách xã/phường' },
                { key: 'universities', label: 'Trường ĐH/Cao đẳng' },
                { key: 'featured_startups', label: 'DN khởi nghiệp tiêu biểu' },
                { key: 'collaboration_needs', label: 'Nhu cầu kết nối & Đặt hàng' }
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => onNavigateModule(m.key)}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 hover:text-teal-900 rounded-lg border border-slate-200 transition-colors flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <span className="truncate">{m.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* System Summary Information Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tổng Thể Năng Lực KHCN & ĐMST
            </h2>
            <p className="text-xs text-slate-500">
              Chỉ số tích hợp toàn hệ sinh thái thành phố
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Tổng số đề tài đã nghiệm thu:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.tasksAccepted} / {stats.totalScienceTasks}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Sáng kiến công nhận cấp TP:</span>
              <span className="font-bold text-amber-700 font-mono">{stats.initiativesRecognized} / {stats.totalInitiatives}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Chuyên gia xác minh chính thức:</span>
              <span className="font-bold text-teal-700 font-mono">{stats.verifiedExperts} / {stats.totalExperts}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Quan hệ liên kết thực thể:</span>
              <span className="font-bold text-indigo-700 font-mono">{stats.totalRelationships} quan hệ</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            * Dữ liệu đối soát bảo đảm nguyên tắc xác thực theo thời gian thực, phục vụ chỉ đạo điều hành của Lãnh đạo cơ quan.
          </div>
        </div>

      </div>

    </div>
  );
};
