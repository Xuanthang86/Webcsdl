import React, { useState, useEffect } from 'react';
import { ModuleType, BaseEntity, User, ApprovalStatus } from '../../types';
import { api } from '../../services/api';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Link as LinkIcon, 
  Filter, 
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';

interface ModuleCrudViewProps {
  moduleType: ModuleType;
  currentUser?: User;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenImport: (mod: ModuleType) => void;
  onManageRelations: (entity: BaseEntity) => void;
}

export const MODULE_NAMES: Record<ModuleType, string> = {
  science_tasks: 'Nhiệm vụ, đề tài KH&CN',
  initiatives: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố',
  patents: 'Sáng chế & Sở hữu trí tuệ',
  experts: 'Chuyên gia & Nhà khoa học',
  startups: 'Doanh nghiệp khởi nghiệp',
  startup_projects: 'Dự án khởi nghiệp',
  startup_ideas: 'Ý tưởng khởi nghiệp',
  investors: 'Nhà đầu tư',
  investment_funds: 'Quỹ đầu tư',
  support_organizations: 'Tổ chức hỗ trợ, Vườn ươm',
  programs: 'Chương trình hỗ trợ & Cơ hội hỗ trợ',
  organizations: 'Tổ chức KH&CN, Viện trường',
  technologies: 'Công nghệ & Kết quả nghiên cứu',
  collaboration_needs: 'Nhu cầu kết nối & Đặt hàng TP',
  publications: 'Bài báo & Công bố khoa học',
  lab_equipments: 'Thiết bị & Phòng thí nghiệm trọng điểm',
  policies: 'Chính sách, Văn bản & Quy định KH&CN'
};

