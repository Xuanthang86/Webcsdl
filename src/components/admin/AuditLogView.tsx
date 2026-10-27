import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { ShieldCheck, RotateCcw, Search, Clock, User } from 'lucide-react';

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

  const filteredLogs = logs.filter(l => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const text = `${l.userName} ${l.userRole} ${l.action} ${l.details} ${l.targetTitle || ''}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Bảo mật & Quản trị Dữ liệu
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Nhật Ký Truy Vết Hệ Thống (Audit Logs & History)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận toàn bộ thao tác thêm, sửa, phê duyệt, từ chối, chuyển trạng thái và đăng nhập
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới nhật ký
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
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs w-full sm:w-44"
        >
          <option value="all">Tất cả hành động</option>
          <option value="create">Tạo mới (create)</option>
          <option value="update">Chỉnh sửa (update)</option>
          <option value="approve">Phê duyệt (approve)</option>
          <option value="reject">Từ chối (reject)</option>
          <option value="revise">Yêu cầu bổ sung (revise)</option>
          <option value="publish">Công khai (publish)</option>
          <option value="delete">Xóa (delete)</option>
          <option value="import">Nhập khẩu (import)</option>
          <option value="export">Xuất tệp (export)</option>
          <option value="login">Đăng nhập (login)</option>
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
                <th className="py-2.5 px-3 w-28">Hành động</th>
                <th className="py-2.5 px-3 w-32">Phân hệ</th>
                <th className="py-2.5 px-3">Chi tiết nội dung thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
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
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                      <div>{l.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{l.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                        l.action === 'approve' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        l.action === 'reject' ? 'bg-red-50 text-red-800 border border-red-200' :
                        l.action === 'create' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        l.action === 'import' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">
                      {l.targetModule || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">
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
