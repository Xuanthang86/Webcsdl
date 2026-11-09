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
  const [chartTab, setChartTab] = useState<'tasks' | 'initiatives' | 'startups' | 'patents' | 'experts' | 'projects' | 'ideas' | 'support_orgs' | 'investors' | 'investment_funds'>('tasks');

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
    yearBreakdown(stats.tasksByYear),
    stats.initiativesByYear,
    yearBreakdown(stats.startupsByYear),
    stats.patentsByYear,
    yearBreakdown(stats.expertsByYear),
    yearBreakdown(stats.projectsByYear),
    yearBreakdown(stats.ideasByYear),
    yearBreakdown(stats.supportOrgsByYear),
    yearBreakdown(stats.investorsByYear),
    stats.investmentFundsByYear
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
  const yearBreakdown = (source?: Record<string, number>): Record<string, number> => Object.fromEntries(
    displayYears
      .map(year => [year, Number(source?.[year] ?? (source as any)?.[Number(year)]) || 0] as [string, number])
      .filter(([, count]) => count > 0)
  );
  const maxInitiativesYear = Math.max(...displayYears.map(y => (stats.initiativesByYear?.[y] ?? (stats.initiativesByYear as any)?.[Number(y)]) || 0), 1);
  const maxPatentsYear = Math.max(...displayYears.map(y => stats.patentsByYear?.[y] || 0), 1);
  const ecosystemClassificationData = (stats as any).ecosystemClassifications || {};
  const ecosystemClassificationCards = [
    { key: 'science_tasks', label: 'Nhiệm vụ khoa học và công nghệ', total: stats.totalScienceTasks },
    { key: 'initiatives', label: 'Sáng kiến thành phố', total: stats.totalInitiatives },
    { key: 'experts', label: 'Chuyên gia', total: stats.totalExperts },
    { key: 'organizations', label: 'Tổ chức khoa học và công nghệ', total: stats.totalOrganizations },
    { key: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', total: stats.totalStartups },
    { key: 'support_organizations', label: 'Tổ chức trung gian', total: stats.totalSupportOrgs },
    { key: 'startup_projects', label: 'Dự án khởi nghiệp', total: stats.totalProjects },
    { key: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', total: stats.totalIdeas },
    { key: 'featured_startups', label: 'Doanh nghiệp khởi nghiệp tiêu biểu', total: stats.totalFeaturedStartups },
    { key: 'investors', label: 'Nhà đầu tư', total: stats.totalInvestors },
    { key: 'investment_funds', label: 'Quỹ đầu tư', total: stats.totalFunds },
    { key: 'patents', label: 'Sáng chế và sở hữu trí tuệ', total: stats.totalPatents },
    { key: 'technologies', label: 'Công nghệ và kết quả nghiên cứu', total: stats.totalTechnologies },
    { key: 'programs', label: 'Chương trình hỗ trợ', total: stats.totalPrograms },
    { key: 'collaboration_needs', label: 'Nhu cầu kết nối', total: stats.totalCollaborationNeeds },
    { key: 'publications', label: 'Bài báo và công bố khoa học', total: stats.totalPublications },
    { key: 'lab_equipments', label: 'Phòng thí nghiệm và thiết bị', total: stats.totalLabEquipments },
    { key: 'policies', label: 'Chính sách và văn bản', total: stats.totalPolicies }
  ];

  const renderBreakdown = (title: string, source?: Record<string, number>, colorClass = 'bg-teal-600') => {
    const sortedEntries = Object.entries(source || {})
      .map(([name, count]) => [name, Number(count) || 0] as [string, number])
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    const visibleEntries = sortedEntries.slice(0, 9);
    const remainingCount = sortedEntries.slice(9).reduce((sum, [, count]) => sum + count, 0);
    if (remainingCount > 0) visibleEntries.push(['Khác', remainingCount]);
    const total = visibleEntries.reduce((sum, [, count]) => sum + count, 0);
    const palette = ['#0f766e', '#2563eb', '#7c3aed', '#d97706', '#0891b2', '#be123c', '#4d7c0f', '#9333ea', '#0369a1', '#64748b'];
    let cursor = 0;
    const gradientStops = visibleEntries.map(([, count], index) => {
      const start = cursor;
      cursor += total > 0 ? (count / total) * 100 : 0;
      return palette[index % palette.length] + ' ' + start + '% ' + cursor + '%';
    });
    const pieBackground = visibleEntries.length ? 'conic-gradient(' + gradientStops.join(', ') + ')' : '#e2e8f0';
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={'h-1 w-5 shrink-0 rounded ' + colorClass} aria-hidden="true" />
          <h3 className="text-xs font-bold text-slate-800 flex-1">{title}</h3>
          <span className="text-[10px] font-mono text-slate-500">Tổng: {total.toLocaleString('vi-VN')}</span>
        </div>
        {visibleEntries.length ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div role="img" aria-label={'Biểu đồ tròn ' + title} className="w-36 h-36 sm:w-40 sm:h-40 shrink-0 rounded-full border border-white shadow-sm" style={{ background: pieBackground }} />
            <div className="w-full min-w-0 space-y-1.5">
              {visibleEntries.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 shrink-0 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="truncate" title={name}>{name}</span>
                  </span>
                  <span className="shrink-0 font-mono font-semibold text-slate-800">{count.toLocaleString('vi-VN')} ({total > 0 ? (count / total * 100).toFixed(1) : '0.0'}%)</span>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-[11px] text-slate-500">Chưa có dữ liệu phân loại.</p>}
      </div>
    );
  };

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

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Phân loại dữ liệu Hệ sinh thái</h2>
          <p className="text-xs text-slate-500 mt-1">Thống kê theo trường phân loại thực tế của từng phân hệ; chỉ tính hồ sơ đã phê duyệt và công khai.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ecosystemClassificationCards.filter(card => card.total > 0).map(card => {
            const groups = Object.entries(ecosystemClassificationData[card.key] || {})
              .map(([label, count]) => [label, Number(count) || 0] as [string, number])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);
            return (
              <div key={card.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-800">{card.label}</h3>
                  <span className="text-xs font-mono font-bold text-teal-800">{card.total}</span>
                </div>
                {groups.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {groups.map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="min-w-0 truncate text-slate-600" title={label}>{label}</span>
                        <span className="shrink-0 font-mono font-semibold text-slate-800">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">Chưa có trường phân loại được ghi nhận.</p>
                )}
              </div>
            );
          })}
        </div>
        {ecosystemClassificationCards.every(card => !card.total) && (
          <p className="text-xs text-slate-500">Chưa có hồ sơ hệ sinh thái đã được phê duyệt và công khai để thống kê.</p>
        )}
      </div>

      {/* Interactive Charts & Breakdowns Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 min-w-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Biểu đồ Phân tích & Thống kê Tăng trưởng</span>
            </h2>
            <p className="text-xs text-slate-500">
              Phân tích theo năm, lĩnh vực, đơn vị, cấp quản lý, trường học/xã phường, chuyên gia, tổ chức trung gian và nhà đầu tư
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 w-full min-w-0">
            {[
              { key: 'tasks', label: 'Đề tài KH&CN' },
              { key: 'initiatives', label: 'Sáng kiến' },
              { key: 'startups', label: 'Doanh nghiệp ĐMST' },
              { key: 'patents', label: 'Sở hữu trí tuệ' },
              { key: 'experts', label: 'Chuyên gia' },
              { key: 'projects', label: 'Dự án khởi nghiệp' },
              { key: 'ideas', label: 'Ý tưởng khởi nghiệp' },
              { key: 'support_orgs', label: 'Tổ chức trung gian' },
              { key: 'investors', label: 'Nhà đầu tư' },
              { key: 'investment_funds', label: 'Quỹ đầu tư' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setChartTab(tab.key as typeof chartTab)}
                className={`min-w-0 min-h-9 px-2.5 py-2 rounded-lg text-[11px] font-semibold leading-tight text-center whitespace-normal break-words transition-colors cursor-pointer ${chartTab === tab.key ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-100' : 'bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900'}`}
              >
                {tab.label}
              </button>
            ))}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
            {renderBreakdown('Đề tài theo năm', stats.tasksByYear, 'bg-blue-600')}
            {renderBreakdown('Đề tài theo lĩnh vực chuyên ngành', stats.tasksByField || stats.fieldBreakdown, 'bg-teal-600')}
            {renderBreakdown('Đề tài theo đơn vị chủ trì', stats.tasksByUnit, 'bg-blue-600')}
            {renderBreakdown('Đề tài theo cấp quản lý', stats.tasksByLevel, 'bg-indigo-600')}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
            <div className="lg:col-span-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Doanh nghiệp khởi nghiệp sáng tạo</span><span className="font-mono text-purple-700">Tổng: {stats.totalStartups || 0}</span></div>
            {renderBreakdown('Doanh nghiệp khởi nghiệp sáng tạo theo năm', stats.startupsByYear, 'bg-purple-600')}
            {renderBreakdown('Doanh nghiệp khởi nghiệp sáng tạo theo lĩnh vực', stats.startupsByField, 'bg-violet-600')}
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
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Phân bổ chuyên gia và nhà khoa học theo các tiêu chí</span><span className="font-mono text-cyan-700">Tổng: {stats.totalExperts || 0}</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {renderBreakdown('Chuyên gia theo năm', stats.expertsByYear, 'bg-cyan-600')}
              {renderBreakdown('Chuyên gia theo lĩnh vực', stats.expertsByField, 'bg-cyan-600')}
              {renderBreakdown('Chuyên gia theo chuyên ngành', stats.expertsBySpecialty, 'bg-sky-600')}
              {renderBreakdown('Chuyên gia theo học hàm', stats.expertsByAcademicTitle, 'bg-violet-600')}
              {renderBreakdown('Chuyên gia theo học vị', stats.expertsByDegree, 'bg-indigo-600')}
              {renderBreakdown('Chuyên gia theo đơn vị công tác', stats.expertsByWorkplace, 'bg-teal-600')}
            </div>
          </div>
        )}

        {/* Tab 6: Dự án khởi nghiệp Charts */}
        {chartTab === 'projects' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Dự án khởi nghiệp theo các tiêu chí</span><span className="font-mono text-emerald-700">Tổng: {stats.totalProjects || 0}</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {renderBreakdown('Dự án khởi nghiệp theo năm', stats.projectsByYear, 'bg-emerald-600')}
              {renderBreakdown('Dự án khởi nghiệp theo lĩnh vực', stats.projectsByField, 'bg-emerald-600')}
              {renderBreakdown('Dự án khởi nghiệp theo trường học', stats.projectsBySchool, 'bg-teal-600')}
              {renderBreakdown('Dự án khởi nghiệp theo xã/phường', stats.projectsByWard, 'bg-cyan-600')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><div className="font-semibold text-violet-800">Thuộc trường học</div><div className="mt-1 text-lg font-bold font-mono text-violet-900">{stats.projectsByOrigin?.school || 0}</div></div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3"><div className="font-semibold text-sky-800">Thuộc xã/phường</div><div className="mt-1 text-lg font-bold font-mono text-sky-900">{stats.projectsByOrigin?.ward || 0}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="font-semibold text-slate-700">Chưa xác định</div><div className="mt-1 text-lg font-bold font-mono text-slate-900">{stats.projectsByOrigin?.other || 0}</div></div>
            </div>
          </div>
        )}

        {/* Tab 7: Ý tưởng khởi nghiệp Charts */}
        {chartTab === 'ideas' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Ý tưởng khởi nghiệp theo các tiêu chí</span><span className="font-mono text-amber-700">Tổng: {stats.totalIdeas || 0}</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {renderBreakdown('Ý tưởng khởi nghiệp theo năm', stats.ideasByYear, 'bg-amber-500')}
              {renderBreakdown('Ý tưởng khởi nghiệp theo lĩnh vực', stats.ideasByField, 'bg-amber-500')}
              {renderBreakdown('Ý tưởng khởi nghiệp theo trường học', stats.ideasBySchool, 'bg-violet-600')}
              {renderBreakdown('Ý tưởng khởi nghiệp theo xã/phường', stats.ideasByWard, 'bg-sky-600')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><div className="font-semibold text-violet-800">Thuộc trường học</div><div className="mt-1 text-lg font-bold font-mono text-violet-900">{(stats as any).ideasByOrigin?.school || 0}</div></div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3"><div className="font-semibold text-sky-800">Thuộc xã/phường</div><div className="mt-1 text-lg font-bold font-mono text-sky-900">{(stats as any).ideasByOrigin?.ward || 0}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="font-semibold text-slate-700">Chưa xác định</div><div className="mt-1 text-lg font-bold font-mono text-slate-900">{(stats as any).ideasByOrigin?.other || 0}</div></div>
            </div>
          </div>
        )}

        {/* Tab 8: Tổ chức hỗ trợ Charts */}
        {chartTab === 'support_orgs' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Tổ chức trung gian theo các tiêu chí</span><span className="font-mono text-rose-700">Tổng: {stats.totalSupportOrgs || 0}</span></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {renderBreakdown('Tổ chức trung gian theo năm', stats.supportOrgsByYear, 'bg-rose-600')}
              {renderBreakdown('Tổ chức trung gian theo lĩnh vực / loại hình', stats.supportOrgsByField, 'bg-rose-600')}
            </div>
          </div>
        )}

        {/* Tab 9: Nhà đầu tư */}
        {chartTab === 'investors' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Nhà đầu tư theo năm</span><span className="font-mono text-teal-800">Tổng: {stats.totalInvestors || 0}</span></div>
            {renderBreakdown('Cơ cấu nhà đầu tư theo năm', stats.investorsByYear, 'bg-teal-600')}
          </div>
        )}

        {/* Tab 10: Quỹ đầu tư */}
        {chartTab === 'investment_funds' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800"><span>Quỹ đầu tư theo năm</span><span className="font-mono text-indigo-800">Tổng: {stats.totalFunds || 0}</span></div>
            {renderBreakdown('Cơ cấu quỹ đầu tư theo năm', yearBreakdown(stats.investmentFundsByYear), 'bg-indigo-600')}
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
