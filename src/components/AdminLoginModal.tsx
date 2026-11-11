import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const [rememberAccount, setRememberAccount] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('portal_remember_account') === 'true';
  });
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('portal_remembered_username') || '';
  });
  const [password, setPassword] = useState('');

  useEffect(() => {
    try { window.localStorage.removeItem('portal_remembered_password'); } catch {}
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginForm = e.currentTarget as HTMLFormElement;
    setError(null);
    setLoading(true);

    try {
      const normalizedUsername = username.trim();
      const user = await api.login(normalizedUsername, password);
      if (rememberAccount && typeof window !== 'undefined') {
        try {
          const CredentialCtor = (window as any).PasswordCredential;
          const credentialStore = (navigator as any).credentials;
          if (CredentialCtor && credentialStore?.store && loginForm) {
            await credentialStore.store(new CredentialCtor(loginForm));
          }
        } catch (credentialError) {
          console.debug('[Login] Browser credential manager is unavailable:', credentialError);
        }
      }
      if (typeof window !== 'undefined') {
        if (rememberAccount) {
          window.localStorage.setItem('portal_remember_account', 'true');
          window.localStorage.setItem('portal_remembered_username', normalizedUsername);
          window.localStorage.removeItem('portal_remembered_password');
        } else {
          window.localStorage.removeItem('portal_remember_account');
          window.localStorage.removeItem('portal_remembered_username');
          window.localStorage.removeItem('portal_remembered_password');
        }
      }
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
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
              <h3 className="font-bold text-lg leading-tight">Đăng nhập</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form name="admin-login" autoComplete="on" onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên đăng nhập / Mã định danh</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập được cấp..."
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded focus:outline-none cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={rememberAccount}
              onChange={e => setRememberAccount(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
            />
            Ghi nhớ tài khoản
          </label>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
