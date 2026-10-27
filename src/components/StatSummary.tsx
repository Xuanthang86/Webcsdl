import React from 'react';
import { AggregatedStats } from '../types';
import { 
  FlaskConical, 
  Lightbulb, 
  Users, 
  Building2, 
  Rocket, 
  PiggyBank, 
  Cpu, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

interface StatSummaryProps {
  stats: AggregatedStats | null;
  onSelectCategory: (mod: string) => void;
}

export const StatSummary: React.FC<StatSummaryProps> = ({ stats, onSelectCategory }) => {
  if (!stats) return null;

  // Format VND currency into billions / millions concisely
  const formatVND = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} tỷ`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} triệu`;
    }
    return `${amount.toLocaleString()} đ`;
  };

  const statCards = [
    {
      label: 'Nhiệm vụ, đề tài KH&CN',
      count: stats.totalScienceTasks,
      subtext: `${stats.tasksAccepted} đã nghiệm thu · ${stats.tasksRunning} đang thực hiện`,
      moduleKey: 'science_tasks',
      icon: FlaskConical,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Sáng kiến cấp thành phố',
      count: stats.totalInitiatives,
      subtext: `${stats.initiativesRecognized} đã công nhận chính thức`,
      moduleKey: 'initiatives',
      icon: Lightbulb,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Chuyên gia & Nhà khoa học',
      count: stats.totalExperts,
      subtext: `${stats.verifiedExperts} hồ sơ đã xác thực`,
      moduleKey: 'experts',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Doanh nghiệp khởi nghiệp',
      count: stats.totalStartups,
      subtext: `${stats.totalProjects} dự án & ${stats.totalIdeas} ý tưởng`,
      moduleKey: 'startups',
      icon: Rocket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Công nghệ & Kết quả NC',
      count: stats.totalTechnologies,
      subtext: 'Sẵn sàng chuyển giao cho doanh nghiệp',
      moduleKey: 'technologies',
      icon: Cpu,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      label: 'Liên kết dữ liệu đa chiều',
      count: stats.totalRelationships,
      subtext: 'Mối quan hệ 2 chiều giữa các thực thể',
      moduleKey: 'all',
      icon: Layers,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
      {/* 6-Card KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectCategory(item.moduleKey)}
              className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-slate-500 line-clamp-1 group-hover:text-teal-800 transition-colors">
                  {item.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                  {item.count.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {item.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verified Economic & Social Impact Strip */}
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800">Hiệu quả kinh tế - xã hội tổng hợp có căn cứ từ dữ liệu thực:</span>
        </div>
        <div className="flex items-center gap-6 font-mono tabular-nums">
          <div>
            <span className="text-slate-400 mr-1.5 font-sans">Ước tính chi phí tiết kiệm:</span>
            <span className="font-bold text-emerald-700 text-sm">{formatVND(stats.totalCostSavings)}</span>
          </div>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <div>
            <span className="text-slate-400 mr-1.5 font-sans">Tổng kinh phí đề tài đã duyệt:</span>
            <span className="font-bold text-teal-800 text-sm">{formatVND(stats.totalBudgetApproved)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
