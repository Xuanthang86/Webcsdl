import React from 'react';
import { AggregatedStats, User } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Building2, 
  Users, 
  Lightbulb, 
  FlaskConical, 
  Rocket, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
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
  if (!stats) return null;

  const formatVND = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ VND`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu VND`;
    return `${amount.toLocaleString()} VND`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Trung tâm Điều hành Dữ liệu Tập trung
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Bảng Điều Khiển Tổng Hợp KH&CN & Hệ Sinh Thái Khởi Nghiệp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xin chào, <span className="font-semibold text-slate-800">{currentUser?.fullName}</span> ({currentUser?.role}). Toàn bộ số liệu hiển thị được tính toán trực tiếp từ cơ sở dữ liệu thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTestRunner}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Chạy Kiểm thử Nghiệm thu (16 Tiêu chí)
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => onNavigateModule('science_tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Nhiệm vụ KH&CN</span>
            <FlaskConical className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalScienceTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Đã nghiệm thu: {stats.tasksAccepted}</span>
            <span className="text-blue-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateModule('initiatives')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Sáng kiến Thành phố</span>
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalInitiatives}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Công nhận cấp TP: {stats.initiativesRecognized}</span>
            <span className="text-amber-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateModule('startups')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Doanh nghiệp ĐMST</span>
            <Rocket className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalStartups}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Dự án: {stats.totalProjects} · Ý tưởng: {stats.totalIdeas}</span>
            <span className="text-purple-600 font-medium">Chi tiết →</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateModule('initiatives')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Chi phí tiết kiệm đo lường</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatVND(stats.totalCostSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Kinh phí đề tài: {formatVND(stats.totalBudgetApproved)}
          </div>
        </div>

      </div>

      {/* Grid: Approval Queue & Field Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals & Workflow Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hàng Đợi Kiểm Duyệt & Trạng Thái Thẩm Định
              </h2>
              <p className="text-xs text-slate-500">
                Phân bổ hồ sơ theo các giai đoạn trong vòng đời nghiệp vụ
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
              {stats.pendingApprovalsCount} hồ sơ chờ xử lý
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-emerald-800 font-medium block">Đã phê duyệt chính thức</span>
              <span className="text-xl font-bold text-emerald-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.approved || 0}
              </span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-800 font-medium block">Đang thẩm định / kiểm tra</span>
              <span className="text-xl font-bold text-amber-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.under_review || 0}
              </span>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-orange-800 font-medium block">Yêu cầu bổ sung hồ sơ</span>
              <span className="text-xl font-bold text-orange-950 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.needs_revision || 0}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-600 font-medium block">Bản nháp cơ sở</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1 block">
                {stats.statusBreakdown?.draft || 0}
              </span>
            </div>
          </div>

          {/* Quick Module Navigation Matrix */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">Truy cập nhanh 13 phân hệ quản lý:</div>
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
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 hover:text-teal-900 rounded-lg border border-slate-200 transition-colors flex items-center justify-between text-slate-700"
                >
                  <span className="truncate">{m.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Sector / Field Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Phân Bổ Theo Lĩnh Vực
            </h2>
            <p className="text-xs text-slate-500">
              Thống kê hồ sơ tổng hợp trên toàn hệ thống
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(stats.fieldBreakdown || {}).map(([fieldName, count], idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium truncate max-w-[200px]">{fieldName}</span>
                  <span className="font-mono font-bold">{count} hồ sơ</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${Math.min(100, (count / (stats.totalScienceTasks + stats.totalInitiatives || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            * Dữ liệu thống kê được tổng hợp từ các bảng quan hệ thực thể theo nguyên tắc đối soát chuẩn hóa, không đếm trùng lặp.
          </div>
        </div>

      </div>

    </div>
  );
};
