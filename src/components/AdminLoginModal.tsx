import React, { useState } from "react";
import { api } from "../services/api";
import { User } from "../types";
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Phone,
  Building2,
  Loader2
} from "lucide-react";

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem("portal_remember_username") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regRole, setRegRole] = useState("data_officer");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const cleanUsername = username.trim();
      try {
        const user = await api.login(cleanUsername, password);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("portal_tab_active", "true");
        }
        if (rememberMe) {
          try {
            localStorage.setItem("portal_remember_username", cleanUsername);
          } catch {}
        } else {
          try {
            localStorage.removeItem("portal_remember_username");
          } catch {}
        }
        onSuccess(user);
      } catch (err: any) {
        setError(err.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
      } finally {
        setLoading(false);
      }
    } else {
      // Register mode
      if (!regUsername.trim()) {
        setError("Vui lòng nhập tên đăng nhập.");
        setLoading(false);
        return;
      }
      if (!regFullName.trim()) {
        setError("Vui lòng nhập họ và tên.");
        setLoading(false);
        return;
      }
      if (regPassword.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        setLoading(false);
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setError("Xác nhận mật khẩu không trùng khớp.");
        setLoading(false);
        return;
      }

      try {
        const user = await api.register({
          username: regUsername.trim(),
          password: regPassword,
          fullName: regFullName.trim(),
          email: regEmail.trim() || `${regUsername.trim()}@danang.gov.vn`,
          phone: regPhone.trim(),
          organization: regOrg.trim(),
          role: regRole
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("portal_tab_active", "true");
        }
        onSuccess(user);
      } catch (err: any) {
        setError(err.message || "Lỗi tạo tài khoản Cloudflare D1.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/60 flex items-center justify-center text-teal-200 border border-teal-500/30">
              {mode === "login" ? <ShieldCheck className="w-5 h-5 text-teal-300" /> : <UserPlus className="w-5 h-5 text-teal-300" />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === "login" ? "Đăng Nhập Quản Trị" : "Tạo Tài Khoản (Cloudflare D1)"}
              </h3>
              <p className="text-xs text-teal-200/80 mt-0.5">
                {mode === "login"
                  ? "Xác thực an toàn qua Cloudflare Workers + D1"
                  : "Mã hóa bảo mật PBKDF2 lưu trực tiếp vào CSDL D1"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-white text-teal-800 border-b-2 border-teal-800 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-white text-teal-800 border-b-2 border-teal-800 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            + Tạo tài khoản mới (Cloudflare D1)
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tên đăng nhập / Mã định danh / Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập hoặc email"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Mật khẩu xác thực
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none cursor-pointer"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-800 border-slate-300 focus:ring-teal-700 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Ghi nhớ tên đăng nhập
                  </span>
                </label>
              </div>
            </>
          ) : (
            // Register form
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tên đăng nhập *</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="vd: canbo_khcn"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Họ và tên cán bộ"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="canbo@danang.gov.vn"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="09xx..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cơ quan / Đơn vị</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      placeholder="Sở KH&CN / Viện / Trường"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vai trò đăng ký</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  >
                    <option value="data_officer">Cán bộ Quản lý Dữ liệu</option>
                    <option value="evaluator_expert">Chuyên gia Thẩm định</option>
                    <option value="partner_officer">Cán bộ Đơn vị Phối hợp</option>
                    <option value="org_representative">Đại diện Doanh nghiệp / Tổ chức</option>
                    <option value="expert_user">Chuyên gia / Nhà khoa học</option>
                    <option value="public_user">Người dùng công khai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu (tối thiểu 6 ký tự) *</label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Xác nhận mật khẩu *</label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Tài khoản sẽ được tạo lập trực tiếp vào CSDL Cloudflare D1 và mã hóa an toàn bằng PBKDF2 (SHA-512).
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý qua Cloudflare...</span>
                </>
              ) : mode === "login" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đăng nhập Quản Trị</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Xác nhận Tạo Tài Khoản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
