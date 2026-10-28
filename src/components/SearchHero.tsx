import React, { useState } from 'react';
import { Search, Sparkles, Database, ArrowRight } from 'lucide-react';

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
  { value: 'collaboration_needs', label: 'Nhu cầu kết nối & Đặt hàng TP' },
  { value: 'lab_equipments', label: 'Thiết bị & Phòng thí nghiệm trọng điểm' },
  { value: 'policies', label: 'Chính sách, Văn bản & Quy định' }
];

export const POPULAR_FIELDS = [
  'Trí tuệ nhân tạo & Bán dẫn',
  'Y tế & Chăm sóc sức khỏe',
  'Nông nghiệp công nghệ cao',
  'Môi trường & Kinh tế tuần hoàn',
  'Vật liệu mới',
  'Chuyển đổi số đô thị'
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('');

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      q: searchTerm,
      field: selectedField || undefined
    });
  };

  const handleFieldClick = (field: string) => {
    const nextField = selectedField === field ? '' : field;
    setSelectedField(nextField);
    onSearch({
      q: searchTerm,
      field: nextField || undefined
    });
  };

  return (
    <div className="bg-gradient-to-b from-teal-900 to-slate-900 text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-teal-800">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        
        {/* Subtle lead-in badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-200 bg-teal-800/40 border border-teal-700/50 px-3.5 py-1 rounded-full">
          <Database className="w-3.5 h-3.5 text-teal-300" />
          <span>Hệ thống Cơ sở Dữ liệu Thống nhất & Tập trung Thành phố Đà Nẵng</span>
        </div>

        {/* Top 1: Title & lead-in */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight text-balance">
          Cổng dữ liệu Tổng hợp khoa học, công nghệ & khởi nghiệp đổi mới sáng tạo
        </h1>

        <p className="text-sm sm:text-base text-slate-200 max-w-3xl mx-auto font-normal leading-relaxed">
          Nền tảng tra cứu, kết nối, khai thác dữ liệu chính thức phục vụ cơ quan quản lý nhà nước, nhà khoa học, doanh nghiệp, nhà đầu tư và người dân.
        </p>

        {/* Top 2: Clean Search Bar without redundant middle dropdown */}
        <form onSubmit={handleExecuteSearch} className="pt-3 max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-xl shadow-2xl p-1.5 gap-2 text-slate-800 border border-slate-200">
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm (đề tài, sáng kiến, chuyên gia, dự án, công nghệ, doanh nghiệp...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="h-11 px-5 bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>Tìm kiếm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Topics Tags */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Chủ đề quan tâm:</span>
          {POPULAR_FIELDS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => handleFieldClick(f)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors border ${
                selectedField === f
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
