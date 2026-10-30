import React, { useState, useEffect } from 'react';
import { ModuleType } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  EyeOff, 
  Edit2, 
  Check, 
  X,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface CustomField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  helpText?: string;
  placeholder?: string;
  isHidden?: boolean;
}

interface FieldOverride {
  label?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

// Standard system fields for modules
const STANDARD_FIELDS: Array<{ key: string; label: string; desc: string; defaultOptions?: string[] }> = [
  { 
    key: 'code', 
    label: 'Mã số quản lý định danh', 
    desc: 'Mã hồ sơ định danh duy nhất (vd: DT-2026-001, SK-TP-2026-001)' 
  },
  { 
    key: 'field', 
    label: 'Lĩnh vực chuyên ngành', 
    desc: 'Lĩnh vực nghiên cứu hoặc ứng dụng KH&CN',
    defaultOptions: [
      'CNTT, AI & Bán dẫn',
      'Y Dược & Sức khỏe',
      'Nông nghiệp CNC',
      'Môi trường & Năng lượng',
      'Vật liệu mới & Hóa học',
      'Cơ khí & Tự động hóa',
      'Cải cách HC & Đô thị số',
      'ĐMST & Khởi nghiệp'
    ]
  },
  { 
    key: 'ownerName', 
    label: 'Chủ trì / Tác giả / Đơn vị sở hữu', 
    desc: 'Tên cơ quan, doanh nghiệp hoặc cá nhân chủ trì thực hiện' 
  },
  { 
    key: 'source', 
    label: 'Nguồn gốc dữ liệu & Quyết định', 
    desc: 'Văn bản căn cứ pháp lý, quyết định công nhận hoặc nguồn gốc hồ sơ' 
  },
  { 
    key: 'description', 
    label: 'Mô tả tóm tắt nội dung', 
    desc: 'Tóm lược nội dung, mục tiêu giải pháp hoặc kết quả đạt được' 
  },
  { 
    key: 'verificationStatus', 
    label: 'Trạng thái xác minh thẩm định', 
    desc: 'Xác minh chính thức từ Hội đồng hoặc Cơ quan quản lý chuyên trách',
    defaultOptions: [
      'Chưa xác minh',
      'Đang xác minh',
      'Đã xác minh chính thức',
      'Đang khiếu nại kiến nghị'
    ]
  },
  { 
    key: 'publicityLevel', 
    label: 'Phạm vi công khai', 
    desc: 'Công khai toàn dân, hạn chế người dùng đăng nhập hoặc nội bộ cơ quan',
    defaultOptions: [
      'Công khai toàn dân',
      'Hạn chế / Chỉ đăng nhập',
      'Nội bộ cơ quan quản lý'
    ]
  },
  { 
    key: 'history', 
    label: 'Nhật ký truy vết quy trình', 
    desc: 'Lịch sử tiếp nhận, kiểm tra, thẩm định và phê duyệt của hồ sơ' 
  }
];

export const FormConfigView: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>('initiatives');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [hiddenSystemFields, setHiddenSystemFields] = useState<string[]>([]);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, FieldOverride>>({});
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New field inputs
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomField['fieldType']>('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newHelp, setNewHelp] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newOptions, setNewOptions] = useState('');

  // Modal editing for any standard or custom field
  const [editingStandardField, setEditingStandardField] = useState<{ key: string; label: string; desc: string; defaultOptions?: string[] } | null>(null);
  const [modalLabel, setModalLabel] = useState('');
  const [modalPlaceholder, setModalPlaceholder] = useState('');
  const [modalHelp, setModalHelp] = useState('');
  const [modalOptions, setModalOptions] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await api.getFormConfig(selectedModule);
      setCustomFields(cfg.customFields || []);
      setHiddenSystemFields(cfg.hiddenSystemFields || []);
      setFieldOverrides(cfg.fieldOverrides || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [selectedModule]);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

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

  // Open edit modal for a standard field
  const handleOpenStandardEdit = (sf: { key: string; label: string; desc: string; defaultOptions?: string[] }) => {
    setEditingStandardField(sf);
    const existing = fieldOverrides[sf.key] || {};
    setModalLabel(existing.label || sf.label);
    setModalPlaceholder(existing.placeholder || '');
    setModalHelp(existing.helpText || sf.desc);
    const currentOpts = existing.options || sf.defaultOptions || [];
    setModalOptions(currentOpts.join(', '));
  };

  // Save changes from modal into fieldOverrides
  const handleSaveStandardEdit = () => {
    if (!editingStandardField) return;
    const key = editingStandardField.key;
    const opts = modalOptions.split(',').map(s => s.trim()).filter(Boolean);

    setFieldOverrides({
      ...fieldOverrides,
      [key]: {
        label: modalLabel.trim() || editingStandardField.label,
        placeholder: modalPlaceholder.trim(),
        helpText: modalHelp.trim(),
        options: opts.length > 0 ? opts : undefined
      }
    });

    setEditingStandardField(null);
    showNotice(`Đã cập nhật tùy biến trường [${modalLabel || editingStandardField.label}]. Vui lòng bấm 'Lưu tất cả thay đổi'.`);
  };

  // Reset standard field to default
  const handleResetStandardField = (key: string) => {
    const updated = { ...fieldOverrides };
    delete updated[key];
    setFieldOverrides(updated);
    setEditingStandardField(null);
    showNotice(`Đã khôi phục trường về thiết lập mặc định của hệ thống.`);
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newLabel) return;

    const formattedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    // Prevent duplicate keys
    if (customFields.some(f => f.fieldKey === formattedKey)) {
      showNotice(`Mã trường "${formattedKey}" đã tồn tại.`);
      return;
    }

    const newField: CustomField = {
      id: `field_${Date.now()}`,
      fieldKey: formattedKey,
      fieldLabel: newLabel.trim(),
      fieldType: newType,
      required: newRequired,
      helpText: newHelp.trim(),
      placeholder: newPlaceholder.trim(),
      options: newType === 'select' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      isHidden: false
    };

    setCustomFields([...customFields, newField]);
    setNewKey('');
    setNewLabel('');
    setNewHelp('');
    setNewPlaceholder('');
    setNewOptions('');
    setNewRequired(false);
    showNotice(`Đã thêm trường tùy biến "${newLabel}". Bấm "Lưu tất cả thay đổi" để áp dụng.`);
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
    showNotice(`Đã xóa trường tùy biến khỏi danh sách.`);
  };

