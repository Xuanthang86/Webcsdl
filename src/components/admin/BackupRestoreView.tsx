import React, { useState } from 'react';
import { AlertTriangle, Download, FileJson, RotateCcw, ShieldCheck, Upload, X } from 'lucide-react';
import { api } from '../../services/api';

interface BackupRestoreViewProps {
  canRestore: boolean;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ canRestore }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setMessage(null);
    try {
      const blob = await api.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `portal_database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Đã tải bản sao lưu dữ liệu thành công.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Không thể tạo bản sao lưu dữ liệu.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(null);
    setSnapshot(null);
    setMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tệp sao lưu định dạng JSON.' });
      event.target.value = '';
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || !parsed.systemConfig || !Array.isArray(parsed.science_tasks)) {
        throw new Error('Tệp không có cấu trúc bản sao lưu dữ liệu hợp lệ.');
      }
      setSelectedFile(file);
      setSnapshot(parsed);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Không thể đọc tệp sao lưu.' });
      event.target.value = '';
    }
  };

  const handleRestore = async () => {
    if (!snapshot || !canRestore) return;
    setIsRestoring(true);
    setMessage(null);
    try {
      await api.restoreBackup(snapshot);
      setConfirmRestore(false);
      setSelectedFile(null);
      setSnapshot(null);
      setMessage({ type: 'success', text: 'Đã phục hồi dữ liệu từ bản sao lưu. Vui lòng tải lại trang quản trị để đồng bộ dữ liệu.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Không thể phục hồi dữ liệu.' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sao lưu và phục hồi dữ liệu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tạo tệp sao lưu toàn bộ dữ liệu hệ thống hoặc phục hồi từ một bản sao lưu JSON hợp lệ.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Sao lưu dữ liệu</h2>
              <p className="text-xs text-slate-500">Tải bản snapshot dữ liệu hiện tại dưới dạng JSON.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Tệp sao lưu có thể chứa dữ liệu đề tài, người dùng, cấu hình và các dữ liệu nghiệp vụ khác. Hãy lưu trữ ở nơi an toàn và giới hạn người được phép truy cập.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="min-h-10 w-full sm:w-auto px-4 py-2 rounded-lg bg-sky-800 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Đang tạo bản sao lưu...' : 'Tải bản sao lưu dữ liệu'}
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Phục hồi dữ liệu</h2>
              <p className="text-xs text-slate-500">Chỉ sử dụng tệp JSON được tạo từ chức năng sao lưu của hệ thống.</p>
            </div>
          </div>
          {canRestore ? (
            <>
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center hover:border-sky-400 hover:bg-sky-50">
                <FileJson className="w-6 h-6 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Chọn tệp sao lưu JSON</span>
                <span className="text-xs text-slate-500">Tệp được kiểm tra cấu trúc trước khi cho phép phục hồi</span>
                <input type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} />
              </label>
              {selectedFile && snapshot && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold break-all">{selectedFile.name}</div>
                  <div className="mt-1 text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Tệp JSON hợp lệ về cấu trúc cơ bản</div>
                </div>
              )}
              <button
                type="button"
                disabled={!snapshot || isRestoring}
                onClick={() => setConfirmRestore(true)}
                className="min-h-10 w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Tiếp tục phục hồi
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Tài khoản hiện tại được phép tạo bản sao lưu nhưng không được phép phục hồi. Chức năng phục hồi chỉ dành cho Admin toàn quyền (super_admin).
            </div>
          )}
        </section>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 flex gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Kiểm soát an toàn</div>
          <p className="mt-1 text-xs leading-relaxed">
            Máy chủ tiếp tục kiểm tra quyền truy cập. Trước khi phục hồi, hệ thống tự lưu một bản dự phòng trạng thái hiện tại; thao tác phục hồi thay thế dữ liệu đang sử dụng bằng snapshot đã chọn.
          </p>
        </div>
      </div>

      {confirmRestore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />
              <div>
                <h2 className="font-bold text-slate-900">Xác nhận phục hồi toàn bộ dữ liệu?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Thao tác này sẽ thay thế dữ liệu hiện tại bằng nội dung trong tệp sao lưu. Chỉ tiếp tục khi đã chọn đúng tệp và hiểu rõ ảnh hưởng.
                </p>
                <p className="mt-2 text-xs font-semibold text-rose-700 break-all">{selectedFile?.name}</p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => setConfirmRestore(false)} className="min-h-10 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Hủy
              </button>
              <button type="button" onClick={handleRestore} disabled={isRestoring} className="min-h-10 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-sm font-semibold">
                {isRestoring ? 'Đang phục hồi...' : 'Xác nhận phục hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
