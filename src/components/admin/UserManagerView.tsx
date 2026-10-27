import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  KeyRound, 
  Building, 
  Mail, 
  Phone, 
  Lock, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const ROLE_DEFINITIONS: Record<UserRole, { label: string; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', desc: 'Toàn quyền cấu hình, quản trị người dùng và cơ sở dữ liệu', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  system_admin: { label: 'Quản trị viên hệ thống', desc: 'Quản lý người dùng, cấu hình dữ liệu và các phân hệ', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  agency_leader: { label: 'Lãnh đạo cơ quan (Sở KH&CN)', desc: 'Xem báo cáo tổng hợp, phê duyệt chính thức sáng kiến & đề tài', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  data_officer: { label: 'Cán bộ quản lý dữ liệu', desc: 'Tiếp nhận, thẩm định sơ bộ, biên tập và nhập/xuất dữ liệu', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  evaluator_expert: { label: 'Chuyên gia thẩm định', desc: 'Đánh giá chuyên môn, chấm điểm hồ sơ nhiệm vụ và sáng kiến', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  partner_officer: { label: 'Cán bộ đơn vị phối hợp', desc: 'Cung cấp dữ liệu từ Viện, Trường, Quận huyện', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  org_representative: { label: 'Đại diện Doanh nghiệp', desc: 'Khai báo thông tin doanh nghiệp ĐMST, dự án và nhu cầu công nghệ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  expert_user: { label: 'Chuyên gia / Nhà khoa học', desc: 'Cập nhật hồ sơ cá nhân, công trình và hướng nghiên cứu', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  investor_user: { label: 'Nhà đầu tư / Quỹ', desc: 'Xem thông tin dự án, kết nối đầu tư và đặt hàng', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  public_user: { label: 'Công dân / Người dùng công khai', desc: 'Tra cứu thông tin công khai, gửi đề xuất sáng kiến trực tuyến', color: 'bg-slate-100 text-slate-700 border-slate-300' }
};

interface UserManagerViewProps {
  currentUser?: User;
}

export const UserManagerView: React.FC<UserManagerViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('admin123');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOrganization, setFormOrganization] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('data_officer');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const handleOpenCreate = () => {
    setFormUsername('');
    setFormPassword('admin123');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormOrganization('Sở Khoa học và Công nghệ');
    setFormRole('data_officer');
    setFormIsActive(true);
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword('');
    setFormFullName(u.fullName);
    setFormEmail(u.email);
    setFormPhone(u.phone || '');
    setFormOrganization(u.organization || '');
    setFormRole(u.role);
    setFormIsActive(u.isActive);
    setModalError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    try {
      if (editingUser) {
        // Update user
        const updates: Partial<User> = {
          fullName: formFullName,
          email: formEmail,
          phone: formPhone,
          organization: formOrganization,
          role: formRole,
          isActive: formIsActive
        };
        if (formPassword.trim()) {
          updates.password = formPassword.trim();
        }
        await api.updateUser(editingUser.id, updates);
        showToast(`Đã cập nhật thành công tài khoản [${editingUser.username}]`);
        setEditingUser(null);
      } else {
        // Create user
        if (!formUsername.trim()) {
          setModalError('Vui lòng nhập tên đăng nhập.');
          return;
        }
        await api.createUser({
          username: formUsername.trim(),
          password: formPassword.trim() || 'admin123',
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          organization: formOrganization.trim(),
          role: formRole,
          isActive: formIsActive
        });
        showToast(`Đã tạo tài khoản [${formUsername}] với vai trò [${formRole}]`);
        setShowCreateModal(false);
      }
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Lỗi xử lý tài khoản');
    }
  };

  const handleToggleStatus = async (u: User) => {
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      showToast(`Đã ${!u.isActive ? 'mở khóa' : 'khóa'} tài khoản [${u.username}]`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi thay đổi trạng thái');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản [${u.username}] (${u.fullName})?`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      showToast(`Đã xóa tài khoản [${u.username}] thành công`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tài khoản');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchQ = !searchQuery || 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchQ && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-700 animate-in fade-in">
          <span>✓</span>
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Phân Quyền & Quản Trị Hệ Thống (RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Quản Lý Tài Khoản & Phân Quyền Người Dùng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách tài khoản, cấp phát vai trò, quyền thẩm định, phê duyệt và giám sát hoạt động
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm tài khoản mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên đăng nhập, họ tên, email, đơn vị công tác..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            <option value="all">Tất cả vai trò ({users.length})</option>
            {Object.entries(ROLE_DEFINITIONS).map(([rKey, def]) => (
              <option key={rKey} value={rKey}>{def.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tài khoản & Họ tên</th>
                <th className="py-3 px-4">Vai trò & Phân quyền</th>
                <th className="py-3 px-4">Đơn vị công tác</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || { label: u.role, desc: '', color: 'bg-slate-100 text-slate-800 border-slate-200' };
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-teal-800 font-semibold">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleDef.color}`}>
                          {roleDef.label}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{roleDef.desc}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{u.organization || 'Sở KH&CN'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chỉnh sửa tài khoản & phân quyền"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.role === 'super_admin'}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Chỉnh Sửa & Phân Quyền: @${editingUser.username}` : 'Tạo Tài Khoản & Cấp Quyền Người Dùng Mới'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tên đăng nhập (username) *</label>
                  <input
                    type="text"
                    value={formUsername}
                    disabled={Boolean(editingUser)}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="vd: officer_hanoi"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Giữ nguyên mật khẩu' : 'Mật khẩu mặc định: admin123'}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Họ và tên người dùng *</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={e => setFormFullName(e.target.value)}
                  placeholder="vd: Nguyễn Văn An"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email công vụ *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="an.nv@sokhcn.gov.vn"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0912.345.678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cơ quan / Đơn vị công tác</label>
                <input
                  type="text"
                  value={formOrganization}
                  onChange={e => setFormOrganization(e.target.value)}
                  placeholder="Phòng Quản lý Khoa học - Sở KH&CN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Role Assignment */}
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-700">Vai trò & Ma trận quyền hạn *</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-teal-700"
                >
                  {Object.entries(ROLE_DEFINITIONS).map(([rKey, def]) => (
                    <option key={rKey} value={rKey}>
                      {def.label} — {def.desc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-teal-800 bg-teal-50 p-2.5 rounded-lg border border-teal-200 mt-1">
                  <strong>Mô tả quyền hạn:</strong> {ROLE_DEFINITIONS[formRole]?.desc}
                </p>
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActiveToggle"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-teal-800 rounded focus:ring-teal-700"
                />
                <label htmlFor="userActiveToggle" className="font-semibold text-slate-700 cursor-pointer">
                  Tài khoản đang hoạt động (Được phép đăng nhập hệ thống)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  {editingUser ? 'Lưu thay đổi phân quyền' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
