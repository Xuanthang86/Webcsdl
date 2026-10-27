import React, { useState } from 'react';
import { Search, Filter, Sparkles, Database, ArrowRight } from 'lucide-react';
import { ModuleType } from '../types';

interface SearchHeroProps {
  onSearch: (params: { q: string; moduleType?: string; field?: string }) => void;
  onSelectCategory: (mod: string) => void;
  activeCategory: string;
}

export const MODULE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tất cả dữ liệu' },
  { value: 'science_tasks', label: '1. Nhiệm vụ, đề tài KH&CN' },
  { value: 'initiatives', label: '2. Sáng kiến cấp thành phố' },
  { value: 'experts', label: '3. Chuyên gia & Nhà khoa học' },
  { value: 'organizations', label: '4. Tổ chức KH&CN, Viện trường' },
  { value: 'startups', label: '5. Doanh nghiệp khởi nghiệp ĐMST' },
  { value: 'startup_projects', label: '6. Dự án khởi nghiệp' },
  { value: 'startup_ideas', label: '7. Ý tưởng khởi nghiệp & ĐMST' },
  { value: 'investors', label: '8. Nhà đầu tư' },
  { value: 'investment_funds', label: '9. Quỹ đầu tư' },
  { value: 'support_organizations', label: '10. Tổ chức hỗ trợ, Vườn ươm' },
  { value: 'technologies', label: '11. Công nghệ & Kết quả nghiên cứu' },
  { value: 'programs', label: '12. Chương trình & Cơ hội hỗ trợ' },
  { value: 'collaboration_needs', label: '13. Nhu cầu kết nối & Đặt hàng TP' },
  { value: 'patents', label: '14.1 Sáng chế & Sở hữu trí tuệ' },
  { value: 'publications', label: '14.2 Bài báo & Công bố khoa học' },
  { value: 'lab_equipments', label: '14.3 Thiết bị & Phòng thí nghiệm trọng điểm' },
  { value: 'policies', label: '14.4 Chính sách, Văn bản & Quy định KH&CN' }
];

export const POPULAR_FIELDS = [
  'Trí tuệ nhân tạo',
  'Y tế & Sức khỏe',
  'Nông nghiệp công nghệ cao',
  'Môi trường & Kinh tế tuần hoàn',
  'Vật liệu nano',
  'Chuyển đổi số đô thị'
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  onSearch,
  onSelectCategory,
  activeCategory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState(activeCategory || 'all');
  const [selectedField, setSelectedField] = useState('');

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      q: searchTerm,
      moduleType: selectedModule === 'all' ? undefined : selectedModule,
      field: selectedField || undefined
    });
  };

  const handleFieldClick = (field: string) => {
    const nextField = selectedField === field ? '' : field;
    setSelectedField(nextField);
    onSearch({
      q: searchTerm,
      moduleType: selectedModule === 'all' ? undefined : selectedModule,
      field: nextField || undefined
    });
  };

  return (
    <div className="bg-gradient-to-b from-teal-900 to-slate-900 text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-teal-800">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        
        {/* Subtle lead-in text */}
        <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-200 bg-teal-800/40 border border-teal-700/50 px-3 py-1 rounded-full">
          <Database className="w-3.5 h-3.5 text-teal-300" />
          <span>Cơ sở Dữ liệu Thống nhất & Liên kết Đa chiều Cấp Thành phố</span>
        </div>

        {/* Hero headline with balance and no orphans */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight text-balance">
          Cổng Dữ Liệu Tổng Hợp Khoa Học, Công Nghệ & Khởi Nghiệp Đổi Mới Sáng Tạo
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Nền tảng tra cứu, kết nối, khai thác dữ liệu chính thức phục vụ cơ quan quản lý nhà nước, nhà khoa học, doanh nghiệp, nhà đầu tư và người dân.
        </p>

        {/* Global Search Box Form */}
        <form onSubmit={handleExecuteSearch} className="pt-4 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-xl shadow-xl p-1.5 gap-1.5 text-slate-800 border border-slate-200">
            
            {/* Category Dropdown */}
            <div className="sm:w-60 shrink-0">
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  onSelectCategory(e.target.value);
                }}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
              >
                {MODULE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Input */}
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập từ khóa (tên đề tài, sáng kiến, chuyên gia, công nghệ, doanh nghiệp...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-lg"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="h-12 px-6 bg-teal-800 hover:bg-teal-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm whitespace-nowrap"
            >
              <span>Tìm kiếm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Keyword Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs">
            <span className="text-slate-400 font-medium">Lĩnh vực trọng điểm:</span>
            {POPULAR_FIELDS.map(f => (
              <button
                type="button"
                key={f}
                onClick={() => handleFieldClick(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedField === f
                    ? 'bg-teal-500 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

        </form>

      </div>
    </div>
  );
};
