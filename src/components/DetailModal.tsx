import React, { useState } from 'react';
import { BaseEntity, EntityRelationship, User } from '../types';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Building, 
  User as UserIcon, 
  Calendar, 
  Tag, 
  DollarSign, 
  Link as LinkIcon, 
  Mail, 
  Share2, 
  MessageSquarePlus, 
  FileCheck,
  Download,
  Paperclip,
  Lock,
  ShieldCheck,
  Plus,
  Check,
  Globe,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Phone,
  FileCode,
  Archive,
  Layers,
  MapPin,
  School
} from 'lucide-react';
import { AttachmentManagerModal } from './AttachmentManagerModal';

interface DetailModalProps {
  entity: BaseEntity | null;
  relationships: EntityRelationship[];
  currentUser?: User;
  onOpenAdminLogin?: () => void;
  onClose: () => void;
  onOpenEntity: (moduleType: string, id: string) => void;
  onOpenConnectModal: (entity: BaseEntity) => void;
}

const safeDisplayValue = (value: any, fallback = 'Chưa cập nhật'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const items = value.map((item) => safeDisplayValue(item, '')).filter(Boolean);
    return items.length ? items.join(', ') : fallback;
  }
  if (typeof value === 'object') {
    const preferred = value.name ?? value.fullName ?? value.title ?? value.label ?? value.value ?? value.url;
    if (preferred !== undefined && preferred !== null) return safeDisplayValue(preferred, fallback);
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return fallback;
};

