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
  AlertCircle,
  Layers,
  CheckSquare,
  Square,
  Eye,
  EyeOff
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

export const MANAGEABLE_MODULE_OPTIONS: Array<{ key: string; label: string; group: string }> = [
  { key: 'science_tasks', label: 'Nhiệm vụ, đề tài KH&CN', group: 'Nhiệm vụ & Đề tài' },
  { key: 'initiatives', label: 'Sáng kiến có tác dụng, ảnh hưởng thành phố', group: 'Sáng kiến' },
  { key: 'patents', label: 'Sáng chế & Sở hữu trí tuệ', group: 'Sở hữu trí tuệ' },
  { key: 'experts', label: 'Chuyên gia & Nhà khoa học', group: 'Chuyên gia' },
  { key: 'startups', label: 'Doanh nghiệp khởi nghiệp sáng tạo', group: 'Hệ sinh thái' },
  { key: 'startup_projects', label: 'Dự án khởi nghiệp', group: 'Hệ sinh thái' },
  { key: 'startup_ideas', label: 'Ý tưởng khởi nghiệp', group: 'Hệ sinh thái' },
  { key: 'investors', label: 'Nhà đầu tư', group: 'Hệ sinh thái' },
  { key: 'investment_funds', label: 'Quỹ đầu tư', group: 'Hệ sinh thái' },
  { key: 'support_organizations', label: 'Tổ chức hỗ trợ, Vườn ươm', group: 'Hệ sinh thái' },
  { key: 'programs', label: 'Chương trình hỗ trợ & Cơ hội', group: 'Hệ sinh thái' },
  { key: 'organizations', label: 'Tổ chức KH&CN, Viện trường', group: 'Bổ trợ' },
  { key: 'publications', label: 'Bài báo & Công bố khoa học', group: 'Bổ trợ' },
  { key: 'technologies', label: 'Công nghệ & Kết quả nghiên cứu', group: 'Bổ trợ' },
  { key: 'collaboration_needs', label: 'Nhu cầu kết nối & Đặt hàng TP', group: 'Bổ trợ' },
  { key: 'lab_equipments', label: 'Thiết bị & Phòng thí nghiệm', group: 'Bổ trợ' },
  { key: 'policies', label: 'Chính sách & Quy định', group: 'Bổ trợ' }
];

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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formOldPassword, setFormOldPassword] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOrganization, setFormOrganization] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('data_officer');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formManagedModules, setFormManagedModules] = useState<string[]>([]);
  const [formOrgScope, setFormOrgScope] = useState('');

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
    setFormOldPassword('');
    setFormPassword('');
    setFormConfirmPassword('');
    setShowOldPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormOrganization('Sở Khoa học và Công nghệ Đà Nẵng');
    setFormRole('data_officer');
    setFormIsActive(true);
    setFormManagedModules(['science_tasks', 'initiatives']);
    setFormOrgScope('');
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormOldPassword('');
    setFormPassword('');
    setFormConfirmPassword('');
    setShowOldPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormFullName(u.fullName);
    setFormEmail(u.email);
    setFormPhone(u.phone || '');
    setFormOrganization(u.organization || '');
    setFormRole(u.role);
    setFormIsActive(u.role === 'super_admin' || u.role === 'system_admin' ? true : u.isActive);
    setFormManagedModules(u.role === 'super_admin' || u.role === 'system_admin' ? MANAGEABLE_MODULE_OPTIONS.map(m => m.key) : (u.managedModules || []));
    setFormOrgScope(u.organizationScope || '');
    setModalError(null);
  };

  const handleToggleModule = (modKey: string) => {
    setFormManagedModules(prev => 
      prev.includes(modKey) ? prev.filter(m => m !== modKey) : [...prev, modKey]
    );
  };

  const handleSelectAllModules = () => {
    if (formManagedModules.length === MANAGEABLE_MODULE_OPTIONS.length) {
      setFormManagedModules([]);
    } else {
      setFormManagedModules(MANAGEABLE_MODULE_OPTIONS.map(m => m.key));
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validate password match
    const isAdminEditing = editingUser && (editingUser.role === 'super_admin' || editingUser.role === 'system_admin');
    if (editingUser) {
      if (formPassword.trim()) {
        if (isAdminEditing && !formOldPassword.trim()) {
          setModalError('Vui lòng nhập mật khẩu cũ để xác thực thay đổi mật khẩu quản trị viên.');
          return;
        }
        if (formPassword !== formConfirmPassword) {
          setModalError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
          return;
        }
        if (formPassword.length < 6) {
          setModalError('Mật khẩu mới phải có ít nhất 6 ký tự.');
          return;
        }
      }
    } else {
      if (!formPassword) {
        setModalError('Vui lòng nhập mật khẩu khởi tạo cho tài khoản.');
        return;
      }
      if (formPassword !== formConfirmPassword) {
        setModalError('Mật khẩu và xác nhận mật khẩu không trùng khớp.');
        return;
      }
      if (formPassword.length < 6) {
        setModalError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
    }

    try {
      if (editingUser) {
        // Update user
        const updates: Partial<User> & { oldPassword?: string } = {
          fullName: formFullName,
          email: formEmail,
          phone: formPhone,
          organization: formOrganization,
          role: isAdminEditing ? editingUser.role : formRole,
          isActive: isAdminEditing ? true : formIsActive,
          managedModules: isAdminEditing ? MANAGEABLE_MODULE_OPTIONS.map(m => m.key) : formManagedModules,
          organizationScope: formOrgScope
        };
        if (formPassword.trim()) {
          updates.password = formPassword.trim();
          if (isAdminEditing) {
            updates.oldPassword = formOldPassword.trim();
          }
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
          password: formPassword.trim(),
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          organization: formOrganization.trim(),
          role: formRole,
          isActive: formIsActive,
          managedModules: formManagedModules,
          organizationScope: formOrgScope
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
    if (u.role === 'super_admin' || u.role === 'system_admin') {
      showToast('Tài khoản Quản trị viên luôn duy trì hoạt động bảo vệ hệ thống.');
      return;
    }
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      showToast(`Đã ${!u.isActive ? 'mở khóa' : 'khóa'} tài khoản [${u.username}]`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Lỗi thay đổi trạng thái');
    }
  };

  const handleApproveUser = async (u: User) => {
    try {
      await api.updateUser(u.id, { isActive: true });
      showToast(`Đã duyệt và kích hoạt tài khoản [@${u.username}] thành công!`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Lỗi duyệt tài khoản');
    }
  };

  const handleDeleteUser = (u: User) => {
    if (u.role === 'super_admin') {
      showToast('Không được phép xóa tài khoản Super Admin.');
      return;
    }
    if (currentUser?.id === u.id) {
      showToast('Không thể tự xóa tài khoản của chính mình.');
      return;
    }
    setUserToDelete(u);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete.id);
      showToast(`Đã xóa tài khoản [${userToDelete.username}] thành công`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa tài khoản');
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
            Quản lý danh sách tài khoản, cấp phát vai trò, quyền quản lý theo phân hệ dữ liệu và địa bàn/đơn vị
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
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
            className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
          >
            <option value="all">Tất cả vai trò ({users.length})</option>
            {Object.entries(ROLE_DEFINITIONS).map(([rKey, def]) => (
              <option key={rKey} value={rKey}>
                {def.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tài khoản & Họ tên</th>
                <th className="py-3 px-4">Email / Điện thoại</th>
                <th className="py-3 px-4">Đơn vị công tác</th>
                <th className="py-3 px-4">Vai trò hệ thống</th>
                <th className="py-3 px-4">Phân hệ quản lý</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp với tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-700 border-slate-300' };
                  const isSuperAdminRole = u.role === 'super_admin' || u.role === 'system_admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] font-mono text-teal-800 flex items-center gap-1">
                          <span>@{u.username}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-800 truncate">{u.email}</div>
                        {u.phone && <div className="text-[11px] text-slate-500">{u.phone}</div>}
                      </td>

                      {/* Organization */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{u.organization || '—'}</div>
                        {u.organizationScope && (
                          <div className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                            Phạm vi: {u.organizationScope}
                          </div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleDef.color}`}>
                          {roleDef.label}
                        </span>
                      </td>

                      {/* Managed Modules */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {isSuperAdminRole ? (
                          <span className="text-slate-600 font-medium text-[11px]">Toàn quyền 17 phân hệ</span>
                        ) : u.managedModules && u.managedModules.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.managedModules.slice(0, 3).map(mKey => {
                              const found = MANAGEABLE_MODULE_OPTIONS.find(o => o.key === mKey);
                              return (
                                <span key={mKey} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] border border-slate-200">
                                  {found ? found.label.replace(/^\d+\.\s*/, '') : mKey}
                                </span>
                              );
                            })}
                            {u.managedModules.length > 3 && (
                              <span className="text-[10px] text-teal-800 font-semibold self-center">
                                +{u.managedModules.length - 3} nữa
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chưa chỉ định phân hệ</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {u.isActive ? (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Bấm để tạm khóa tài khoản"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Hoạt động</span>
                          </button>
                        ) : (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Chờ duyệt</span>
                            </span>
                            <button
                              onClick={() => handleApproveUser(u)}
                              className="px-2 py-0.5 bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Duyệt và kích hoạt tài khoản này ngay lập tức"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt tài khoản</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin & phân quyền"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {u.id !== currentUser?.id && u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Modal: Create or Edit User */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingUser ? `Chỉnh sửa tài khoản: ${editingUser.username}` : 'Thêm tài khoản người dùng mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Cấp phát tài khoản, vai trò và phân quyền các phân hệ dữ liệu</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="vd: canbo.khoahoc"
                    disabled={!!editingUser}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 disabled:bg-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Họ và tên người dùng *</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    placeholder="vd: Nguyễn Văn An"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 font-medium"
                  />
                </div>
              </div>

              {/* Password and Confirm Password Row with Eye/EyeOff toggles */}
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {editingUser && (editingUser.role === 'super_admin' || editingUser.role === 'system_admin') && (
                  <div className="space-y-1">
                    <label className="font-semibold text-rose-700 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Mật khẩu cũ của Quản trị viên * (Bắt buộc nếu đổi mật khẩu)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={formOldPassword}
                        onChange={e => setFormOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại của tài khoản..."
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-600 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
                        title={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu thiết lập *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        placeholder={editingUser ? 'Nhập mật khẩu mới nếu muốn đổi' : 'Tối thiểu 6 ký tự'}
                        required={!editingUser}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      {editingUser ? 'Xác nhận mật khẩu mới' : 'Xác nhận mật khẩu *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formConfirmPassword}
                        onChange={e => setFormConfirmPassword(e.target.value)}
                        placeholder={editingUser ? 'Nhập lại mật khẩu mới' : 'Nhập lại mật khẩu'}
                        required={!editingUser || !!formPassword}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
                        title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formConfirmPassword.length > 0 && (
                      <div className="pt-1 text-[11px] font-medium">
                        {formPassword === formConfirmPassword ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>✓ Mật khẩu xác nhận trùng khớp</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>⚠ Mật khẩu xác nhận không khớp</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email công vụ *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="an.nv@danang.gov.vn"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cơ quan / Đơn vị công tác</label>
                  <input
                    type="text"
                    value={formOrganization}
                    onChange={e => setFormOrganization(e.target.value)}
                    placeholder="Phòng Quản lý KH&CN - Sở KH&CN Đà Nẵng"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phạm vi ủy quyền (Quận/Huyện, Trường...)</label>
                  <input
                    type="text"
                    value={formOrgScope}
                    onChange={e => setFormOrgScope(e.target.value)}
                    placeholder="vd: Đại học Bách Khoa, UBND Quận Hải Châu..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700"
                  />
                </div>
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

              {/* Granular Module Permission Assignment (Checkboxes for 5 standardized groups) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-700" />
                      <span>Phân quyền quản lý theo phân hệ dữ liệu:</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Chọn các loại cơ sở dữ liệu mà người dùng này được phép thêm, sửa, quản lý
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllModules}
                    className="text-xs font-semibold text-teal-800 hover:underline"
                  >
                    {formManagedModules.length === MANAGEABLE_MODULE_OPTIONS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {MANAGEABLE_MODULE_OPTIONS.map(opt => {
                    const isChecked = formManagedModules.includes(opt.key);
                    return (
                      <label 
                        key={opt.key}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors text-[11px] ${
                          isChecked 
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(opt.key)}
                          className="rounded text-teal-800 focus:ring-teal-700"
                        />
                        <span className="truncate">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
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
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
                >
                  {editingUser ? 'Lưu thay đổi phân quyền' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa tài khoản</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Tài khoản:</strong> <span className="font-mono font-bold text-slate-900">@{userToDelete.username}</span></div>
              <div><strong>Họ và tên:</strong> {userToDelete.fullName}</div>
              <div><strong>Vai trò:</strong> {ROLE_DEFINITIONS[userToDelete.role]?.label || userToDelete.role}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
