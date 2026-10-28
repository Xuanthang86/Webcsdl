import React, { useState, useEffect } from 'react';
import { AuditLog, ModuleType } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { RotateCcw, Search, ShieldCheck } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Tạo mới', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  update: { label: 'Cập nhật', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  delete: { label: 'Xóa', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  approve: { label: 'Phê duyệt', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  reject: { label: 'Từ chối', color: 'bg-red-50 text-red-800 border-red-200' },
  revise: { label: 'Yêu cầu bổ sung', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  publish: { label: 'Công khai', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  import: { label: 'Nhập dữ liệu', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  export: { label: 'Xuất dữ liệu', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  login: { label: 'Đăng nhập', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  system_config: { label: 'Cấu hình hệ thống', color: 'bg-violet-50 text-violet-800 border-violet-200' }
};

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const item = ACTION_LABELS[action] || { label: action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border font-sans ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const getModuleName = (mod?: ModuleType | string) => {
    if (!mod) return 'Toàn hệ thống';
    return (MODULE_NAMES as Record<string, string>)[mod] || mod;
  };

  const filteredLogs = logs.filter(l => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const modName = getModuleName(l.targetModule).toLowerCase();
      const actionName = (ACTION_LABELS[l.action]?.label || l.action).toLowerCase();
      const text = `${l.userName} ${l.userRole} ${actionName} ${modName} ${l.details} ${l.targetTitle || ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Bảo Mật & Quản Trị Dữ Liệu</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Nhật Ký Truy Vết Hệ Thống (Audit Logs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận toàn bộ thao tác tạo mới, cập nhật, xóa, phê duyệt, từ chối, nhập/xuất và đăng nhập
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo người thực hiện, nội dung chi tiết hoặc tiêu đề đối tượng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs w-full sm:w-52 font-medium"
        >
          <option value="all">Tất cả hành động</option>
          <option value="create">Tạo mới</option>
          <option value="update">Cập nhật</option>
          <option value="delete">Xóa</option>
          <option value="approve">Phê duyệt</option>
          <option value="reject">Từ chối</option>
          <option value="revise">Yêu cầu bổ sung</option>
          <option value="publish">Công khai</option>
          <option value="import">Nhập dữ liệu</option>
          <option value="export">Xuất dữ liệu</option>
          <option value="login">Đăng nhập</option>
          <option value="system_config">Cấu hình hệ thống</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3 w-36">Thời điểm</th>
                <th className="py-2.5 px-3 w-44">Người thực hiện</th>
                <th className="py-2.5 px-3 w-32">Hành động</th>
                <th className="py-2.5 px-3 w-44">Phân hệ dữ liệu</th>
                <th className="py-2.5 px-3">Chi tiết nội dung thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">Đang tải nhật ký...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">Không tìm thấy bản ghi nhật ký phù hợp.</td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                      {new Date(l.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-800">{l.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getActionBadge(l.action)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium font-sans">
                      {getModuleName(l.targetModule)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
