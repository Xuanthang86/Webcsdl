import React, { useState, useEffect } from 'react';
import { ModuleType } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Info, 
  Eye, 
  EyeOff, 
  Edit2, 
  Check, 
  X,
  Layers
} from 'lucide-react';

interface CustomField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  helpText?: string;
  isHidden?: boolean;
}

// Standard system fields for modules
const STANDARD_FIELDS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'code', label: 'Mã số quản lý định danh', desc: 'Mã hồ sơ định danh duy nhất (vd: DT-2026-001)' },
  { key: 'field', label: 'Lĩnh vực chuyên ngành', desc: 'Lĩnh vực nghiên cứu hoặc ứng dụng KH&CN' },
  { key: 'ownerName', label: 'Chủ trì / Tác giả / Đơn vị sở hữu', desc: 'Tên cơ quan, doanh nghiệp hoặc cá nhân chủ trì' },
  { key: 'source', label: 'Nguồn gốc dữ liệu & Quyết định', desc: 'Văn bản căn cứ pháp lý hoặc nguồn gốc hồ sơ' },
  { key: 'description', label: 'Mô tả tóm tắt nội dung', desc: 'Tóm lược nội dung, mục tiêu hoặc giải pháp' },
  { key: 'verificationStatus', label: 'Trạng thái xác minh thẩm định', desc: 'Xác minh chính thức từ Hội đồng hoặc Cơ quan' },
  { key: 'publicityLevel', label: 'Phạm vi công khai', desc: 'Công khai toàn dân hoặc hạn chế' },
  { key: 'history', label: 'Nhật ký truy vết quy trình', desc: 'Lịch sử tiếp nhận, thẩm định và phê duyệt' }
];

