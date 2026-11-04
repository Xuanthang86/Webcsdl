import React, { useState } from 'react';
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
  Award,
  Building2,
  MapPin,
  School,
  Star,
  Target,
  GraduationCap,
  ExternalLink,
  Layers
} from 'lucide-react';

interface HomeViewProps {
  stats: AggregatedStats | null;
  featuredTasks: BaseEntity[];
  featuredInitiatives: BaseEntity[];
  featuredPatents?: BaseEntity[];
  featuredExperts: BaseEntity[];
  featuredStartups: BaseEntity[];
  featuredSupportOrgs?: BaseEntity[];
  featuredProjects?: BaseEntity[];
  featuredIdeas?: BaseEntity[];
  featuredWards?: BaseEntity[];
  featuredUniversities?: BaseEntity[];
  featuredPopularStartups?: BaseEntity[];
  featuredNeeds?: BaseEntity[];
  featuredPolicies?: BaseEntity[];
  systemConfig: SystemConfig;
  onSearch: (params: { q: string; moduleType?: string; field?: string }) => void;
  onNavigateBrowse: (category?: string) => void;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenSubmitModal: () => void;
  onOpenConnectModal: (entity: BaseEntity) => void;
  onOpenAdvancedSearch?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stats,
  featuredTasks,
  featuredInitiatives,
  featuredPatents = [],
  featuredExperts,
  featuredStartups,
  featuredSupportOrgs = [],
  featuredProjects = [],
  featuredIdeas = [],
  featuredWards = [],
  featuredUniversities = [],
  featuredPopularStartups = [],
  systemConfig,
  onSearch,
  onNavigateBrowse,
  onViewDetail,
  onOpenSubmitModal,
  onOpenConnectModal,
  onOpenAdvancedSearch
}) => {
  const [activeEcosystemTab, setActiveEcosystemTab] = useState<'all' | 'startups' | 'support_organizations' | 'startup_projects' | 'startup_ideas' | 'wards' | 'universities' | 'featured_startups'>('all');

  const formatVND = (num?: number) => {
    if (!num) return '0 đồng';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đồng`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đồng`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu đồng`;
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đồng`;
  };

  const getStandardAcceptance = (res?: string) => {
    if (!res) return 'Đang thực hiện';
    const l = res.toLowerCase();
    if (l.includes('xuất sắc') || l.includes('đạt') || l.includes('đã')) return 'Đã nghiệm thu';
    if (l.includes('đang')) return 'Đang nghiệm thu';
    return 'Chưa nghiệm thu';
  };

  const cleanTaskCode = (code?: string) => {
    if (!code) return 'KHCN';
    return code.split(';')[0].trim();
  };

  const renderRecognitionBadge = (scope?: string) => {
    if (!scope || scope === 'Chưa công nhận' || scope === 'Đang thẩm định') {
      return (
        <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded text-xs font-semibold border border-slate-200">
          Đang thẩm định
        </span>
      );
    }
    const scopeLabel = scope.includes('thành phố') || scope.includes('TP') ? 'Cấp thành phố' : scope;
    return (
      <span className="text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-300">
        Sáng kiến đã công nhận ({scopeLabel})
      </span>
    );
  };

  return (
    <div className="pb-16 text-slate-800">
      
      {/* 1. Dashboard (Nằm ngay phía dưới thanh header - không có khoảng trắng) */}
      <HomeOverviewDashboard
        stats={stats}
        systemConfig={systemConfig}
        onNavigateBrowse={onNavigateBrowse}
      />

      {/* 2. Thanh tìm kiếm và các điều kiện phục vụ tìm kiếm (Gắn liền với Dashboard, loại bỏ hoàn toàn khoảng trắng) */}
      <SearchHero
        onSearch={onSearch}
        onSelectCategory={(mod) => onNavigateBrowse(mod)}
        activeCategory="all"
        onOpenAdvancedSearch={onOpenAdvancedSearch}
      />

      {/* 3. Hiển thị chi tiết các loại dữ liệu, mỗi loại hiển thị 3 dữ liệu con mới nhất
          Thứ tự chính xác:
          1. Đề tài, nhiệm vụ
          2. Sáng kiến có tác dụng, ảnh hưởng
          3. Sáng chế & sở hữu trí tuệ
          4. Chuyên gia & nhà khoa học
          5. Dữ liệu Hệ sinh thái
      */}
      <div className="mt-8 sm:mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ================= 1. ĐỀ TÀI, NHIỆM VỤ KH&CN (3 dữ liệu con mới nhất) ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Đề tài, Nhiệm vụ KH&CN
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('science_tasks')}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả đề tài ({stats?.totalScienceTasks ?? 0})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {featuredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 font-medium text-sm">
              Chưa có dữ liệu đề tài, nhiệm vụ KH&CN được công bố trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredTasks.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 truncate">
                        <span className="hidden sm:inline">STT {idx + 1} · </span>{cleanTaskCode(item.code)}
                      </span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs shrink-0">
                        {item.managementLevel || item.managingAgency || 'Cấp Thành phố'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors w-full break-words hyphens-auto leading-snug">
                      {item.title}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium">Cơ quan chủ trì:</span>{' '}
                        <span className="font-semibold text-slate-800">{item.leadOrganization || item.ownerName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Chủ nhiệm đề tài:</span>{' '}
                        <span className="font-semibold text-slate-900">{item.principalInvestigator || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Thời gian thực hiện:</span>{' '}
                        <span className="font-mono font-medium text-slate-800">
                          {item.executionTime || item.actualDuration || (item.expectedStartDate ? `${item.expectedStartDate} - ${item.expectedEndDate || ''}` : '—')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Lĩnh vực:</span>{' '}
                        <span className="text-teal-800 font-medium">{item.field || 'Đa ngành'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-emerald-700 font-semibold">
                      {getStandardAcceptance(item.acceptanceResult)}
                    </span>
                    <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1">
                      Xem chi tiết
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 2. SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ (3 dữ liệu con mới nhất) ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('initiatives')}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả sáng kiến ({stats?.totalInitiatives ?? 0})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {featuredInitiatives.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 font-medium text-sm">
              Chưa có dữ liệu sáng kiến được công nhận trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredInitiatives.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-mono text-amber-900 font-bold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        <span className="hidden sm:inline">STT {idx + 1}</span>
                        <span className="sm:hidden font-mono text-[11px]">{item.code || 'SK'}</span>
                      </span>
                      <span className="text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-300 shrink-0">
                        Năm công nhận: {item.recognitionYear || '2025'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors w-full break-words leading-snug">
                      {item.title}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-600 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
                      <div>
                        <span className="text-slate-400 font-medium">Tác giả:</span>{' '}
                        <span className="font-semibold text-slate-900">
                          {Array.isArray(item.authors) ? item.authors.join(', ') : (item.authors || item.ownerName || '—')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Chủ sở hữu:</span>{' '}
                        <span className="font-semibold text-slate-800">{item.ownerName || item.proposingOrg || '—'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 font-medium">Địa chỉ chủ sở hữu:</span>{' '}
                        <span className="text-slate-700">{item.ownerAddress || item.applicationArea || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Lĩnh vực:</span>{' '}
                        <span className="text-amber-900 font-medium">{item.field || 'Đa ngành'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-emerald-700 font-mono font-bold">
                      Làm lợi: {formatVND(item.costSavings)}
                    </span>
                    <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1">
                      Xem chi tiết
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 3. SÁNG CHẾ & SỞ HỮU TRÍ TUỆ (3 dữ liệu con mới nhất) ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sáng chế & Sở hữu trí tuệ
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('patents')}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả sáng chế ({stats?.totalPatents ?? 0})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {featuredPatents.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 font-medium text-sm">
              Chưa có dữ liệu sáng chế, giải pháp hữu ích trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredPatents.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-mono text-purple-900 font-bold bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 truncate">
                        <span className="hidden sm:inline">STT {idx + 1} · </span>{item.patentNumber || item.code || 'SC'}
                      </span>
                      <span className="font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 text-xs shrink-0">
                        {item.patentType || 'Bằng sáng chế'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-800 transition-colors w-full break-words leading-snug">
                      {item.title}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-600 bg-purple-50/30 p-3 rounded-lg border border-purple-100">
                      <div>
                        <span className="text-slate-400 font-medium">Chủ sở hữu / Đơn vị:</span>{' '}
                        <span className="font-semibold text-slate-800">{item.ownerName || item.organization || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Tác giả sáng chế:</span>{' '}
                        <span className="font-semibold text-slate-900">{item.inventors || item.authors || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Lĩnh vực:</span>{' '}
                        <span className="text-purple-900 font-medium">{item.field || 'Công nghệ kỹ thuật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Ngày cấp bằng / Nộp đơn:</span>{' '}
                        <span className="font-mono text-slate-700">{item.grantDate || item.filingDate || (item.createdAt ? item.createdAt.slice(0, 10) : '—')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">{item.field || 'Sở hữu trí tuệ'}</span>
                    <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1">
                      Xem chi tiết
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 4. CHUYÊN GIA & NHÀ KHOA HỌC (3 dữ liệu con mới nhất) ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chuyên gia & Nhà khoa học
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('experts')}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả chuyên gia ({stats?.totalExperts ?? 0})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {featuredExperts.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 font-medium text-sm">
              Chưa có dữ liệu chuyên gia &amp; nhà khoa học trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredExperts.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.academicTitle || 'TS'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-blue-900 font-bold text-xs hidden sm:inline">STT {idx + 1}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors w-full break-words leading-snug">
                          {item.title || item.fullName}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-slate-600 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                      <div>
                        <span className="text-slate-400 font-medium">Năm sinh:</span>{' '}
                        <span className="font-mono font-semibold text-slate-800">{item.birthYear || '—'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 font-medium">Email:</span>{' '}
                        <span className="text-teal-800 font-medium">{item.email || item.publicEmail || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Điện thoại:</span>{' '}
                        <span className="font-mono text-slate-700">{item.phone || item.publicPhone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Chuyên ngành:</span>{' '}
                        <span className="font-semibold text-slate-900">{item.specialty || item.primaryField || item.field || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 truncate max-w-[180px]">
                      {item.workplace || item.organization || '—'}
                    </span>
                    <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1">
                      Xem hồ sơ
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 5. DỮ LIỆU HỆ SINH THÁI (Hiển thị các loại dữ liệu con, mỗi loại 3 dữ liệu mới nhất) ================= */}
        <section className="space-y-5 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Dữ liệu Hệ sinh thái Khởi nghiệp đổi mới sáng tạo
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('startups')}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Tra cứu toàn bộ Dữ liệu Hệ sinh thái</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Sub-tabs for the 7 ecosystem child data types */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm">
            <button
              onClick={() => setActiveEcosystemTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'all'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất cả 7 loại dữ liệu con
            </button>
            <button
              onClick={() => setActiveEcosystemTab('startups')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'startups'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Doanh nghiệp khởi nghiệp sáng tạo
            </button>
            <button
              onClick={() => setActiveEcosystemTab('support_organizations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'support_organizations'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tổ chức trung gian
            </button>
            <button
              onClick={() => setActiveEcosystemTab('startup_projects')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'startup_projects'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Dự án khởi nghiệp
            </button>
            <button
              onClick={() => setActiveEcosystemTab('startup_ideas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'startup_ideas'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Ý tưởng khởi nghiệp
            </button>
            <button
              onClick={() => setActiveEcosystemTab('wards')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'wards'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Danh sách xã/phường
            </button>
            <button
              onClick={() => setActiveEcosystemTab('universities')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'universities'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Trường Đại học/Cao đẳng
            </button>
            <button
              onClick={() => setActiveEcosystemTab('featured_startups')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'featured_startups'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Doanh nghiệp tiêu biểu
            </button>
          </div>

          <div className="space-y-8">

            {/* 5.1 DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startups') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-rose-600" />
                    <span>Doanh nghiệp khởi nghiệp sáng tạo</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startups')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalStartups ?? 0}) →
                  </button>
                </div>

                {featuredStartups.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có dữ liệu doanh nghiệp khởi nghiệp sáng tạo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredStartups.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-rose-900 font-bold bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                              STT {idx + 1}
                            </span>
                            <span className="font-mono text-slate-500">
                              Năm bắt đầu: {item.foundedYear || '—'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-rose-800 transition-colors text-base line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div><span className="text-slate-400">Địa chỉ:</span> {item.address || '—'}</div>
                            <div><span className="text-slate-400">Lĩnh vực:</span> <strong className="text-slate-800">{item.field || '—'}</strong></div>
                            <div>
                              <span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName || '—'}{item.leaderPhone ? ` (${item.leaderPhone})` : ''}
                            </div>
                            <div className="line-clamp-2 text-xs text-slate-500 pt-1 border-t border-slate-200">
                              <span className="font-semibold text-slate-700">Giải quyết vấn đề:</span> {item.problemSolved || item.description || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                          <span>Nhân sự: {item.currentStaffCount ? `${item.currentStaffCount} người` : '—'}</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.2 TỔ CHỨC TRUNG GIAN (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'support_organizations') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span>Tổ chức trung gian hỗ trợ khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('support_organizations')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalSupportOrgs ?? 0}) →
                  </button>
                </div>

                {featuredSupportOrgs.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có dữ liệu tổ chức trung gian hỗ trợ.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredSupportOrgs.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-cyan-900 font-bold bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
                              STT {idx + 1}
                            </span>
                            <span className="text-cyan-700 font-medium">Tổ chức trung gian</span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-cyan-800 transition-colors text-base line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600">
                            <span className="text-slate-400">Địa chỉ:</span> {item.address || '—'}
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Đơn vị hỗ trợ</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.3 DỰ ÁN KHỞI NGHIỆP (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startup_projects') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Dự án khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startup_projects')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalProjects ?? 0}) →
                  </button>
                </div>

                {featuredProjects.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có dữ liệu dự án khởi nghiệp trong hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredProjects.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-emerald-900 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              STT {idx + 1}
                            </span>
                            <span className="font-mono text-slate-500">Năm {item.startYear || '—'}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-base line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div><span className="text-slate-400">Lĩnh vực:</span> <strong>{item.field || '—'}</strong></div>
                            <div><span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName || '—'}{item.leaderPhone ? ` (${item.leaderPhone})` : ''}</div>
                            <div className="truncate"><span className="text-slate-400">Ươm tạo từ:</span> {item.incubator || '—'}</div>
                            <div className="line-clamp-2 text-xs text-slate-500 pt-1 border-t border-slate-200">
                              <span className="font-semibold text-slate-700">Giải quyết:</span> {item.problemSolved || item.description || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                          <span>{item.memberCount ? `${item.memberCount} thành viên` : '—'}</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.4 Ý TƯỞNG KHỞI NGHIỆP (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startup_ideas') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span>Ý tưởng khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startup_ideas')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalIdeas ?? 0}) →
                  </button>
                </div>

                {featuredIdeas.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có dữ liệu ý tưởng khởi nghiệp trong hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredIdeas.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-yellow-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-yellow-900 font-bold bg-yellow-50 px-2.5 py-0.5 rounded border border-yellow-200">
                              STT {idx + 1}
                            </span>
                            <span className="text-amber-800 font-medium truncate max-w-[160px]">
                              {item.wardSchool || '—'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-yellow-800 transition-colors text-base line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div><span className="text-slate-400">Lĩnh vực:</span> <strong>{item.field || '—'}</strong></div>
                            <div><span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName || '—'}{item.leaderPhone ? ` (${item.leaderPhone})` : ''}</div>
                            <div><span className="text-slate-400">GV hướng dẫn:</span> {item.mentorTeacher || '—'}</div>
                            <div className="line-clamp-2 text-xs text-slate-500 pt-1 border-t border-slate-200">
                              <span className="font-semibold text-slate-700">Giải quyết:</span> {item.problemSolved || item.description || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                          <span>{item.memberCount ? `${item.memberCount} thành viên` : '—'}</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.5 DANH SÁCH XÃ/PHƯỜNG (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'wards') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Danh sách xã/phường</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('wards')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalWards ?? 0}) →
                  </button>
                </div>

                {featuredWards.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có danh sách xã/phường trong hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredWards.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-indigo-900 font-bold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 hidden sm:inline">
                              STT {idx + 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-800 transition-colors text-base">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600">
                            <span className="text-slate-400">Địa chỉ:</span> {item.address || '—'}
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Đơn vị hành chính</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.6 TRƯỜNG ĐẠI HỌC/CAO ĐẲNG TRÊN ĐỊA BÀN (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'universities') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <School className="w-4 h-4 text-violet-600" />
                    <span>Trường Đại học / Cao đẳng trên địa bàn</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('universities')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalUniversities ?? 0}) →
                  </button>
                </div>

                {featuredUniversities.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có danh sách trường Đại học/Cao đẳng trong hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredUniversities.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-violet-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-violet-900 font-bold bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200 hidden sm:inline">
                              STT {idx + 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-violet-800 transition-colors text-base line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div><span className="text-slate-400">Xã/phường:</span> {item.ward || '—'}</div>
                            <div className="truncate"><span className="text-slate-400">Địa chỉ:</span> {item.address || '—'}</div>
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Nguồn lực KH&CN</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5.7 DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'featured_startups') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span>Doanh nghiệp khởi nghiệp tiêu biểu</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('featured_startups')}
                    className="text-sm text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalFeaturedStartups ?? 0}) →
                  </button>
                </div>

                {featuredPopularStartups.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-xl">
                    Chưa có danh sách doanh nghiệp tiêu biểu trong hệ thống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredPopularStartups.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-amber-900 font-bold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                              STT {idx + 1}
                            </span>
                            <span className="text-amber-700 font-medium">Tiêu biểu thành phố</span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors text-base line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600">
                            <span className="text-slate-400">Link website:</span>{' '}
                            {item.website ? (
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-teal-700 hover:underline inline-flex items-center gap-0.5 font-medium"
                              >
                                {item.website} <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Đang cập nhật</span>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Mô hình tăng trưởng</span>
                          <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
};
