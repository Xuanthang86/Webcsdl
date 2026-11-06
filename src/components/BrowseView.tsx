import React, { useState, useEffect, useMemo } from 'react';
import { BaseEntity, ModuleType } from '../types';
import { matchesScienceTaskLevel, normalizeScienceTaskText } from '../utils/scienceTaskFilters';
import { api } from '../services/api';
import { MODULE_OPTIONS, SPECIALIZED_FIELDS } from './SearchHero';
import { MODULE_NAMES } from './admin/ModuleCrudView';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Building, 
  User as UserIcon, 
  ArrowRight, 
  Layers, 
  Database, 
  X, 
  Table as TableIcon, 
  LayoutGrid, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  ChevronDown,
  Calendar,
  GraduationCap,
  Briefcase,
  MapPin,
  School,
  Tag,
  Star,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface BrowseViewProps {
  initialSearchQuery?: string;
  initialModule?: string;
  initialField?: string;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenSubmitModal: () => void;
}

// 10 Official Required Titles for Module Lists
export const MODULE_LIST_TITLES: Record<string, string> = {
  science_tasks: 'DANH SÁCH CÁC ĐỀ TÀI, NHIỆM VỤ KH&CN',
  initiatives: 'DANH SÁCH SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ',
  experts: 'DANH SÁCH CHUYÊN GIA',
  startups: 'DANH SÁCH CÁC DOANH NGHIỆP KHỞI NGHIỆP',
  support_organizations: 'DANH SÁCH CÁC TỔ CHỨC TRUNG GIAN',
  startup_projects: 'DANH SÁCH CÁC DỰ ÁN KHỞI NGHIỆP',
  startup_ideas: 'DANH SÁCH CÁC Ý TƯỞNG KHỞI NGHIỆP',
  wards: 'DANH SÁCH CÁC XÃ, PHƯỜNG, ĐẶC KHU TRÊN ĐỊA BÀN',
  universities: 'DANH SÁCH CÁC TRƯỜNG ĐẠI HỌC, CAO ĐẲNG TRÊN ĐỊA BÀN',
  featured_startups: 'DANH SÁCH CÁC DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU'
};

const SPECIALIZED_FIELD_KEYWORDS: Record<string, string[]> = {
  cntt_ai: ['cong nghe thong tin', 'tri tue nhan tao', 'ban dan', 'vi mach', 'chip', 'semiconductor'],
  y_duoc: ['y duoc', 'y hoc', 'duoc hoc', 'cham soc suc khoe', 'suc khoe cong dong'],
  nong_nghiep: ['nong nghiep', 'cong nghe sinh hoc', 'thuy san', 'lam nghiep', 'nong san'],
  moi_truong: ['moi truong', 'nang luong tai tao', 'kinh te tuan hoan', 'bien doi khi hau', 'tai nguyen nuoc'],
  vat_lieu: ['vat lieu moi', 'cong nghe vat lieu', 'ky thuat hoa hoc', 'polymer', 'nano'],
  co_khi: ['co khi', 'tu dong hoa', 'robot', 'che tao may', 'ky thuat co khi'],
  chinh_quyen_so: ['cai cach hanh chinh', 'quan tri do thi', 'chinh quyen so', 'do thi thong minh'],
  dmst_khoinghiep: ['doi moi sang tao', 'khoi nghiep', 'startup', 'he sinh thai khoi nghiep']
};

const matchesSpecializedField = (record: BaseEntity, selectedField: string): boolean => {
  const definition = SPECIALIZED_FIELDS.find(field => field.name === selectedField);
  if (!definition) return true;

  const searchableValues = [
    record.field, record.specialty, record.primaryField, record.researchField,
    record.scientificField, record.researchArea, record.sector, record.topic,
    record.keywords, record.category, record.technology, record.title, record.summary
  ];
  const recordText = normalizeScienceTaskText(searchableValues
    .filter(value => typeof value === 'string' && value.trim())
    .join(' '));
  const terms = [
    definition.name,
    definition.shortName,
    definition.category,
    ...(SPECIALIZED_FIELD_KEYWORDS[definition.id] || [])
  ].map(normalizeScienceTaskText).filter(term => term.length > 2);

  return terms.some(term => recordText.includes(term));
};

