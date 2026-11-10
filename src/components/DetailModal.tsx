import React, { useState } from 'react';
import { BaseEntity, EntityRelationship, User, ModuleType } from '../types';
import { api } from '../services/api';
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
import { deliverFile } from '../utils/fileDownload';

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
    return [];
  });
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [languagePreset, setLanguagePreset] = useState('');
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  if (!entity) return null;

  // Match the Worker authorization policy: privileged review roles or an explicit module grant.
  const isAuthorized = !!currentUser && (
    ['super_admin', 'system_admin', 'agency_leader', 'data_officer', 'evaluator_expert'].includes(currentUser.role) ||
    Boolean(currentUser.managedModules?.includes(entity.moduleType || ''))
  );
  const canEditLanguages = !!currentUser && (
    ['super_admin', 'system_admin', 'agency_leader', 'data_officer'].includes(currentUser.role) ||
    (['partner_officer', 'org_representative'].includes(currentUser.role) && Boolean(currentUser.managedModules?.includes(entity.moduleType || '')))
  );

  const persistLanguages = async (nextLanguages: string[]) => {
    try {
      await api.updateRecord(entity.moduleType as ModuleType, entity.id, { foreignLanguages: nextLanguages });
      setLanguages(nextLanguages);
      setLanguageError(null);
    } catch (error: any) {
      setLanguageError(error?.message || 'Không thể lưu danh sách ngoại ngữ.');
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguageInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      await persistLanguages([...languages, trimmed]);
      setNewLanguageInput('');
      setIsAddingLanguage(false);
    }
  };

  const handleAddPresetLanguage = async (value: string) => {
    if (!value) return;
    if (!languages.includes(value)) await persistLanguages([...languages, value]);
    setLanguagePreset('');
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

  const handleDownloadFile = async (fileName?: string) => {
    const expertDisplayName = entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || entity.title || 'chuyen_gia';
    const safeTitle = String(entity.moduleType === 'experts' ? expertDisplayName : (entity.title || 'ban_ghi')).slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const exportPrefix = moduleCodePrefixes[entity.moduleType || ''];
    const expertCode = exportPrefix && entity.code
      && new RegExp('^' + exportPrefix + '-\\d{6}
    const rawDocName = fileName || `Ho_so_${expertCode}_${safeTitle}.txt`;
    const docName = rawDocName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const content = `================================================================================
ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ
CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP CẤP THÀNH PHỐ
================================================================================
HỒ SƠ THÔNG TIN TRÍCH XUẤT CHÍNH THỨC
Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}
Mã số quản lý định danh: ${entity.moduleType === 'experts' && expertCode === 'chua-cap-nhat' ? 'Chưa cập nhật' : expertCode}
Phân hệ cơ sở dữ liệu: ${entity.moduleType || 'science_tasks'}

1. THÔNG TIN CHUNG
- Tiêu đề / Tên: ${entity.moduleType === 'experts' ? expertDisplayName : (entity.title || 'Chưa cập nhật tiêu đề')}
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
${entity.moduleType === 'experts' ? `
3. THÔNG TIN CHUYÊN GIA
- Họ và tên: ${safeDisplayValue(entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || entity.title)}
- Năm sinh: ${safeDisplayValue(entity.birthYear)}
- Chuyên ngành: ${safeDisplayValue(entity.specialty || entity.primaryField || entity.field)}
${isAuthorized ? `
- Ngày tháng năm sinh: ${safeDisplayValue(entity.birthDate)}
- Giới tính: ${safeDisplayValue(entity.gender)}
- Học hàm: ${safeDisplayValue(entity.academicRank)}
- Học vị: ${safeDisplayValue(entity.degree)}
- Năm bắt đầu công tác: ${safeDisplayValue(entity.startWorkYear || entity.startYear)}
- Chức danh nghiên cứu: ${safeDisplayValue(entity.researchTitle)}
- Chức vụ: ${safeDisplayValue(entity.jobTitle || entity.position)}
- Email: ${safeDisplayValue(entity.email || entity.publicEmail)}
- Điện thoại: Không công khai
- Lĩnh vực: ${safeDisplayValue(entity.field)}
- Đơn vị công tác: ${safeDisplayValue(entity.workplace || entity.leadOrganization || entity.organization)}
- Quá trình đào tạo: ${safeDisplayValue(entity.trainingProcess)}
- Quá trình công tác: ${safeDisplayValue(entity.workExperience)}
- Bài báo/công bố: ${safeDisplayValue(entity.publications)}
- Văn bằng/chứng chỉ: ${safeDisplayValue(entity.qualifications)}
- Công trình/kết quả nghiên cứu: ${safeDisplayValue(entity.researchOutputs)}
- Đề tài/dự án: ${safeDisplayValue(entity.projects)}
- Cấp đề tài: ${safeDisplayValue(entity.projectLevel)}
- Thời gian thực hiện: ${safeDisplayValue(entity.projectDuration)}
- Thành viên tham gia: ${safeDisplayValue(entity.projectMembers)}
- Vai trò: ${safeDisplayValue(entity.projectRole)}
- Tình trạng: ${safeDisplayValue(entity.projectStatus)}
- Giải thưởng: ${safeDisplayValue(entity.awards)}
- Kinh nghiệm: ${safeDisplayValue(entity.experienceNotes)}
` : '- Thông tin chi tiết chuyên sâu: yêu cầu tài khoản được cấp quyền để trích xuất.'}
` : ''}

================================================================================
Bản quyền dữ liệu thuộc UBND Thành phố & Sở Khoa học và Công nghệ.
Tra cứu trực tuyến tại Cổng thông tin KH&CN Thành phố.
================================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const finalName = docName.endsWith('.txt') ? docName : `${docName}.txt`;
    try {
      await deliverFile(blob, finalName);
      setDownloadSuccessToast(true);
      window.setTimeout(() => setDownloadSuccessToast(false), 6000);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Không thể tạo tệp hồ sơ chuyên gia:', error);
      window.alert('Không thể tạo tệp hồ sơ. Vui lòng thử lại hoặc kiểm tra quyền tải tệp của trình duyệt.');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?module=${entity.moduleType || 'science_tasks'}&id=${entity.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const moduleDisplayNames: Record<string, string> = {
    science_tasks: 'Đề tài, nhiệm vụ KH&CN', initiatives: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố',
    patents: 'Sáng chế & Sở hữu trí tuệ', experts: 'Chuyên gia & Nhà khoa học', startups: 'Doanh nghiệp khởi nghiệp sáng tạo',
    support_organizations: 'Tổ chức trung gian', startup_projects: 'Dự án khởi nghiệp', startup_ideas: 'Ý tưởng khởi nghiệp',
    wards: 'Danh sách xã/phường', universities: 'Trường Đại học/Cao đẳng', featured_startups: 'Doanh nghiệp khởi nghiệp tiêu biểu',
    investors: 'Nhà đầu tư', investment_funds: 'Quỹ đầu tư', organizations: 'Tổ chức KH&CN', technologies: 'Công nghệ & Kết quả nghiên cứu',
    programs: 'Chương trình hỗ trợ', collaboration_needs: 'Nhu cầu kết nối & Hợp tác', publications: 'Bài báo & Công bố khoa học',
    lab_equipments: 'Thiết bị & Phòng thí nghiệm trọng điểm', policies: 'Chính sách, Văn bản & Quy định'
  };
  const moduleCodePrefixes: Record<string, string> = {
    science_tasks: 'DT', initiatives: 'SKTP', patents: 'SC', experts: 'CG', startups: 'DNKNST',
    support_organizations: 'TCTG', startup_projects: 'DAKN', startup_ideas: 'YTKN', wards: 'XP',
    universities: 'ĐHCĐ', featured_startups: 'DNKNTB', investors: 'NĐT', investment_funds: 'QĐT',
    organizations: 'TCKHCN', technologies: 'CN', programs: 'CT', collaboration_needs: 'NC',
    publications: 'CB', lab_equipments: 'PTN', policies: 'CS'
  };
  const expectedCodePrefix = moduleCodePrefixes[entity.moduleType || ''];
  const displayCode = expectedCodePrefix && entity.code
    && new RegExp('^' + expectedCodePrefix + '-\\d{6}

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
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 z-10">
          <div className="w-full min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {displayCode && <>
                <span className="font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{displayCode}</span>
                <span aria-hidden="true">·</span>
              </>}
              <span className="font-semibold text-slate-700">{moduleDisplayNames[entity.moduleType || 'science_tasks'] || 'Thông tin dữ liệu'}</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {formatDateSafe(entity.updatedAt || entity.createdAt)}</span>
              {isAuthorized && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Đã cấp quyền xem chi tiết
                </span>
              )}
            </div>
            <h2 className="w-full min-w-0 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
              {(entity.moduleType === 'experts' ? (entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || (entity.title && entity.title !== entity.id && !String(entity.title).startsWith('experts_imp_') ? entity.title : 'Hồ sơ chuyên gia')) : entity.title) || 'Không có tiêu đề'}
            </h2>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
            {downloadSuccessToast && (
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 animate-in fade-in">
                Đã tạo tệp. Trên iPhone/iPad, chọn Chia sẻ → Lưu vào Tệp.
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{safeDisplayValue(entity.code ?? entity.id)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên đề tài:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{safeDisplayValue(entity.title)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cấp quản lý:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{safeDisplayValue(entity.managementLevel ?? entity.managingAgency)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan chủ trì:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.leadOrganization ?? entity.ownerName)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ nhiệm đề tài:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{safeDisplayValue(entity.principalInvestigator)}</span>
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
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.field, 'Chưa cập nhật')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt đề tài:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{safeDisplayValue(entity.description ?? entity.summary)}</p>
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
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Chưa cập nhật'}</span>
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
                  {entity.moduleType !== 'experts' ? (
                    <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                  ) : (entity.code && entity.code !== entity.id && !String(entity.code).startsWith('experts_imp_') ? (
                    <span className="font-mono text-teal-800">{entity.code}</span>
                  ) : null)}
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên Chuyên gia:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title || entity.fullName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm sinh:</span>
                    <span className="sm:col-span-2 font-mono font-semibold text-slate-800">{entity.birthYear || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chuyên ngành:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.specialty || entity.primaryField || entity.field || 'Chưa cập nhật'}</span>
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
                        <span className="font-mono font-medium text-slate-800">{entity.birthDate || (entity.birthYear ? `Năm ${entity.birthYear}` : 'Chưa cập nhật')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                        <span className="font-medium text-slate-800">{entity.gender || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học hàm:</span>
                        <span className="font-semibold text-teal-900">{entity.academicRank || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học vị:</span>
                        <span className="font-semibold text-teal-900">{entity.degree || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm bắt đầu công tác:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.startWorkYear || entity.startYear || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức danh nghiên cứu:</span>
                        <span className="font-medium text-slate-800">{entity.researchTitle || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức vụ:</span>
                        <span className="font-medium text-slate-800">{entity.jobTitle || entity.position || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                        <span className="font-mono text-teal-800 font-medium">{entity.email || entity.publicEmail || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Điện thoại liên hệ:</span>
                        <span className="font-mono font-semibold text-slate-800">Không công khai số điện thoại</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Lĩnh vực nghiên cứu:</span>
                        <span className="font-semibold text-slate-800">{entity.field || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-slate-400 block mb-0.5">Tên đơn vị công tác:</span>
                        <span className="font-semibold text-slate-900">{entity.workplace || entity.leadOrganization || entity.organization || 'Chưa cập nhật'}</span>
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
                        {entity.trainingProcess || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình công tác:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.workExperience || 'Chưa cập nhật'}
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
                      {canEditLanguages && (
                        <button
                          type="button"
                          onClick={() => setIsAddingLanguage(!isAddingLanguage)}
                          className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm ngoại ngữ mới</span>
                        </button>
                      )}
                    </div>

                    {canEditLanguages && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={languagePreset}
                          onChange={e => handleAddPresetLanguage(e.target.value)}
                          className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700"
                        >
                          <option value="">Thêm nhanh ngoại ngữ có sẵn...</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Tiếng Nhật">Tiếng Nhật</option>
                          <option value="Tiếng Hàn">Tiếng Hàn</option>
                          <option value="Tiếng Trung">Tiếng Trung</option>
                          <option value="Tiếng Pháp">Tiếng Pháp</option>
                          <option value="Tiếng Đức">Tiếng Đức</option>
                        </select>
                      </div>
                    )}

                    {/* Pre-integrated & Added languages */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {languages.length > 0 ? languages.map((lang, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-700" />
                          <span>{lang}</span>
                        </span>
                      )) : <span className="text-xs text-slate-400">Chưa cập nhật ngoại ngữ</span>}
                    </div>

                    {/* Form thêm ngoại ngữ mới */}
                    {languageError && <p className="text-xs text-rose-700">{languageError}</p>}
                    {isAddingLanguage && canEditLanguages && (
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.publications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên văn bằng bảo hộ sở hữu trí tuệ:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.qualifications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên công trình / Kết quả nghiên cứu ứng dụng:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.researchOutputs)}</p>
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
                          {entity.projects ? (
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{safeDisplayValue(entity.projects)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectLevel)}</td>
                              <td className="py-2.5 px-3 font-mono">{safeDisplayValue(entity.projectDuration)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectMembers)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{safeDisplayValue(entity.projectRole)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectStatus)}</td>
                            </tr>
                          ) : (
                            <tr><td colSpan={6} className="py-3 px-3 text-center text-slate-400">Chưa cập nhật</td></tr>
                          )}
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
                        {safeDisplayValue(entity.awards)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        Kinh nghiệm & Năng lực tư vấn:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {safeDisplayValue(entity.experienceNotes)}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">
                      {entity.leaderEmail || entity.publicEmail || '—'}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description || 'Chưa cập nhật'}</p>
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
                        <span className="font-mono font-medium text-slate-900">Không công khai số điện thoại</span>
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                        <span className="text-slate-800">{entity.address || 'Chưa cập nhật'}</span>
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
                        <span className="font-semibold text-slate-800">{entity.wardSchool || 'Chưa cập nhật'}</span>
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{entity.description || entity.summary || 'Chưa cập nhật nội dung tóm tắt chi tiết.'}</p>
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
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount ? `${entity.memberCount} thành viên` : 'Chưa cập nhật'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-slate-800">
                          {entity.leaderEmail || entity.publicEmail || '—'}
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
                    <span className="sm:col-span-2 font-semibold text-indigo-900">{entity.mentorTeacher || 'Chưa cập nhật'}</span>
                  </div>

                  {/* RESTRICTED: Đơn vị đang học tập/công tác */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Đơn vị học tập / công tác:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">{entity.currentAffiliation || 'Chưa cập nhật'}</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.email || 'Thông tin liên hệ không công khai'}</span>
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
                      <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
, 'u').test(String(entity.code).trim())
    ? String(entity.code).trim()
    : '';
  const rawEntityTitle = String(entity.title || '');
  const invalidImportTitle = rawEntityTitle === String(entity.id || '') || rawEntityTitle.startsWith(`${entity.moduleType || ''}_imp_`);
  const detailTitleCandidates: Record<string, any[]> = {
    initiatives: [entity.initiativeName, entity.initiative_name, entity.initiativeTitle, entity.initiative_title, entity.solutionName, entity.solution_name, entity.name],
    startups: [entity.companyName, entity.company_name, entity.startupName, entity.startup_name, entity.name],
    startup_projects: [entity.projectName, entity.project_name, entity.projectTitle, entity.project_title, entity.name],
    startup_ideas: [entity.ideaName, entity.idea_name, entity.ideaTitle, entity.idea_title, entity.name],
    wards: [entity.wardName, entity.ward_name, entity.wardTitle, entity.name],
    universities: [entity.universityName, entity.university_name, entity.schoolName, entity.school_name, entity.institutionName, entity.name],
    experts: [entity.fullName, entity.full_name, entity.expertName, entity.expert_name, entity.name],
    patents: [entity.patentName, entity.patent_name, entity.name],
    support_organizations: [entity.organizationName, entity.organization_name, entity.name]
  };
  const detailTitle = invalidImportTitle
    ? detailTitleCandidates[entity.moduleType || '']?.find(value => value && String(value) !== String(entity.id || '') && !String(value).startsWith(`${entity.moduleType || ''}_imp_`)) || 'Hồ sơ dữ liệu'
    : rawEntityTitle || 'Hồ sơ dữ liệu';

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
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 z-10">
          <div className="w-full min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {displayCode && <>
                <span className="font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{displayCode}</span>
                <span aria-hidden="true">·</span>
              </>}
              <span className="font-semibold text-slate-700">{moduleDisplayNames[entity.moduleType || 'science_tasks'] || 'Thông tin dữ liệu'}</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {formatDateSafe(entity.updatedAt || entity.createdAt)}</span>
              {isAuthorized && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Đã cấp quyền xem chi tiết
                </span>
              )}
            </div>
            <h2 className="w-full min-w-0 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
              {(entity.moduleType === 'experts' ? (entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || (entity.title && entity.title !== entity.id && !String(entity.title).startsWith('experts_imp_') ? entity.title : 'Hồ sơ chuyên gia')) : entity.title) || 'Không có tiêu đề'}
            </h2>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
            {downloadSuccessToast && (
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 animate-in fade-in">
                Đã tạo tệp. Trên iPhone/iPad, chọn Chia sẻ → Lưu vào Tệp.
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{safeDisplayValue(entity.code ?? entity.id)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên đề tài:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{safeDisplayValue(entity.title)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cấp quản lý:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{safeDisplayValue(entity.managementLevel ?? entity.managingAgency)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan chủ trì:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.leadOrganization ?? entity.ownerName)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ nhiệm đề tài:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{safeDisplayValue(entity.principalInvestigator)}</span>
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
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.field, 'Chưa cập nhật')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt đề tài:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{safeDisplayValue(entity.description ?? entity.summary)}</p>
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
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Chưa cập nhật'}</span>
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
                  {entity.moduleType !== 'experts' ? (
                    <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                  ) : (entity.code && entity.code !== entity.id && !String(entity.code).startsWith('experts_imp_') ? (
                    <span className="font-mono text-teal-800">{entity.code}</span>
                  ) : null)}
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên Chuyên gia:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title || entity.fullName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm sinh:</span>
                    <span className="sm:col-span-2 font-mono font-semibold text-slate-800">{entity.birthYear || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chuyên ngành:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.specialty || entity.primaryField || entity.field || 'Chưa cập nhật'}</span>
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
                        <span className="font-mono font-medium text-slate-800">{entity.birthDate || (entity.birthYear ? `Năm ${entity.birthYear}` : 'Chưa cập nhật')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                        <span className="font-medium text-slate-800">{entity.gender || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học hàm:</span>
                        <span className="font-semibold text-teal-900">{entity.academicRank || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học vị:</span>
                        <span className="font-semibold text-teal-900">{entity.degree || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm bắt đầu công tác:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.startWorkYear || entity.startYear || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức danh nghiên cứu:</span>
                        <span className="font-medium text-slate-800">{entity.researchTitle || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức vụ:</span>
                        <span className="font-medium text-slate-800">{entity.jobTitle || entity.position || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                        <span className="font-mono text-teal-800 font-medium">{entity.email || entity.publicEmail || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Điện thoại liên hệ:</span>
                        <span className="font-mono font-semibold text-slate-800">Không công khai số điện thoại</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Lĩnh vực nghiên cứu:</span>
                        <span className="font-semibold text-slate-800">{entity.field || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-slate-400 block mb-0.5">Tên đơn vị công tác:</span>
                        <span className="font-semibold text-slate-900">{entity.workplace || entity.leadOrganization || entity.organization || 'Chưa cập nhật'}</span>
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
                        {entity.trainingProcess || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình công tác:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.workExperience || 'Chưa cập nhật'}
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
                      {canEditLanguages && (
                        <button
                          type="button"
                          onClick={() => setIsAddingLanguage(!isAddingLanguage)}
                          className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm ngoại ngữ mới</span>
                        </button>
                      )}
                    </div>

                    {canEditLanguages && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={languagePreset}
                          onChange={e => handleAddPresetLanguage(e.target.value)}
                          className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700"
                        >
                          <option value="">Thêm nhanh ngoại ngữ có sẵn...</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Tiếng Nhật">Tiếng Nhật</option>
                          <option value="Tiếng Hàn">Tiếng Hàn</option>
                          <option value="Tiếng Trung">Tiếng Trung</option>
                          <option value="Tiếng Pháp">Tiếng Pháp</option>
                          <option value="Tiếng Đức">Tiếng Đức</option>
                        </select>
                      </div>
                    )}

                    {/* Pre-integrated & Added languages */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {languages.length > 0 ? languages.map((lang, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-700" />
                          <span>{lang}</span>
                        </span>
                      )) : <span className="text-xs text-slate-400">Chưa cập nhật ngoại ngữ</span>}
                    </div>

                    {/* Form thêm ngoại ngữ mới */}
                    {languageError && <p className="text-xs text-rose-700">{languageError}</p>}
                    {isAddingLanguage && canEditLanguages && (
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.publications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên văn bằng bảo hộ sở hữu trí tuệ:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.qualifications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên công trình / Kết quả nghiên cứu ứng dụng:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.researchOutputs)}</p>
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
                          {entity.projects ? (
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{safeDisplayValue(entity.projects)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectLevel)}</td>
                              <td className="py-2.5 px-3 font-mono">{safeDisplayValue(entity.projectDuration)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectMembers)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{safeDisplayValue(entity.projectRole)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectStatus)}</td>
                            </tr>
                          ) : (
                            <tr><td colSpan={6} className="py-3 px-3 text-center text-slate-400">Chưa cập nhật</td></tr>
                          )}
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
                        {safeDisplayValue(entity.awards)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        Kinh nghiệm & Năng lực tư vấn:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {safeDisplayValue(entity.experienceNotes)}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">
                      {entity.leaderEmail || entity.publicEmail || '—'}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description || 'Chưa cập nhật'}</p>
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
                        <span className="font-mono font-medium text-slate-900">Không công khai số điện thoại</span>
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                        <span className="text-slate-800">{entity.address || 'Chưa cập nhật'}</span>
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
                        <span className="font-semibold text-slate-800">{entity.wardSchool || 'Chưa cập nhật'}</span>
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{entity.description || entity.summary || 'Chưa cập nhật nội dung tóm tắt chi tiết.'}</p>
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
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount ? `${entity.memberCount} thành viên` : 'Chưa cập nhật'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-slate-800">
                          {entity.leaderEmail || entity.publicEmail || '—'}
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
                    <span className="sm:col-span-2 font-semibold text-indigo-900">{entity.mentorTeacher || 'Chưa cập nhật'}</span>
                  </div>

                  {/* RESTRICTED: Đơn vị đang học tập/công tác */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Đơn vị học tập / công tác:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">{entity.currentAffiliation || 'Chưa cập nhật'}</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.email || 'Thông tin liên hệ không công khai'}</span>
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
                      <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
, 'u').test(String(entity.code).trim())
      ? String(entity.code).trim()
      : 'chua-cap-ma';
    const rawDocName = fileName || `Ho_so_${expertCode}_${safeTitle}.txt`;
    const docName = rawDocName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const content = `================================================================================
ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ
CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP CẤP THÀNH PHỐ
================================================================================
HỒ SƠ THÔNG TIN TRÍCH XUẤT CHÍNH THỨC
Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}
Mã số quản lý định danh: ${entity.moduleType === 'experts' && expertCode === 'chua-cap-nhat' ? 'Chưa cập nhật' : expertCode}
Phân hệ cơ sở dữ liệu: ${entity.moduleType || 'science_tasks'}

1. THÔNG TIN CHUNG
- Tiêu đề / Tên: ${entity.moduleType === 'experts' ? expertDisplayName : (entity.title || 'Chưa cập nhật tiêu đề')}
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
${entity.moduleType === 'experts' ? `
3. THÔNG TIN CHUYÊN GIA
- Họ và tên: ${safeDisplayValue(entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || entity.title)}
- Năm sinh: ${safeDisplayValue(entity.birthYear)}
- Chuyên ngành: ${safeDisplayValue(entity.specialty || entity.primaryField || entity.field)}
${isAuthorized ? `
- Ngày tháng năm sinh: ${safeDisplayValue(entity.birthDate)}
- Giới tính: ${safeDisplayValue(entity.gender)}
- Học hàm: ${safeDisplayValue(entity.academicRank)}
- Học vị: ${safeDisplayValue(entity.degree)}
- Năm bắt đầu công tác: ${safeDisplayValue(entity.startWorkYear || entity.startYear)}
- Chức danh nghiên cứu: ${safeDisplayValue(entity.researchTitle)}
- Chức vụ: ${safeDisplayValue(entity.jobTitle || entity.position)}
- Email: ${safeDisplayValue(entity.email || entity.publicEmail)}
- Điện thoại: Không công khai
- Lĩnh vực: ${safeDisplayValue(entity.field)}
- Đơn vị công tác: ${safeDisplayValue(entity.workplace || entity.leadOrganization || entity.organization)}
- Quá trình đào tạo: ${safeDisplayValue(entity.trainingProcess)}
- Quá trình công tác: ${safeDisplayValue(entity.workExperience)}
- Bài báo/công bố: ${safeDisplayValue(entity.publications)}
- Văn bằng/chứng chỉ: ${safeDisplayValue(entity.qualifications)}
- Công trình/kết quả nghiên cứu: ${safeDisplayValue(entity.researchOutputs)}
- Đề tài/dự án: ${safeDisplayValue(entity.projects)}
- Cấp đề tài: ${safeDisplayValue(entity.projectLevel)}
- Thời gian thực hiện: ${safeDisplayValue(entity.projectDuration)}
- Thành viên tham gia: ${safeDisplayValue(entity.projectMembers)}
- Vai trò: ${safeDisplayValue(entity.projectRole)}
- Tình trạng: ${safeDisplayValue(entity.projectStatus)}
- Giải thưởng: ${safeDisplayValue(entity.awards)}
- Kinh nghiệm: ${safeDisplayValue(entity.experienceNotes)}
` : '- Thông tin chi tiết chuyên sâu: yêu cầu tài khoản được cấp quyền để trích xuất.'}
` : ''}

================================================================================
Bản quyền dữ liệu thuộc UBND Thành phố & Sở Khoa học và Công nghệ.
Tra cứu trực tuyến tại Cổng thông tin KH&CN Thành phố.
================================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const finalName = docName.endsWith('.txt') ? docName : `${docName}.txt`;
    try {
      await deliverFile(blob, finalName);
      setDownloadSuccessToast(true);
      window.setTimeout(() => setDownloadSuccessToast(false), 6000);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Không thể tạo tệp hồ sơ chuyên gia:', error);
      window.alert('Không thể tạo tệp hồ sơ. Vui lòng thử lại hoặc kiểm tra quyền tải tệp của trình duyệt.');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?module=${entity.moduleType || 'science_tasks'}&id=${entity.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const moduleDisplayNames: Record<string, string> = {
    science_tasks: 'Đề tài, nhiệm vụ KH&CN', initiatives: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố',
    patents: 'Sáng chế & Sở hữu trí tuệ', experts: 'Chuyên gia & Nhà khoa học', startups: 'Doanh nghiệp khởi nghiệp sáng tạo',
    support_organizations: 'Tổ chức trung gian', startup_projects: 'Dự án khởi nghiệp', startup_ideas: 'Ý tưởng khởi nghiệp',
    wards: 'Danh sách xã/phường', universities: 'Trường Đại học/Cao đẳng', featured_startups: 'Doanh nghiệp khởi nghiệp tiêu biểu',
    investors: 'Nhà đầu tư', investment_funds: 'Quỹ đầu tư', organizations: 'Tổ chức KH&CN', technologies: 'Công nghệ & Kết quả nghiên cứu',
    programs: 'Chương trình hỗ trợ', collaboration_needs: 'Nhu cầu kết nối & Hợp tác', publications: 'Bài báo & Công bố khoa học',
    lab_equipments: 'Thiết bị & Phòng thí nghiệm trọng điểm', policies: 'Chính sách, Văn bản & Quy định'
  };
  const moduleCodePrefixes: Record<string, string> = {
    science_tasks: 'DT', initiatives: 'SKTP', patents: 'SC', experts: 'CG', startups: 'DNKNST',
    support_organizations: 'TCTG', startup_projects: 'DAKN', startup_ideas: 'YTKN', wards: 'XP',
    universities: 'ĐHCĐ', featured_startups: 'DNKNTB', investors: 'NĐT', investment_funds: 'QĐT',
    organizations: 'TCKHCN', technologies: 'CN', programs: 'CT', collaboration_needs: 'NC',
    publications: 'CB', lab_equipments: 'PTN', policies: 'CS'
  };
  const expectedCodePrefix = moduleCodePrefixes[entity.moduleType || ''];
  const displayCode = expectedCodePrefix && entity.code
    && new RegExp('^' + expectedCodePrefix + '-\\d{6}

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
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 z-10">
          <div className="w-full min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {displayCode && <>
                <span className="font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{displayCode}</span>
                <span aria-hidden="true">·</span>
              </>}
              <span className="font-semibold text-slate-700">{moduleDisplayNames[entity.moduleType || 'science_tasks'] || 'Thông tin dữ liệu'}</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {formatDateSafe(entity.updatedAt || entity.createdAt)}</span>
              {isAuthorized && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Đã cấp quyền xem chi tiết
                </span>
              )}
            </div>
            <h2 className="w-full min-w-0 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
              {(entity.moduleType === 'experts' ? (entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || (entity.title && entity.title !== entity.id && !String(entity.title).startsWith('experts_imp_') ? entity.title : 'Hồ sơ chuyên gia')) : entity.title) || 'Không có tiêu đề'}
            </h2>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
            {downloadSuccessToast && (
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 animate-in fade-in">
                Đã tạo tệp. Trên iPhone/iPad, chọn Chia sẻ → Lưu vào Tệp.
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{safeDisplayValue(entity.code ?? entity.id)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên đề tài:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{safeDisplayValue(entity.title)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cấp quản lý:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{safeDisplayValue(entity.managementLevel ?? entity.managingAgency)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan chủ trì:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.leadOrganization ?? entity.ownerName)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ nhiệm đề tài:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{safeDisplayValue(entity.principalInvestigator)}</span>
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
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.field, 'Chưa cập nhật')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt đề tài:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{safeDisplayValue(entity.description ?? entity.summary)}</p>
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
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Chưa cập nhật'}</span>
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
                  {entity.moduleType !== 'experts' ? (
                    <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                  ) : (entity.code && entity.code !== entity.id && !String(entity.code).startsWith('experts_imp_') ? (
                    <span className="font-mono text-teal-800">{entity.code}</span>
                  ) : null)}
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên Chuyên gia:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title || entity.fullName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm sinh:</span>
                    <span className="sm:col-span-2 font-mono font-semibold text-slate-800">{entity.birthYear || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chuyên ngành:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.specialty || entity.primaryField || entity.field || 'Chưa cập nhật'}</span>
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
                        <span className="font-mono font-medium text-slate-800">{entity.birthDate || (entity.birthYear ? `Năm ${entity.birthYear}` : 'Chưa cập nhật')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                        <span className="font-medium text-slate-800">{entity.gender || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học hàm:</span>
                        <span className="font-semibold text-teal-900">{entity.academicRank || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học vị:</span>
                        <span className="font-semibold text-teal-900">{entity.degree || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm bắt đầu công tác:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.startWorkYear || entity.startYear || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức danh nghiên cứu:</span>
                        <span className="font-medium text-slate-800">{entity.researchTitle || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức vụ:</span>
                        <span className="font-medium text-slate-800">{entity.jobTitle || entity.position || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                        <span className="font-mono text-teal-800 font-medium">{entity.email || entity.publicEmail || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Điện thoại liên hệ:</span>
                        <span className="font-mono font-semibold text-slate-800">Không công khai số điện thoại</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Lĩnh vực nghiên cứu:</span>
                        <span className="font-semibold text-slate-800">{entity.field || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-slate-400 block mb-0.5">Tên đơn vị công tác:</span>
                        <span className="font-semibold text-slate-900">{entity.workplace || entity.leadOrganization || entity.organization || 'Chưa cập nhật'}</span>
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
                        {entity.trainingProcess || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình công tác:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.workExperience || 'Chưa cập nhật'}
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
                      {canEditLanguages && (
                        <button
                          type="button"
                          onClick={() => setIsAddingLanguage(!isAddingLanguage)}
                          className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm ngoại ngữ mới</span>
                        </button>
                      )}
                    </div>

                    {canEditLanguages && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={languagePreset}
                          onChange={e => handleAddPresetLanguage(e.target.value)}
                          className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700"
                        >
                          <option value="">Thêm nhanh ngoại ngữ có sẵn...</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Tiếng Nhật">Tiếng Nhật</option>
                          <option value="Tiếng Hàn">Tiếng Hàn</option>
                          <option value="Tiếng Trung">Tiếng Trung</option>
                          <option value="Tiếng Pháp">Tiếng Pháp</option>
                          <option value="Tiếng Đức">Tiếng Đức</option>
                        </select>
                      </div>
                    )}

                    {/* Pre-integrated & Added languages */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {languages.length > 0 ? languages.map((lang, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-700" />
                          <span>{lang}</span>
                        </span>
                      )) : <span className="text-xs text-slate-400">Chưa cập nhật ngoại ngữ</span>}
                    </div>

                    {/* Form thêm ngoại ngữ mới */}
                    {languageError && <p className="text-xs text-rose-700">{languageError}</p>}
                    {isAddingLanguage && canEditLanguages && (
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.publications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên văn bằng bảo hộ sở hữu trí tuệ:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.qualifications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên công trình / Kết quả nghiên cứu ứng dụng:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.researchOutputs)}</p>
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
                          {entity.projects ? (
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{safeDisplayValue(entity.projects)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectLevel)}</td>
                              <td className="py-2.5 px-3 font-mono">{safeDisplayValue(entity.projectDuration)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectMembers)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{safeDisplayValue(entity.projectRole)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectStatus)}</td>
                            </tr>
                          ) : (
                            <tr><td colSpan={6} className="py-3 px-3 text-center text-slate-400">Chưa cập nhật</td></tr>
                          )}
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
                        {safeDisplayValue(entity.awards)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        Kinh nghiệm & Năng lực tư vấn:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {safeDisplayValue(entity.experienceNotes)}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">
                      {entity.leaderEmail || entity.publicEmail || '—'}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description || 'Chưa cập nhật'}</p>
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
                        <span className="font-mono font-medium text-slate-900">Không công khai số điện thoại</span>
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                        <span className="text-slate-800">{entity.address || 'Chưa cập nhật'}</span>
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
                        <span className="font-semibold text-slate-800">{entity.wardSchool || 'Chưa cập nhật'}</span>
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{entity.description || entity.summary || 'Chưa cập nhật nội dung tóm tắt chi tiết.'}</p>
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
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount ? `${entity.memberCount} thành viên` : 'Chưa cập nhật'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-slate-800">
                          {entity.leaderEmail || entity.publicEmail || '—'}
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
                    <span className="sm:col-span-2 font-semibold text-indigo-900">{entity.mentorTeacher || 'Chưa cập nhật'}</span>
                  </div>

                  {/* RESTRICTED: Đơn vị đang học tập/công tác */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Đơn vị học tập / công tác:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">{entity.currentAffiliation || 'Chưa cập nhật'}</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.email || 'Thông tin liên hệ không công khai'}</span>
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
                      <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
, 'u').test(String(entity.code).trim())
    ? String(entity.code).trim()
    : '';
  const rawEntityTitle = String(entity.title || '');
  const invalidImportTitle = rawEntityTitle === String(entity.id || '') || rawEntityTitle.startsWith(`${entity.moduleType || ''}_imp_`);
  const detailTitleCandidates: Record<string, any[]> = {
    initiatives: [entity.initiativeName, entity.initiative_name, entity.initiativeTitle, entity.initiative_title, entity.solutionName, entity.solution_name, entity.name],
    startups: [entity.companyName, entity.company_name, entity.startupName, entity.startup_name, entity.name],
    startup_projects: [entity.projectName, entity.project_name, entity.projectTitle, entity.project_title, entity.name],
    startup_ideas: [entity.ideaName, entity.idea_name, entity.ideaTitle, entity.idea_title, entity.name],
    wards: [entity.wardName, entity.ward_name, entity.wardTitle, entity.name],
    universities: [entity.universityName, entity.university_name, entity.schoolName, entity.school_name, entity.institutionName, entity.name],
    experts: [entity.fullName, entity.full_name, entity.expertName, entity.expert_name, entity.name],
    patents: [entity.patentName, entity.patent_name, entity.name],
    support_organizations: [entity.organizationName, entity.organization_name, entity.name]
  };
  const detailTitle = invalidImportTitle
    ? detailTitleCandidates[entity.moduleType || '']?.find(value => value && String(value) !== String(entity.id || '') && !String(value).startsWith(`${entity.moduleType || ''}_imp_`)) || 'Hồ sơ dữ liệu'
    : rawEntityTitle || 'Hồ sơ dữ liệu';

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
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 z-10">
          <div className="w-full min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {displayCode && <>
                <span className="font-mono font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{displayCode}</span>
                <span aria-hidden="true">·</span>
              </>}
              <span className="font-semibold text-slate-700">{moduleDisplayNames[entity.moduleType || 'science_tasks'] || 'Thông tin dữ liệu'}</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {formatDateSafe(entity.updatedAt || entity.createdAt)}</span>
              {isAuthorized && (
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Đã cấp quyền xem chi tiết
                </span>
              )}
            </div>
            <h2 className="w-full min-w-0 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
              {(entity.moduleType === 'experts' ? (entity.fullName || entity.full_name || entity.expertName || entity.expert_name || entity.name || (entity.title && entity.title !== entity.id && !String(entity.title).startsWith('experts_imp_') ? entity.title : 'Hồ sơ chuyên gia')) : entity.title) || 'Không có tiêu đề'}
            </h2>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
            {downloadSuccessToast && (
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 animate-in fade-in">
                Đã tạo tệp. Trên iPhone/iPad, chọn Chia sẻ → Lưu vào Tệp.
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{safeDisplayValue(entity.code ?? entity.id)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên đề tài:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-sm">{safeDisplayValue(entity.title)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cấp quản lý:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{safeDisplayValue(entity.managementLevel ?? entity.managingAgency)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Cơ quan chủ trì:</span>
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.leadOrganization ?? entity.ownerName)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chủ nhiệm đề tài:</span>
                    <span className="sm:col-span-2 font-semibold text-slate-900">{safeDisplayValue(entity.principalInvestigator)}</span>
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
                    <span className="sm:col-span-2 font-medium text-slate-800">{safeDisplayValue(entity.field, 'Chưa cập nhật')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tóm tắt đề tài:</span>
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{safeDisplayValue(entity.description ?? entity.summary)}</p>
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
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.field || 'Chưa cập nhật'}</span>
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
                  {entity.moduleType !== 'experts' ? (
                    <span className="font-mono text-teal-800">{entity.code || entity.id}</span>
                  ) : (entity.code && entity.code !== entity.id && !String(entity.code).startsWith('experts_imp_') ? (
                    <span className="font-mono text-teal-800">{entity.code}</span>
                  ) : null)}
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Tên Chuyên gia:</span>
                    <span className="sm:col-span-2 font-bold text-slate-900 text-base">{entity.title || entity.fullName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Năm sinh:</span>
                    <span className="sm:col-span-2 font-mono font-semibold text-slate-800">{entity.birthYear || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Chuyên ngành:</span>
                    <span className="sm:col-span-2 font-semibold text-teal-800">{entity.specialty || entity.primaryField || entity.field || 'Chưa cập nhật'}</span>
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
                        <span className="font-mono font-medium text-slate-800">{entity.birthDate || (entity.birthYear ? `Năm ${entity.birthYear}` : 'Chưa cập nhật')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Giới tính:</span>
                        <span className="font-medium text-slate-800">{entity.gender || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học hàm:</span>
                        <span className="font-semibold text-teal-900">{entity.academicRank || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Học vị:</span>
                        <span className="font-semibold text-teal-900">{entity.degree || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm bắt đầu công tác:</span>
                        <span className="font-mono font-semibold text-slate-800">{entity.startWorkYear || entity.startYear || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức danh nghiên cứu:</span>
                        <span className="font-medium text-slate-800">{entity.researchTitle || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Chức vụ:</span>
                        <span className="font-medium text-slate-800">{entity.jobTitle || entity.position || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                        <span className="font-mono text-teal-800 font-medium">{entity.email || entity.publicEmail || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Điện thoại liên hệ:</span>
                        <span className="font-mono font-semibold text-slate-800">Không công khai số điện thoại</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Lĩnh vực nghiên cứu:</span>
                        <span className="font-semibold text-slate-800">{entity.field || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-slate-400 block mb-0.5">Tên đơn vị công tác:</span>
                        <span className="font-semibold text-slate-900">{entity.workplace || entity.leadOrganization || entity.organization || 'Chưa cập nhật'}</span>
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
                        {entity.trainingProcess || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                        Quá trình công tác:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {entity.workExperience || 'Chưa cập nhật'}
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
                      {canEditLanguages && (
                        <button
                          type="button"
                          onClick={() => setIsAddingLanguage(!isAddingLanguage)}
                          className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm ngoại ngữ mới</span>
                        </button>
                      )}
                    </div>

                    {canEditLanguages && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={languagePreset}
                          onChange={e => handleAddPresetLanguage(e.target.value)}
                          className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700"
                        >
                          <option value="">Thêm nhanh ngoại ngữ có sẵn...</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Tiếng Nhật">Tiếng Nhật</option>
                          <option value="Tiếng Hàn">Tiếng Hàn</option>
                          <option value="Tiếng Trung">Tiếng Trung</option>
                          <option value="Tiếng Pháp">Tiếng Pháp</option>
                          <option value="Tiếng Đức">Tiếng Đức</option>
                        </select>
                      </div>
                    )}

                    {/* Pre-integrated & Added languages */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {languages.length > 0 ? languages.map((lang, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-700" />
                          <span>{lang}</span>
                        </span>
                      )) : <span className="text-xs text-slate-400">Chưa cập nhật ngoại ngữ</span>}
                    </div>

                    {/* Form thêm ngoại ngữ mới */}
                    {languageError && <p className="text-xs text-rose-700">{languageError}</p>}
                    {isAddingLanguage && canEditLanguages && (
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.publications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên văn bằng bảo hộ sở hữu trí tuệ:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.qualifications)}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 block mb-1">Tên công trình / Kết quả nghiên cứu ứng dụng:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{safeDisplayValue(entity.researchOutputs)}</p>
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
                          {entity.projects ? (
                            <tr className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{safeDisplayValue(entity.projects)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectLevel)}</td>
                              <td className="py-2.5 px-3 font-mono">{safeDisplayValue(entity.projectDuration)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectMembers)}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{safeDisplayValue(entity.projectRole)}</td>
                              <td className="py-2.5 px-3">{safeDisplayValue(entity.projectStatus)}</td>
                            </tr>
                          ) : (
                            <tr><td colSpan={6} className="py-3 px-3 text-center text-slate-400">Chưa cập nhật</td></tr>
                          )}
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
                        {safeDisplayValue(entity.awards)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        Kinh nghiệm & Năng lực tư vấn:
                      </span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {safeDisplayValue(entity.experienceNotes)}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <span className="sm:col-span-2 font-mono text-slate-800">
                      {entity.leaderEmail || entity.publicEmail || '—'}
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
                  <span className="font-mono text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                    <p className="sm:col-span-2 text-slate-700 leading-relaxed">{entity.problemSolved || entity.description || 'Chưa cập nhật'}</p>
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
                        <span className="font-mono font-medium text-slate-900">Không công khai số điện thoại</span>
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
                    <span className="sm:col-span-2 font-mono font-bold text-teal-800">{entity.code && entity.code !== entity.id && !String(entity.code).startsWith('startup_ideas_imp_') ? entity.code : 'Chưa cấp mã'}</span>
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
                        <span className="text-slate-800">{entity.address || 'Chưa cập nhật'}</span>
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
                        <span className="font-semibold text-slate-800">{entity.wardSchool || 'Chưa cập nhật'}</span>
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
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{entity.description || entity.summary || 'Chưa cập nhật nội dung tóm tắt chi tiết.'}</p>
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
                        <span className="font-mono font-bold text-slate-900">{entity.memberCount ? `${entity.memberCount} thành viên` : 'Chưa cập nhật'}</span>
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
                    <span className="font-semibold text-slate-500">Email người đứng đầu:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="font-mono text-slate-800">
                          {entity.leaderEmail || entity.publicEmail || '—'}
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
                    <span className="sm:col-span-2 font-semibold text-indigo-900">{entity.mentorTeacher || 'Chưa cập nhật'}</span>
                  </div>

                  {/* RESTRICTED: Đơn vị đang học tập/công tác */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-1 hover:bg-slate-50/50">
                    <span className="font-semibold text-slate-500">Đơn vị học tập / công tác:</span>
                    <div className="sm:col-span-2">
                      {isAuthorized ? (
                        <span className="text-slate-800 font-medium">{entity.currentAffiliation || 'Chưa cập nhật'}</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
                    <span className="sm:col-span-2 font-mono text-slate-800">{entity.email || 'Thông tin liên hệ không công khai'}</span>
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
                      <span className="sm:col-span-2 font-mono text-slate-800">Thông tin liên hệ không công khai</span>
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
