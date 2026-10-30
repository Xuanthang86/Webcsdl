import React, { useState } from 'react';
import { SystemConfig } from '../../types';
import { api } from '../../services/api';
import { Settings, Save, CheckCircle2, Download, Upload, ShieldAlert } from 'lucide-react';

interface SystemConfigViewProps {
  config: SystemConfig;
  onConfigUpdated: (newConfig: SystemConfig) => void;
}

export const SystemConfigView: React.FC<SystemConfigViewProps> = ({ config, onConfigUpdated }) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [restoreText, setRestoreText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({ ...config });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setConfigError(null);

    try {
      const updated = await api.updateConfig(formData);
      setFormData({ ...updated });
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setConfigError(err.message || 'Lỗi cập nhật cấu hình hệ thống');
    } finally {
      setIsSaving(false);
    }
  };

  const executeRestore = async () => {
    if (!restoreText.trim()) return;
    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);
    setShowConfirmRestore(false);

    try {
      const parsed = JSON.parse(restoreText);
      await api.restoreBackup(parsed);
      setRestoreSuccess('Đã phục hồi cơ sở dữ liệu thành công! Đang tải lại...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreError(err.message || 'Dữ liệu sao lưu không hợp lệ.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreText.trim()) return;
    setShowConfirmRestore(true);
  };

  return (
    <div className="space-y-6 text-xs max-w-4xl">
      
      {/* Branding & Contact Settings */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
              Tùy biến nhận diện & Cấu hình cổng
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Cấu hình nhận diện thương hiệu & cơ quan chủ quản
            </h2>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Đã lưu thành công!
            </div>
          )}
          {configError && (
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
              {configError}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên cổng thông tin chính thức <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.portalName}
              onChange={(e) => setFormData({ ...formData, portalName: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên cơ quan chủ quản / Đơn vị quản lý <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.governingAgency}
              onChange={(e) => setFormData({ ...formData, governingAgency: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Địa bàn hành chính thành phố
              </label>
              <input
                type="text"
                value={formData.cityArea}
                onChange={(e) => setFormData({ ...formData, cityArea: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên miền website chính thức
              </label>
              <input
                type="text"
                value={formData.websiteDomain}
                onChange={(e) => setFormData({ ...formData, websiteDomain: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email tiếp nhận thông tin
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Đường dây nóng / Điện thoại liên hệ
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Địa chỉ trụ sở cơ quan
            </label>
            <input
              type="text"
              value={formData.contactAddress}
              onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enablePublicSubmissions}
                onChange={(e) => setFormData({ ...formData, enablePublicSubmissions: e.target.checked })}
                className="rounded text-teal-800"
              />
              <span className="font-semibold text-slate-700">Cho phép công dân & doanh nghiệp nộp đề xuất trực tuyến</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="rounded text-red-600"
              />
              <span className="font-semibold text-slate-700">Chế độ bảo trì hệ thống</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình hệ thống'}
          </button>
        </div>
      </form>

      {/* Backup & Restore Studio */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Sao lưu & Phục hồi toàn vẹn dữ liệu
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Snapshot Backup & Disaster Recovery
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tải về toàn bộ cơ sở dữ liệu dạng JSON hoặc phục hồi hệ thống khi có sự cố
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex-1">
            <div className="font-semibold text-slate-800">Tạo bản sao lưu ngay lập tức:</div>
            <div className="text-slate-500 text-[11px]">Bao gồm tất cả 13 phân hệ, tài khoản, quan hệ liên kết và nhật ký truy vết.</div>
          </div>
          <a
            href={api.getBackupUrl()}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Tải snapshot cơ sở dữ liệu (.json)
          </a>
        </div>

        {/* Restore Section */}
        <form onSubmit={handleRestoreSubmit} className="space-y-3 pt-2">
          {restoreSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-semibold">
              ✓ {restoreSuccess}
            </div>
          )}
          {restoreError && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 font-semibold">
              ⚠ {restoreError}
            </div>
          )}

          <label className="block font-semibold text-slate-700">
            Phục hồi dữ liệu từ bản sao lưu JSON:
          </label>
          <textarea
            rows={4}
            value={restoreText}
            onChange={(e) => setRestoreText(e.target.value)}
            placeholder="Dán nội dung tệp JSON sao lưu vào đây để khôi phục..."
            className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
          />

          {showConfirmRestore && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Xác nhận phục hồi bản sao lưu snapshot?
              </div>
              <p className="text-amber-800 text-[11px]">
                Hành động này sẽ thay thế cơ sở dữ liệu hiện tại bằng dữ liệu sao lưu. Một bản sao lưu an toàn tự động sẽ được tạo trước khi áp dụng.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeRestore}
                  disabled={isRestoring}
                  className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-xs"
                >
                  {isRestoring ? 'Đang phục hồi...' : 'Đồng ý phục hồi'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmRestore(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Hủy thao tác
                </button>
              </div>
            </div>
          )}

          {!showConfirmRestore && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isRestoring || !restoreText.trim()}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {isRestoring ? 'Đang phục hồi...' : 'Thực hiện phục hồi dữ liệu'}
              </button>
            </div>
          )}
        </form>
      </div>

    </div>
  );
};
