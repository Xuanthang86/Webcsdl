import React, { useState } from 'react';
import { Search, Database, ArrowRight, ChevronDown, Check, Layers, SlidersHorizontal } from 'lucide-react';

interface SearchHeroProps {
  onSearch: (params: { q: string; moduleType?: string; field?: string }) => void;
  onSelectCategory?: (mod: string) => void;
  activeCategory?: string;
  onOpenAdvancedSearch?: () => void;
}

export const MODULE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tất cả cơ sở dữ liệu' },
  { value: 'science_tasks', label: 'Đề tài, nhiệm vụ KH&CN' },
  { value: 'initiatives', label: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố' },
  { value: 'patents', label: 'Sáng chế & Sở hữu trí tuệ' },
  { value: 'experts', label: 'Chuyên gia & Nhà khoa học' },
  { value: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo' },
  { value: 'support_organizations', label: 'Tổ chức trung gian' },
  { value: 'startup_projects', label: 'Dự án khởi nghiệp' },
  { value: 'startup_ideas', label: 'Ý tưởng khởi nghiệp' },
  { value: 'wards', label: 'Danh sách xã/phường' },
  { value: 'universities', label: 'Trường Đại học/Cao đẳng trên địa bàn' },
  { value: 'featured_startups', label: 'Doanh nghiệp khởi nghiệp tiêu biểu' }
];

export interface SpecializedField {
  id: string;
  name: string;
  shortName: string;
  category: string;
}

export const SPECIALIZED_FIELDS: SpecializedField[] = [
  { id: 'cntt_ai', name: 'Công nghệ thông tin, Trí tuệ nhân tạo & Bán dẫn', shortName: 'CNTT, AI & Bán dẫn', category: 'Khoa học Kỹ thuật và Công nghệ' },
  { id: 'y_duoc', name: 'Khoa học Y Dược & Chăm sóc sức khỏe cộng đồng', shortName: 'Y Dược & Sức khỏe', category: 'Khoa học Y, Dược' },
  { id: 'nong_nghiep', name: 'Nông nghiệp công nghệ cao & Công nghệ sinh học', shortName: 'Nông nghiệp CNC', category: 'Khoa học Nông nghiệp' },
  { id: 'moi_truong', name: 'Môi trường, Năng lượng tái tạo & Kinh tế tuần hoàn', shortName: 'Môi trường & Năng lượng', category: 'Khoa học Tự nhiên & Môi trường' },
  { id: 'vat_lieu', name: 'Công nghệ vật liệu mới & Kỹ thuật Hóa học', shortName: 'Vật liệu mới & Hóa học', category: 'Khoa học Kỹ thuật và Công nghệ' },
  { id: 'co_khi', name: 'Khoa học Kỹ thuật, Cơ khí & Tự động hóa', shortName: 'Cơ khí & Tự động hóa', category: 'Khoa học Kỹ thuật và Công nghệ' },
  { id: 'chinh_quyen_so', name: 'Cải cách hành chính & Quản trị đô thị thông minh', shortName: 'Cải cách HC & Đô thị số', category: 'Khoa học Xã hội & Quản lý' },
  { id: 'dmst_khoinghiep', name: 'Đổi mới sáng tạo & Hệ sinh thái khởi nghiệp', shortName: 'KNĐMST', category: 'Đổi mới sáng tạo' }
];

export const POPULAR_FIELDS = SPECIALIZED_FIELDS.map(f => f.name);

export const SearchHero: React.FC<SearchHeroProps> = ({
  onSearch,
  onOpenAdvancedSearch,
  activeCategory = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState(activeCategory);
  const [selectedField, setSelectedField] = useState('');
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      q: searchTerm.trim(),
      moduleType: selectedModule === 'all' ? undefined : selectedModule,
      field: selectedField || undefined
    });
  };

  const handleSelectSpecializedField = (fieldName: string) => {
    const nextField = selectedField === fieldName ? '' : fieldName;
    setSelectedField(nextField);
    onSearch({
      q: searchTerm.trim(),
      moduleType: selectedModule === 'all' ? undefined : selectedModule,
      field: nextField || undefined
    });
  };

  return (
    <div className="bg-slate-900 text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="max-w-5xl mx-auto space-y-3.5">
        
        {/* Main Search Input & Primary Filters */}
        <form onSubmit={handleExecuteSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-xl shadow-xl p-1.5 gap-2 text-slate-800 border border-slate-200">
            
            {/* Module Selector Filter */}
            <div className="sm:w-56 shrink-0 relative border-b sm:border-b-0 sm:border-r border-slate-200 pb-1.5 sm:pb-0 sm:pr-2">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full h-11 px-3 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                aria-label="Chọn loại dữ liệu tìm kiếm"
              >
                {MODULE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Input */}
            <div className="flex-1 relative flex items-center min-w-0">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm (đề tài, sáng kiến, chuyên gia, dự án, doanh nghiệp, công nghệ...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Search Execute Button */}
            <button
              type="submit"
              className="h-11 px-5 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <span>Tìm kiếm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Condition Bar: Lĩnh vực chuyên ngành + Tìm kiếm nâng cao button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Lĩnh vực chuyên ngành dropdown toggle */}
              <button
                type="button"
                onClick={() => setShowFieldsPanel(!showFieldsPanel)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  selectedField
                    ? 'bg-teal-400 text-slate-950 border-teal-300 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-teal-200 border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-300" />
                <span>
                  {selectedField 
                    ? `Lĩnh vực: ${SPECIALIZED_FIELDS.find(f => f.name === selectedField)?.shortName || selectedField}` 
                    : 'Lĩnh vực chuyên ngành'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFieldsPanel ? 'rotate-180' : ''}`} />
              </button>

              {selectedField && (
                <button
                  type="button"
                  onClick={() => handleSelectSpecializedField(selectedField)}
                  className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
                >
                  ✕ Bỏ chọn lĩnh vực
                </button>
              )}
            </div>

            {/* Nút Tìm kiếm nâng cao */}
            {onOpenAdvancedSearch && (
              <button
                type="button"
                onClick={onOpenAdvancedSearch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/80 hover:bg-teal-800 text-teal-200 hover:text-white border border-teal-700/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span>Tìm kiếm nâng cao</span>
              </button>
            )}
          </div>
        </form>

        {/* Dropdown panel showing 8 standardized fields when opened */}
        {showFieldsPanel && (
          <div className="bg-slate-800/95 backdrop-blur-md border border-teal-600/50 rounded-xl p-3 shadow-2xl text-left animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 px-1 text-xs">
              <div className="font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Danh mục 8 Lĩnh vực chuyên ngành chuẩn hóa</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFieldsPanel(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 text-xs">
              {SPECIALIZED_FIELDS.map(sf => {
                const isSelected = selectedField === sf.name;
                return (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => {
                      handleSelectSpecializedField(sf.name);
                      setShowFieldsPanel(false);
                    }}
                    className={`p-2 rounded-lg text-left transition-all border flex items-center justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-400 font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5 hover:border-teal-500/30'
                    }`}
                  >
                    <span className="font-medium text-slate-100 truncate">{sf.shortName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
