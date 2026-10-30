import React, { useState } from 'react';
import { Search, Sparkles, Database, ArrowRight, ChevronDown, Check, Layers } from 'lucide-react';

interface SearchHeroProps {
  onSearch: (params: { q: string; moduleType?: string; field?: string }) => void;
  onSelectCategory?: (mod: string) => void;
  activeCategory?: string;
}

export const MODULE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tất cả dữ liệu' },
  { value: 'science_tasks', label: '1. Nhiệm vụ, Đề tài KH&CN' },
  { value: 'initiatives', label: '2. Sáng kiến có tác dụng, ảnh hưởng đối với thành phố' },
  { value: 'patents', label: '3. Sáng chế & Sở hữu trí tuệ' },
  { value: 'experts', label: '4. Chuyên gia & Nhà khoa học' },
  { value: 'startups', label: '5.1 Doanh nghiệp khởi nghiệp' },
  { value: 'startup_projects', label: '5.2 Dự án khởi nghiệp' },
  { value: 'startup_ideas', label: '5.3 Ý tưởng khởi nghiệp' },
  { value: 'investors', label: '5.4 Nhà đầu tư' },
  { value: 'investment_funds', label: '5.5 Quỹ đầu tư' },
  { value: 'support_organizations', label: '5.6 Tổ chức hỗ trợ, Vườn ươm' },
  { value: 'programs', label: '5.7 Chương trình hỗ trợ & Cơ hội hỗ trợ' },
  { value: 'organizations', label: 'Tổ chức KH&CN, Viện trường' },
  { value: 'publications', label: 'Bài báo & Công bố khoa học' },
  { value: 'technologies', label: 'Công nghệ & Kết quả nghiên cứu' },
  { value: 'collaboration_needs', label: 'Tra cứu nhu cầu kết nối & đặt hàng' },
  { value: 'lab_equipments', label: 'Thiết bị & Phòng thí nghiệm trọng điểm' },
  { value: 'policies', label: 'Chính sách, Văn bản & Quy định' }
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
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      q: searchTerm,
      field: selectedField || undefined
    });
  };

  const handleSelectSpecializedField = (fieldName: string) => {
    const nextField = selectedField === fieldName ? '' : fieldName;
    setSelectedField(nextField);
    onSearch({
      q: searchTerm,
      field: nextField || undefined
    });
  };

  return (
    <div className="bg-gradient-to-b from-teal-900 to-slate-900 text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        
        {/* Lead-in badge with responsive font size */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm md:text-base font-semibold text-teal-200 bg-teal-800/40 border border-teal-700/50 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-xs">
          <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-300 shrink-0" />
          <span>Hệ thống Cơ sở dữ liệu thống nhất & tập trung thành phố Đà Nẵng</span>
        </div>

        {/* Portal Headline */}
        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight break-words">
          Cổng dữ liệu Tổng hợp về khoa học, công nghệ & khởi nghiệp đổi mới sáng tạo thành phố Đà Nẵng
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-3xl mx-auto font-normal leading-relaxed">
          Nền tảng tra cứu, kết nối, khai thác dữ liệu chính thức phục vụ cơ quan quản lý nhà nước, nhà khoa học, doanh nghiệp, nhà đầu tư và người dân.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleExecuteSearch} className="pt-2 max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-xl shadow-2xl p-1.5 gap-2 text-slate-800 border border-slate-200">
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm (đề tài, sáng kiến, chuyên gia, dự án, công nghệ, doanh nghiệp...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="h-11 px-4 sm:px-5 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>Tìm kiếm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Single Container for Specialized Fields */}
        <div className="pt-2 flex flex-col items-center relative">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFieldsPanel(!showFieldsPanel)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                selectedField
                  ? 'bg-teal-400 text-slate-950 border-teal-300 font-bold'
                  : 'bg-teal-800/60 hover:bg-teal-700/80 text-teal-100 border-teal-600/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-300" />
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
                onClick={() => handleSelectSpecializedField(selectedField)}
                className="text-xs text-rose-300 hover:text-white underline cursor-pointer inline-flex items-center gap-0.5"
              >
                ✕ Bỏ chọn
              </button>
            )}
          </div>

          {/* Dropdown showing the exact 8 standardized items when clicked */}
          {showFieldsPanel && (
            <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-md border border-teal-600/60 rounded-2xl p-3 shadow-2xl text-left animate-in fade-in duration-150 mt-2 z-30">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-teal-800/80 px-1">
                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Danh mục 8 Lĩnh vực chuyên ngành</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFieldsPanel(false)}
                  className="text-xs text-slate-400 hover:text-white p-1"
                >
                  Đóng ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
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
                      className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-400 font-bold shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5 hover:border-teal-500/30'
                      }`}
                    >
                      <span className="font-semibold text-slate-100">{sf.shortName}</span>
                      {isSelected && <Check className="w-4 h-4 text-teal-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