export const BrowseView: React.FC<BrowseViewProps> = ({
  initialSearchQuery = '',
  initialModule = 'all',
  initialField = '',
  onViewDetail,
  onOpenSubmitModal
}) => {
  const [query, setQuery] = useState(initialSearchQuery);
  const [selectedModule, setSelectedModule] = useState(initialModule);
  const [selectedField, setSelectedField] = useState(initialField);
  const [statusFilter, setStatusFilter] = useState('all');
  const [results, setResults] = useState<BaseEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Specific Sub-Filters
  const [filterYear, setFilterYear] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterAcademicRank, setFilterAcademicRank] = useState('all');
  const [filterDegree, setFilterDegree] = useState('all');
  const [filterSchoolWard, setFilterSchoolWard] = useState('all'); // 'all' | 'school' | 'ward'

  const fetchResults = async (isCurrentCheck?: () => boolean) => {
    setLoading(true);
    try {
      const data = await api.searchGlobal({
        q: query,
        moduleType: selectedModule === 'all' ? undefined : selectedModule,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      if (!isCurrentCheck || isCurrentCheck()) {
        setResults(data.results || []);
        setCurrentPage(1);
      }
    } catch (err) {
      if (!isCurrentCheck || isCurrentCheck()) {
        console.error('Lỗi tìm kiếm dữ liệu:', err);
      }
    } finally {
      if (!isCurrentCheck || isCurrentCheck()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    fetchResults(() => active);
    return () => {
      active = false;
    };
  }, [selectedModule, selectedField, statusFilter]);

  // Reset sub-filters on module change
  useEffect(() => {
    setFilterYear('all');
    setFilterUnit('all');
    setFilterLevel('all');
    setFilterSpecialty('all');
    setFilterAcademicRank('all');
    setFilterDegree('all');
    setFilterSchoolWard('all');
    setCurrentPage(1);
  }, [selectedModule]);

  // Synchronize with external prop triggers
  useEffect(() => {
    if (initialModule) setSelectedModule(initialModule);
  }, [initialModule]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialField !== undefined) setSelectedField(initialField);
  }, [initialField]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const handleApplyAdvancedSearch = (params: any) => {
    setQuery(params.q || '');
    if (params.moduleType) setSelectedModule(params.moduleType);
    if (params.field) setSelectedField(params.field);
    if (params.status) setStatusFilter(params.status);
    fetchResults();
  };

  // Derive unique values for sub-filter dropdowns
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      if (r.recognitionYear) set.add(String(r.recognitionYear));
      if (r.year) set.add(String(r.year));
      if (r.foundedYear) set.add(String(r.foundedYear));
      if (r.startYear) set.add(String(r.startYear));
      if (r.birthYear) set.add(String(r.birthYear));
    });
    return Array.from(set).sort().reverse();
  }, [results]);

  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      [
        r.leadOrganization, r.ownerName, r.proposingOrg, r.workplace,
        r.organization, r.managingAgency, r.hostOrganization, r.coordinatingOrganization
      ].forEach(value => {
        if (typeof value === 'string' && value.trim().length > 2) set.add(value.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [results]);

  const filteredUnitSuggestions = useMemo(() => {
    const unitQuery = normalizeScienceTaskText(filterUnit === 'all' ? '' : filterUnit);
    return availableUnits
      .filter(unit => !unitQuery || normalizeScienceTaskText(unit).includes(unitQuery))
      .slice(0, 30);
  }, [availableUnits, filterUnit]);

  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      const s = r.specialty || r.primaryField;
      if (s && typeof s === 'string') set.add(s);
    });
    return Array.from(set).sort();
  }, [results]);

  const unclassifiedScienceTaskCount = useMemo(
    () => results.filter(record => matchesScienceTaskLevel(record, 'Chưa phân loại')).length,
    [results]
  );

  // Filtered & Sorted items
  const processedResults = useMemo(() => {
    let list = [...results];

    // Sub-filters
    if (filterYear !== 'all') {
      list = list.filter(r => 
        String(r.recognitionYear || r.year || r.foundedYear || r.startYear || r.birthYear) === filterYear ||
        (r.executionTime && r.executionTime.includes(filterYear))
      );
    }

    if (filterUnit !== 'all' && filterUnit.trim()) {
      const unitQuery = normalizeScienceTaskText(filterUnit);
      list = list.filter(r => {
        const unitValues = [
          r.leadOrganization, r.ownerName, r.proposingOrg, r.workplace,
          r.organization, r.managingAgency, r.hostOrganization, r.coordinatingOrganization
        ];
        return unitValues.some(value =>
          typeof value === 'string' && normalizeScienceTaskText(value).includes(unitQuery)
        );
      });
    }

    if (filterLevel !== 'all') {
      list = list.filter(r => matchesScienceTaskLevel(r, filterLevel));
    }

    if (selectedField) {
      list = list.filter(record => matchesSpecializedField(record, selectedField));
    }

    if (filterSpecialty !== 'all') {
      list = list.filter(r => {
        const sp = (r.specialty || r.primaryField || '').toLowerCase();
        return sp.includes(filterSpecialty.toLowerCase());
      });
    }

    if (filterAcademicRank !== 'all') {
      list = list.filter(r => {
        const rank = ((r.academicRank || '') + ' ' + (r.title || '')).toLowerCase();
        return rank.includes(filterAcademicRank.toLowerCase());
      });
    }

    if (filterDegree !== 'all') {
      list = list.filter(r => {
        const deg = ((r.degree || '') + ' ' + (r.title || '')).toLowerCase();
        return deg.includes(filterDegree.toLowerCase());
      });
    }

    if (filterSchoolWard !== 'all') {
      list = list.filter(r => {
        const text = ((r.wardSchool || '') + ' ' + (r.originType || '') + ' ' + (r.incubator || '') + ' ' + (r.currentAffiliation || '') + ' ' + (r.address || '')).toLowerCase();
        if (filterSchoolWard === 'school') {
          return text.includes('trường') || text.includes('đại học') || text.includes('cao đẳng') || text.includes('viện');
        }
        if (filterSchoolWard === 'ward') {
          return text.includes('xã') || text.includes('phường') || text.includes('đặc khu') || text.includes('quận');
        }
        return true;
      });
    }

    // MANDATORY REQUIREMENT: Wards sorting priority: Phường -> Xã -> Đặc khu
    if (selectedModule === 'wards') {
      list.sort((a, b) => {
        const getRank = (item: BaseEntity) => {
          const t = ((item.title || '') + ' ' + (item.areaType || '') + ' ' + (item.address || '')).toLowerCase();
          if (t.includes('phường')) return 1;
          if (t.includes('xã')) return 2;
          if (t.includes('đặc khu')) return 3;
          return 4;
        };
        const rankA = getRank(a);
        const rankB = getRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return (a.title || '').localeCompare(b.title || '', 'vi');
      });
    }

    // MANDATORY REQUIREMENT: Universities sorting priority: Đại học -> Cao đẳng
    if (selectedModule === 'universities') {
      list.sort((a, b) => {
        const getRank = (item: BaseEntity) => {
          const t = ((item.title || '') + ' ' + (item.institutionType || '') + ' ' + (item.level || '')).toLowerCase();
          if (t.includes('đại học')) return 1;
          if (t.includes('cao đẳng')) return 2;
          return 3;
        };
        const rankA = getRank(a);
        const rankB = getRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return (a.title || '').localeCompare(b.title || '', 'vi');
      });
    }

    return list;
  }, [
    results,
    selectedModule,
    selectedField,
    filterYear,
    filterUnit,
    filterLevel,
    filterSpecialty,
    filterAcademicRank,
    filterDegree,
    filterSchoolWard
  ]);

  // Grouped results when selectedModule === 'all'
  const groupedResults = useMemo(() => {
    if (selectedModule !== 'all') return null;
    const groups: Record<string, BaseEntity[]> = {};
    for (const item of results) {
      const mod = item.moduleType;
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(item);
    }
    return groups;
  }, [results, selectedModule]);

  // Keep public pagination compact when the result set spans many pages.
  const totalPages = Math.ceil(processedResults.length / pageSize);
  const paginationItems: Array<number | 'ellipsis-start' | 'ellipsis-end'> = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages];
  })();

  const formatModuleTitle = (mod: string) => {
    if (mod === 'all') return 'Tra cứu dữ liệu toàn hệ thống (phân loại từng phân hệ)';
    if (MODULE_LIST_TITLES[mod]) return MODULE_LIST_TITLES[mod];
    const name = MODULE_NAMES[mod as ModuleType];
    return name ? `DANH SÁCH ${name.toUpperCase()}` : `DANH SÁCH ${mod.toUpperCase()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-x-hidden">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatModuleTitle(selectedModule)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu dữ liệu chính thống, lọc phân loại theo các tiêu chí chuẩn hóa và trích xuất hồ sơ chi tiết.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAdvancedModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
            <span>Tìm kiếm nâng cao</span>
          </button>

          <button
            onClick={onOpenSubmitModal}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
          >
            <span>Nộp sáng kiến trực tuyến</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          
          <div className="sm:w-72 shrink-0">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
            >
              {MODULE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm (tên đề tài, sáng kiến, chuyên gia, đơn vị, mã số, người đứng đầu...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <button
            type="submit"
            className="h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Specialized Field Dropdown Toggle & View Mode */}
        <div className="pt-3 border-t border-slate-100 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFieldsPanel(!showFieldsPanel)}
                className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                  selectedField 
                    ? 'bg-teal-800 text-white border-teal-700' 
                    : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
                }`}
                title="Mở danh sách Lĩnh vực chuyên ngành"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {selectedField 
                    ? `Lĩnh vực: ${SPECIALIZED_FIELDS.find(f => f.name === selectedField)?.shortName || selectedField}` 
                    : 'Lĩnh vực chuyên ngành'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFieldsPanel ? 'rotate-180' : ''}`} />
              </button>

              {selectedField && (
                <button
                  type="button"
                  onClick={() => setSelectedField('')}
                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Bỏ chọn</span>
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2 text-slate-500 text-xs">
              {selectedModule !== 'all' && (
                <>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        viewMode === 'table' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Xem dạng bảng chuẩn hoá"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Dạng bảng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        viewMode === 'grid' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Xem dạng thẻ"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Dạng thẻ</span>
                    </button>
                  </div>

                  <a
                    href={`/api/export/${selectedModule}`}
                    download
                    className="px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs"
                    title="Xuất tệp CSV dữ liệu theo biểu mẫu chuẩn"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xuất CSV</span>
                  </a>

                  <button
                    onClick={() => setSelectedModule('all')}
                    className="text-teal-800 font-semibold hover:underline cursor-pointer shrink-0 whitespace-nowrap text-[11px] sm:text-xs"
                  >
                    ← Tất cả phân hệ
                  </button>
                </>
              )}
              <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs">Tổng cộng: <strong className="text-slate-900 font-bold">{processedResults.length}</strong> kết quả</span>
            </div>
          </div>

          {/* =========================================================================
              CUSTOM SUB-FILTERS SPECIFICALLY REQUESTED FOR EACH MODULE
             ========================================================================= */}
          {selectedModule !== 'all' && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-teal-700" />
                <span>Bộ lọc phân loại:</span>
              </span>

              {/* 1. Science Tasks Filters: theo năm, theo lĩnh vực, theo đơn vị, theo cấp */}
              {selectedModule === 'science_tasks' && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Năm:</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả năm</option>
                      {['2026', '2025', '2024', '2023', '2022', '2021'].map(yr => (
                        <option key={yr} value={yr}>Năm {yr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Cấp quản lý:</span>
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả cấp</option>
                      <option value="Cấp Quốc gia">Cấp Quốc gia</option>
                      <option value="Cấp Thành phố">Cấp Thành phố</option>
                      <option value="Cấp Cơ sở">Cấp Cơ sở</option>
                      <option value="Chưa phân loại">Chưa phân loại ({unclassifiedScienceTaskCount})</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 min-w-0 w-full sm:w-auto sm:flex-1">
                    <span className="text-slate-500 whitespace-nowrap">Đơn vị chủ trì:</span>
                    <div
                      className="relative min-w-0 flex-1 sm:max-w-[320px]"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setShowUnitSuggestions(false);
                        }
                      }}
                    >
                      <input
                        type="search"
                        value={filterUnit === 'all' ? '' : filterUnit}
                        onFocus={() => setShowUnitSuggestions(true)}
                        onChange={(event) => {
                          setFilterUnit(event.target.value.trim() ? event.target.value : 'all');
                          setCurrentPage(1);
                          setShowUnitSuggestions(true);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setFilterUnit('all');
                            setShowUnitSuggestions(false);
                          }
                        }}
                        placeholder="Gõ để tìm đơn vị chủ trì..."
                        aria-label="Tìm và lọc theo đơn vị chủ trì"
                        aria-expanded={showUnitSuggestions}
                        autoComplete="off"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-medium min-w-0"
                      />
                      {showUnitSuggestions && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                          {filteredUnitSuggestions.length > 0 ? filteredUnitSuggestions.map(unit => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => {
                                setFilterUnit(unit);
                                setCurrentPage(1);
                                setShowUnitSuggestions(false);
                              }}
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                            >
                              {unit}
                            </button>
                          )) : (
                            <div className="px-3 py-2 text-xs text-slate-500">Không có đơn vị phù hợp.</div>
                          )}
                        </div>
                      )}
                    </div>
                    {filterUnit !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterUnit('all');
                          setCurrentPage(1);
                          setShowUnitSuggestions(false);
                        }}
                        className="text-teal-800 hover:text-teal-950 font-semibold whitespace-nowrap"
                        aria-label="Xóa bộ lọc đơn vị"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* 2. Initiatives Filters: theo đơn vị, theo lĩnh vực, theo năm */}
              {selectedModule === 'initiatives' && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Năm công nhận:</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả năm</option>
                      {['2026', '2025', '2024', '2023', '2022', '2021'].map(yr => (
                        <option key={yr} value={yr}>Năm {yr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Đơn vị / Chủ sở hữu:</span>
                    <select
                      value={filterUnit}
                      onChange={(e) => setFilterUnit(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium max-w-[200px] truncate cursor-pointer"
                    >
                      <option value="all">Tất cả đơn vị</option>
                      {availableUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 3. Experts Filters: theo đơn vị, theo lĩnh vực, theo chuyên ngành, theo học hàm, theo học vị, theo năm */}
              {selectedModule === 'experts' && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Học hàm:</span>
                    <select
                      value={filterAcademicRank}
                      onChange={(e) => setFilterAcademicRank(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả học hàm</option>
                      <option value="Giáo sư">Giáo sư (GS)</option>
                      <option value="Phó Giáo sư">Phó Giáo sư (PGS)</option>
                      <option value="Chuyên gia">Chuyên gia cao cấp</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Học vị:</span>
                    <select
                      value={filterDegree}
                      onChange={(e) => setFilterDegree(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả học vị</option>
                      <option value="Tiến sĩ">Tiến sĩ (TS/TSKH)</option>
                      <option value="Thạc sĩ">Thạc sĩ (ThS)</option>
                      <option value="Bác sĩ CKII">Bác sĩ CKII</option>
                      <option value="Kỹ sư">Kỹ sư / Cử nhân</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Chuyên ngành:</span>
                    <select
                      value={filterSpecialty}
                      onChange={(e) => setFilterSpecialty(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium max-w-[180px] truncate cursor-pointer"
                    >
                      <option value="all">Tất cả chuyên ngành</option>
                      {availableSpecialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Đơn vị công tác:</span>
                    <select
                      value={filterUnit}
                      onChange={(e) => setFilterUnit(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium max-w-[180px] truncate cursor-pointer"
                    >
                      <option value="all">Tất cả đơn vị</option>
                      {availableUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Năm sinh / Bắt đầu:</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="all">Tất cả năm</option>
                      {['1990', '1985', '1980', '1975', '1970', '1965'].map(yr => (
                        <option key={yr} value={yr}>Thập niên {yr}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 4. Startups, Startup Projects, Startup Ideas: Phân loại theo trường học và xã/phường */}
              {['startups', 'startup_projects', 'startup_ideas'].includes(selectedModule) && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Nguồn gốc phân loại:</span>
                  <select
                    value={filterSchoolWard}
                    onChange={(e) => setFilterSchoolWard(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="all">Tất cả (Trường học & Xã/phường)</option>
                    <option value="school">Từ Trường học / Viện trường</option>
                    <option value="ward">Từ Xã / Phường địa bàn</option>
                  </select>
                </div>
              )}

              {/* Clear filters button */}
              {(filterYear !== 'all' || filterUnit !== 'all' || filterLevel !== 'all' || filterSpecialty !== 'all' || filterAcademicRank !== 'all' || filterDegree !== 'all' || filterSchoolWard !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterYear('all');
                    setFilterUnit('all');
                    setFilterLevel('all');
                    setFilterSpecialty('all');
                    setFilterAcademicRank('all');
                    setFilterDegree('all');
                    setFilterSchoolWard('all');
                  }}
                  className="text-rose-700 hover:text-rose-900 font-semibold ml-auto flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          )}

          {/* Active Field Filter Indicator */}
          {selectedField && (
            <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
              <span className="font-semibold">Đang lọc theo Lĩnh vực chuyên ngành:</span>
              <span className="font-bold underline">{selectedField}</span>
              <button
                onClick={() => setSelectedField('')}
                className="ml-auto text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Bỏ lọc</span>
              </button>
            </div>
          )}

          {/* Expandable Panel of 8 Standardized Disciplines */}
          {showFieldsPanel && (
            <div className="p-4 bg-slate-50 border border-teal-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>Chọn lĩnh vực chuyên ngành chuẩn hoá để tra cứu:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFieldsPanel(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Đóng ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {SPECIALIZED_FIELDS.map(sf => {
                  const isSelected = selectedField === sf.name;
                  return (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => {
                        setSelectedField(isSelected ? '' : sf.name);
                        setShowFieldsPanel(false);
                      }}
                      className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-700 font-semibold shadow-xs'
                          : 'bg-white hover:bg-teal-50/50 text-slate-800 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 mb-0.5">
                          Lĩnh vực {sf.id}
                        </div>
                        <div className="text-xs font-medium leading-snug">{sf.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          GROUPED OVERVIEW (WHEN selectedModule === 'all')
         ========================================================================= */}
      {selectedModule === 'all' && groupedResults ? (
        <div className="space-y-10">
          {Object.entries(groupedResults).map(([modKey, modItems]) => {
            const modTitle = MODULE_LIST_TITLES[modKey] || `DANH SÁCH ${modKey.toUpperCase()}`;
            const displayItems = modItems.slice(0, 5);
            const remainingCount = modItems.length - 5;

            return (
              <section key={modKey} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-bold text-sm tracking-tight">
                      {modTitle}
                    </h2>
                    <span className="text-[11px] font-mono bg-teal-700/60 text-teal-200 px-2 py-0.5 rounded border border-teal-500/40">
                      {modItems.length} bản ghi
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedModule(modKey);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-teal-200 hover:text-white flex items-center gap-1 group self-end sm:self-auto bg-teal-800/80 hover:bg-teal-700 px-3 py-1.5 rounded-lg border border-teal-600/40 transition-colors cursor-pointer"
                  >
                    <span>Xem toàn bộ danh sách ({modItems.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-mono text-teal-800 font-semibold">{item.code}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.field || 'Đa ngành'}</span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.description || item.problemSolved || 'Chưa cập nhật nội dung tóm tắt.'}
                        </p>

                        <div className="pt-2 border-t border-slate-100 space-y-0.5 text-xs text-slate-500">
                          <div className="truncate">
                            <span className="text-slate-400">Đơn vị / Tác giả:</span> {item.ownerName || item.leadOrganization || item.workplace || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        {item.moduleType !== 'experts' ? (
                          <span className="text-[11px] flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã xác minh
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-700 font-medium">Hồ sơ chuyên gia</span>
                        )}
                        <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                          Chi tiết
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {remainingCount > 0 && (
                  <div className="text-center pt-1 pb-3">
                    <button
                      onClick={() => {
                        setSelectedModule(modKey);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <span>Xem toàn bộ {modItems.length} bản ghi của {modTitle}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
            SINGLE MODULE VIEW: TABLE OR GRID
           ========================================================================= */
        <div className="space-y-6">
          {processedResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-base font-bold text-slate-800">Không tìm thấy dữ liệu phù hợp</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Không có bản ghi nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại. Hãy thử đặt lại bộ lọc hoặc chọn tất cả phân hệ.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedField('');
                    setStatusFilter('all');
                    setFilterYear('all');
                    setFilterUnit('all');
                    setFilterLevel('all');
                    setFilterSpecialty('all');
                    setFilterAcademicRank('all');
                    setFilterDegree('all');
                    setFilterSchoolWard('all');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModule('all')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <span>Xem tất cả phân hệ</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <>
              {/* MOBILE ADAPTIVE CARDS (block md:hidden):
                  No STT prefix displayed on mobile;
                  Title spreads evenly across 100% width with no left compression;
                  Metadata and direct 'Xem chi tiết' button without horizontal scrolling */}
              <div className="block md:hidden space-y-3">
                {processedResults.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
                        <span className="font-mono text-teal-800 font-semibold">{item.code || item.field || 'CSDL'}</span>
                        {item.managementLevel && (
                          <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {item.managementLevel}
                          </span>
                        )}
                        {item.recognitionYear && (
                          <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Năm {item.recognitionYear}
                          </span>
                        )}
                        {item.birthYear && (
                          <span className="font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Sinh năm {item.birthYear}
                          </span>
                        )}
                      </div>

                      {/* Tiêu đề trải đều toàn bộ bề ngang màn hình, không bị ép 1 bên trái */}
                      <h3
                        onClick={() => onViewDetail(item)}
                        className="w-full text-sm font-bold text-slate-900 hover:text-teal-800 cursor-pointer leading-snug break-words"
                      >
                        {item.title}
                      </h3>

                      {/* Chi tiết các trường dữ liệu */}
                      <div className="space-y-1 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                        {selectedModule === 'science_tasks' && (
                          <>
                            <div><span className="text-slate-400">Cơ quan chủ trì:</span> <span className="font-medium text-slate-800">{item.leadOrganization || item.ownerName || '—'}</span></div>
                            <div><span className="text-slate-400">Chủ nhiệm đề tài:</span> <span className="font-semibold text-slate-900">{item.principalInvestigator || '—'}</span></div>
                            <div><span className="text-slate-400">Thời gian:</span> <span className="font-mono text-slate-800">{item.executionTime || item.actualDuration || '18 tháng'}</span></div>
                            <div><span className="text-slate-400">Lĩnh vực:</span> <span className="text-teal-800 font-medium">{item.field || 'Đa ngành'}</span></div>
                            <div>
                              <span className="text-slate-400">Trạng thái:</span>{' '}
                              <span className={`font-semibold ${
                                item.acceptanceResult === 'Đang nghiệm thu' ? 'text-amber-700' : 'text-emerald-700'
                              }`}>
                                {item.acceptanceResult === 'Đang nghiệm thu' ? 'Đang nghiệm thu' : (item.acceptanceResult === 'Đã nghiệm thu' || item.status === 'approved' || item.acceptanceResult === 'Xuất sắc' || item.acceptanceResult === 'Đạt') ? 'Đã nghiệm thu' : 'Chưa nghiệm thu'}
                              </span>
                            </div>
                          </>
                        )}
                        {selectedModule === 'initiatives' && (
                          <>
                            <div><span className="text-slate-400">Tác giả:</span> <span className="font-semibold text-slate-900">{Array.isArray(item.authors) ? item.authors.join(', ') : (item.authors || '—')}</span></div>
                            <div><span className="text-slate-400">Chủ sở hữu:</span> <span className="font-medium text-slate-800">{item.ownerName || '—'}</span></div>
                            <div><span className="text-slate-400">Địa chỉ:</span> <span className="text-slate-700">{item.ownerAddress || 'TP. Đà Nẵng'}</span></div>
                            <div><span className="text-slate-400">Lĩnh vực:</span> <span className="text-amber-800 font-medium">{item.field || '—'}</span></div>
                          </>
                        )}
                        {selectedModule === 'experts' && (
                          <>
                            <div><span className="text-slate-400">Chuyên ngành:</span> <span className="font-semibold text-slate-900">{item.specialty || item.primaryField || item.field || '—'}</span></div>
                            <div><span className="text-slate-400">Đơn vị:</span> <span className="text-slate-800">{item.workplace || item.organization || '—'}</span></div>
                          </>
                        )}
                        {!['science_tasks', 'initiatives', 'experts'].includes(selectedModule) && (
                          <>
                            {item.leadOrganization || item.ownerName ? (
                              <div><span className="text-slate-400">Đơn vị / Tác giả:</span> <span className="font-medium text-slate-800">{item.leadOrganization || item.ownerName}</span></div>
                            ) : null}
                            {item.address ? (
                              <div><span className="text-slate-400">Địa chỉ:</span> <span className="text-slate-700">{item.address}</span></div>
                            ) : null}
                            {item.field ? (
                              <div><span className="text-slate-400">Lĩnh vực:</span> <span className="text-teal-800 font-medium">{item.field}</span></div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewDetail(item)}
                      className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Xem chi tiết hồ sơ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* DESKTOP DATA TABLE (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                    
                    {/* 1. Science Tasks: STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thời gian thực hiện, Lĩnh vực, Tóm tắt đề tài */}
                    {selectedModule === 'science_tasks' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[260px]">Tên đề tài</th>
                        <th className="py-3 px-4 w-32">Cấp quản lý</th>
                        <th className="py-3 px-4 w-44">Cơ quan chủ trì</th>
                        <th className="py-3 px-4 w-40">Chủ nhiệm đề tài</th>
                        <th className="py-3 px-4 w-36">Thời gian thực hiện</th>
                        <th className="py-3 px-4 w-36">Lĩnh vực</th>
                        <th className="py-3 px-4 min-w-[280px]">Tóm tắt đề tài</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 2. Initiatives: STT, Năm công nhận, Tên sáng kiến, Tác giả, Chủ sở hữu, Địa chỉ chủ sở hữu, Lĩnh vực */}
                    {selectedModule === 'initiatives' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 w-28 text-center">Năm công nhận</th>
                        <th className="py-3 px-4 min-w-[260px]">Tên sáng kiến</th>
                        <th className="py-3 px-4 w-36">Tác giả</th>
                        <th className="py-3 px-4 w-40">Chủ sở hữu</th>
                        <th className="py-3 px-4 w-44">Địa chỉ chủ sở hữu</th>
                        <th className="py-3 px-4 w-36">Lĩnh vực</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 3. Experts: STT, Tên Chuyên gia, Năm sinh, Chuyên ngành */}
                    {selectedModule === 'experts' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[240px]">Tên Chuyên gia</th>
                        <th className="py-3 px-4 w-28 text-center">Năm sinh</th>
                        <th className="py-3 px-4 min-w-[260px]">Chuyên ngành</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 4. Startups: STT, Tên doanh nghiệp, Địa chỉ hoạt động, Website, File logo, Lĩnh vực, Tóm tắt, Sản phẩm giải quyết vấn đề, Số sáng lập viên, Nhân sự, Người đứng đầu, SĐT, Email, Năm bắt đầu */}
                    {selectedModule === 'startups' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[220px]">Tên doanh nghiệp</th>
                        <th className="py-3 px-4 min-w-[180px]">Địa chỉ hoạt động</th>
                        <th className="py-3 px-4 w-32">Website</th>
                        <th className="py-3 px-3 w-16 text-center">Logo</th>
                        <th className="py-3 px-4 w-36">Lĩnh vực kinh doanh</th>
                        <th className="py-3 px-4 min-w-[240px]">Tóm tắt về DN & Sản phẩm</th>
                        <th className="py-3 px-4 min-w-[240px]">Sản phẩm giải quyết vấn đề gì</th>
                        <th className="py-3 px-3 w-24 text-center">Sáng lập viên</th>
                        <th className="py-3 px-3 w-24 text-center">Nhân sự</th>
                        <th className="py-3 px-4 w-36">Người đứng đầu</th>
                        <th className="py-3 px-4 w-32">Số điện thoại</th>
                        <th className="py-3 px-4 w-40">Email</th>
                        <th className="py-3 px-4 w-28 text-center">Năm bắt đầu</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 5. Support Organizations: STT, Tên tổ chức, Địa chỉ, Thông tin về tổ chức */}
                    {selectedModule === 'support_organizations' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[280px]">Tên tổ chức</th>
                        <th className="py-3 px-4 min-w-[260px]">Địa chỉ</th>
                        <th className="py-3 px-4 min-w-[320px]">Thông tin về tổ chức</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 6. Startup Projects: STT, Tên dự án, Lĩnh vực khởi nghiệp, Sản phẩm giải quyết vấn đề, Người đứng đầu, Dự án được ươm tạo từ tổ chức, Năm bắt đầu khởi nghiệp */}
                    {selectedModule === 'startup_projects' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[240px]">Tên dự án</th>
                        <th className="py-3 px-4 w-36">Lĩnh vực khởi nghiệp</th>
                        <th className="py-3 px-4 min-w-[260px]">Sản phẩm giải quyết vấn đề</th>
                        <th className="py-3 px-4 w-36">Người đứng đầu</th>
                        <th className="py-3 px-4 min-w-[220px]">Dự án được ươm tạo từ tổ chức</th>
                        <th className="py-3 px-4 w-28 text-center">Năm bắt đầu</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 7. Startup Ideas: STT, Tên ý tưởng, Lĩnh vực khởi nghiệp, Người đứng đầu, Giáo viên hướng dẫn */}
                    {selectedModule === 'startup_ideas' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[260px]">Tên ý tưởng</th>
                        <th className="py-3 px-4 w-36">Lĩnh vực khởi nghiệp</th>
                        <th className="py-3 px-4 w-40">Người đứng đầu</th>
                        <th className="py-3 px-4 w-40">Giáo viên hướng dẫn</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 8. Wards: STT, Tên xã/phường/đặc khu, Địa chỉ, Thông tin liên hệ, Website */}
                    {selectedModule === 'wards' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[220px]">Tên xã / phường / đặc khu</th>
                        <th className="py-3 px-4 min-w-[280px]">Địa chỉ</th>
                        <th className="py-3 px-4 w-36">Thông tin liên hệ</th>
                        <th className="py-3 px-4 w-40">Website</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 9. Universities: STT, Tên trường, Thuộc xã/ phường, Địa chỉ, Thông tin liên hệ, Website */}
                    {selectedModule === 'universities' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[260px]">Tên trường</th>
                        <th className="py-3 px-4 w-36">Thuộc xã / phường</th>
                        <th className="py-3 px-4 min-w-[280px]">Địa chỉ</th>
                        <th className="py-3 px-4 w-36">Thông tin liên hệ</th>
                        <th className="py-3 px-4 w-40">Website</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* 10. Featured Startups: STT, Tên doanh nghiệp, Tên dự án, Người đại diện dự án, Địa chỉ, Thông tin liên hệ, Website, Thuộc xã/ phường */}
                    {selectedModule === 'featured_startups' && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 min-w-[220px]">Tên doanh nghiệp</th>
                        <th className="py-3 px-4 min-w-[220px]">Tên dự án</th>
                        <th className="py-3 px-4 w-36">Người đại diện dự án</th>
                        <th className="py-3 px-4 min-w-[200px]">Địa chỉ</th>
                        <th className="py-3 px-4 w-36">Thông tin liên hệ</th>
                        <th className="py-3 px-4 w-36">Website</th>
                        <th className="py-3 px-4 w-36">Thuộc xã / phường</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}

                    {/* Other modules fallback */}
                    {!['science_tasks', 'initiatives', 'experts', 'startups', 'support_organizations', 'startup_projects', 'startup_ideas', 'wards', 'universities', 'featured_startups'].includes(selectedModule) && (
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3 w-12 text-center">STT</th>
                        <th className="py-3 px-4 w-32">Mã bản ghi</th>
                        <th className="py-3 px-4 min-w-[260px]">Tiêu đề / Tên</th>
                        <th className="py-3 px-4 w-40">Lĩnh vực</th>
                        <th className="py-3 px-4 w-44">Đơn vị / Cá nhân</th>
                        <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {processedResults.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => {
                      const stt = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="hidden sm:table-cell py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {stt}
                          </td>

                          {/* 1. Science Tasks */}
                          {selectedModule === 'science_tasks' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block leading-snug"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-teal-800 font-semibold">
                                {item.managementLevel || item.managingAgency || 'Cấp Thành phố'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.leadOrganization || item.ownerName || '—'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {item.principalInvestigator || '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                                {item.executionTime || item.actualDuration || '18 tháng'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.field || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs">
                                <p className="line-clamp-2 leading-relaxed text-[11px]">
                                  {item.description || item.summary || '—'}
                                </p>
                              </td>
                            </>
                          )}

                          {/* 2. Initiatives */}
                          {selectedModule === 'initiatives' && (
                            <>
                              <td className="py-3 px-4 text-center font-mono font-bold text-teal-800">
                                {item.recognitionYear || '2025'}
                              </td>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block leading-snug"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-800 font-medium">
                                {Array.isArray(item.authors) ? item.authors.join(', ') : (item.authors || item.implementingLead || '—')}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.ownerName || item.proposingOrg || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {item.ownerAddress || item.applicationArea || 'TP. Đà Nẵng'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.field || '—'}
                              </td>
                            </>
                          )}

                          {/* 3. Experts */}
                          {selectedModule === 'experts' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block"
                                >
                                  {item.title || item.fullName}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                                {item.birthYear || '1978'}
                              </td>
                              <td className="py-3 px-4 text-slate-800 font-medium">
                                {item.specialty || item.primaryField || item.field}
                              </td>
                            </>
                          )}

                          {/* 4. Startups */}
                          {selectedModule === 'startups' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {item.address || item.headquarters || 'TP. Đà Nẵng'}
                              </td>
                              <td className="py-3 px-4">
                                {item.website ? (
                                  <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]">
                                    {item.website.replace('https://', '')}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {item.logoUrl ? (
                                  <img src={item.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded mx-auto border border-slate-200" />
                                ) : (
                                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center mx-auto">
                                    {item.title?.charAt(0) || 'D'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.field || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs">
                                <p className="line-clamp-2 text-[11px] leading-relaxed">{item.description || item.summary || '—'}</p>
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs">
                                <p className="line-clamp-2 text-[11px] leading-relaxed">{item.problemSolved || '—'}</p>
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                                {item.founderCount || 2}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                                {item.currentStaffCount || item.teamSize || '25'}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-900">
                                {item.leaderName || item.representative || item.ownerName || '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                                {item.leaderPhone || item.publicPhone || '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-teal-800">
                                {item.leaderEmail || item.publicEmail || '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                                {item.foundedYear || item.startYear || '2023'}
                              </td>
                            </>
                          )}

                          {/* 5. Support Organizations */}
                          {selectedModule === 'support_organizations' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.address || item.headquarters || 'Số 48 Phan Đình Phùng, Hải Châu, Đà Nẵng'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-md">
                                <p className="line-clamp-2 text-[11px] leading-relaxed">
                                  {item.description || item.information || item.servicesOffered || 'Hỗ trợ ươm tạo, kết nối đầu tư và tư vấn pháp lý.'}
                                </p>
                              </td>
                            </>
                          )}

                          {/* 6. Startup Projects */}
                          {selectedModule === 'startup_projects' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block leading-snug"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.field || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs">
                                <p className="line-clamp-2 text-[11px] leading-relaxed">{item.problemSolved || item.description || '—'}</p>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {item.leaderName || (Array.isArray(item.foundingTeam) ? item.foundingTeam[0] : item.ownerName) || '—'}
                              </td>
                              <td className="py-3 px-4 text-teal-800 font-medium">
                                {item.incubator || 'Tự hình thành dự án'}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                                {item.startYear || '2024'}
                              </td>
                            </>
                          )}

                          {/* 7. Startup Ideas */}
                          {selectedModule === 'startup_ideas' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block leading-snug"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.field || '—'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {item.leaderName || item.proposer || '—'}
                              </td>
                              <td className="py-3 px-4 text-indigo-900 font-medium">
                                {item.mentorTeacher || '—'}
                              </td>
                            </>
                          )}

                          {/* 8. Wards */}
                          {selectedModule === 'wards' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer text-sm block"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.address}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                                {item.contactInfo || item.phone || '0236.3822.xxx'}
                              </td>
                              <td className="py-3 px-4">
                                {item.website ? (
                                  <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]">
                                    {item.website.replace('https://', '')}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : '—'}
                              </td>
                            </>
                          )}

                          {/* 9. Universities */}
                          {selectedModule === 'universities' && (
                            <>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer block text-sm"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-teal-800 font-semibold">
                                {item.ward || 'Thành phố Đà Nẵng'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.address}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                                {item.contactInfo || item.phone || '0236.3842.xxx'}
                              </td>
                              <td className="py-3 px-4">
                                {item.website ? (
                                  <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]">
                                    {item.website.replace('https://', '')}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : '—'}
                              </td>
                            </>
                          )}

                          {/* 10. Featured Startups */}
                          {selectedModule === 'featured_startups' && (
                            <>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="hover:text-teal-800 cursor-pointer block"
                                >
                                  {item.companyName || item.ownerName || item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-teal-800">
                                {item.title || item.projectName}
                              </td>
                              <td className="py-3 px-4 text-slate-900 font-medium">
                                {item.leaderName || item.representative || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.address || 'TP. Đà Nẵng'}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                                {item.contactInfo || item.phone || item.email || '—'}
                              </td>
                              <td className="py-3 px-4">
                                {item.website ? (
                                  <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]">
                                    {item.website.replace('https://', '')}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.ward || item.wardSchool || '—'}
                              </td>
                            </>
                          )}

                          {/* Fallback */}
                          {!['science_tasks', 'initiatives', 'experts', 'startups', 'support_organizations', 'startup_projects', 'startup_ideas', 'wards', 'universities', 'featured_startups'].includes(selectedModule) && (
                            <>
                              <td className="py-3 px-4 font-mono font-medium text-teal-800">
                                {item.code}
                              </td>
                              <td className="py-3 px-4">
                                <span 
                                  onClick={() => onViewDetail(item)}
                                  className="font-semibold text-slate-900 hover:text-teal-800 cursor-pointer block"
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {item.field || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.ownerName || item.leadOrganization || '—'}
                              </td>
                            </>
                          )}

                          {/* Action column */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onViewDetail(item)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedResults.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onViewDetail(item)}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono text-teal-800 font-semibold">{item.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{item.field || 'Đa ngành'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.description || item.problemSolved || 'Chưa cập nhật thông tin mô tả chi tiết.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-0.5 text-xs text-slate-500">
                      <div className="truncate">
                        <span className="text-slate-400">Đơn vị / Tác giả:</span> {item.ownerName || item.leadOrganization || item.workplace || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    {item.moduleType !== 'experts' && selectedModule !== 'experts' ? (
                      <span className="text-[11px] flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã xác minh
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-700 font-medium">Hồ sơ chuyên gia</span>
                    )}
                    <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                      Xem hồ sơ
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {processedResults.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-500">
                <span>
                  Hiển thị từ <strong className="text-slate-900 font-mono">{(currentPage - 1) * pageSize + 1}</strong> đến{' '}
                  <strong className="text-slate-900 font-mono">{Math.min(currentPage * pageSize, processedResults.length)}</strong> trên{' '}
                  <strong className="text-slate-900 font-mono">{processedResults.length}</strong> kết quả
                </span>
                <label className="flex items-center gap-2 whitespace-nowrap">
                  Số dòng/trang
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-slate-700"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </label>
              </div>

              {processedResults.length > pageSize && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 cursor-pointer"
                >
                  Trang trước
                </button>

                {paginationItems.map((item) => {
                  if (typeof item !== 'number') {
                    return (
                      <span key={item} className="px-1 text-slate-400 select-none" aria-hidden="true">
                        …
                      </span>
                    );
                  }
                  const pageNum = item;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      aria-label={`Trang ${pageNum}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 180, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-lg font-medium font-mono text-xs cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-teal-800 text-white font-bold'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedModal && (
        <AdvancedSearchModal
          initialModule={selectedModule}
          onClose={() => setShowAdvancedModal(false)}
          onApplySearch={handleApplyAdvancedSearch}
        />
      )}

    </div>
  );
};
