import React, { useState, useEffect } from 'react';
import { BaseEntity, ModuleType } from '../types';
import { api } from '../services/api';
import { MODULE_OPTIONS, POPULAR_FIELDS, SPECIALIZED_FIELDS } from './SearchHero';
import { MODULE_NAMES } from './admin/ModuleCrudView';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Building, 
  User, 
  Tag, 
  Download, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Layers,
  Database,
  Check,
  X
} from 'lucide-react';

interface BrowseViewProps {
  initialSearchQuery?: string;
  initialModule?: string;
  initialField?: string;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenSubmitModal: () => void;
}

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
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const fetchResults = async (isCurrentCheck?: () => boolean) => {
    setLoading(true);
    try {
      const data = await api.searchGlobal({
        q: query,
        moduleType: selectedModule === 'all' ? undefined : selectedModule,
        field: selectedField || undefined,
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

  // Synchronize when parent navigates or passes new initial props
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

  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace('.', ',')} tỷ đ`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu đ`;
    return `${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
  };

  // Group results by module when selectedModule === 'all'
  const groupedResults = React.useMemo(() => {
    if (selectedModule !== 'all') return null;
    const groups: Record<string, BaseEntity[]> = {};
    for (const item of results) {
      const mod = item.moduleType;
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(item);
    }
    return groups;
  }, [results, selectedModule]);

  const formatModuleTitle = (mod: string) => {
    if (mod === 'all') return 'Tra cứu dữ liệu toàn hệ thống (phân loại từng phân hệ)';
    if (mod === 'collaboration_needs') return 'Tra cứu nhu cầu kết nối & đặt hàng';
    const name = MODULE_NAMES[mod as ModuleType];
    if (name) {
      return `Tra cứu ${name.charAt(0).toLowerCase() + name.slice(1)}`;
    }
    return `Tra cứu: ${mod}`;
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
            Tìm kiếm theo từ khóa, lọc chuyên sâu theo lĩnh vực và xem tối đa 5 dữ liệu mỗi phân hệ khi xem tổng thể
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAdvancedModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
            <span>Tìm kiếm nâng cao</span>
          </button>

          <button
            onClick={onOpenSubmitModal}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
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
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
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
              placeholder="Nhập từ khóa tìm kiếm (AI, y tế, tên chuyên gia, số quyết định, mã số đề tài...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <button
            type="submit"
            className="h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Quick field selector and status toggle */}
        <div className="pt-3 border-t border-slate-100 text-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFieldsPanel(!showFieldsPanel)}
                className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 transition-colors shadow-2xs ${
                  selectedField 
                    ? 'bg-teal-800 text-white border-teal-700' 
                    : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
                }`}
                title="Mở danh sách 8 Lĩnh vực chuyên ngành"
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
                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-0.5 hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Bỏ chọn</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-500 font-mono text-xs shrink-0">
              {selectedModule !== 'all' && (
                <button
                  onClick={() => setSelectedModule('all')}
                  className="text-teal-800 font-sans font-semibold hover:underline"
                >
                  ← Xem tất cả phân hệ
                </button>
              )}
              <span>Tổng cộng: <strong className="text-slate-900 text-sm font-sans">{results.length}</strong> kết quả</span>
            </div>
          </div>

          {/* Active Field Filter Indicator */}
          {selectedField && (
            <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
              <span className="font-semibold">Đang lọc theo Lĩnh vực chuyên ngành:</span>
              <span className="font-bold underline">{selectedField}</span>
              <button
                onClick={() => setSelectedField('')}
                className="ml-auto text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-0.5 hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                <span>Bỏ lọc</span>
              </button>
            </div>
          )}

          {/* Expandable Panel of 8 Standardized Disciplines when clicking 'Lĩnh vực chuyên ngành' */}
          {showFieldsPanel && (
            <div className="p-4 bg-slate-50 border border-teal-200 rounded-2xl shadow-xs animate-in fade-in duration-150 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>Chọn lĩnh vực chuyên ngành chuẩn hoá để tra cứu:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFieldsPanel(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
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
                      className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-700 font-semibold shadow-xs'
                          : 'bg-white hover:bg-teal-50/50 text-slate-800 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 mb-0.5">
                          {sf.category}
                        </div>
                        <div className={`text-xs leading-snug font-medium ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {sf.name}
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] flex items-center justify-between opacity-80 pt-1 border-t border-slate-100">
                        <span>{sf.shortName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Đang tải dữ liệu từ máy chủ thành phố...
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-slate-800">Không tìm thấy bản ghi phù hợp</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vui lòng thử tìm kiếm với từ khóa khác, hoặc mở rộng bộ lọc phân hệ dữ liệu.
          </p>
        </div>
      ) : selectedModule === 'all' && groupedResults ? (
        /* ================= GROUPED VIEW WHEN SEARCHING "ALL DATA" ================= */
        /* Yêu cầu: Có 1 dòng là tên loại dữ liệu để phân loại giữa các dữ liệu, mỗi loại dữ liệu chỉ hiển thị 5 dữ liệu và có nút click để xem thêm */
        <div className="space-y-10">
          {Object.entries(groupedResults).map(([modKey, modItems]) => {
            const modTitle = MODULE_NAMES[modKey as ModuleType] || modKey;
            const displayItems = modItems.slice(0, 5);
            const remainingCount = modItems.length - 5;

            return (
              <section key={modKey} className="space-y-4">
                {/* 1 DÒNG TÊN LOẠI DỮ LIỆU ĐỂ PHÂN LOẠI */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-xl shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-teal-300" />
                    <h2 className="font-bold text-sm tracking-tight">
                      {modTitle}
                    </h2>
                    <span className="text-[11px] font-mono bg-teal-700/60 text-teal-200 px-2 py-0.5 rounded border border-teal-500/40">
                      {modItems.length} bản ghi
                    </span>
                  </div>

                  {/* Nút xem thêm loại dữ liệu */}
                  <button
                    onClick={() => {
                      setSelectedModule(modKey);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-teal-200 hover:text-white flex items-center gap-1 group self-end sm:self-auto bg-teal-800/80 hover:bg-teal-700 px-3 py-1.5 rounded-lg border border-teal-600/40 transition-colors"
                  >
                    <span>Xem thêm {modTitle} ({modItems.length} bản ghi)</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Danh sách tối đa 5 dữ liệu của loại này */}
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
                          {item.moduleType === 'initiatives' ? (
                            <>
                              <span className="text-teal-900 font-semibold truncate">Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                                Sáng kiến đã công nhận {item.recognizedScope ? `(${item.recognizedScope})` : '(Cấp thành phố)'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="truncate">{item.field || 'Đa ngành'}</span>
                              {item.recognizedScope && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-800 font-semibold">{item.recognizedScope}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.description || item.problemSolved || 'Chưa cập nhật nội dung tóm tắt.'}
                        </p>

                        <div className="pt-2 border-t border-slate-100 space-y-0.5 text-xs text-slate-500">
                          <div className="truncate">
                            <span className="text-slate-400">Đơn vị / Tác giả:</span> {item.ownerName || item.leadOrganization || '—'}
                          </div>
                          {item.totalBudgetApproved && (
                            <div className="text-teal-800 font-mono text-[11px]">
                              <span>Kinh phí duyệt: <strong>{formatVND(item.totalBudgetApproved)}</strong></span>
                            </div>
                          )}
                          {item.costSavings && (
                            <div className="text-emerald-700 font-mono text-[11px]">
                              <span>Làm lợi: <strong>{formatVND(item.costSavings)}/năm</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px] flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã xác minh
                        </span>
                        <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                          Chi tiết
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer xem thêm của từng phân hệ */}
                {remainingCount > 0 && (
                  <div className="text-center pt-1 pb-3">
                    <button
                      onClick={() => {
                        setSelectedModule(modKey);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
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
        /* ================= SINGLE MODULE GRID VIEW ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
              <div
                key={item.id}
                onClick={() => onViewDetail(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono text-teal-800 font-semibold">{item.code}</span>
                    <span aria-hidden="true">·</span>
                    {item.moduleType === 'initiatives' ? (
                      <>
                        <span className="text-teal-900 font-semibold truncate">Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                          Sáng kiến đã công nhận {item.recognizedScope ? `(${item.recognizedScope})` : '(Cấp thành phố)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="capitalize truncate">{MODULE_NAMES[item.moduleType] || item.moduleType}</span>
                        {item.recognizedScope && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-800 font-semibold">{item.recognizedScope}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.description || item.problemSolved || 'Chưa cập nhật nội dung tóm tắt.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="text-slate-500 truncate">
                      <span className="text-slate-400">Đơn vị / Tác giả:</span> {item.ownerName || item.leadOrganization || '—'}
                    </div>
                    
                    {item.costSavings && (
                      <div className="text-emerald-700 font-mono">
                        <span className="text-slate-400 font-sans">Tiết kiệm:</span> <span className="font-bold">{formatVND(item.costSavings)}/năm</span>
                      </div>
                    )}

                    {item.totalBudgetApproved && (
                      <div className="text-teal-800 font-mono">
                        <span className="text-slate-400 font-sans">Kinh phí duyệt:</span> <span className="font-bold">{formatVND(item.totalBudgetApproved)}</span>
                      </div>
                    )}

                    {item.publicationsCount !== undefined && (
                      <div className="text-slate-700 font-mono">
                        <span className="text-slate-400 font-sans">Công bố:</span> <span className="font-bold">{item.publicationsCount} bài báo ISI/Scopus</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Xác thực chính thức
                  </span>
                  <span className="text-teal-800 font-semibold group-hover:underline flex items-center gap-1 text-[11px]">
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {results.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
              <div className="text-slate-500">
                Hiển thị từ <strong className="text-slate-900 font-mono">{(currentPage - 1) * PAGE_SIZE + 1}</strong> đến{' '}
                <strong className="text-slate-900 font-mono">{Math.min(currentPage * PAGE_SIZE, results.length)}</strong> trên{' '}
                <strong className="text-slate-900 font-mono">{results.length}</strong> kết quả
              </div>

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

                {Array.from({ length: Math.ceil(results.length / PAGE_SIZE) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
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
                  disabled={currentPage === Math.ceil(results.length / PAGE_SIZE)}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(Math.ceil(results.length / PAGE_SIZE), prev + 1));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
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
