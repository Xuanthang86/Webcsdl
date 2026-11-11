import React, { useState } from 'react';
import { BaseEntity, AggregatedStats, SystemConfig } from '../types';
import { SearchHero } from './SearchHero';
import { HomeOverviewDashboard } from './HomeOverviewDashboard';
import { GrowthAnalytics } from './GrowthAnalytics';
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
  featuredInvestors?: BaseEntity[];
  featuredFunds?: BaseEntity[];
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
  featuredInvestors = [],
  featuredFunds = [],
  systemConfig,
  onSearch,
  onNavigateBrowse,
  onViewDetail,
  onOpenSubmitModal,
  onOpenConnectModal,
  onOpenAdvancedSearch
}) => {
  const [activeEcosystemTab, setActiveEcosystemTab] = useState<'all' | 'startups' | 'support_organizations' | 'startup_projects' | 'startup_ideas' | 'wards' | 'universities' | 'featured_startups' | 'investors' | 'investment_funds'>('all');

  const publicEmail = (item: BaseEntity) => {
    const value = String(item.email || item.contactEmail || item.contact_email || item.publicEmail || item.public_email || item.public_contact_email || item.emailAddress || item.email_address || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : 'Chưa cập nhật';
  };
  // Số điện thoại được API trả về theo quyền: đã che với tài khoản xem chung, đầy đủ với tài khoản được cấp quyền.
  const displayExpertPhone = (item: BaseEntity) => {
    // API đã trả số đầy đủ cho tài khoản được cấp quyền và số đã che cho tài khoản xem chung.
    const phoneKeys = [
      'phone', 'phoneNumber', 'phone_number', 'mobile', 'mobilePhone', 'mobile_phone',
      'telephone', 'telephoneNumber', 'telephone_number', 'tel', 'contactPhone', 'contact_phone',
      'publicPhone', 'public_phone', 'leaderPhone', 'leader_phone', 'expertPhone', 'expert_phone',
      'phoneNo', 'phone_no', 'mobile_number', 'workPhone', 'work_phone', 'officePhone',
      'office_phone', 'sdt', 'soDienThoai', 'so_dien_thoai', 'dienThoai', 'dien_thoai'
    ];
    const directValue = phoneKeys.map(key => item[key]).find(value =>
      value !== null && value !== undefined && String(value).trim() !== ''
    );
    const dynamicEntry = Object.entries(item).find(([key, value]) =>
      /(phone|mobile|telephone|^tel$|sdt|so.?dien.?thoai|dien.?thoai)/i.test(key) &&
      value !== null && value !== undefined && String(value).trim() !== ''
    );
    const value = directValue ?? dynamicEntry?.[1];
    return value === null || value === undefined || String(value).trim() === ''
      ? 'Chưa cập nhật'
      : String(value).trim();
  };

  const publicWebsite = (item: BaseEntity) =>
    item.website || item.websiteUrl || item.website_url || item.web || '';
  const websiteHref = (value: string) =>
    /^https?:\/\//i.test(value) ? value : `https://${value}`;

  // Format currency with standard Vietnamese format: 6,5 tỷ đồng
  const formatVND = (num?: number) => {
    if (!num) return '0 đồng';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2).replace('.', ',')} nghìn tỷ đồng`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đồng`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu đồng`;
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đồng`;
  };

  const renderRecognitionBadge = (scope?: string) => {
    const scopeLabel = (!scope || scope === 'Chưa công nhận' || scope === 'Đang thẩm định' || scope.includes('thành phố') || scope.includes('TP')) 
      ? 'Cấp thành phố' 
      : scope;
    return (
      <span className="text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded text-[11px] font-bold border border-amber-300">
        Sáng kiến đã công nhận ({scopeLabel})
      </span>
    );
  };

  return (
    <div className="pb-16">
      
      {/* 1. Dashboard (Nằm ngay phía dưới thanh header - không có khoảng trắng) */}
      <HomeOverviewDashboard
        stats={stats}
        systemConfig={systemConfig}
        onNavigateBrowse={onNavigateBrowse}
      />

      <div className="mt-6 px-4 sm:px-6 lg:px-8">
        <GrowthAnalytics stats={stats} />
      </div>

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
        {/* Các trường: STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thời gian thực hiện, Lĩnh vực */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Đề tài, Nhiệm vụ KH&CN
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('science_tasks')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả ({stats?.totalScienceTasks || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredTasks.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.code || `NV-KHCN-00${idx + 1}`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.managementLevel || item.managingAgency || 'Cấp Thành phố'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
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
                        {item.executionTime || item.actualDuration || `${item.expectedStartDate || '2024'} - ${item.expectedEndDate || '2026'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Lĩnh vực:</span>{' '}
                      <span className="text-teal-800 font-medium">{item.field || 'Đa ngành'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`font-semibold text-[11px] ${
                    item.acceptanceResult === 'Đang nghiệm thu' || item.status === 'under_review'
                      ? 'text-amber-700'
                      : (item.acceptanceResult === 'Đã nghiệm thu' || item.acceptanceResult === 'Xuất sắc' || item.acceptanceResult === 'Đạt' || item.status === 'approved')
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                  }`}>
                    {item.acceptanceResult === 'Đang nghiệm thu' || item.status === 'under_review'
                      ? 'Đang nghiệm thu'
                      : (item.acceptanceResult === 'Đã nghiệm thu' || item.acceptanceResult === 'Xuất sắc' || item.acceptanceResult === 'Đạt' || item.status === 'approved')
                      ? 'Đã nghiệm thu'
                      : 'Chưa nghiệm thu'}
                  </span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 2. SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ (3 dữ liệu con mới nhất) ================= */}
        {/* Các trường: STT, Năm công nhận, Tên sáng kiến, Tác giả, Chủ sở hữu, Địa chỉ chủ sở hữu, Lĩnh vực */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sáng kiến có tác dụng, ảnh hưởng đối với thành phố
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('initiatives')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả ({stats?.totalInitiatives || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredInitiatives.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Năm công nhận: {item.recognitionYear || '2025'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Cấp thành phố
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
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
                      <span className="text-slate-700">{item.ownerAddress || item.applicationArea || 'Thành phố Đà Nẵng'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Lĩnh vực:</span>{' '}
                      <span className="text-amber-900 font-medium">{item.field || 'Đa ngành'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-mono font-bold text-[11px]">
                    Làm lợi: {formatVND(item.costSavings)}
                  </span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 3. SÁNG CHẾ & SỞ HỮU TRÍ TUỆ (3 dữ liệu con mới nhất) ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sáng chế & Sở hữu trí tuệ
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('patents')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả ({stats?.totalPatents || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredPatents.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.patentNumber || item.code || `SC-00${idx + 1}`}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.patentType || 'Bằng sáng chế'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-800 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-purple-50/30 p-3 rounded-lg border border-purple-100">
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
                      <span className="font-mono text-slate-700">{item.grantDate || item.filingDate || item.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium text-[11px]">Đã công bố hợp lệ</span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 4. CHUYÊN GIA & NHÀ KHOA HỌC (3 dữ liệu con mới nhất) ================= */}
        {/* Các trường: STT, Tên Chuyên gia, Năm sinh, Email, Điện thoại, Chuyên ngành */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chuyên gia & Nhà khoa học
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('experts')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả ({stats?.totalExperts || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredExperts.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {item.academicTitle || 'TS'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors truncate">
                        {item.title || item.fullName}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <div>
                      <span className="text-slate-400 font-medium">Năm sinh:</span>{' '}
                      <span className="font-mono font-semibold text-slate-800">{item.birthYear || '1978'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400 font-medium">Email:</span>{' '}
                      <span className="text-teal-800 font-medium">{item.email || item.publicEmail || 'chuyengia@danang.gov.vn'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Liên hệ:</span>{' '}
                      <span className="font-mono font-medium text-slate-600">{displayExpertPhone(item)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Chuyên ngành:</span>{' '}
                      <span className="font-semibold text-slate-900">{item.specialty || item.primaryField || item.field}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {item.workplace || item.organization || 'ĐH Đà Nẵng'}
                  </span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem hồ sơ
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 5. DỮ LIỆU HỆ SINH THÁI (Hiển thị các loại dữ liệu con, mỗi loại 3 dữ liệu mới nhất) ================= */}
        {/* Bao gồm: DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO, TỔ CHỨC TRUNG GIAN, DỰ ÁN KHỞI NGHIỆP, Ý TƯỞNG KHỞI NGHIỆP, DANH SÁCH XÃ/PHƯỜNG, TRƯỜNG ĐH/CĐ, DN KHỞI NGHIỆP TIÊU BIỂU */}
        <section className="desktop-ecosystem-text space-y-5 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Dữ liệu Hệ sinh thái Khởi nghiệp đổi mới sáng tạo
              </h2>
            </div>
            <button
              onClick={() => onNavigateBrowse('startups')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Sub-tabs for the 7 ecosystem child data types */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs lg:flex-wrap lg:overflow-visible">
            <button
              onClick={() => setActiveEcosystemTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'all'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Các loại dữ liệu trong Hệ sinh thái
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
            <button
              onClick={() => setActiveEcosystemTab('investors')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'investors'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Nhà đầu tư
            </button>
            <button
              onClick={() => setActiveEcosystemTab('investment_funds')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                activeEcosystemTab === 'investment_funds'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Quỹ đầu tư
            </button>
          </div>

          <div className="space-y-8">

            {/* 5.1 DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO (3 dữ liệu con mới nhất) */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startups') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-rose-600" />
                    <span>Doanh nghiệp khởi nghiệp sáng tạo</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startups')}
                    className="text-xs text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalStartups || 0}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredStartups.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-mono text-slate-500">
                            Năm bắt đầu: {item.foundedYear || '2023'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-rose-800 transition-colors text-sm line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div><span className="text-slate-400">Địa chỉ:</span> {item.address || 'Đà Nẵng'}</div>
                          <div><span className="text-slate-400">Lĩnh vực:</span> <strong className="text-slate-800">{item.field}</strong></div>
                          <div><span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName}</div>
                          <div className="line-clamp-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            <span className="font-semibold text-slate-700">Giải quyết vấn đề:</span> {item.problemSolved || item.description}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Nhân sự: {item.currentStaffCount || 15} người</span>
                        <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5.2 TỔ CHỨC TRUNG GIAN (3 dữ liệu con mới nhất) */}
            {/* Các trường: STT, Tên tổ chức, Địa chỉ */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'support_organizations') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span>Tổ chức trung gian hỗ trợ khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('support_organizations')}
                    className="text-xs text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalSupportOrgs || 0}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredSupportOrgs.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="hidden sm:inline font-mono text-cyan-900 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            STT {idx + 1}
                          </span>
                          <span className="text-[11px] text-cyan-700 font-medium">Tổ chức trung gian</span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-cyan-800 transition-colors text-sm line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400">Địa chỉ:</span> {item.address || 'Thành phố Đà Nẵng'}
                        </div>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Đơn vị hỗ trợ</span>
                        <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5.3 DỰ ÁN KHỞI NGHIỆP (3 dữ liệu con mới nhất) */}
            {/* Các trường: STT, Tên dự án khởi nghiệp, Địa chỉ hoạt động, Lĩnh vực khởi nghiệp, Tóm tắt, Sản phẩm giải quyết vấn đề gì, Số thành viên, Người đứng đầu (SĐT, Email), Nơi ươm tạo, Năm bắt đầu */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startup_projects') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Dự án khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startup_projects')}
                    className="text-xs text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalProjects || 0}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredProjects.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-mono text-slate-500">Năm {item.startYear || '2024'}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-sm line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div><span className="text-slate-400">Lĩnh vực:</span> <strong>{item.field}</strong></div>
                          <div><span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName}</div>
                          <div className="truncate"><span className="text-slate-400">Ươm tạo từ:</span> {item.incubator || 'Trung tâm ĐMST Đà Nẵng'}</div>
                          <div className="line-clamp-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            <span className="font-semibold text-slate-700">Giải quyết:</span> {item.problemSolved || item.description}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.memberCount || 4} thành viên</span>
                        <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5.4 Ý TƯỞNG KHỞI NGHIỆP (3 dữ liệu con mới nhất) */}
            {/* Các trường: STT, Tên ý tưởng, Địa chỉ, Lĩnh vực, Xã/phường - Trường học, Tóm tắt, Vấn đề giải quyết, Số thành viên, Người đứng đầu, SĐT, Email, GV hướng dẫn, Đơn vị */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'startup_ideas') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span>Ý tưởng khởi nghiệp</span>
                  </h3>
                  <button
                    onClick={() => onNavigateBrowse('startup_ideas')}
                    className="text-xs text-teal-800 font-semibold hover:underline"
                  >
                    Xem tất cả ({stats?.totalIdeas || 0}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredIdeas.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-yellow-400 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-amber-800 font-medium truncate max-w-[150px]">
                            {item.wardSchool || item.wardOrSchool || item.ward_or_school || item.affiliatedUnit || item.originType || 'Chưa cập nhật'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-yellow-800 transition-colors text-sm line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div><span className="text-slate-400">Lĩnh vực:</span> <strong>{item.field}</strong></div>
                          <div><span className="text-slate-400">Người đứng đầu:</span> {item.leaderName || item.ownerName}</div>
                          <div><span className="text-slate-400">GV hướng dẫn:</span> {item.mentorTeacher || 'TS. Huỳnh Tấn Đạt'}</div>
                          <div className="line-clamp-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            <span className="font-semibold text-slate-700">Giải quyết:</span> {item.problemSolved || item.description}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.memberCount || 3} thành viên</span>
                        <span className="text-teal-800 font-semibold group-hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5.5 DANH SÁCH XÃ/PHƯỜNG - BẢNG CÔNG KHAI */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'wards') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /><span>Danh sách xã/phường/đặc khu</span></h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{featuredWards.length} đơn vị</span>
                </div>
                <div className="max-h-[500px] overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[850px] text-xs text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-14 text-center">STT</th>
                        <th className="px-3 py-3 min-w-[210px]">Tên xã/phường/đặc khu (*)</th>
                        <th className="px-3 py-3 min-w-[220px]">Địa chỉ (*)</th>
                        <th className="px-3 py-3 min-w-[190px]">Thông tin liên hệ (*)</th>
                        <th className="px-3 py-3 min-w-[180px]">Website</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {featuredWards.map((item, idx) => {
                        const website = publicWebsite(item);
                        return (
                          <tr key={item.id} className="hover:bg-indigo-50/40">
                            <td className="px-3 py-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800">{item.title || item.name || item.wardName || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.address || item.operatingAddress || item.operating_address || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600 break-all">{publicEmail(item)}</td>
                            <td className="px-3 py-3">{website ? <a href={websiteHref(String(website))} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">{website}</a> : <span className="text-slate-400">Chưa cập nhật</span>}</td>
                          </tr>
                        );
                      })}
                      {!featuredWards.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Chưa có dữ liệu công khai.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5.6 TRƯỜNG ĐẠI HỌC/CAO ĐẲNG - BẢNG CÔNG KHAI */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'universities') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><School className="w-4 h-4 text-violet-600" /><span>Trường Đại học/Cao đẳng</span></h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{featuredUniversities.length} trường</span>
                </div>
                <div className="max-h-[500px] overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[1050px] text-xs text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-14 text-center">STT</th>
                        <th className="px-3 py-3 min-w-[220px]">Tên trường (*)</th>
                        <th className="px-3 py-3 min-w-[170px]">Thuộc xã/phường (*)</th>
                        <th className="px-3 py-3 min-w-[230px]">Địa chỉ (*)</th>
                        <th className="px-3 py-3 min-w-[190px]">Thông tin liên hệ (*)</th>
                        <th className="px-3 py-3 min-w-[180px]">Website</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {featuredUniversities.map((item, idx) => {
                        const website = publicWebsite(item);
                        return (
                          <tr key={item.id} className="hover:bg-violet-50/40">
                            <td className="px-3 py-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800">{item.title || item.name || item.schoolName || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.ward || item.wardName || item.ward_name || item.wardSchool || item.ward_school || item.administrativeUnit || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.address || item.operatingAddress || item.operating_address || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600 break-all">{publicEmail(item)}</td>
                            <td className="px-3 py-3">{website ? <a href={websiteHref(String(website))} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">{website}</a> : <span className="text-slate-400">Chưa cập nhật</span>}</td>
                          </tr>
                        );
                      })}
                      {!featuredUniversities.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Chưa có dữ liệu công khai.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5.7 DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU - BẢNG CÔNG KHAI */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'featured_startups') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-600" /><span>Doanh nghiệp khởi nghiệp tiêu biểu</span></h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{featuredPopularStartups.length} doanh nghiệp</span>
                </div>
                <div className="max-h-[500px] overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[1450px] text-xs text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-14 text-center">STT</th>
                        <th className="px-3 py-3 min-w-[200px]">Tên doanh nghiệp (*)</th>
                        <th className="px-3 py-3 min-w-[200px]">Tên dự án (*)</th>
                        <th className="px-3 py-3 min-w-[180px]">Người đại diện dự án (*)</th>
                        <th className="px-3 py-3 min-w-[220px]">Địa chỉ (*)</th>
                        <th className="px-3 py-3 min-w-[190px]">Thông tin liên hệ (*)</th>
                        <th className="px-3 py-3 min-w-[180px]">Website</th>
                        <th className="px-3 py-3 min-w-[170px]">Thuộc xã/phường (*)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {featuredPopularStartups.map((item, idx) => {
                        const website = publicWebsite(item);
                        return (
                          <tr key={item.id} className="hover:bg-amber-50/40">
                            <td className="px-3 py-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800">{item.companyName || item.company_name || item.businessName || item.business_name || item.title || item.name || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.projectName || item.projectTitle || item.project_name || item.project || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.projectRepresentative || item.project_representative || item.representativeName || item.representative_name || item.representative || item.projectLeader || item.project_leader || item.ownerName || item.leaderName || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600">{item.address || item.operatingAddress || item.operating_address || 'Chưa cập nhật'}</td>
                            <td className="px-3 py-3 text-slate-600 break-all">{publicEmail(item)}</td>
                            <td className="px-3 py-3">{website ? <a href={websiteHref(String(website))} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">{website}</a> : <span className="text-slate-400">Chưa cập nhật</span>}</td>
                            <td className="px-3 py-3 text-slate-600">{item.ward || item.wardName || item.ward_name || item.wardSchool || item.ward_school || item.administrativeUnit || item.administrative_unit || 'Chưa cập nhật'}</td>
                          </tr>
                        );
                      })}
                      {!featuredPopularStartups.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">Chưa có dữ liệu công khai.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5.8 NHÀ ĐẦU TƯ */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'investors') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>Nhà đầu tư</span>
                  </h3>
                  <button onClick={() => onNavigateBrowse('investors')} className="text-xs text-teal-800 font-semibold hover:underline">
                    Xem tất cả ({stats?.totalInvestors || 0}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredInvestors.slice(0, 3).map((item, idx) => (
                    <div key={item.id} onClick={() => onViewDetail(item)} className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between group">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-cyan-800 font-bold">STT {idx + 1}</div>
                        <h4 className="font-bold text-slate-900 group-hover:text-cyan-800 text-sm line-clamp-2">{item.title || item.name || item.investorName || 'Nhà đầu tư'}</h4>
                        <p className="text-xs text-slate-600 line-clamp-3">{item.description || item.summary || item.investmentThesis || item.investmentFocus || 'Thông tin đang được cập nhật.'}</p>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 text-[11px] text-teal-800 font-semibold">Chi tiết →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5.9 QUỸ ĐẦU TƯ */}
            {(activeEcosystemTab === 'all' || activeEcosystemTab === 'investment_funds') && (
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Quỹ đầu tư</span>
                  </h3>
                  <button onClick={() => onNavigateBrowse('investment_funds')} className="text-xs text-teal-800 font-semibold hover:underline">
                    Xem tất cả ({stats?.totalFunds || 0}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredFunds.slice(0, 3).map((item, idx) => (
                    <div key={item.id} onClick={() => onViewDetail(item)} className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-indigo-800 font-bold">STT {idx + 1}</div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-800 text-sm line-clamp-2">{item.title || item.name || item.fundName || 'Quỹ đầu tư'}</h4>
                        <p className="text-xs text-slate-600 line-clamp-3">{item.description || item.summary || item.investmentStrategy || item.investmentFocus || 'Thông tin đang được cập nhật.'}</p>
                      </div>
                      <div className="pt-2 mt-3 border-t border-slate-200 text-[11px] text-teal-800 font-semibold">Chi tiết →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
};