export const FormConfigView: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>('initiatives');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [hiddenSystemFields, setHiddenSystemFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New field inputs
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomField['fieldType']>('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newHelp, setNewHelp] = useState('');
  const [newOptions, setNewOptions] = useState('');

  // Editing state for an existing custom field
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editHelp, setEditHelp] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await api.getFormConfig(selectedModule);
      setCustomFields(cfg.customFields || []);
      setHiddenSystemFields(cfg.hiddenSystemFields || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [selectedModule]);

  const handleToggleSystemField = (fieldKey: string) => {
    if (hiddenSystemFields.includes(fieldKey)) {
      setHiddenSystemFields(hiddenSystemFields.filter(k => k !== fieldKey));
    } else {
      setHiddenSystemFields([...hiddenSystemFields, fieldKey]);
    }
  };

  const handleToggleCustomField = (id: string) => {
    setCustomFields(customFields.map(f => {
      if (f.id === id) {
        return { ...f, isHidden: !f.isHidden };
      }
      return f;
    }));
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newLabel) return;

    const formattedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    // Prevent duplicate keys
    if (customFields.some(f => f.fieldKey === formattedKey)) {
      alert(`Mã trường "${formattedKey}" đã tồn tại.`);
      return;
    }

    const newField: CustomField = {
      id: `field_${Date.now()}`,
      fieldKey: formattedKey,
      fieldLabel: newLabel.trim(),
      fieldType: newType,
      required: newRequired,
      helpText: newHelp.trim(),
      options: newType === 'select' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      isHidden: false
    };

    setCustomFields([...customFields, newField]);
    setNewKey('');
    setNewLabel('');
    setNewHelp('');
    setNewOptions('');
    setNewRequired(false);
  };

  const handleStartEdit = (f: CustomField) => {
    setEditingFieldId(f.id);
    setEditLabel(f.fieldLabel);
    setEditHelp(f.helpText || '');
  };

  const handleSaveEdit = (id: string) => {
    setCustomFields(customFields.map(f => {
      if (f.id === id) {
        return { ...f, fieldLabel: editLabel.trim(), helpText: editHelp.trim() };
      }
      return f;
    }));
    setEditingFieldId(null);
  };

  const handleRemoveField = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa trường tùy biến này?')) return;
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const handleSaveAll = async () => {
    try {
      await api.updateFormConfig(selectedModule, {
        customFields,
        hiddenSystemFields
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cấu hình biểu mẫu');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6 text-xs">
      
      {/* Title & Save action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-teal-700" />
            <span>Cấu Hình Biểu Mẫu & Quản Lý Trường Dữ Liệu (Section VIII.3)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Tùy Biến Trường & Thiết Lập Ẩn / Hiện Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị viên có thể bật/tắt hiển thị (Ẩn/Hiện) bất kỳ trường dữ liệu nào và thêm mới các trường mở rộng
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu thành công!</span>
            </div>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </div>

      {/* Select Module */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <label className="font-semibold text-slate-700 whitespace-nowrap">
          Chọn phân hệ dữ liệu cần cấu hình:
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value as ModuleType)}
          className="h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-teal-700"
        >
          {Object.entries(MODULE_NAMES).map(([mod, name]) => (
            <option key={mod} value={mod}>{name}</option>
          ))}
        </select>
        <span className="text-slate-400 text-[11px] sm:ml-auto">
          Đang cấu hình: <strong className="text-teal-900">{MODULE_NAMES[selectedModule]}</strong>
        </span>
      </div>

      {/* 1. Standard Fields Visibility Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900 flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>1. Thiết lập Ẩn / Hiện các trường dữ liệu mặc định ({STANDARD_FIELDS.length} trường):</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click vào nút mắt để Ẩn hoặc Hiện trường khi xem chi tiết và lập biểu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {STANDARD_FIELDS.map((sf) => {
            const isHidden = hiddenSystemFields.includes(sf.key);
            return (
              <div 
                key={sf.key}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isHidden ? 'bg-slate-100 border-slate-300 opacity-60' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{sf.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">({sf.key})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{sf.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleSystemField(sf.key)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                    isHidden
                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                  }`}
                  title={isHidden ? 'Nhấn để HIỆN trường này' : 'Nhấn để ẨN trường này'}
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                      <span>Đang Ẩn</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      <span>Đang Hiện</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Add New Custom Field Form */}
      <form onSubmit={handleAddField} className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-3">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-teal-700" />
          <span>2. Thêm trường dữ liệu tùy biến mới vào phân hệ:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Mã khóa trường (Field Key) *</label>
            <input
              type="text"
              placeholder="vd: ma_so_thue, tieu_chuan_iso..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-teal-700"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Tên trường hiển thị tiếng Việt *</label>
            <input
              type="text"
              placeholder="Mã số thuế doanh nghiệp..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Kiểu dữ liệu (Data Type)</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
            >
              <option value="text">Văn bản ngắn (Text)</option>
              <option value="textarea">Văn bản dài (Textarea)</option>
              <option value="number">Số học / Tiền tệ (Number)</option>
              <option value="select">Danh mục lựa chọn (Dropdown)</option>
              <option value="boolean">Hộp kiểm Đúng/Sai (Boolean)</option>
              <option value="date">Ngày tháng (Date)</option>
            </select>
          </div>
        </div>

        {newType === 'select' && (
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Các tùy chọn (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              placeholder="Tùy chọn 1, Tùy chọn 2, Tùy chọn 3"
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Hướng dẫn nhập liệu (Placeholder)</label>
            <input
              type="text"
              placeholder="Gợi ý nội dung cần nhập cho người khai..."
              value={newHelp}
              onChange={(e) => setNewHelp(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="rounded text-teal-800 focus:ring-teal-700"
              />
              <span className="font-semibold text-slate-700">Bắt buộc nhập</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              + Thêm vào biểu mẫu
            </button>
          </div>
        </div>
      </form>

      {/* 3. Configured Custom Fields List */}
      <div className="space-y-3">
        <div className="font-bold text-slate-900">
          3. Danh sách trường tùy biến ({customFields.length} trường):
        </div>

        {customFields.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
            Chưa có trường tùy biến nào cho phân hệ này. Bạn có thể sử dụng khung phía trên để thêm trường mới.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {customFields.map((f) => (
              <div 
                key={f.id} 
                className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                  f.isHidden ? 'bg-slate-100/70 opacity-60' : 'bg-white hover:bg-slate-50'
                }`}
              >
                {editingFieldId === f.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded font-semibold w-1/3"
                      placeholder="Tên trường..."
                    />
                    <input
                      type="text"
                      value={editHelp}
                      onChange={e => setEditHelp(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded text-slate-600 flex-1"
                      placeholder="Hướng dẫn nhập liệu..."
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(f.id)}
                      className="p-1.5 bg-teal-800 text-white rounded hover:bg-teal-700"
                      title="Lưu"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFieldId(null)}
                      className="p-1.5 border border-slate-300 text-slate-500 rounded hover:bg-slate-100"
                      title="Hủy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{f.fieldLabel}</span>
                      <span className="font-mono text-[10px] text-teal-800 font-semibold">({f.fieldKey})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {f.fieldType}
                      </span>
                      {f.required && (
                        <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-1 rounded border border-red-200">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    {f.helpText && (
                      <div className="text-[11px] text-slate-500">Hướng dẫn: {f.helpText}</div>
                    )}
                    {f.options && f.options.length > 0 && (
                      <div className="text-[10px] text-slate-400">Tùy chọn: {f.options.join(', ')}</div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ẩn / Hiện button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCustomField(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      f.isHidden
                        ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                    }`}
                    title={f.isHidden ? 'Nhấn để Hiện trường' : 'Nhấn để Ẩn trường'}
                  >
                    {f.isHidden ? (
                      <>
                        <EyeOff className="w-3 h-3 text-rose-600" />
                        <span>Đang Ẩn</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-teal-600" />
                        <span>Đang Hiện</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEdit(f)}
                    title="Chỉnh sửa nhãn và hướng dẫn"
                    className="p-1.5 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRemoveField(f.id)}
                    title="Xóa trường này"
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
