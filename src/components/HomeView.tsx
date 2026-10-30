import React from 'react';
import { BaseEntity, AggregatedStats, SystemConfig } from '../types';
import { SearchHero } from './SearchHero';
import { HomeOverviewDashboard } from './HomeOverviewDashboard';
import { 
  ArrowRight, 
  Lightbulb, 
  FlaskConical, 
  Users, 
  Rocket, 
  FileText, 
  MessageSquarePlus, 
  ShieldCheck,
  Building
} from 'lucide-react';

interface HomeViewProps {
  stats: AggregatedStats | null;
  featuredInitiatives: BaseEntity[];
  featuredTasks: BaseEntity[];
  featuredExperts: BaseEntity[];
  featuredStartups: BaseEntity[];
  featuredNeeds: BaseEntity[];
  featuredPolicies?: BaseEntity[];
  systemConfig: SystemConfig;
  onSearch: (params: { q: string; moduleType?: string; field?: string }) => void;
  onNavigateBrowse: (category?: string) => void;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenSubmitModal: () => void;
  onOpenConnectModal: (entity: BaseEntity) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stats,
  featuredInitiatives,
  featuredTasks,
  featuredExperts,
  featuredStartups,
  featuredNeeds,
  featuredPolicies = [],
  systemConfig,
  onSearch,
  onNavigateBrowse,
  onViewDetail,
  onOpenSubmitModal,
  onOpenConnectModal
}) => {
  // Format currency with dots: 1.850.000.000 đ
  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đ`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đ`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu đ`;
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
  };

  // Safe label for recognition scope to explicitly display "Sáng kiến đã công nhận"
  const renderRecognitionBadge = (scope?: string) => {
    if (!scope || scope === 'Chưa công nhận' || scope === 'Đang thẩm định') {
      return (
        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
          Đang thẩm định / Chưa công nhận
        </span>
      );
    }
    const scopeLabel = scope.includes('thành phố') || scope.includes('TP') ? 'Cấp thành phố' : scope;
    return (
      <span className="text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded text-[11px] font-bold border border-amber-300">
        Sáng kiến đã công nhận ({scopeLabel})
      </span>
    );
  };

  return (
    <div className="pb-16 space-y-12">
      
      {/* Top Hero Search & Executive Overview Dashboard (seamlessly connected without white gap) */}
      <div className="overflow-hidden">
        <SearchHero
          onSearch={onSearch}
          onSelectCategory={(mod) => onNavigateBrowse(mod)}
          activeCategory="all"
        />
        <HomeOverviewDashboard
          stats={stats}
          systemConfig={systemConfig}
          onNavigateBrowse={onNavigateBrowse}
        />
      </div>

      {/* Section 1: Sáng kiến có tác dụng, ảnh hưởng đối với thành phố */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phân định minh bạch phạm vi đề xuất và phạm vi đã được UBND thành phố công nhận chính thức
            </p>
          </div>

          <button
            onClick={() => onNavigateBrowse('initiatives')}
            className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap"
          >
            <span>Xem tất cả sáng kiến ({stats?.totalInitiatives || 0})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredInitiatives.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewDetail(item)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{item.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-teal-900 font-semibold text-[11px]">Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                  <span aria-hidden="true">·</span>
                  {renderRecognitionBadge(item.recognizedScope)}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.description || item.problemSolved}
                </p>

                {/* Savings and Impact Box */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-950 font-mono">
                    <span className="font-sans text-slate-500 text-[11px]">Chi phí tiết kiệm:</span>
                    <span className="font-bold text-emerald-800 text-sm">{formatVND(item.costSavings)}/năm</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span className="text-slate-400">Đơn vị thụ hưởng:</span>
                    <span className="font-medium truncate max-w-[150px]">{item.beneficiaries || item.proposingOrg}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  Tác giả / Cơ quan: <span className="font-medium text-slate-800">{item.ownerName || item.proposingOrg}</span>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">Căn cứ: QĐ {item.recognitionDecision?.split(' ')[2] || 'UBND TP'}</span>
                <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                  Xem hồ sơ
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Nhiệm vụ & Đề tài KH&CN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nhiệm vụ & Đề tài KH&CN
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý trọn vẹn vòng đời từ tuyển chọn, phê duyệt, tiến độ, nghiệm thu đến chuyển giao kết quả
            </p>
          </div>

          <button
            onClick={() => onNavigateBrowse('science_tasks')}
            className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap"
          >
            <span>Xem tất cả nhiệm vụ ({stats?.totalScienceTasks || 0})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredTasks.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewDetail(item)}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="font-mono text-teal-800 font-semibold">{item.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{item.taskType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-700 font-medium">{item.field}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Progress & Budget Line */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-sans block text-[11px]">Kinh phí duyệt</span>
                    <span className="font-bold text-slate-800">{formatVND(item.totalBudgetApproved)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-sans block text-[11px]">Tiến độ thực hiện</span>
                    <span className="font-bold text-teal-800">{item.executionProgress || 70}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-sans block text-[11px]">Nghiệm thu</span>
                    <span className="font-bold text-emerald-700 font-sans">{item.acceptanceResult || 'Đang thực hiện'}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <div>Chủ nhiệm: <span className="font-semibold text-slate-800">{item.principalInvestigator}</span></div>
                  <div>Cơ quan chủ trì: <span className="font-semibold text-slate-800">{item.leadOrganization}</span></div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">Đơn vị tiếp nhận: {item.receivingUnit || 'UBND TP Đà Nẵng'}</span>
                <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                  Xem chi tiết
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Chuyên gia & Khởi nghiệp (2-column layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Col 1: Chuyên gia & Nhà khoa học */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chuyên gia & Nhà khoa học</h3>
                <p className="text-[11px] text-slate-500">Mạng lưới nhà khoa học, chuyên gia tư vấn và thẩm định</p>
              </div>
              <button
                onClick={() => onNavigateBrowse('experts')}
                className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1"
              >
                Tất cả ({stats?.totalExperts || 0}) →
              </button>
            </div>

            <div className="space-y-3">
              {featuredExperts.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onViewDetail(exp)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {exp.academicTitle || 'TS'}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors text-sm">
                        {exp.title}
                      </h4>
                      <span className="text-[11px] text-emerald-700 font-medium">Đã xác minh</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {exp.position} · {exp.workplace}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      Chuyên môn: {exp.primaryField}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Hệ sinh thái KNĐMST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Doanh nghiệp & Dự án khởi nghiệp</h3>
                <p className="text-[11px] text-slate-500">Doanh nghiệp KH&CN, startup và mô hình đổi mới sáng tạo</p>
              </div>
              <button
                onClick={() => onNavigateBrowse('startups')}
                className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1"
              >
                Tất cả ({stats?.totalStartups || 0}) →
              </button>
            </div>

            <div className="space-y-3">
              {featuredStartups.map((stp) => (
                <div
                  key={stp.id}
                  onClick={() => onViewDetail(stp)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors text-sm">
                        {stp.title}
                      </h4>
                      <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {stp.developmentStage || 'Tăng trưởng'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">
                      {stp.description}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Nhu cầu vốn: <span className="font-bold text-emerald-700">{formatVND(stp.fundingNeeds)}</span> · Công nghệ: {stp.coreTech?.split(',')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Section 4: Nhu cầu kết nối & Đặt hàng giải quyết bài toán Thành phố */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Cổng đặt hàng bài toán công nghệ & Nhu cầu chuyển giao
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Cơ quan quản lý, viện trường và doanh nghiệp đăng tải các thách thức đô thị và nhu cầu tìm kiếm đối tác đồng hành.
              </p>
            </div>

            <button
              onClick={() => onNavigateBrowse('collaboration_needs')}
              className="px-4 py-2 bg-white text-teal-900 font-semibold rounded-lg text-xs hover:bg-slate-100 transition-colors shrink-0 shadow-xs"
            >
              Xem tất cả nhu cầu kết nối →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredNeeds.map((need) => (
              <div
                key={need.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-teal-300">
                    <span className="font-mono">{need.code}</span>
                    <span className="bg-teal-800/80 px-2 py-0.5 rounded text-white font-medium">{need.needType}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm line-clamp-2">
                    {need.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {need.description}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Đơn vị đăng: <span className="text-white font-medium">{need.ownerName}</span> · Hạn chót: {need.deadline || '30/08/2026'}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-teal-200">
                    Đã có {need.connectionRequestsCount || 0} hồ sơ quan tâm
                  </span>
                  <button
                    onClick={() => onOpenConnectModal(need)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Ứng tuyển / Kết nối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Văn bản & Chính sách */}
      {featuredPolicies.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chính sách & Cơ chế khuyến khích KH&CN, Đổi mới sáng tạo
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Các nghị quyết HĐND và quyết định UBND Thành phố hướng dẫn thủ tục, mức kinh phí hỗ trợ và ưu đãi
              </p>
            </div>

            <button
              onClick={() => onNavigateBrowse('policies')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap"
            >
              <span>Xem tất cả văn bản</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredPolicies.map((pol) => (
              <div
                key={pol.id}
                onClick={() => onViewDetail(pol)}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono text-teal-800 font-semibold">{pol.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{pol.documentNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Có hiệu lực</span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors text-sm leading-snug">
                    {pol.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {pol.description}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Ban hành: {pol.issuingBody || 'UBND TP Đà Nẵng'}</span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem toàn văn
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 6: CTA Hướng dẫn nộp đề xuất */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Bạn có sáng kiến, giải pháp cải tiến hoặc đề tài nghiên cứu muốn ứng dụng vào thành phố?
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Cổng thông tin tiếp nhận hồ sơ trực tuyến liên tục 24/7. Các sáng kiến đủ điều kiện sẽ được Hội đồng Sáng kiến Thành phố thẩm định, công nhận và hỗ trợ kinh phí nhân rộng theo quy định của pháp luật.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSubmitModal}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Nộp hồ sơ trực tuyến</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
