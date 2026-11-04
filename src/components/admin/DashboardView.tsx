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
  Sparkles
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
  const [chartTab, setChartTab] = useState<'tasks' | 'initiatives' | 'startups'>('tasks');

  if (!stats) return null;

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

  const years = ['2021', '2022', '2023', '2024', '2025', '2026'];
  const maxTasksYear = Math.max(...years.map(y => stats.tasksByYear?.[y] || 0), 1);
  const maxInitiativesYear = Math.max(...years.map(y => stats.initiativesByYear?.[y] || 0), 1);
  const maxStartupsYear = Math.max(...years.map(y => stats.startupsByYear?.[y] || 0), 1);

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
            <span>Chạy Kiểm thử (18 Tiêu chí)</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Cards covering all standard categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Nhiệm vụ KH&CN */}
        <div 
          onClick={() => onNavigateModule('science_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">1. Nhiệm vụ KH&CN</span>
            <FlaskConical className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {displayTasksCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Kinh phí: {formatVND(displayBudget)}</span>
            <span className="text-blue-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 2: Sáng kiến Thành phố */}
        <div 
          onClick={() => onNavigateModule('initiatives')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">2. Sáng kiến Thành phố</span>
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {displayInitiativesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Làm lợi: {formatVND(displaySavings)}</span>
            <span className="text-amber-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 3: Doanh nghiệp ĐMST */}
        <div 
          onClick={() => onNavigateModule('startups')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">3. Doanh nghiệp ĐMST</span>
            <Rocket className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {displayStartupsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Dự án & Ý tưởng: {(stats.totalProjects || 0) + (stats.totalIdeas || 0)}</span>
            <span className="text-purple-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 4: Sáng chế & Sở hữu trí tuệ */}
        <div 
          onClick={() => onNavigateModule('patents')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">4. Sáng chế & SHTT</span>
            <Award className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalPatents || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Bằng độc quyền & Đơn</span>
            <span className="text-rose-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 5: Chuyên gia & Nhà khoa học */}
        <div 
          onClick={() => onNavigateModule('experts')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">5. Chuyên gia & Nhà KH</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalExperts || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Đã xác minh: {stats.verifiedExperts || 0}</span>
            <span className="text-teal-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 6: Quỹ & Nhà đầu tư */}
        <div 
          onClick={() => onNavigateModule('investment_funds')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">6. Quỹ & Nhà đầu tư</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {(stats.totalFunds || 0) + (stats.totalInvestors || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Vườn ươm: {stats.totalSupportOrgs || 0}</span>
            <span className="text-indigo-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 7: Bài báo & Công bố khoa học */}
        <div 
          onClick={() => onNavigateModule('publications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">7. Bài báo & Công bố KH</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalPublications || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Scopus, WoS, Tạp chí</span>
            <span className="text-sky-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        {/* Card 8: Nhu cầu kết nối & Đặt hàng */}
        <div 
          onClick={() => onNavigateModule('collaboration_needs')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">8. Nhu cầu kết nối & Đặt hàng</span>
            <Link2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalCollaborationNeeds || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Công nghệ chuyển giao: {stats.totalTechnologies || 0}</span>
            <span className="text-emerald-600 font-medium">Chi tiết →</span>
          </div>
        </div>

      </div>

      {/* Interactive Charts & Breakdowns Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Biểu đồ Phân tích & Thống kê Tăng trưởng</span>
            </h2>
            <p className="text-xs text-slate-500">
              Thống kê số lượng đề tài, sáng kiến và doanh nghiệp theo Lĩnh vực & theo Năm
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
              Số lượng doanh nghiệp khởi nghiệp đổi mới sáng tạo, dự án spin-off hình thành tại TP Đà Nẵng qua từng giai đoạn.
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
