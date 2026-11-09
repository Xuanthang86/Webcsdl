import React, { useState } from 'react';
import { AggregatedStats, User, SystemConfig } from '../../types';
import { HomeOverviewDashboard } from '../HomeOverviewDashboard';
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
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  stats: AggregatedStats | null;
  currentUser?: User;
  systemConfig: SystemConfig;
  onNavigateModule: (mod: string) => void;
  onOpenTestRunner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats: rawStats,
  currentUser,
  systemConfig,
  onNavigateModule,
  onOpenTestRunner
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [yearDisplayMode, setYearDisplayMode] = useState<'recent' | 'single' | 'range'>('recent');
  const [chartSingleYear, setChartSingleYear] = useState<string>(String(new Date().getFullYear()));
  const [chartFromYear, setChartFromYear] = useState<string>(String(new Date().getFullYear() - 4));
  const [chartToYear, setChartToYear] = useState<string>(String(new Date().getFullYear()));
  const [chartTab, setChartTab] = useState<'tasks' | 'initiatives' | 'startups' | 'patents' | 'experts' | 'projects' | 'ideas' | 'support_orgs' | 'universities' | 'wards'>('tasks');

  const currentYear = new Date().getFullYear();
  const stats: AggregatedStats = rawStats || {
    totalScienceTasks: 0,
    tasksRunning: 0,
    tasksAccepted: 0,
    tasksPending: 0,
    totalInitiatives: 0,
    initiativesRecognized: 0,
    initiativesInCurrentYear: 0,
    currentYear: currentYear,
    totalPatents: 0,
    totalExperts: 0,
    verifiedExperts: 0,
    totalStartups: 0,
    totalSupportOrgs: 0,
    totalProjects: 0,
    totalIdeas: 0,
    totalWards: 0,
    totalUniversities: 0,
    totalFeaturedStartups: 0,
    totalOrganizations: 0,
    totalInvestors: 0,
    totalFunds: 0,
    totalPrograms: 0,
    totalPublications: 0,
    totalTechnologies: 0,
    totalCollaborationNeeds: 0,
    totalLabEquipments: 0,
    totalPolicies: 0,
    totalRelationships: 0,
    pendingApprovalsCount: 0,
    fieldBreakdown: {},
    statusBreakdown: { approved: 0, under_review: 0, draft: 0, needs_revision: 0 },
    totalBudgetApproved: 0,
    totalCostSavings: 0,
    tasksByYear: {},
    initiativesByYear: {},
    startupsByYear: {}
  };

  const formatVND = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ VND`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu VND`;
    return `${amount.toLocaleString()} VND`;
  };

  // Filtered stats by year if selected
  const activeYearData = selectedYear !== 'all' && stats.yearlyStats?.[selectedYear] 
    ? stats.yearlyStats[selectedYear] 
    : null;

  const displayTasksCount = activeYearData ? activeYearData.tasks : stats.totalScienceTasks;
  const displayInitiativesCount = activeYearData ? activeYearData.initiatives : stats.totalInitiatives;
  const displayStartupsCount = activeYearData ? activeYearData.startups : stats.totalStartups;
  const displayBudget = activeYearData ? activeYearData.budget : stats.totalBudgetApproved;
  const displaySavings = activeYearData ? activeYearData.savings : stats.totalCostSavings;

  const defaultYears = Array.from(
    { length: Math.max(6, currentYear - 2021 + 1) },
    (_, index) => String(2021 + index)
  );
  const yearMaps = [
    stats.tasksByYear,
    stats.initiativesByYear,
    stats.startupsByYear,
    stats.patentsByYear,
    stats.expertsByYear,
    stats.projectsByYear,
    stats.ideasByYear,
    stats.supportOrgsByYear,
    stats.universitiesByYear,
    stats.wardsByYear
  ];
  const availableYears = Array.from(new Set([
    ...defaultYears,
    ...yearMaps.flatMap(yearMap => Object.keys(yearMap || {}))
  ])).filter(year => /^\d{4}$/.test(year)).sort();
  const recentFiveYears = availableYears.filter(year =>
    Number(year) >= currentYear - 4 && Number(year) <= currentYear
  );
  const rangeStart = Math.min(Number(chartFromYear), Number(chartToYear));
  const rangeEnd = Math.max(Number(chartFromYear), Number(chartToYear));
  const displayYears = yearDisplayMode === 'single'
    ? [chartSingleYear]
    : yearDisplayMode === 'range'
      ? availableYears.filter(year => Number(year) >= rangeStart && Number(year) <= rangeEnd)
      : (recentFiveYears.length > 0 ? recentFiveYears : availableYears.slice(-5));
  const maxTasksYear = Math.max(...displayYears.map(y => (stats.tasksByYear?.[y] ?? (stats.tasksByYear as any)?.[Number(y)]) || 0), 1);
  const maxInitiativesYear = Math.max(...displayYears.map(y => (stats.initiativesByYear?.[y] ?? (stats.initiativesByYear as any)?.[Number(y)]) || 0), 1);
  const maxStartupsYear = Math.max(...displayYears.map(y => (stats.startupsByYear?.[y] ?? (stats.startupsByYear as any)?.[Number(y)]) || 0), 1);
  const maxPatentsYear = Math.max(...displayYears.map(y => stats.patentsByYear?.[y] || 0), 1);
  const maxExpertsYear = Math.max(...displayYears.map(y => stats.expertsByYear?.[y] || 0), 1);
  const maxProjectsYear = Math.max(...displayYears.map(y => stats.projectsByYear?.[y] || 0), 1);
  const maxIdeasYear = Math.max(...displayYears.map(y => stats.ideasByYear?.[y] || 0), 1);
  const maxSupportOrgsYear = Math.max(...displayYears.map(y => stats.supportOrgsByYear?.[y] || 0), 1);
  const maxUniversitiesYear = Math.max(...displayYears.map(y => stats.universitiesByYear?.[y] || 0), 1);
  const maxWardsYear = Math.max(...displayYears.map(y => stats.wardsByYear?.[y] || 0), 1);

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Year Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>Trung tâm Điều hành Dữ liệu Tập trung</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Bảng điều khiển tổng hợp KHCN & KNĐMST
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xin chào, <span className="font-semibold text-slate-800">{currentUser?.fullName}</span> ({currentUser?.role}). Số liệu được tính toán theo thời gian thực từ cơ sở dữ liệu.
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
              <option value="all">Tất cả các năm</option>
              {availableYears.slice().reverse().map(yr => (
                <option key={yr} value={yr}>Năm {yr}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenTestRunner}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chạy Kiểm thử (18 Tiêu chí)</span>
          </button>
        </div>
      </div>

      <HomeOverviewDashboard stats={stats} systemConfig={systemConfig} showIntro={false} onNavigateBrowse={(category) => onNavigateModule(category || 'science_tasks')} />

      {/* Interactive Charts & Breakdowns Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 min-w-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Biểu đồ Phân tích & Thống kê Tăng trưởng</span>
            </h2>
            <p className="text-xs text-slate-500">
              Thống kê số lượng đề tài, sáng kiến và doanh nghiệp theo Lĩnh vực & theo Năm
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold max-w-full min-w-0 sm:flex-1">
            <button
              onClick={() => setChartTab('tasks')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'tasks' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đề tài KH&CN
            </button>
            <button
              onClick={() => setChartTab('initiatives')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'initiatives' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sáng kiến TP
            </button>
            <button
              onClick={() => setChartTab('startups')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'startups' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doanh nghiệp ĐMST
            </button>
            <button
              onClick={() => setChartTab('patents')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'patents' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sáng chế & SHTT
            </button>
            <button
              onClick={() => setChartTab('experts')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'experts' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chuyên gia & Nhà KH
            </button>
            <button
              onClick={() => setChartTab('projects')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'projects' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dự án KN
            </button>
            <button
              onClick={() => setChartTab('ideas')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'ideas' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ý tưởng KN
            </button>
            <button
              onClick={() => setChartTab('support_orgs')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'support_orgs' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổ chức hỗ trợ
            </button>
            <button
              onClick={() => setChartTab('universities')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'universities' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trường ĐH/CĐ
            </button>
            <button
              onClick={() => setChartTab('wards')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                chartTab === 'wards' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xã/Phường
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3 min-w-0">
          <div className="text-xs font-bold text-slate-700 shrink-0">Khoảng thời gian:</div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <select
              value={yearDisplayMode}
              onChange={(event) => setYearDisplayMode(event.target.value as 'recent' | 'single' | 'range')}
              className="min-h-9 max-w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Chế độ hiển thị năm của biểu đồ"
            >
              <option value="recent">5 năm gần nhất</option>
              <option value="single">Theo một năm</option>
              <option value="range">Từ năm đến năm</option>
            </select>
            {yearDisplayMode === 'single' && (
              <select
                value={chartSingleYear}
                onChange={(event) => setChartSingleYear(event.target.value)}
                className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                aria-label="Chọn năm thống kê"
              >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            )}
            {yearDisplayMode === 'range' && (
              <>
                <select
                  value={chartFromYear}
                  onChange={(event) => setChartFromYear(event.target.value)}
                  className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                  aria-label="Từ năm"
                >
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <span className="text-xs text-slate-500">đến</span>
                <select
                  value={chartToYear}
                  onChange={(event) => setChartToYear(event.target.value)}
                  className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                  aria-label="Đến năm"
                >
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-500 sm:ml-auto">
            {displayYears.length > 0 ? (displayYears.length === 1 ? displayYears[0] : displayYears[0] + ' – ' + displayYears[displayYears.length - 1]) : 'Chưa có năm phù hợp'}
          </span>
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
                  const numericCount = Number(count) || 0;
                  const totalTasks = Number(stats.totalScienceTasks) || 0;
                  const pct = totalTasks > 0 ? (numericCount / totalTasks) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="truncate max-w-[240px] font-medium">{f}</span>
                        <span className="font-mono font-semibold">{count} đề tài ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-700 rounded-full transition-all duration-500"
                          style={{ width: `${numericCount > 0 ? Math.max(pct, 4) : 0}%` }}
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
                <span>Thống kê số lượng Đề tài qua các năm:</span>
                <span className="text-[11px] text-blue-700 font-mono font-bold">Xu hướng tăng trưởng</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-4 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
                {displayYears.map(yr => {
                  const count = (stats.tasksByYear?.[yr] ?? (stats.tasksByYear as any)?.[Number(yr)]) || 0;
                  const heightPct = count > 0 ? Math.max(10, Math.round((count / maxTasksYear) * 100)) : 0;
                  return (
                    <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-blue-700">{count}</span>
                      <div 
                        className="w-full max-w-[36px] bg-blue-600 group-hover:bg-blue-700 rounded-t-md transition-all duration-300"
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
                          style={{ width: `${count > 0 ? Math.max(pct, 4) : 0}%` }}
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
                <span>Thống kê Sáng kiến được công nhận theo năm:</span>
                <span className="text-[11px] text-amber-800 font-mono font-bold">Hiệu quả lan tỏa</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-4 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
                {displayYears.map(yr => {
                  const count = (stats.initiativesByYear?.[yr] ?? (stats.initiativesByYear as any)?.[Number(yr)]) || 0;
                  const heightPct = count > 0 ? Math.max(10, Math.round((count / maxInitiativesYear) * 100)) : 0;
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
              <span>Thống kê số lượng Doanh nghiệp Khởi nghiệp ĐMST thành lập và ươm tạo theo năm:</span>
              <span className="text-[11px] text-purple-700 font-mono font-bold">Tổng: {stats.totalStartups}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = (stats.startupsByYear?.[yr] ?? (stats.startupsByYear as any)?.[Number(yr)]) || 0;
                const heightPct = count > 0 ? Math.max(10, Math.round((count / maxStartupsYear) * 100)) : 0;
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
              Số lượng doanh nghiệp khởi nghiệp đổi mới sáng tạo, dự án spin-off hình thành tại TP Đà Nẵng qua từng giai đoạn.
            </p>
          </div>
        )}

        {/* Tab 4: Sáng chế & Sở hữu trí tuệ Charts */}
        {chartTab === 'patents' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê số lượng Sáng chế và Văn bằng SHTT nộp đơn/cấp bằng theo năm:</span>
              <span className="text-[11px] text-indigo-700 font-mono font-bold">Tổng: {stats.totalPatents || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.patentsByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxPatentsYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-indigo-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-indigo-600 group-hover:bg-indigo-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Số lượng bằng sáng chế, giải pháp hữu ích và văn bằng sở hữu trí tuệ được bảo hộ hợp pháp.
            </p>
          </div>
        )}

        {/* Tab 5: Chuyên gia & Nhà khoa học Charts */}
        {chartTab === 'experts' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê phân bổ Chuyên gia & Nhà khoa học tham gia mạng lưới theo giai đoạn:</span>
              <span className="text-[11px] text-cyan-700 font-mono font-bold">Tổng: {stats.totalExperts || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.expertsByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxExpertsYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-cyan-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-cyan-600 group-hover:bg-cyan-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Số lượng nhà khoa học, chuyên gia công nghệ cao gia nhập hệ cơ sở dữ liệu chuyên gia Đà Nẵng.
            </p>
          </div>
        )}

        {/* Tab 6: Dự án khởi nghiệp Charts */}
        {chartTab === 'projects' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê số lượng Dự án khởi nghiệp ĐMST được tiếp nhận và ươm tạo theo năm:</span>
              <span className="text-[11px] text-emerald-700 font-mono font-bold">Tổng: {stats.totalProjects || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.projectsByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxProjectsYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-emerald-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-emerald-600 group-hover:bg-emerald-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Dự án khởi nghiệp đổi mới sáng tạo đăng ký qua các chương trình tăng tốc và ươm tạo của thành phố.
            </p>
          </div>
        )}

        {/* Tab 7: Ý tưởng khởi nghiệp Charts */}
        {chartTab === 'ideas' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê số lượng Ý tưởng khởi nghiệp sáng tạo đề xuất qua các năm:</span>
              <span className="text-[11px] text-amber-700 font-mono font-bold">Tổng: {stats.totalIdeas || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.ideasByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxIdeasYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-amber-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-amber-500 group-hover:bg-amber-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Ý tưởng khởi nghiệp mới từ sinh viên, cộng đồng sáng tạo và các cuộc thi ĐMST.
            </p>
          </div>
        )}

        {/* Tab 8: Tổ chức hỗ trợ Charts */}
        {chartTab === 'support_orgs' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê mạng lưới Tổ chức hỗ trợ, Vườn ươm & Trung tâm ĐMST:</span>
              <span className="text-[11px] text-rose-700 font-mono font-bold">Tổng: {stats.totalSupportOrgs || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.supportOrgsByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxSupportOrgsYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-rose-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-rose-600 group-hover:bg-rose-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Vườn ươm công lập và tư nhân, không gian làm việc chung (coworking) và tổ chức trung gian hỗ trợ khởi nghiệp.
            </p>
          </div>
        )}

        {/* Tab 9: Trường Đại học/Cao đẳng Charts */}
        {chartTab === 'universities' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê mạng lưới Cơ sở Giáo dục Đại học & Cao đẳng tham gia Cổng:</span>
              <span className="text-[11px] text-teal-700 font-mono font-bold">Tổng: {stats.totalUniversities || 0}</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.universitiesByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxUniversitiesYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-teal-700">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-teal-600 group-hover:bg-teal-700 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Các trường Đại học, Cao đẳng, Học viện thành viên thuộc mạng lưới đổi mới sáng tạo Đà Nẵng.
            </p>
          </div>
        )}

        {/* Tab 10: Xã/Phường Charts */}
        {chartTab === 'wards' && (
          <div className="space-y-3 pt-2">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Thống kê phân bổ dữ liệu địa bàn Phường / Xã / Đặc khu:</span>
              <span className="text-[11px] text-slate-700 font-mono font-bold">Tổng: {stats.totalWards || 0} đơn vị</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 sm:px-8 min-w-0 w-full overflow-hidden bg-slate-50 rounded-xl border border-slate-100">
              {displayYears.map(yr => {
                const count = stats.wardsByYear?.[yr] || 0;
                const heightPct = count > 0 ? Math.max(8, Math.round((count / maxWardsYear) * 100)) : 0;
                return (
                  <div key={yr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-800 group-hover:text-slate-900">{count}</span>
                    <div 
                      className="w-full max-w-[48px] bg-slate-700 group-hover:bg-slate-800 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 mt-1">{yr}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Dữ liệu đơn vị hành chính cấp xã, phường và đặc khu phục vụ phân bổ nguồn lực và quản lý địa bàn.
            </p>
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
            <div className="text-xs font-semibold text-slate-700 mb-2">Truy cập nhanh 13 phân hệ quản trị:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'science_tasks', label: '1. Nhiệm vụ KH&CN' },
                { key: 'initiatives', label: '2. Sáng kiến TP' },
                { key: 'experts', label: '3. Chuyên gia' },
                { key: 'organizations', label: '4. Tổ chức KH&CN' },
                { key: 'startups', label: '5. Doanh nghiệp ĐMST' },
                { key: 'startup_projects', label: '6. Dự án khởi nghiệp' },
                { key: 'startup_ideas', label: '7. Ý tưởng khởi nghiệp' },
                { key: 'investors', label: '8. Nhà đầu tư' },
                { key: 'investment_funds', label: '9. Quỹ đầu tư' },
                { key: 'support_organizations', label: '10. Vườn ươm / TT ĐMST' },
                { key: 'technologies', label: '11. Công nghệ & KQNC' },
                { key: 'programs', label: '12. Chương trình hỗ trợ' },
                { key: 'collaboration_needs', label: '13. Nhu cầu kết nối' }
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
              <span className="text-slate-600">Quan hệ liên kết thực thể (Graph):</span>
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
