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
  const [restoreText, setRestoreText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateConfig(formData);
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreText.trim()) return;
    if (!window.confirm('CẢNH BÁO: Phục hồi snapshot sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu trong tệp sao lưu. Bạn có chắc chắn muốn thực hiện?')) return;

    setIsRestoring(true);
    try {
      const parsed = JSON.parse(restoreText);
      await api.restoreBackup(parsed);
      alert('Đã phục hồi cơ sở dữ liệu thành công! Tải lại trang để đồng bộ.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Dữ liệu sao lưu không hợp lệ.');
    } finally {
      setIsRestoring(false);
    }
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
              Cấu Hình Nhận Diện Thương Hiệu & Cơ Quan Chủ Quản
            </h2>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Đã lưu thành công!
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
        <form onSubmit={handleRestore} className="space-y-3 pt-2">
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
        </form>
      </div>

    </div>
  );
};
