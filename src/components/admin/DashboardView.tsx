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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Quản trị & điều hành dữ liệu</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Bảng điều khiển tổng hợp KHCN & KNĐMST</h1>
          <p className="text-xs text-slate-500 mt-1">Xin chào, <span className="font-semibold text-slate-800">{currentUser?.fullName || 'Quản trị viên'}</span>. Số liệu lấy trực tiếp từ cơ sở dữ liệu.</p>
        </div>
        <button onClick={onOpenTestRunner} className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Chạy kiểm thử (18 tiêu chí)</span>
        </button>
      </div>

      <HomeOverviewDashboard stats={stats} systemConfig={systemConfig} onNavigateBrowse={(category) => onNavigateModule(category || 'science_tasks')} />

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