export const ModuleCrudView: React.FC<ModuleCrudViewProps> = ({
  moduleType,
  currentUser,
  onViewDetail,
  onOpenImport,
  onManageRelations
}) => {
  const [records, setRecords] = useState<BaseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BaseEntity | null>(null);
  const [workflowRecord, setWorkflowRecord] = useState<BaseEntity | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<ApprovalStatus>('approved');
  const [workflowNote, setWorkflowNote] = useState('');
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<BaseEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formField, setFormField] = useState('Công nghệ thông tin và Truyền thông');
  const [formOwner, setFormOwner] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<ApprovalStatus>('draft');
  const [formCostSavings, setFormCostSavings] = useState('');
  const [formBudget, setFormBudget] = useState('');

  const isSuperUser = ['super_admin', 'system_admin'].includes(currentUser?.role || '');
  const canApprove = ['super_admin', 'system_admin', 'agency_leader'].includes(currentUser?.role || '');
  const canDelete = isSuperUser || currentUser?.role === 'data_officer';

  // Check if current user is restricted to specific managedModules
  const isModuleRestricted = !isSuperUser && 
    currentUser?.managedModules && 
    currentUser.managedModules.length > 0 && 
    !currentUser.managedModules.includes(moduleType);

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getModuleRecords(moduleType);
      setRecords(data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu module:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSelectedIds([]);
  }, [moduleType]);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormField('Công nghệ thông tin và Truyền thông');
    setFormOwner(currentUser?.fullName || '');
    setFormDesc('');
    setFormStatus('draft');
    setFormCostSavings('');
    setFormBudget('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (rec: BaseEntity) => {
    setEditingRecord(rec);
    setFormTitle(rec.title);
    setFormField(rec.field || 'Công nghệ thông tin');
    setFormOwner(rec.ownerName || '');
    setFormDesc(rec.description || '');
    setFormStatus(rec.status);
    setFormCostSavings(rec.costSavings ? String(rec.costSavings) : '');
    setFormBudget(rec.totalBudgetApproved ? String(rec.totalBudgetApproved) : '');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    try {
      if (editingRecord) {
        await api.updateRecord(moduleType, editingRecord.id, {
          title: formTitle,
          field: formField,
          ownerName: formOwner,
          description: formDesc,
          status: formStatus,
          costSavings: Number(formCostSavings) || undefined,
          totalBudgetApproved: Number(formBudget) || undefined,
          updateNote: 'Chỉnh sửa thông tin từ giao diện quản trị'
        });
        showToast(`Đã cập nhật bản ghi [${editingRecord.code}] thành công`);
        setEditingRecord(null);
      } else {
        await api.createRecord(moduleType, {
          title: formTitle,
          field: formField,
          ownerName: formOwner,
          description: formDesc,
          status: formStatus,
          costSavings: Number(formCostSavings) || undefined,
          totalBudgetApproved: Number(formBudget) || undefined
        });
        showToast(`Đã tạo bản ghi mới thành công trong ${MODULE_NAMES[moduleType]}`);
        setShowCreateModal(false);
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu bản ghi');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    setIsDeleting(true);
    try {
      await api.deleteRecord(moduleType, deleteConfirmRecord.id);
      showToast(`Đã xóa bản ghi [${deleteConfirmRecord.code}] thành công`);
      setDeleteConfirmRecord(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa bản ghi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransitionWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowRecord) return;
    try {
      await api.transitionWorkflow(moduleType, workflowRecord.id, workflowStatus, workflowNote);
      showToast(`Đã chuyển trạng thái bản ghi [${workflowRecord.code}] sang [${workflowStatus}]`);
      setWorkflowRecord(null);
      setWorkflowNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển trạng thái quy trình');
    }
  };

  // Filtered records
  const filteredRecords = records.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${item.code} ${item.title} ${item.ownerName} ${item.field}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  if (isModuleRestricted) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Phân hệ dữ liệu này nằm ngoài phạm vi được phân quyền
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Tài khoản của bạn ({currentUser?.fullName}) hiện được phân công quản lý các phân hệ sau:
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {currentUser?.managedModules?.map(mKey => (
            <span key={mKey} className="px-2.5 py-1 bg-teal-50 text-teal-900 border border-teal-200 rounded-lg text-xs font-semibold">
              {(MODULE_NAMES as Record<string, string>)[mKey] || mKey}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-700 animate-in fade-in">
          <span>✓</span>
          <span>{actionSuccessToast}</span>
        </div>
      )}
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Phân hệ dữ liệu quản lý
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản Lý: {MODULE_NAMES[moduleType]}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-semibold text-slate-800 font-mono">{records.length}</span> bản ghi tích hợp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getExportUrl(moduleType)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </a>

          <button
            onClick={() => onOpenImport(moduleType)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập Excel/CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo bản ghi mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên bản ghi, đơn vị chủ trì, lĩnh vực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="under_review">Đang thẩm định</option>
            <option value="needs_revision">Yêu cầu bổ sung</option>
            <option value="draft">Bản nháp</option>
          </select>

          <button
            onClick={loadData}
            title="Làm mới dữ liệu"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-32">Mã bản ghi</th>
                <th className="py-3 px-4">Tên / Tiêu đề</th>
                <th className="py-3 px-4 w-40">Lĩnh vực</th>
                <th className="py-3 px-4 w-44">Đơn vị / Cá nhân</th>
                <th className="py-3 px-4 w-28 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-24 text-center">Công khai</th>
                <th className="py-3 px-4 w-36 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có bản ghi nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-teal-800">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => onViewDetail(item)}
                        className="font-semibold text-slate-900 hover:text-teal-800 cursor-pointer line-clamp-1"
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                      {item.field || item.primaryField || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[170px]">
                      {item.ownerName || item.proposingOrg || item.leadOrganization || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        item.status === 'under_review' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        item.status === 'needs_revision' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status === 'approved' ? 'Đã duyệt' : item.status === 'under_review' ? 'Đang duyệt' : item.status === 'needs_revision' ? 'Bổ sung' : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[11px] font-medium ${item.publicityLevel === 'public' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {item.publicityLevel === 'public' ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDetail(item)}
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-400 hover:text-teal-800 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onManageRelations(item)}
                          title="Quản lý liên kết đa chiều"
                          className="p-1.5 text-slate-400 hover:text-indigo-800 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        {canApprove && (
                          <button
                            onClick={() => {
                              setWorkflowRecord(item);
                              setWorkflowStatus(item.status === 'approved' ? 'needs_revision' : 'approved');
                              setWorkflowNote('');
                            }}
                            title="Chuyển trạng thái quy trình phê duyệt"
                            className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Chỉnh sửa bản ghi"
                          className="p-1.5 text-slate-400 hover:text-blue-800 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmRecord(item)}
                            title="Xóa bản ghi"
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (2-step verification) */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa bản ghi
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hành động này sẽ xóa dữ liệu và cập nhật nhật ký truy vết
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-mono text-teal-800 font-semibold">{deleteConfirmRecord.code}</div>
              <div className="font-bold text-slate-900 line-clamp-2">{deleteConfirmRecord.title}</div>
              <div className="text-[11px] text-slate-500">Phân hệ: {MODULE_NAMES[moduleType]}</div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Bạn có chắc chắn muốn xóa bản ghi này? Các mối liên kết đa chiều liên quan sẽ được tự động gỡ bỏ an toàn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              {editingRecord ? `Chỉnh sửa bản ghi: [${editingRecord.code}]` : `Thêm mới ${MODULE_NAMES[moduleType]}`}
            </h2>

            <form onSubmit={handleSaveForm} className="pt-4 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiêu đề / Tên đối tượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lĩnh vực
                  </label>
                  <input
                    type="text"
                    value={formField}
                    onChange={(e) => setFormField(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị / Chủ quản
                  </label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả / Tóm tắt nội dung
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {moduleType === 'initiatives' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chi phí tiết kiệm đo lường (VND)
                  </label>
                  <input
                    type="number"
                    value={formCostSavings}
                    onChange={(e) => setFormCostSavings(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              )}

              {moduleType === 'science_tasks' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tổng kinh phí duyệt (VND)
                  </label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ApprovalStatus)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="submitted">Gửi duyệt</option>
                  <option value="under_review">Đang thẩm định</option>
                  <option value="needs_revision">Yêu cầu bổ sung</option>
                  <option value="approved">Đã phê duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingRecord(null); }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Transition Modal */}
      {workflowRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
              Quy Trình Thẩm Định & Phê Duyệt Hồ Sơ
            </h2>
            <div className="text-[11px] text-slate-500 py-1">
              Bản ghi: <span className="font-semibold text-slate-800">{workflowRecord.code}</span> - {workflowRecord.title}
            </div>

            <form onSubmit={handleTransitionWorkflow} className="pt-3 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chuyển sang trạng thái tiếp theo <span className="text-red-500">*</span>
                </label>
                <select
                  value={workflowStatus}
                  onChange={(e) => setWorkflowStatus(e.target.value as ApprovalStatus)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="under_review">1. Tiếp nhận & Kiểm tra hồ sơ</option>
                  <option value="needs_revision">2. Yêu cầu sửa đổi / bổ sung tài liệu</option>
                  <option value="approved">3. Phê duyệt chính thức & Công khai</option>
                  <option value="rejected">4. Từ chối phê duyệt</option>
                  <option value="archived">5. Lưu trữ / Hết hiệu lực</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ý kiến thẩm định / Lý do phê duyệt hoặc yêu cầu bổ sung <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi nhận căn cứ quyết định, kết quả thẩm định hoặc danh mục tài liệu cần bổ sung..."
                  value={workflowNote}
                  onChange={(e) => setWorkflowNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkflowRecord(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Xác nhận chuyển trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
