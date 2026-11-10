import React, { useMemo, useState } from 'react';
import { AggregatedStats } from '../types';

type ChartKey =
  | 'tasks'
  | 'initiatives'
  | 'startups'
  | 'patents'
  | 'experts'
  | 'projects'
  | 'ideas'
  | 'featured_startups'
  | 'support_orgs'
  | 'investors'
  | 'investment_funds';

interface GrowthAnalyticsProps {
  stats: AggregatedStats | null;
}

interface BreakdownProps {
  title: string;
  source?: Record<string, number>;
  accent: string;
}

const PALETTE = ['#0f766e', '#2563eb', '#7c3aed', '#d97706', '#0891b2', '#be123c', '#4d7c0f', '#9333ea', '#0369a1', '#64748b'];

const toEntries = (source?: Record<string, number>) =>
  Object.entries(source || {})
    .map(([name, value]) => ({ name, count: Number(value) || 0 }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

const formatCount = (value: number) => value.toLocaleString('vi-VN');

const PieBreakdown: React.FC<BreakdownProps> = ({ title, source, accent }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const entries = useMemo(() => {
    const sorted = toEntries(source);
    const visible = sorted.slice(0, 9);
    const otherCount = sorted.slice(9).reduce((sum, item) => sum + item.count, 0);
    if (otherCount > 0) visible.push({ name: 'Khác', count: otherCount });
    return visible;
  }, [source]);
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;
  const segments = entries.map((entry, index) => {
    const length = total > 0 ? (entry.count / total) * circumference : 0;
    const segment = { ...entry, index, length, offset: cursor };
    cursor += length;
    return segment;
  });
  const active = activeIndex === null ? null : segments[activeIndex];

  return (
    <section data-accent={accent} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="border-l-4 border-teal-600 pl-2 text-base lg:text-lg font-extrabold text-slate-900">{title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-sm lg:text-base font-bold text-slate-700">Tổng {formatCount(total)}</span>
      </div>
      {segments.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
          <div className="mx-auto w-[150px]">
            <svg viewBox="0 0 120 120" role="img" aria-label={'Biểu đồ tròn ' + title} className="w-full overflow-visible">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="22" />
              {segments.map(segment => (
                <circle
                  key={segment.name}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={PALETTE[segment.index % PALETTE.length]}
                  strokeWidth={activeIndex === segment.index ? 30 : 22}
                  strokeDasharray={segment.length + ' ' + (circumference - segment.length)}
                  strokeDashoffset={-segment.offset}
                  transform="rotate(-90 60 60)"
                  className="cursor-pointer transition-all duration-150"
                  tabIndex={0}
                  role="button"
                  aria-label={segment.name + ': ' + formatCount(segment.count) + ' (' + (segment.count / total * 100).toFixed(1) + '%)'}
                  onMouseEnter={() => setActiveIndex(segment.index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(segment.index)}
                  onBlur={() => setActiveIndex(null)}
                />
              ))}
              <text x="60" y="56" textAnchor="middle" className="fill-slate-900 text-[13px] font-extrabold">
                {formatCount(active ? active.count : total)}
              </text>
              <text x="60" y="70" textAnchor="middle" className="fill-slate-500 text-[7px] font-semibold">
                {active ? (active.count / total * 100).toFixed(1) + '%' : 'BẢN GHI'}
              </text>
            </svg>
          </div>
          <div className="min-w-0 space-y-1.5">
            {segments.map(segment => {
              const isActive = activeIndex === segment.index;
              const percentage = total > 0 ? (segment.count / total * 100) : 0;
              return (
                <button
                  key={segment.name}
                  type="button"
                  onMouseEnter={() => setActiveIndex(segment.index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(segment.index)}
                  onBlur={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(isActive ? null : segment.index)}
                  className={'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm transition-all ' + (isActive ? 'bg-slate-100 font-extrabold text-slate-950 shadow-sm' : 'text-sm lg:text-base text-slate-700 hover:bg-slate-50')}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: PALETTE[segment.index % PALETTE.length] }} />
                    <span className="truncate" title={segment.name}>{segment.name}</span>
                  </span>
                  <span className="shrink-0 font-mono font-bold">{formatCount(segment.count)} ({percentage.toFixed(1)}%)</span>
                </button>
              );
            })}
            <p className="min-h-5 pt-1 text-xs font-semibold text-teal-800" aria-live="polite">
              {active ? active.name + ': ' + formatCount(active.count) + ' hồ sơ (' + (active.count / total * 100).toFixed(1) + '%)' : 'Di chuyển chuột vào lát biểu đồ hoặc nhóm phân loại để xem chi tiết.'}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">Chưa có dữ liệu phân loại.</p>
      )}
    </section>
  );
};

const YearBarBreakdown: React.FC<BreakdownProps> = ({ title, source, accent }) => {
  const entries = useMemo(
    () => toEntries(source).sort((a, b) => Number(a.name) - Number(b.name)),
    [source]
  );
  const maxValue = Math.max(1, ...entries.map(item => item.count));

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="border-l-4 border-teal-600 pl-2 text-sm font-extrabold text-slate-900">{title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">Tổng {formatCount(entries.reduce((sum, item) => sum + item.count, 0))}</span>
      </div>
      {entries.length ? (
        <div className="flex h-48 min-w-0 items-end gap-3 overflow-x-auto rounded-lg bg-slate-50 px-3 pb-2 pt-4">
          {entries.map(item => {
            const height = item.count > 0 ? Math.max(8, (item.count / maxValue) * 100) : 0;
            return (
              <div key={item.name} className="group flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-1.5" title={item.name + ': ' + formatCount(item.count)}>
                <span className="text-sm font-extrabold text-slate-900 group-hover:text-teal-800">{formatCount(item.count)}</span>
                <div className={'w-full max-w-12 rounded-t-md transition-all duration-150 group-hover:brightness-110 ' + accent} style={{ height: height + '%' }} />
                <span className="text-sm font-extrabold text-slate-700">{item.name}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">Chưa có dữ liệu theo năm.</p>
      )}
    </section>
  );
};

const SectionHeading: React.FC<{ title: string; total: number }> = ({ title, total }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
    <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
    <span className="text-sm font-extrabold text-slate-700">Tổng: {formatCount(total)}</span>
  </div>
);

export const GrowthAnalytics: React.FC<GrowthAnalyticsProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<ChartKey>('tasks');
  const safeStats = stats || ({} as AggregatedStats);
  const tabs: Array<{ key: ChartKey; label: string; total: number; tint: string; active: string }> = [
    { key: 'tasks', label: 'Đề tài/Nhiệm vụ KH&CN', total: safeStats.totalScienceTasks || 0, tint: 'border-blue-200 bg-blue-50 text-blue-900', active: 'border-blue-700 bg-blue-700 text-white' },
    { key: 'initiatives', label: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố', total: safeStats.totalInitiatives || 0, tint: 'border-amber-200 bg-amber-50 text-amber-900', active: 'border-amber-700 bg-amber-600 text-white' },
    { key: 'startups', label: 'Doanh nghiệp KNST', total: safeStats.totalStartups || 0, tint: 'border-purple-200 bg-purple-50 text-purple-900', active: 'border-purple-700 bg-purple-700 text-white' },
    { key: 'patents', label: 'Sở hữu trí tuệ', total: safeStats.totalPatents || 0, tint: 'border-indigo-200 bg-indigo-50 text-indigo-900', active: 'border-indigo-700 bg-indigo-700 text-white' },
    { key: 'experts', label: 'Chuyên gia', total: safeStats.totalExperts || 0, tint: 'border-cyan-200 bg-cyan-50 text-cyan-900', active: 'border-cyan-700 bg-cyan-700 text-white' },
    { key: 'projects', label: 'Dự án khởi nghiệp', total: safeStats.totalProjects || 0, tint: 'border-emerald-200 bg-emerald-50 text-emerald-900', active: 'border-emerald-700 bg-emerald-700 text-white' },
    { key: 'ideas', label: 'Ý tưởng khởi nghiệp', total: safeStats.totalIdeas || 0, tint: 'border-orange-200 bg-orange-50 text-orange-900', active: 'border-orange-700 bg-orange-600 text-white' },
    { key: 'featured_startups', label: 'Doanh nghiệp khởi nghiệp tiêu biểu', total: safeStats.totalFeaturedStartups || 0, tint: 'border-pink-200 bg-pink-50 text-pink-900', active: 'border-pink-700 bg-pink-700 text-white' },
    { key: 'support_orgs', label: 'Tổ chức trung gian', total: safeStats.totalSupportOrgs || 0, tint: 'border-rose-200 bg-rose-50 text-rose-900', active: 'border-rose-700 bg-rose-700 text-white' },
    { key: 'investors', label: 'Nhà đầu tư', total: safeStats.totalInvestors || 0, tint: 'border-teal-200 bg-teal-50 text-teal-900', active: 'border-teal-700 bg-teal-700 text-white' },
    { key: 'investment_funds', label: 'Quỹ đầu tư', total: safeStats.totalFunds || 0, tint: 'border-violet-200 bg-violet-50 text-violet-900', active: 'border-violet-700 bg-violet-700 text-white' }
  ];
  const renderPanel = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="space-y-3">
            <SectionHeading title="Đề tài/Nhiệm vụ KH&CN" total={safeStats.totalScienceTasks || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.tasksByYear} accent="bg-blue-600" />
              <PieBreakdown title="Theo lĩnh vực chuyên ngành" source={safeStats.tasksByField || safeStats.fieldBreakdown} accent="blue" />
              <PieBreakdown title="Theo đơn vị chủ trì" source={safeStats.tasksByUnit} accent="blue" />
              <PieBreakdown title="Theo cấp quản lý" source={safeStats.tasksByLevel} accent="blue" />
            </div>
          </div>
        );
      case 'initiatives':
        return (
          <div className="space-y-3">
            <SectionHeading title="Sáng kiến có tác dụng, ảnh hưởng đối với thành phố" total={safeStats.totalInitiatives || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.initiativesByYear} accent="bg-amber-500" />
              <PieBreakdown title="Theo lĩnh vực công nhận" source={safeStats.initiativesByField} accent="amber" />
              <PieBreakdown title="Theo chuyên ngành" source={safeStats.initiativesBySpecialty} accent="amber" />
              <PieBreakdown title="Theo đơn vị" source={safeStats.initiativesByUnit} accent="amber" />
            </div>
          </div>
        );
      case 'startups':
        return (
          <div className="space-y-3">
            <SectionHeading title="Doanh nghiệp khởi nghiệp sáng tạo" total={safeStats.totalStartups || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.startupsByYear} accent="bg-purple-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.startupsByField} accent="purple" />
            </div>
          </div>
        );
      case 'patents':
        return (
          <div className="space-y-3">
            <SectionHeading title="Sở hữu trí tuệ" total={safeStats.totalPatents || 0} />
            <YearBarBreakdown title="Thống kê số lượng Sáng chế và Văn bằng SHTT theo năm" source={safeStats.patentsByYear} accent="bg-indigo-600" />
          </div>
        );
      case 'experts':
        return (
          <div className="space-y-3">
            <SectionHeading title="Chuyên gia" total={safeStats.totalExperts || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.expertsByYear} accent="bg-cyan-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.expertsByField} accent="cyan" />
              <PieBreakdown title="Theo chuyên ngành" source={safeStats.expertsBySpecialty} accent="cyan" />
              <PieBreakdown title="Theo học hàm" source={safeStats.expertsByAcademicTitle} accent="cyan" />
              <PieBreakdown title="Theo học vị" source={safeStats.expertsByDegree} accent="cyan" />
              <PieBreakdown title="Theo đơn vị công tác" source={safeStats.expertsByWorkplace} accent="cyan" />
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-3">
            <SectionHeading title="Dự án khởi nghiệp" total={safeStats.totalProjects || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.projectsByYear} accent="bg-emerald-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.projectsByField} accent="emerald" />
              <PieBreakdown title="Thuộc trường học" source={safeStats.projectsBySchool} accent="emerald" />
              <PieBreakdown title="Thuộc xã/phường" source={safeStats.projectsByWard} accent="emerald" />
            </div>
          </div>
        );
      case 'ideas':
        return (
          <div className="space-y-3">
            <SectionHeading title="Ý tưởng khởi nghiệp" total={safeStats.totalIdeas || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.ideasByYear} accent="bg-orange-500" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.ideasByField} accent="orange" />
              <PieBreakdown title="Thuộc trường học" source={safeStats.ideasBySchool} accent="orange" />
              <PieBreakdown title="Thuộc xã/phường" source={safeStats.ideasByWard} accent="orange" />
            </div>
          </div>
        );
      case 'featured_startups':
        return (
          <div className="space-y-3">
            <SectionHeading title="Doanh nghiệp khởi nghiệp tiêu biểu" total={safeStats.totalFeaturedStartups || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.featuredStartupsByYear} accent="bg-pink-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.featuredStartupsByField} accent="pink" />
            </div>
          </div>
        );
      case 'support_orgs':
        return (
          <div className="space-y-3">
            <SectionHeading title="Tổ chức trung gian" total={safeStats.totalSupportOrgs || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.supportOrgsByYear} accent="bg-rose-600" />
              <PieBreakdown title="Theo lĩnh vực / loại hình" source={safeStats.supportOrgsByField} accent="rose" />
            </div>
          </div>
        );
      case 'investors':
        return (
          <div className="space-y-3">
            <SectionHeading title="Nhà đầu tư" total={safeStats.totalInvestors || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.investorsByYear} accent="bg-teal-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.investorsByField} accent="teal" />
            </div>
          </div>
        );
      case 'investment_funds':
        return (
          <div className="space-y-3">
            <SectionHeading title="Quỹ đầu tư" total={safeStats.totalFunds || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <YearBarBreakdown title="Theo năm" source={safeStats.investmentFundsByYear} accent="bg-violet-600" />
              <PieBreakdown title="Theo lĩnh vực" source={safeStats.investmentFundsByField} accent="violet" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base lg:text-lg font-extrabold text-slate-950">Biểu đồ Phân tích & Thống kê Tăng trưởng</h2>
          <p className="mt-1 text-sm text-slate-600">Số liệu tổng hợp từ hồ sơ đã phê duyệt và đủ điều kiện công khai; có thể chọn từng nhóm dữ liệu để xem cơ cấu chi tiết.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={'flex min-h-14 min-w-0 flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2 text-left text-sm font-extrabold leading-tight transition-all ' + (activeTab === tab.key ? tab.active + ' shadow-md ring-2 ring-offset-1 ring-slate-300' : tab.tint + ' hover:-translate-y-0.5 hover:shadow-sm')}
            >
              <span className="break-words">{tab.label}</span>
              <span className={'font-mono text-sm ' + (activeTab === tab.key ? 'text-white/90' : 'opacity-75')}>{formatCount(tab.total)} hồ sơ</span>
            </button>
          ))}
        </div>
      </div>
      <div>{renderPanel()}</div>
    </section>
  );
};
