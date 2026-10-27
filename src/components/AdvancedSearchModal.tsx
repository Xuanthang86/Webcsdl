import React, { useState } from 'react';
import { ModuleType } from '../types';
import { MODULE_OPTIONS, POPULAR_FIELDS } from './SearchHero';
import { MODULE_NAMES } from './admin/ModuleCrudView';
import { Search, Filter, X, SlidersHorizontal, CheckCircle2, RotateCcw } from 'lucide-react';

interface AdvancedSearchModalProps {
  initialModule?: string;
  onClose: () => void;
  onApplySearch: (params: {
    q: string;
    moduleType?: string;
    field?: string;
    status?: string;
    verificationStatus?: string;
    advancedFilters?: Record<string, string>;
  }) => void;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  initialModule = 'all',
  onClose,
  onApplySearch
}) => {
  const [selectedModule, setSelectedModule] = useState(initialModule);
  const [keyword, setKeyword] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [status, setStatus] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState('all');

  // Specialized filters per module
  const [codeFilter, setCodeFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [budgetRange, setBudgetRange] = useState('all'); // all, under1b, 1to5b, over5b
  const [stageFilter, setStageFilter] = useState('all');
  const [recognizedScopeFilter, setRecognizedScopeFilter] = useState('all');

  const handleReset = () => {
    setKeyword('');
    setSelectedModule('all');
    setSelectedField('');
    setStatus('all');
    setVerificationStatus('all');
    setCodeFilter('');
    setOwnerFilter('');
    setBudgetRange('all');
    setStageFilter('all');
    setRecognizedScopeFilter('all');
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySearch({
      q: keyword.trim(),
      moduleType: selectedModule === 'all' ? undefined : selectedModule,
      field: selectedField || undefined,
      status: status === 'all' ? undefined : status,
      verificationStatus: verificationStatus === 'all' ? undefined : verificationStatus,
      advancedFilters: {
        code: codeFilter,
        owner: ownerFilter,
        budgetRange,
        stage: stageFilter,
        recognizedScope: recognizedScopeFilter
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm">Tìm Kiếm Nâng Cao Theo Từng Loại Dữ Liệu</h3>
              <p className="text-[11px] text-teal-300">Bộ lọc đa tiêu chí chuyên sâu cho 17 phân hệ dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleApply} className="p-6 space-y-4 overflow-y-auto text-xs">
          
          {/* Module selector */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">1. Chọn loại cơ sở dữ liệu cần tra cứu:</label>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-teal-700"
            >
              {MODULE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">2. Từ khóa tìm kiếm (Tên đề tài, tóm tắt, giải pháp, bài toán):</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Nhập từ khóa cần tìm..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>

          {/* Field & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Lĩnh vực chuyên ngành:</label>
              <select
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-700"
              >
                <option value="">Tất cả lĩnh vực</option>
                {POPULAR_FIELDS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Trạng thái phê duyệt:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã phê duyệt chính thức</option>
                <option value="under_review">Đang thẩm định / kiểm tra</option>
                <option value="submitted">Mới nộp trực tuyến</option>
              </select>
            </div>
          </div>

          {/* Specialized Criteria per Module Type */}
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-3">
            <div className="font-bold text-teal-950 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              <span>Tiêu chí lọc chi tiết theo phân hệ đang chọn:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Mã số hồ sơ / Mã định danh:</label>
                <input
                  type="text"
                  value={codeFilter}
                  onChange={e => setCodeFilter(e.target.value)}
                  placeholder="vd: DT-2026-001, SK-2026..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Chủ trì / Tác giả / Đơn vị sở hữu:</label>
                <input
                  type="text"
                  value={ownerFilter}
                  onChange={e => setOwnerFilter(e.target.value)}
                  placeholder="Tên viện trường, doanh nghiệp, cá nhân..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Specific for Science tasks */}
              {(selectedModule === 'science_tasks' || selectedModule === 'all') && (
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Khung kinh phí NSNN phê duyệt:</label>
                  <select
                    value={budgetRange}
                    onChange={e => setBudgetRange(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">Tất cả mức kinh phí</option>
                    <option value="under1b">Dưới 1 tỷ đồng</option>
                    <option value="1to5b">Từ 1 tỷ - 5 tỷ đồng</option>
                    <option value="over5b">Trên 5 tỷ đồng</option>
                  </select>
                </div>
              )}

              {/* Specific for Initiatives */}
              {(selectedModule === 'initiatives' || selectedModule === 'all') && (
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Phạm vi công nhận sáng kiến:</label>
                  <select
                    value={recognizedScopeFilter}
                    onChange={e => setRecognizedScopeFilter(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">Tất cả phạm vi</option>
                    <option value="Cấp thành phố">Đã được UBND TP công nhận cấp thành phố</option>
                    <option value="Toàn quốc">Cấp toàn quốc</option>
                  </select>
                </div>
              )}

              {/* Specific for Startups */}
              {(selectedModule === 'startups' || selectedModule === 'startup_projects' || selectedModule === 'all') && (
                <div className="space-y-1">
                  <label className="text-slate-600 font-medium">Giai đoạn phát triển:</label>
                  <select
                    value={stageFilter}
                    onChange={e => setStageFilter(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">Tất cả giai đoạn</option>
                    <option value="seed">Hạt giống (Seed / Khởi tạo)</option>
                    <option value="mvp">Có sản phẩm thử nghiệm (MVP)</option>
                    <option value="growth">Đang tăng trưởng & gọi vốn</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Mức độ thẩm định / Xác minh:</label>
                <select
                  value={verificationStatus}
                  onChange={e => setVerificationStatus(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="verified">Đã xác minh chính thức từ Hội đồng</option>
                  <option value="pending">Đang xác minh hồ sơ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Áp dụng tìm kiếm</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