  const handleSaveAll = async () => {
    try {
      await api.updateFormConfig(selectedModule, {
        customFields,
        hiddenSystemFields,
        fieldOverrides
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      showNotice('Đã lưu cấu hình biểu mẫu và trường dữ liệu thành công!');
    } catch (err: any) {
      showNotice(err.message || 'Lỗi lưu cấu hình biểu mẫu');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6 text-xs">
      
      {/* Title & Save action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-teal-700" />
            <span>Cấu Hình Biểu Mẫu & Tùy Biến Trường Dữ Liệu (Section VIII.3)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Tùy biến trường & thiết lập ẩn / hiện dữ liệu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị viên có thể tùy biến Label, Placeholder, Hướng dẫn, Tùy chọn danh mục và bật/tắt Ẩn/Hiện bất kỳ trường dữ liệu nào.
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
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium flex items-center justify-between animate-in fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-teal-700 hover:text-teal-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {/* 1. Standard Fields Visibility & Customization Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-bold text-slate-900 flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>1. Các trường dữ liệu mặc định ({STANDARD_FIELDS.length} trường) - Cho phép sửa nhãn, hướng dẫn, danh mục và ẩn/hiện:</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Bấm "Chỉnh sửa" để đổi Label / Placeholder / Options hoặc nút mắt để Ẩn / Hiện
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {STANDARD_FIELDS.map((sf) => {
            const isHidden = hiddenSystemFields.includes(sf.key);
            const override = fieldOverrides[sf.key];
            const displayLabel = override?.label || sf.label;
            const displayDesc = override?.helpText || sf.desc;
            const isCustomized = !!override;

            return (
              <div 
                key={sf.key}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isHidden ? 'bg-slate-100 border-slate-300 opacity-60' : 'bg-white border-slate-200 shadow-2xs hover:border-teal-300'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{displayLabel}</span>
                    <span className="font-mono text-[10px] text-slate-400">({sf.key})</span>
                    {isCustomized && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Đã tùy biến
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{displayDesc}</p>
                  {override?.options && override.options.length > 0 && (
                    <div className="text-[10px] text-teal-800 truncate">
                      Tùy chọn: {override.options.slice(0, 3).join(', ')}{override.options.length > 3 ? '...' : ''}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleOpenStandardEdit(sf)}
                    className="p-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa tên hiển thị, gợi ý nhập liệu và tùy chọn"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Ẩn / Hiện button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSystemField(sf.key)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                      isHidden
                        ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                    }`}
                    title={isHidden ? 'Nhấn để HIỆN trường này' : 'Nhấn để ẨN trường này'}
                  >
                    {isHidden ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                        <span>Ẩn</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        <span>Hiện</span>
                      </>
                    )}
                  </button>
                </div>
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
            <label className="block text-slate-600 font-semibold mb-1">Các tùy chọn danh mục (phân cách bằng dấu phẩy)</label>
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
            <label className="block text-slate-600 font-semibold mb-1">Gợi ý nhập liệu (Placeholder)</label>
            <input
              type="text"
              placeholder="Gợi ý nội dung cần nhập cho người khai..."
              value={newPlaceholder}
              onChange={(e) => setNewPlaceholder(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Hướng dẫn nghiệp vụ (Help text)</label>
            <input
              type="text"
              placeholder="Quy định định dạng hoặc tài liệu đính kèm..."
              value={newHelp}
              onChange={(e) => setNewHelp(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
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
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            + Thêm vào biểu mẫu
          </button>
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
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  {f.placeholder && (
                    <div className="text-[10px] text-slate-400 italic">Gợi ý: "{f.placeholder}"</div>
                  )}
                  {f.options && f.options.length > 0 && (
                    <div className="text-[10px] text-slate-400">Tùy chọn: {f.options.join(', ')}</div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ẩn / Hiện button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCustomField(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      f.isHidden 
                        ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {f.isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
                    <span>{f.isHidden ? 'Ẩn' : 'Hiện'}</span>
                  </button>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(f.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa trường tùy biến này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Edit Modal (Section VIII.3) */}
      {editingStandardField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setEditingStandardField(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Tùy biến trường dữ liệu</h3>
                <span className="text-[11px] text-teal-300 font-mono">Mã trường: {editingStandardField.key}</span>
              </div>
              <button
                onClick={() => setEditingStandardField(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tên trường hiển thị (Label) *
                </label>
                <input
                  type="text"
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Gợi ý nội dung hiển thị trong ô nhập (Placeholder)
                </label>
                <input
                  type="text"
                  value={modalPlaceholder}
                  onChange={(e) => setModalPlaceholder(e.target.value)}
                  placeholder="Ví dụ: Nhập đầy đủ theo quyết định công nhận..."
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mô tả hướng dẫn nghiệp vụ (Help text)
                </label>
                <textarea
                  rows={2}
                  value={modalHelp}
                  onChange={(e) => setModalHelp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Danh mục tùy chọn (Options - phân cách bằng dấu phẩy)
                </label>
                <textarea
                  rows={3}
                  value={modalOptions}
                  onChange={(e) => setModalOptions(e.target.value)}
                  placeholder="Lựa chọn 1, Lựa chọn 2, Lựa chọn 3..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-teal-700 font-sans"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Áp dụng cho các trường lựa chọn như Lĩnh vực, Trạng thái thẩm định, Phạm vi công nhận...
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleResetStandardField(editingStandardField.key)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Khôi phục về giá trị mặc định của hệ thống"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStandardField(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStandardEdit}
                    className="px-4 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    Áp dụng thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