export const DetailModal: React.FC<DetailModalProps> = ({
  entity,
  relationships,
  currentUser,
  onOpenAdminLogin,
  onClose,
  onOpenEntity,
  onOpenConnectModal
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Foreign Languages State with built-in languages & dynamic add
  const [languages, setLanguages] = useState<string[]>(() => {
    if (entity?.foreignLanguages) {
      if (Array.isArray(entity.foreignLanguages)) return entity.foreignLanguages;
      if (typeof entity.foreignLanguages === 'string') {
        return entity.foreignLanguages.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return ['Tiếng Anh (Thành thạo)', 'Tiếng Nhật (N2)', 'Tiếng Hàn (Giao tiếp)'];
  });
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  if (!entity) return null;

  // Authorization check: public_user or guest cannot view restricted detailed fields
  const isAuthorized = !!currentUser && currentUser.role !== 'public_user';

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguageInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages(prev => [...prev, trimmed]);
      setNewLanguageInput('');
      setIsAddingLanguage(false);
    }
  };

  const formatDateSafe = (dateVal?: any) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return String(dateVal);
    }
  };

  const handleDownloadFile = (fileName?: string) => {
    const safeTitle = (entity.title || 'ban_ghi').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const docName = fileName || `Ho_so_${entity.code || entity.id}_${safeTitle}.txt`;
    const content = `================================================================================
ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ
CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP CẤP THÀNH PHỐ
================================================================================
HỒ SƠ THÔNG TIN TRÍCH XUẤT CHÍNH THỨC
Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}
Mã số quản lý định danh: ${entity.code || entity.id}
Phân hệ cơ sở dữ liệu: ${entity.moduleType || 'science_tasks'}

1. THÔNG TIN CHUNG
- Tiêu đề / Tên: ${entity.title || 'Chưa cập nhật tiêu đề'}
- Lĩnh vực chuyên ngành: ${entity.field || 'Đa ngành'}
- Chủ trì / Tác giả / Đơn vị sở hữu: ${entity.ownerName || 'Chưa cập nhật'}
- Nguồn gốc dữ liệu: ${entity.source || 'Cơ quan có thẩm quyền'}
- Trạng thái phê duyệt: ${entity.status || 'draft'}
- Tình trạng xác minh: ${entity.verificationStatus || 'pending'}
- Phạm vi công khai: ${entity.publicityLevel || 'public'}
- Ngày khởi tạo: ${entity.createdAt || '—'}
- Cập nhật lần cuối: ${entity.updatedAt || entity.createdAt || '—'}

2. MÔ TẢ TÓM TẮT NỘI DUNG
${entity.description || 'Không có mô tả chi tiết'}

================================================================================
Bản quyền dữ liệu thuộc UBND Thành phố & Sở Khoa học và Công nghệ.
Tra cứu trực tuyến tại Cổng thông tin KH&CN Thành phố.
================================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName.endsWith('.txt') ? docName : `${docName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?module=${entity.moduleType || 'science_tasks'}&id=${entity.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    return `${Number(num).toLocaleString()} đ`;
  };

  // Render the authorization banner for protected views
  const renderPermissionNotice = (moduleName: string) => (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Yêu cầu có tài khoản được cấp quyền xem các trường chi tiết chuyên sâu</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
          Thông tin chi tiết chuyên sâu của {moduleName} được bảo mật theo quy định quản lý cơ sở dữ liệu KH&CN thành phố. Vui lòng đăng nhập với tài khoản cán bộ quản lý, chuyên gia thẩm định hoặc lãnh đạo đơn vị để truy cập toàn bộ dữ liệu.
        </p>
      </div>
      {onOpenAdminLogin && (
        <button
          type="button"
          onClick={onOpenAdminLogin}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer shrink-0"
        >
          Đăng nhập ngay
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {entity.code || entity.id}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700 capitalize">
                {(entity.moduleType || 'science_tasks').replace(/_/g, ' ')}
              </span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {formatDateSafe(entity.updatedAt || entity.createdAt)}</span>
              {isAuthorized && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Đã cấp quyền xem chi tiết
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {entity.title || 'Không có tiêu đề'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {downloadSuccessToast && (
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 animate-in fade-in">
                Đã tải tệp về máy!
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDownloadFile()}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải tệp tóm tắt hồ sơ chính thức"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải tệp hồ sơ</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAttachments(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Quản lý & xem tệp đính kèm"
            >
              <Paperclip className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Tệp đính kèm</span>
            </button>
            <button
              onClick={handleCopyLink}
              title="Sao chép đường dẫn bản ghi"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {copied && <span className="text-[11px] text-teal-700 font-medium">Đã chép</span>}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm text-slate-700">

          {/* =========================================================================
              MODULE 1: ĐỀ TÀI, NHIỆM VỤ KH&CN
              Public list: STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thời gian thực hiện, Lĩnh vực, Tóm tắt đề tài
              Authorized detail: STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thành viên tham gia, Thời gian thực hiện, Lĩnh vực, Tóm tắt đề tài, Tài liệu minh chứng, Ký hiệu Kho
             ========================================================================= */}
          {entity.moduleType === 'science_tasks' && (
            <div className="space-y-5">
              {!isAuthorized && renderPermissionNotice('Đề tài, Nhiệm vụ KH&CN')}

              {/* Bảng thông tin chi tiết */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>Hồ sơ chi tiết Đề tài, Nhiệm vụ KH&CN</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên đề tài:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cấp quản lý:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.managementLevel || entity.managingAgency || 'Cấp Thành phố'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan chủ trì:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.leadOrganization || entity.ownerName || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ nhiệm đề tài:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{entity.principalInvestigator || '—'}</span>
                  </div>

                  {/* RESTRICTED FIELD: Thành viên tham gia */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thành viên tham gia:</span>
                    <span className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">
                          {safeDisplayValue(entity.members ?? entity.projectTeam)}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thời gian thực hiện:</span>
                    <span className="sm:col-span-2 font-mono text-slate-700">{safeDisplayValue(entity.executionTime ?? entity.actualDuration)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.field || 'Đa ngành'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt đề tài:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.description || entity.summary || 'Chưa cập nhật tóm tắt nội dung nghiên cứu.'}</p>
                  </div>

                  {/* RESTRICTED FIELD: Tài liệu minh chứng */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tài liệu minh chứng:</span>
                    <div className="sm:col-span-2">
                      <div className="space-y-1.5">
                        <div className="text-slate-800 font-medium">
                          {safeDisplayValue(entity.evidenceDocuments ?? entity.attachmentSummary ?? (Array.isArray(entity.attachments) ? entity.attachments : undefined))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAttachments(true)}
                          className="text-teal-800 hover:text-teal-900 font-semibold underline inline-flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Paperclip className="w-3 h-3" />
                          Xem và tải tệp đính kèm hồ sơ minh chứng
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RESTRICTED FIELD: Ký hiệu Kho */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Ký hiệu Kho lưu trữ:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                          {safeDisplayValue(entity.storageCode ?? entity.archiveCode ?? entity.warehouseCode)}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 2: SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ
              Columns: STT, Năm công nhận, Tên sáng kiến, Tác giả, Chủ sở hữu, Địa chỉ chủ sở hữu, Lĩnh vực
             ========================================================================= */}
          {entity.moduleType === 'initiatives' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-amber-50/70 px-4 py-3 border-b border-amber-200 font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>Chi tiết Sáng kiến có tác dụng, ảnh hưởng đối với thành phố</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm công nhận:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-slate-900">{entity.recognitionYear || '2025'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên sáng kiến:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tác giả sáng kiến:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">
                      {Array.isArray(entity.authors) ? entity.authors.join(', ') : (entity.authors || entity.implementingLead || '—')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ sở hữu:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.ownerName || entity.proposingOrg || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ chủ sở hữu:</span>
                    <span className="sm:col-span-2 text-slate-700">{entity.ownerAddress || entity.applicationArea || 'Thành phố Đà Nẵng'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Đa ngành'}</span>
                  </div>
                  {entity.problemSolved && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Vấn đề giải quyết:</span>
                      <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved}</p>
                    </div>
                  )}
                  {entity.solutionDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Nội dung giải pháp:</span>
                      <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.solutionDetails}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 3: SÁNG CHẾ & SỞ HỮU TRÍ TUỆ
              Columns: STT, Số bằng/Số đơn, Tên sáng chế, Tác giả, Chủ sở hữu, Lĩnh vực, Tóm tắt
             ========================================================================= */}
          {entity.moduleType === 'patents' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-purple-50/70 px-4 py-3 border-b border-purple-200 font-bold text-xs uppercase tracking-wider text-purple-950 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>Chi tiết Sáng chế & Sở hữu trí tuệ</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên sáng chế / Giải pháp:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Số bằng / Số đơn:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block w-fit">
                      {entity.patentNumber || entity.code || '28492/SHTT'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Loại hình bảo hộ:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.ipType || entity.patentType || 'Bằng độc quyền Sáng chế'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tác giả sáng chế:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">
                      {Array.isArray(entity.authors) ? entity.authors.join(', ') : (entity.authors || entity.inventors || '—')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ sở hữu văn bằng:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.ownerName || entity.applicant || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực công nghệ:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Khoa học Kỹ thuật và Công nghệ'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt sáng chế:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.description || entity.abstract || 'Chưa cập nhật tóm tắt nội dung sáng chế.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan cấp bằng:</span>
                    <span className="sm:col-span-2 text-slate-700">{entity.issuingAgency || 'Cục Sở hữu trí tuệ Việt Nam'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tình trạng bảo hộ:</span>
                    <span className="sm:col-span-2 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-fit">
                      {entity.status === 'approved' ? 'Đã cấp bằng bảo hộ chính thức' : 'Đang thẩm định đơn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 4: CHUYÊN GIA & NHÀ KHOA HỌC
              Public list: STT, Tên Chuyên gia, Năm sinh, Chuyên ngành
              Authorized detail: STT, Tên Chuyên gia, Ngày tháng năm sinh, Giới tính, Học hàm, Học vị, Năm bắt đầu công tác, Chức danh nghiên cứu, Chức vụ, Email, Điện thoại, Lĩnh vực, Chuyên ngành, Tên đơn vị công tác, Quá trình đào tạo và học tập, Quá trình công tác, Ngoại ngữ (tích hợp sẵn tiếng Anh, tiếng Nhật, tiếng Hàn... và thêm mới), Tên bài báo/Tạp chí/Quốc gia, Tên văn bằng, Tên công trình/Kết quả nghiên cứu, Tên đề tài/Dự án (Cấp đề tài, Thời gian, Thành viên, Chủ trì/Tham gia, Tình trạng), Giải thưởng, Kinh nghiệm.
             ========================================================================= */}
          {entity.moduleType === 'experts' && (
            <div className="space-y-5">
              {!isAuthorized && renderPermissionNotice('Chuyên gia & Nhà khoa học')}

              {/* Public/Basic Overview */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Chuyên gia Khoa học & Công nghệ</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên Chuyên gia:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title || entity.fullName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm sinh:</span>
                    <span className="sm:col-span-2 font-mono font-semibold text-slate-800">{entity.birthYear || '1978'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chuyên ngành:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.specialty || entity.primaryField || entity.field}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Protected Sections (Only if Authorized) */}
              {isAuthorized ? (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* General Profile Grid */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-teal-700" />
                      <span>Thông tin Lý lịch & Học vị</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Ngày tháng năm sinh:</span>
                        <span className="font-mono font-medium text-slate-800">{entity.birthDate || (entity.birthYear ? `15/08/${entity.birthYear}` : '15/08/1978')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                        <span className="font-medium text-slate-800">{entity.gender || 'Nam'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học hàm:</span>
                        <span className="font-semibold text-teal-900">{entity.academicRank || 'Phó Giáo sư (PGS)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học vị:</span>
                        <span className="font-semibold text-teal-900">{entity.degree || 'Tiến sĩ (TS)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm bắt đầu công tác:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.startWorkYear || entity.startYear || '2004'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức danh nghiên cứu:</span>
                        <span className="font-medium text-slate-800">{entity.researchTitle || 'Nghiên cứu viên Cao cấp'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức vụ:</span>
                        <span className="font-medium text-slate-800">{entity.jobTitle || entity.position || 'Trưởng phòng NCKH & Hợp tác Quốc tế'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                        <span className="font-mono text-teal-800 font-medium">{entity.email || entity.publicEmail || 'expert@danang.gov.vn'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Điện thoại liên hệ:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.phone || entity.publicPhone || '0905.123.456'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Lĩnh vực nghiên cứu:</span>
                        <span className="font-semibold text-slate-800">{entity.field || 'Khoa học Kỹ thuật và Công nghệ'}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-slate-400 block mb-0.5">Tên đơn vị công tác:</span>
                        <span className="font-semibold text-slate-900">{entity.workplace || entity.leadOrganization || entity.organization || 'Trường Đại học Bách Khoa - Đại học Đà Nẵng'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quá trình đào tạo & công tác */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình đào tạo và học tập:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.trainingProcess || `• 1996 - 2001: Kỹ sư Công nghệ Thông tin, Đại học Bách Khoa Đà Nẵng\n• 2002 - 2005: Thạc sĩ Khoa học Máy tính, Đại học Quốc gia\n• 2007 - 2011: Tiến sĩ Kỹ thuật Điện toán, Tokyo Institute of Technology (Nhật Bản)`}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình công tác:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.workExperience || `• 2004 - 2011: Giảng viên, Nghiên cứu viên Bộ môn Hệ thống Thông tin\n• 2012 - 2018: Phó Trưởng Khoa, Giám đốc Phòng Thí nghiệm Trọng điểm\n• 2019 - nay: Trưởng Bộ môn, Thành viên Hội đồng Khoa học & Công nghệ TP Đà Nẵng`}
                      </p>
                    </div>
                  </div>

                  {/* Ngoại ngữ: Tích hợp sẵn + Thêm mới */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-teal-700" />
                        <span>Ngoại ngữ sử dụng trong nghiên cứu:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingLanguage(!isAddingLanguage)}
                        className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm ngoại ngữ mới</span>
                      </button>
                    </div>

                    {/* Pre-integrated & Added languages */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {languages.map((lang, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-700" />
                          <span>{lang}</span>
                        </span>
                      ))}
                    </div>

                    {/* Form thêm ngoại ngữ mới */}
                    {isAddingLanguage && (
                      <form onSubmit={handleAddLanguage} className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nhập tên ngoại ngữ (VD: Tiếng Pháp, Tiếng Trung HSK5, Tiếng Đức B2...)"
                          value={newLanguageInput}
                          onChange={(e) => setNewLanguageInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsAddingLanguage(false); setNewLanguageInput(''); }}
                          className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Hủy
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Bài báo, Tạp chí, Quốc gia & Văn bằng */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                      Công bố Khoa học (Bài báo / Tạp chí / Quốc gia) & Văn bằng Bảo hộ
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên bài báo / Tạp chí / Quốc gia:</span>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          <li>Advanced Machine Learning Architecture for Real-time Water Monitoring Systems - IEEE Internet of Things Journal (Hoa Kỳ, ISI Q1, 2024)</li>
                          <li>Nghiên cứu mô hình tối ưu hóa mạng lưới viễn thông trong thành phố thông minh - Tạp chí KH&CN Đại học Đà Nẵng (Việt Nam, 2023)</li>
                          <li>Deep Residual Learning for Automated Medical Imaging Classification - Springer LNCS (Quốc tế, 2022)</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên văn bằng bảo hộ sở hữu trí tuệ:</span>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          <li>Bằng Độc quyền Sáng chế số 28492/SHTT: Phương pháp cảnh báo sớm ngập úng đô thị dựa trên mạng cảm biến không dây</li>
                          <li>Bằng Độc quyền Giải pháp hữu ích số 3105/GPHI: Thiết bị thu thập và mã hóa dữ liệu cảm biến đa chỉ tiêu</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên công trình / Kết quả nghiên cứu ứng dụng:</span>
                        <p className="text-slate-700 leading-relaxed">
                          Hệ thống Giám sát và Cảnh báo Thiên tai Đô thị Thông minh (đã triển khai thử nghiệm tại Trung tâm Điều hành Đô thị Thông minh TP Đà Nẵng); Nền tảng chia sẻ dữ liệu nghiên cứu mở cấp trường đại học.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách Đề tài/Dự án nghiên cứu */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800">
                      Tên đề tài / Dự án nghiên cứu khoa học
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Tên đề tài / Dự án</th>
                            <th className="py-2.5 px-3 w-28">Cấp đề tài</th>
                            <th className="py-2.5 px-3 w-28">Thời gian</th>
                            <th className="py-2.5 px-3 w-32">Thành viên</th>
                            <th className="py-2.5 px-3 w-32">Chủ trì/Tham gia</th>
                            <th className="py-2.5 px-3 w-28">Tình trạng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">Nghiên cứu ứng dụng thị giác máy tính và IoT trong giao thông đô thị</td>
                            <td className="py-2.5 px-3 font-semibold text-teal-800">Cấp Quốc gia</td>
                            <td className="py-2.5 px-3 font-mono">2022 - 2024</td>
                            <td className="py-2.5 px-3">8 thành viên</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">Chủ nhiệm đề tài</td>
                            <td className="py-2.5 px-3 text-emerald-700 font-medium">Đã nghiệm thu</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">Xây dựng bản đồ số tài nguyên du lịch thông minh trên nền tảng GIS</td>
                            <td className="py-2.5 px-3 font-semibold text-teal-800">Cấp Thành phố</td>
                            <td className="py-2.5 px-3 font-mono">2021 - 2023</td>
                            <td className="py-2.5 px-3">5 thành viên</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">Chủ trì kỹ thuật</td>
                            <td className="py-2.5 px-3 text-emerald-700 font-medium">Đã chuyển giao</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">Phát triển thuật toán nhận dạng dị thường trong mạng cảm biến công nghiệp</td>
                            <td className="py-2.5 px-3 font-semibold text-teal-800">Cấp Cơ sở</td>
                            <td className="py-2.5 px-3 font-mono">2023 - 2024</td>
                            <td className="py-2.5 px-3">4 thành viên</td>
                            <td className="py-2.5 px-3">Tham gia nghiên cứu</td>
                            <td className="py-2.5 px-3 text-amber-700 font-medium">Đang triển khai</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Giải thưởng & Kinh nghiệm */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2">
                      <span className="font-bold text-amber-950 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-700" />
                        Giải thưởng Khoa học & Công nghệ:
                      </span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {entity.awards || `• Giải Nhất Sáng tạo Khoa học và Công nghệ Việt Nam (VIFOTEC) năm 2023\n• Bằng khen của Chủ tịch UBND Thành phố Đà Nẵng về thành tích nghiên cứu khoa học xuất sắc năm 2024\n• Giải thưởng Nhà khoa học trẻ tiêu biểu khu vực miền Trung`}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        Kinh nghiệm & Năng lực tư vấn:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.experienceNotes || `Hơn 20 năm chủ trì và phản biện các đề tài KH&CN cấp Nhà nước và Thành phố. Thành viên Hội đồng Giám khảo cuộc thi Khởi nghiệp Đổi mới sáng tạo TP Đà Nẵng (SURF). Cố vấn chiến lược công nghệ cho 6 doanh nghiệp khởi nghiệp đổi mới sáng tạo.`}
                      </p>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* =========================================================================
              MODULE 4: DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO
              Columns: STT, Tên doanh nghiệp, Địa chỉ hoạt động, Website, File logo, Lĩnh vực, Tóm tắt, Sản phẩm giải quyết vấn đề gì, Số lượng sáng lập viên, Tổng số nhân sự, Người đứng đầu, Số điện thoại, Email, Năm bắt đầu khởi nghiệp
             ========================================================================= */}
          {entity.moduleType === 'startups' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Doanh nghiệp Khởi nghiệp Sáng tạo</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-2 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Logo & Tên doanh nghiệp:</span>
                    <div className="sm:col-span-2 flex items-center gap-3">
                      {entity.logoUrl ? (
                        <img src={entity.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 text-base">
                          {entity.title?.charAt(0) || 'D'}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 text-base block">{entity.title}</span>
                        <span className="text-[11px] text-slate-500">{entity.wardSchool || 'Thuộc địa bàn TP Đà Nẵng'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ hoạt động:</span>
                    <span className="sm:col-span-2 text-slate-800">{entity.address || entity.headquarters || 'TP. Đà Nẵng'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Website doanh nghiệp:</span>
                    <div className="sm:col-span-2">
                      {entity.website ? (
                        <a href={entity.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono">
                          {entity.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-slate-400">Chưa có website</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực kinh doanh:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Đa ngành'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt về doanh nghiệp & sản phẩm:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.description || entity.summary || 'Chưa cập nhật tóm tắt.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Sản phẩm giải quyết vấn đề gì:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || 'Tối ưu hóa quy trình và nâng cao năng suất công nghệ cao.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Số lượng sáng lập viên:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-slate-800">{entity.founderCount || 2} người</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tổng số nhân sự hiện tại:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-slate-800">{entity.currentStaffCount || entity.teamSize || '25'} nhân sự</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Người đứng đầu doanh nghiệp:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{entity.leaderName || entity.representative || entity.ownerName || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Điện thoại / Email người đứng đầu:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">
                      {entity.leaderPhone || entity.publicPhone || '0905.123.456'} · <span className="text-teal-800">{entity.leaderEmail || entity.publicEmail || 'contact@startup.vn'}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm bắt đầu khởi nghiệp:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-slate-900">{entity.foundedYear || entity.startYear || '2023'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 5: TỔ CHỨC TRUNG GIAN
              Columns: STT, Tên tổ chức, Địa chỉ, Thông tin về tổ chức
             ========================================================================= */}
          {entity.moduleType === 'support_organizations' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Tổ chức Trung gian</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên tổ chức:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ:</span>
                    <span className="sm:col-span-2 text-slate-800">{entity.address || entity.headquarters || 'Số 48 Phan Đình Phùng, Hải Châu, Đà Nẵng'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thông tin về tổ chức:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">
                      {entity.description || entity.information || entity.servicesOffered || 'Tổ chức trung gian hỗ trợ khởi nghiệp, không gian làm việc chung, ươm tạo doanh nghiệp công nghệ cao và kết nối mạng lưới cố vấn.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 6: DỰ ÁN KHỞI NGHIỆP
              Public: STT, Tên dự án, Lĩnh vực khởi nghiệp, Sản phẩm giải quyết vấn đề, Người đứng đầu, Dự án được ươm tạo từ tổ chức, Năm bắt đầu khởi nghiệp
              Authorized detail: STT, Tên dự án, Địa chỉ hoạt động, Lĩnh vực khởi nghiệp, Tóm tắt về dự án, Sản phẩm giải quyết vấn đề, Số lượng thành viên tham gia dự án, Họ và tên người đứng đầu dự án, Số điện thoại người đứng đầu dự án, Email người đứng đầu dự án, Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án), Năm bắt đầu khởi nghiệp
             ========================================================================= */}
          {entity.moduleType === 'startup_projects' && (
            <div className="space-y-5">
              {!isAuthorized && renderPermissionNotice('Dự án Khởi nghiệp')}

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Dự án Khởi nghiệp</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên dự án:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>

                  {/* RESTRICTED: Địa chỉ hoạt động */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ hoạt động:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800">{entity.address || 'Quận Liên Chiểu, TP. Đà Nẵng'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực khởi nghiệp:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Đa ngành'}</span>
                  </div>

                  {/* RESTRICTED: Tóm tắt về dự án */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt về dự án:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <p className="text-slate-700 leading-relaxed">{entity.description || 'Chưa cập nhật nội dung tóm tắt.'}</p>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Sản phẩm giải quyết vấn đề:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description}</p>
                  </div>

                  {/* RESTRICTED: Số lượng thành viên tham gia */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Số lượng thành viên tham gia dự án:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount || 5} thành viên</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Họ và tên người đứng đầu dự án:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{entity.leaderName || entity.ownerName || '—'}</span>
                  </div>

                  {/* RESTRICTED: Số điện thoại người đứng đầu */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Số điện thoại người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono font-medium text-slate-900">{entity.leaderPhone || entity.publicPhone || '0905.123.456'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RESTRICTED: Email người đứng đầu */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-teal-800">{entity.leaderEmail || entity.publicEmail || 'leader@duan.vn'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Dự án được ươm tạo từ tổ chức:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.incubator || 'Tự hình thành dự án'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm bắt đầu khởi nghiệp:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-slate-900">{entity.startYear || '2024'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 7: Ý TƯỞNG KHỞI NGHIỆP
              Public: STT, Tên ý tưởng, Lĩnh vực khởi nghiệp, Người đứng đầu, Giáo viên hướng dẫn
              Authorized detail: STT, Tên ý tưởng, Địa chỉ hoạt động (Nếu có), Lĩnh vực khởi nghiệp, Ý tưởng thuộc Xã/phường - Trường học, Tóm tắt về ý tưởng (Khoảng 150-200 từ), Sản phẩm giải quyết vấn đề gì, Số lượng thành viên tham gia ý tưởng khởi nghiệp, Người đứng đầu nhóm ý tưởng, Số điện thoại người đứng đầu, Email người đứng đầu, Tên thầy/cô giáo hướng dẫn thực hiện, Nhóm ý tưởng đang học tập/công tác tại đơn vị nào? (Tên đơn vị và Địa chỉ)
             ========================================================================= */}
          {entity.moduleType === 'startup_ideas' && (
            <div className="space-y-5">
              {!isAuthorized && renderPermissionNotice('Ý tưởng Khởi nghiệp')}

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Ý tưởng Khởi nghiệp</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên ý tưởng:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>

                  {/* RESTRICTED: Địa chỉ hoạt động */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ hoạt động (Nếu có):</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800">{entity.address || '54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Lĩnh vực khởi nghiệp:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Đa ngành'}</span>
                  </div>

                  {/* RESTRICTED: Ý tưởng thuộc Xã/phường - Trường học */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Ý tưởng thuộc Xã/phường - Trường học:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-semibold text-slate-800">{entity.wardSchool || 'Phường Hòa Khánh Bắc - Đại học Bách Khoa ĐHĐN'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RESTRICTED: Tóm tắt về ý tưởng (150-200 từ) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt về ý tưởng (Khoảng 150-200 từ):</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{entity.description || 'Chưa cập nhật nội dung tóm tắt chi tiết.'}</p>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Sản phẩm giải quyết vấn đề gì:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description}</p>
                  </div>

                  {/* RESTRICTED: Số lượng thành viên tham gia ý tưởng */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Số lượng thành viên tham gia:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount || 3} thành viên</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Người đứng đầu nhóm ý tưởng:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{entity.leaderName || entity.proposer || '—'}</span>
                  </div>

                  {/* RESTRICTED: SĐT & Email người đứng đầu */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">SĐT & Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-slate-800">
                          {entity.leaderPhone || entity.publicPhone || '0905.123.789'} · <span className="text-teal-800">{entity.leaderEmail || entity.publicEmail || 'leader@ytuong.vn'}</span>
                        </span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên thầy/cô giáo hướng dẫn:</span>
                    <span className="sm:col-span-2 font-semibold text-indigo-900">{entity.mentorTeacher || 'TS. Huỳnh Tấn Đạt'}</span>
                  </div>

                  {/* RESTRICTED: Đơn vị đang học tập/công tác */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Đơn vị học tập / công tác:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">{entity.currentAffiliation || 'Trường Đại học Bách Khoa - Đại học Đà Nẵng, 54 Nguyễn Lương Bằng, Q. Liên Chiểu'}</span>
                      ) : (
                        <span className="text-amber-800 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Yêu cầu tài khoản có thẩm quyền xem
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 8: DANH SÁCH XÃ, PHƯỜNG, ĐẶC KHU
              Columns: STT, Tên xã/phường/đặc khu, Địa chỉ, Thông tin liên hệ, Website
             ========================================================================= */}
          {entity.moduleType === 'wards' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Địa bàn Xã / Phường / Đặc khu</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên xã / phường / đặc khu:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ:</span>
                    <span className="sm:col-span-2 text-slate-800">{entity.address}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thông tin liên hệ:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.contactInfo || entity.phone || '0236.3822.xxx'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Website:</span>
                    <div className="sm:col-span-2">
                      {entity.website ? (
                        <a href={entity.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono">
                          {entity.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-slate-400">Chưa cập nhật cổng điện tử</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 9: TRƯỜNG ĐẠI HỌC, CAO ĐẲNG TRÊN ĐỊA BÀN
              Columns: STT, Tên trường, Thuộc xã/ phường, Địa chỉ, Thông tin liên hệ, Website
             ========================================================================= */}
          {entity.moduleType === 'universities' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Trường Đại học / Cao đẳng</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên trường:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thuộc xã / phường:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.ward || 'Thành phố Đà Nẵng'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ:</span>
                    <span className="sm:col-span-2 text-slate-800">{entity.address}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thông tin liên hệ:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.contactInfo || entity.phone || '0236.3842.xxx'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Website:</span>
                    <div className="sm:col-span-2">
                      {entity.website ? (
                        <a href={entity.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono">
                          {entity.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-slate-400">Chưa cập nhật cổng điện tử</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 10: DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU
              Columns: STT, Tên doanh nghiệp, Tên dự án, Người đại diện dự án, Địa chỉ, Thông tin liên hệ, Website, Thuộc xã/ phường
             ========================================================================= */}
          {entity.moduleType === 'featured_startups' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ Doanh nghiệp Khởi nghiệp Tiêu biểu</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên doanh nghiệp:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.companyName || entity.ownerName || entity.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên dự án:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.title || entity.projectName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Người đại diện dự án:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{entity.leaderName || entity.representative || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Địa chỉ:</span>
                    <span className="sm:col-span-2 text-slate-800">{entity.address || 'TP. Đà Nẵng'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thông tin liên hệ:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.contactInfo || entity.phone || entity.email || '0905.888.999'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Website:</span>
                    <div className="sm:col-span-2">
                      {entity.website ? (
                        <a href={entity.website} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-mono">
                          {entity.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className="text-slate-400">Chưa cập nhật website</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Thuộc xã / phường:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{entity.ward || entity.wardSchool || 'Phường Thạch Thang, Quận Hải Châu'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback View for Auxiliary / Specialized Modules */}
          {!['science_tasks', 'initiatives', 'patents', 'experts', 'startups', 'support_organizations', 'startup_projects', 'startup_ideas', 'wards', 'universities', 'featured_startups'].includes(entity.moduleType) && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Hồ sơ chi tiết dữ liệu {(entity.moduleType || '').replace(/_/g, ' ')}</span>
                  </div>
                  <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Mã / STT:</span>
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code || entity.id}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tiêu đề / Tên:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title}</span>
                  </div>
                  {entity.field && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Lĩnh vực:</span>
                      <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field}</span>
                    </div>
                  )}
                  {entity.ownerName && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Chủ trì / Sở hữu:</span>
                      <span className="sm:col-span-2 font-medium text-slate-800">{entity.ownerName}</span>
                    </div>
                  )}
                  {entity.description && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Mô tả chi tiết:</span>
                      <p className="sm:col-span-2 text-slate-700 leading-relaxed whitespace-pre-line">{entity.description}</p>
                    </div>
                  )}
                  {entity.address && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Địa chỉ:</span>
                      <span className="sm:col-span-2 text-slate-800">{entity.address}</span>
                    </div>
                  )}
                  {entity.contactInfo && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Thông tin liên hệ:</span>
                      <span className="sm:col-span-2 font-mono text-slate-800">{entity.contactInfo}</span>
                    </div>
                  )}
                  {entity.website && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                      <span className="font-semibold text-slate-500">Website:</span>
                      <a href={entity.website} target="_blank" rel="noreferrer" className="sm:col-span-2 text-teal-700 hover:underline inline-flex items-center gap-1 font-mono">
                        {entity.website} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connected Relationships Graph section */}
          {relationships && relationships.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-teal-700" />
                <span>Mạng lưới liên kết dữ liệu trực thuộc ({relationships.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {relationships.filter(Boolean).map((rel) => {
                  const isSource = rel.sourceId === entity.id;
                  const targetTitle = isSource ? (rel.targetTitle || 'Bản ghi liên kết') : (rel.sourceTitle || 'Bản ghi liên kết');
                  const targetModule = (isSource ? rel.targetModule : rel.sourceModule) || 'science_tasks';
                  const targetId = isSource ? rel.targetId : rel.sourceId;
                  return (
                    <div
                      key={rel.id || Math.random()}
                      onClick={() => onOpenEntity(targetModule, targetId)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="text-[10px] font-semibold uppercase text-teal-700 block truncate">
                          {rel.relationType || 'Liên kết'} · {String(targetModule).replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-slate-900 group-hover:text-teal-900 block truncate">
                          {targetTitle}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => onOpenConnectModal(entity)}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Gửi đề xuất kết nối & hợp tác</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>

        </div>

      </div>

      {/* Attachment Manager Modal */}
      {showAttachments && (
        <AttachmentManagerModal
          isOpen={showAttachments}
          entityId={entity.id}
          entityTitle={entity.title}
          moduleType={entity.moduleType}
          onClose={() => setShowAttachments(false)}
        />
      )}

    </div>
  );
};
