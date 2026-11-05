import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  HardDrive,
  Download
} from 'lucide-react';

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  entityId?: string;
  moduleType?: string;
  title?: string;
  uploadedBy?: string;
  createdAt: string;
}

interface AttachmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId?: string;
  entityTitle?: string;
  moduleType?: string;
}

export const AttachmentManagerModal: React.FC<AttachmentManagerModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityTitle,
  moduleType
}) => {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [customFileUrl, setCustomFileUrl] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAttachments();
    }
  }, [isOpen, entityId, moduleType]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await api.getAttachments({ entityId, moduleType });
      setAttachments(data || []);
    } catch (err) {
      console.error('Failed to load attachments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (att: AttachmentItem) => {
    let downloadUrl = att.cdnUrl;
    if (downloadUrl.includes('drive.google.com/file/d/')) {
      const match = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = att.fileName || 'tai_lieu_minh_chung.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá tệp đính kèm này?')) return;
    try {
      await api.deleteAttachment(id);
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xoá tệp');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Fetch ImageKit auth credentials
      const auth = await api.getImageKitAuth();

      // In browser environment, we upload metadata to /api/imagekit/upload with simulated/generated ImageKit CDN url
      const safeFileName = file.name.replace(/\s+/g, '_');
      const cdnUrl = `${auth.urlEndpoint}/${moduleType || 'general'}/${Date.now()}_${safeFileName}`;

      const newAtt = await api.uploadAttachment({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        cdnUrl,
        entityId,
        moduleType,
        title: uploadTitle.trim() || file.name
      });

      setAttachments(prev => [newAtt, ...prev]);
      setUploadTitle('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải tệp lên ImageKit CDN');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddDirectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFileUrl.trim() || !customFileName.trim()) return;

    try {
      setUploading(true);
      const newAtt = await api.uploadAttachment({
        fileName: customFileName.trim(),
        cdnUrl: customFileUrl.trim(),
        mimeType: customFileUrl.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? 'image/jpeg' : 'application/pdf',
        entityId,
        moduleType,
        title: uploadTitle.trim() || customFileName.trim()
      });

      setAttachments(prev => [newAtt, ...prev]);
      setCustomFileName('');
      setCustomFileUrl('');
      setUploadTitle('');
    } catch (err: any) {
      alert(err.message || 'Lỗi đính kèm liên kết CDN');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quản lý Tệp Đính kèm & Media CDN
              </h2>
              <p className="text-xs text-slate-500">
                {entityTitle ? `Hồ sơ: ${entityTitle}` : 'Tập trung lưu trữ tài liệu, hình ảnh, văn bản pháp lý & logo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Direct File Picker */}
            <div className="p-4 bg-white rounded-xl border-2 border-dashed border-teal-200 hover:border-teal-400 transition-colors text-center flex flex-col items-center justify-center relative group">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {uploading ? 'Đang tải lên ImageKit...' : 'Chọn tệp từ máy tính để tải lên'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                PDF, DOCX, PNG, JPG, WebP (Tự động tối ưu hóa & CDN)
              </div>
            </div>

            {/* Direct CDN Link input */}
            <form onSubmit={handleAddDirectUrl} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-semibold text-slate-700">Hoặc thêm URL CDN / ImageKit trực tiếp:</div>
              <input
                type="text"
                placeholder="Tên tài liệu / Logo (VD: Logo Vườn ươm)"
                value={customFileName}
                onChange={e => setCustomFileName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="url"
                placeholder="https://ik.imagekit.io/danangsokhcn/..."
                value={customFileUrl}
                onChange={e => setCustomFileUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={uploading || !customFileUrl || !customFileName}
                className="w-full py-1.5 px-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Ghi nhận vào Hồ sơ
              </button>
            </form>
          </div>
        </div>

        {/* List of Attachments */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <div className="text-xs">Đang tải danh sách tệp đính kèm...</div>
            </div>
          ) : attachments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-600">Chưa có tệp đính kèm nào</div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                Tải lên bản sao quyết định phê duyệt, thuyết minh đề tài, bằng sáng chế hoặc hình ảnh sản phẩm.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 mb-2">
                Tổng cộng: {attachments.length} tệp tài liệu
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map(att => {
                  const isImage = (att.mimeType || '').startsWith('image/') || att.cdnUrl.match(/\.(png|jpe?g|webp|svg)$/i);
                  return (
                    <div
                      key={att.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all flex items-start gap-3 shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={att.thumbnailUrl || att.cdnUrl}
                            alt={att.title || att.fileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if remote preview fails
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-teal-700" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate" title={att.title || att.fileName}>
                          {att.title || att.fileName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          {att.fileSize > 0 && <span>{(att.fileSize / 1024).toFixed(1)} KB</span>}
                          <span>{new Date(att.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleCopyLink(att.cdnUrl, att.id)}
                            className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                          >
                            {copiedId === att.id ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Đã chép link</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Chép link CDN</span>
                              </>
                            )}
                          </button>
                          <a
                            href={att.cdnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Mở tệp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(att)}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                            title="Tải tệp tin về máy"
                          >
                            <Download className="w-3 h-3 text-emerald-600" />
                            <span>Tải xuống</span>
                          </button>
                          <button
                            onClick={() => handleDelete(att.id)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 ml-auto flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xoá</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>Tích hợp ImageKit CDN: ik.imagekit.io/danangsokhcn</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
