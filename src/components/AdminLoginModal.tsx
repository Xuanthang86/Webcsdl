import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, X, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await api.login(username, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd = 'admin123') => {
    setUsername(uname);
    setPassword(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/60 flex items-center justify-center text-teal-200 border border-teal-500/30">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Đăng Nhập</h3>
              <p className="text-xs text-teal-200/80 mt-0.5">Xác thực quyền quản trị viên & cán bộ chuyên trách</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tên đăng nhập / Mã định danh</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (vd: superadmin)"
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mật khẩu xác thực</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Credential Hints for Testing / Evaluation */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-teal-700" />
              <span>Tài khoản mẫu để kiểm tra nhanh phân quyền:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin', 'admin123')}
                className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 rounded font-mono transition-colors"
              >
                superadmin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sysadmin', 'admin123')}
                className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 rounded font-mono transition-colors"
              >
                sysadmin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('leader', 'admin123')}
                className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 rounded font-mono transition-colors"
              >
                leader (Lãnh đạo)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('officer1', 'admin123')}
                className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 rounded font-mono transition-colors"
              >
                officer1 (Cán bộ)
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đăng nhập Quản Trị</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
