import React, { useState, useEffect } from 'react';
import { EntityRelationship, BaseEntity, ModuleType, User } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { Link as LinkIcon, Plus, Trash2, ExternalLink, ArrowRight, X } from 'lucide-react';

interface RelationshipManagerProps {
  initialEntity?: BaseEntity | null;
  onClose?: () => void;
  currentUser?: User;
}

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  initialEntity,
  onClose,
  currentUser
}) => {
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  // New relationship form
  const [sourceModule, setSourceModule] = useState<ModuleType>(initialEntity?.moduleType || 'science_tasks');
  const [sourceId, setSourceId] = useState(initialEntity?.id || '');
  const [sourceTitle, setSourceTitle] = useState(initialEntity?.title || '');

  const [targetModule, setTargetModule] = useState<ModuleType>('experts');
  const [targetId, setTargetId] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [relationType, setRelationType] = useState('Chủ nhiệm nhiệm vụ');

  const [targetOptions, setTargetOptions] = useState<BaseEntity[]>([]);

  const loadRelationships = async () => {
    setLoading(true);
    try {
      const data = await api.getRelationships(initialEntity?.id);
      setRelationships(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTargetCandidates = async (mod: ModuleType) => {
    try {
      const list = await api.getModuleRecords(mod);
      setTargetOptions(list);
      if (list.length > 0) {
        setTargetId(list[0].id);
        setTargetTitle(list[0].title);
      } else {
        setTargetId('');
        setTargetTitle('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRelationships();
  }, [initialEntity]);

  useEffect(() => {
    loadTargetCandidates(targetModule);
  }, [targetModule]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;

    try {
      await api.createRelationship({
        sourceModule,
        sourceId,
        sourceTitle: sourceTitle || 'Thực thể nguồn',
        targetModule,
        targetId,
        targetTitle: targetTitle || 'Thực thể đích',
        relationType,
        status: 'active'
      });
      await loadRelationships();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo liên kết');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận hủy liên kết đa chiều này?')) return;
    try {
      await api.deleteRelationship(id);
      await loadRelationships();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa liên kết');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Mô hình liên kết dữ liệu đa chiều (Cross-Entity Graph)
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            {initialEntity ? `Quan hệ liên kết của: [${initialEntity.code}] ${initialEntity.title}` : 'Quản Lý Tất Cả Quan Hệ Liên Kết Toàn Hệ Thống'}
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Relation Form */}
      <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-teal-700" />
          Thiết lập mối quan hệ 2 chiều mới:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Loại đối tượng liên kết</label>
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value as ModuleType)}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              {Object.entries(MODULE_NAMES).map(([mod, name]) => (
                <option key={mod} value={mod}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Chọn thực thể liên kết</label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                const item = targetOptions.find(o => o.id === e.target.value);
                if (item) setTargetTitle(item.title);
              }}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 truncate"
            >
              {targetOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  [{opt.code}] {opt.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Bản chất quan hệ nghiệp vụ</label>
            <input
              type="text"
              placeholder="Ví dụ: Chủ nhiệm nhiệm vụ, Cơ quan chủ trì, Đầu tư hạt giống..."
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Lưu liên kết dữ liệu
          </button>
        </div>
      </form>

      {/* Relationships List */}
      <div className="space-y-3">
        <div className="font-semibold text-slate-800">
          Danh sách mối liên kết hiện hành ({relationships.length}):
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-400">Đang tải quan hệ...</div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            Chưa có mối quan hệ nào được liên kết.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {relationships.map(rel => (
              <div key={rel.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="font-semibold text-slate-800">
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mr-1.5">
                      {MODULE_NAMES[rel.sourceModule] || rel.sourceModule}
                    </span>
                    {rel.sourceTitle}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold px-2 py-0.5 bg-indigo-50 rounded-full shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{rel.relationType}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  <div className="font-semibold text-slate-800">
                    <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mr-1.5">
                      {MODULE_NAMES[rel.targetModule] || rel.targetModule}
                    </span>
                    {rel.targetTitle}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(rel.id)}
                  title="Hủy liên kết"
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
