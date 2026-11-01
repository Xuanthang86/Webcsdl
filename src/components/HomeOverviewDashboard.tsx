import React from 'react';
import { AggregatedStats, SystemConfig } from '../types';
import { 
  FlaskConical, 
  Lightbulb, 
  Award, 
  Users, 
  Rocket, 
  Database, 
  ArrowRight,
  Sparkles,
  Building,
  BookOpen,
  Link2,
  ChevronRight,
  Building2
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
  // Format Vietnamese currency with dots: 1.850.000.000 đ
  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đ`;
    }
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đ`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)} triệu đ`;
    }
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
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
    (stats.totalPolicies || 0)
  ) : 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-7 pb-9 px-4 sm:px-6 lg:px-8 border-b border-teal-800 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Row of Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 uppercase tracking-wider bg-teal-800/40 border border-teal-600/40 px-3 py-1 rounded-full mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Bảng Chỉ Số Tổng Quan & Bức Tranh Dữ Liệu Thời Gian Thực</span>
            </div>
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
            1. Nhiệm vụ, Đề tài KH&CN
            2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
            3. Sáng chế & Sở hữu trí tuệ
            4. Chuyên gia & Nhà khoa học
            5. Dữ liệu Hệ sinh thái
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
                <div className="text-xs text-slate-300 font-medium">1. Nhiệm vụ, Đề tài KH&CN</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalScienceTasks || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Đang thực hiện:</span>
                  <span className="font-mono text-amber-300 font-semibold">{stats?.tasksRunning || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kinh phí NSNN:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatVND(stats?.totalBudgetApproved)}</span>
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
                <div className="text-xs text-slate-300 font-medium line-clamp-1" title="2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố">
                  2. Sáng kiến TP
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalInitiatives || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
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
                <div className="w-8 h-8 rounded-lg bg-rose-800/80 text-rose-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-rose-300 font-semibold border border-rose-400/50 hover:border-rose-300 bg-rose-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-rose-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">3. Sáng chế & SHTT</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalPatents || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
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
          <div 
            onClick={() => onNavigateBrowse('experts')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-800/80 text-blue-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-blue-300 font-semibold border border-blue-400/50 hover:border-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-blue-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">4. Chuyên gia & Nhà KH</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats?.totalExperts || 0}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Đã xác minh:</span>
                  <span className="font-mono text-white font-semibold">{stats?.verifiedExperts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hội đồng thẩm định:</span>
                  <span className="font-mono text-teal-300 font-semibold">100% CSDL chuẩn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 5: Dữ liệu Hệ sinh thái */}
          <div 
            onClick={() => onNavigateBrowse('startups')}
            className="bg-white/5 hover:bg-white/10 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-800/80 text-purple-300 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-purple-300 font-semibold border border-purple-400/50 hover:border-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 group-hover:bg-purple-800/60">
                  Xem <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-300 font-medium">5. Dữ liệu Hệ sinh thái</div>
                <div className="text-2xl font-bold font-mono text-white mt-0.5">
                  {(stats?.totalStartups || 0) + (stats?.totalProjects || 0) + (stats?.totalIdeas || 0)}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Doanh nghiệp & Dự án:</span>
                  <span className="font-mono text-white font-semibold">{(stats?.totalStartups || 0) + (stats?.totalProjects || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quỹ & Vườn ươm:</span>
                  <span className="font-mono text-white font-semibold">{(stats?.totalFunds || 0) + (stats?.totalSupportOrgs || 0)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Các Phân Hệ Bổ Trợ Row:
            • Tổ chức KH&CN, Viện trường
            • Bài báo & Công bố khoa học
            • Công nghệ & Kết quả nghiên cứu
            • Tra cứu nhu cầu kết nối & đặt hàng
        */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2 text-xs font-semibold text-teal-300 uppercase tracking-wider">
            <span>Các Phân Hệ Bổ Trợ & Kết Nối Chuyển Giao</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateBrowse('organizations')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-teal-800/40 hover:border-teal-500 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-teal-300">Tổ chức KH&CN, Viện trường</div>
                  <div className="text-[10px] text-slate-400 font-mono">{stats?.totalOrganizations || 0} viện, trường, trung tâm</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 shrink-0" />
            </button>

            <button
              onClick={() => onNavigateBrowse('publications')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-teal-800/40 hover:border-teal-500 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300">Bài báo & Công bố khoa học</div>
                  <div className="text-[10px] text-slate-400 font-mono">{stats?.totalPublications || 0} bài báo Scopus, WoS</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300 shrink-0" />
            </button>

            <button
              onClick={() => onNavigateBrowse('technologies')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-teal-800/40 hover:border-teal-500 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300">Công nghệ & Kết quả NC</div>
                  <div className="text-[10px] text-slate-400 font-mono">{stats?.totalTechnologies || 0} công nghệ sẵn sàng CG</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
            </button>

            <button
              onClick={() => onNavigateBrowse('collaboration_needs')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-teal-800/40 hover:border-teal-500 rounded-xl text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-300">Tra cứu nhu cầu kết nối & đặt hàng</div>
                  <div className="text-[10px] text-slate-400 font-mono">{stats?.totalCollaborationNeeds || 0} nhu cầu hợp tác</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 shrink-0" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
