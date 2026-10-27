import React from 'react';
import { AggregatedStats, SystemConfig } from '../types';
import { 
  FlaskConical, 
  Lightbulb, 
  Rocket, 
  Award, 
  TrendingUp, 
  Database, 
  Cpu, 
  Building, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles
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
  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2)} nghìn tỷ`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} tỷ`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu`;
    return `${Number(num).toLocaleString('vi-VN')} đ`;
  };

  const totalIntegratedRecords = stats ? (
    (stats.totalScienceTasks || 0) +
    (stats.totalInitiatives || 0) +
    (stats.totalExperts || 0) +
    (stats.totalOrganizations || 0) +
    (stats.totalStartups || 0) +
    (stats.totalProjects || 0) +
    (stats.totalIdeas || 0) +
    (stats.totalInvestors || 0) +
    (stats.totalFunds || 0) +
    (stats.totalSupportOrgs || 0) +
    (stats.totalTechnologies || 0) +
    (stats.totalPrograms || 0) +
    (stats.totalCollaborationNeeds || 0) +
    (stats.totalPatents || 0) +
    (stats.totalPublications || 0) +
    (stats.totalLabEquipments || 0) +
    (stats.totalPolicies || 0)
  ) : 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-teal-800 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 uppercase tracking-wider bg-teal-800/40 border border-teal-600/40 px-3 py-1 rounded-full mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Bảng Chỉ Số Tổng Quan & Bức Tranh Dữ Liệu Thời Gian Thực</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Tổng Quan Cơ Sở Dữ Liệu KH&CN, Đổi Mới Sáng Tạo và Khởi Nghiệp
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dữ liệu quản lý nhà nước tập trung từ Sở Khoa học & Công nghệ, Viện trường, Doanh nghiệp và Mạng lưới khởi nghiệp đổi mới sáng tạo
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

        {/* 4 Main Pillar Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pillar 1: Nghiên cứu & Đề tài KH&CN */}
          <div 
            onClick={() => onNavigateBrowse('science_tasks')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-800/80 text-teal-300 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Khám phá <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">Nhiệm Vụ & Đề Tài KH&CN</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalScienceTasks || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Đang triển khai:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.tasksRunning || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kinh phí NSNN duyệt:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatVND(stats?.totalBudgetApproved)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Sáng kiến Thành phố */}
          <div 
            onClick={() => onNavigateBrowse('initiatives')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-800/80 text-amber-300 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-amber-300 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Khám phá <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">Sáng Kiến Đổi Mới Cấp TP</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalInitiatives || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Đã công nhận cấp TP:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.initiativesRecognized || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Làm lợi cho thành phố:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatVND(stats?.totalCostSavings)}/năm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Hệ Sinh Thái Khởi Nghiệp ĐMST */}
          <div 
            onClick={() => onNavigateBrowse('startups')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-800/80 text-purple-300 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-purple-300 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Khám phá <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">Hệ Sinh Thái Khởi Nghiệp ĐMST</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {(stats?.totalStartups || 0) + (stats?.totalProjects || 0) + (stats?.totalIdeas || 0)}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Doanh nghiệp ĐMST:</span>
                  <span className="font-mono text-white font-semibold">{stats?.totalStartups || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vườn ươm & Quỹ đầu tư:</span>
                  <span className="font-mono text-white font-semibold">{(stats?.totalSupportOrgs || 0) + (stats?.totalFunds || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 4: Tài Sản Trí Tuệ & Hạ Tầng */}
          <div 
            onClick={() => onNavigateBrowse('patents')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-800/80 text-blue-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-blue-300 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Khám phá <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">Sở Hữu Trí Tuệ & Hạ Tầng</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {(stats?.totalPatents || 0) + (stats?.totalPublications || 0) + (stats?.totalLabEquipments || 0)}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Sáng chế & Bài báo:</span>
                  <span className="font-mono text-white font-semibold">{(stats?.totalPatents || 0) + (stats?.totalPublications || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phòng thí nghiệm trọng điểm:</span>
                  <span className="font-mono text-teal-300 font-semibold">{stats?.totalLabEquipments || 0} PTN</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
