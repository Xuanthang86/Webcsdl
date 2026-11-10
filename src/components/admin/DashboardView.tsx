import React, { useState } from 'react';
import { AggregatedStats, User, SystemConfig } from '../../types';
import { HomeOverviewDashboard } from '../HomeOverviewDashboard';
import { GrowthAnalytics } from '../GrowthAnalytics';
import {
  CheckCircle2,
  Filter,
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
    stats.featuredStartupsByYear,
    stats.supportOrgsByYear,
    stats.investorsByYear,
    stats.investmentFundsByYear
  ];
  const availableYears = Array.from(new Set([
    ...defaultYears,
    ...yearMaps.flatMap(yearMap => Object.keys(yearMap || {}))
  ])).filter(year => /^\\d{4}$/.test(year)).sort();

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

      <GrowthAnalytics stats={stats} />

      {/* Grid: Approval Queue & Module Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Approvals & Workflow Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hàng đợi kiểm duyệt & trạng thái thẩm định
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

        </div>

        {/* System Summary Information Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tổng thể năng lực KHCN & KHĐMST
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
