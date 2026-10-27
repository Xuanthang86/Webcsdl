import React, { useState } from 'react';
import { BaseEntity, EntityRelationship } from '../types';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Building, 
  User, 
  Calendar, 
  Tag, 
  DollarSign, 
  Link as LinkIcon, 
  Mail, 
  Share2, 
  MessageSquarePlus, 
  FileCheck,
  Download
} from 'lucide-react';

interface DetailModalProps {
  entity: BaseEntity | null;
  relationships: EntityRelationship[];
  onClose: () => void;
  onOpenEntity: (moduleType: string, id: string) => void;
  onOpenConnectModal: (entity: BaseEntity) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  entity,
  relationships,
  onClose,
  onOpenEntity,
  onOpenConnectModal
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!entity) return null;

  const handleDownloadFile = (fileName?: string) => {
    const docName = fileName || `Ho_so_${entity.code || entity.id}_${entity.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    const content = `================================================================================
ỦY BAN NHÂN DÂN THÀNH PHỐ - SỞ KHOA HỌC VÀ CÔNG NGHỆ
CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP CẤP THÀNH PHỐ
================================================================================
HỒ SƠ THÔNG TIN TRÍCH XUẤT CHÍNH THỨC
Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}
Mã số quản lý định danh: ${entity.code || entity.id}
Phân hệ cơ sở dữ liệu: ${entity.moduleType}

1. THÔNG TIN CHUNG
- Tiêu đề / Tên: ${entity.title}
- Lĩnh vực chuyên ngành: ${entity.field || 'Đa ngành'}
- Chủ trì / Tác giả / Đơn vị sở hữu: ${entity.ownerName || 'Chưa cập nhật'}
- Nguồn gốc dữ liệu & Quyết định: ${entity.source || 'Cơ quan có thẩm quyền'}
- Trạng thái phê duyệt: ${entity.status}
- Tình trạng xác minh: ${entity.verificationStatus}
- Phạm vi công khai: ${entity.publicityLevel}
- Ngày khởi tạo: ${entity.createdAt}
- Cập nhật lần cuối: ${entity.updatedAt || entity.createdAt}

2. MÔ TẢ TÓM TẮT NỘI DUNG
${entity.description || 'Không có mô tả chi tiết'}

${entity.mainContents ? `3. NỘI DUNG CHI TIẾT & SẢN PHẨM\n${entity.mainContents}\n` : ''}
${entity.totalBudgetApproved ? `- Tổng kinh phí phê duyệt: ${Number(entity.totalBudgetApproved).toLocaleString('vi-VN')} VNĐ\n- Kinh phí từ NSNN: ${Number(entity.stateBudget || 0).toLocaleString('vi-VN')} VNĐ\n` : ''}
${entity.recognizedScope ? `- Phạm vi ảnh hưởng công nhận: ${entity.recognizedScope}\n` : ''}

================================================================================
Bản quyền dữ liệu thuộc UBND Thành phố & Sở Khoa học và Công nghệ.
Tra cứu trực tuyến tại Cổng thông tin KH&CN Thành phố.
================================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName.endsWith('.txt') || docName.endsWith('.pdf') || docName.endsWith('.doc') ? docName : `${docName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?module=${entity.moduleType}&id=${entity.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportForm(false);
      setReportSubmitted(false);
      setReportNote('');
    }, 2500);
  };

  const formatVND = (num?: number) => {
    if (!num) return '0 đ';
    return `${Number(num).toLocaleString()} đ`;
  };

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
                {entity.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{entity.moduleType.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật: {new Date(entity.updatedAt || entity.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {entity.title}
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
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Tải tệp tóm tắt hồ sơ chính thức"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải tệp hồ sơ</span>
            </button>
            <button
              onClick={handleCopyLink}
              title="Sao chép đường dẫn bản ghi"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              {copied && <span className="text-[11px] text-teal-700 font-medium">Đã chép</span>}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm text-slate-700">
          
          {/* Status & Scope Badges Row (Zero-pill discipline: unboxed metadata or clean indicators) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Trạng thái nghiệp vụ</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                {entity.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {entity.status === 'under_review' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                {entity.status === 'needs_revision' && <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
                {entity.status === 'approved' ? 'Đã phê duyệt' : entity.status === 'under_review' ? 'Đang thẩm định' : entity.status === 'needs_revision' ? 'Yêu cầu bổ sung' : entity.status}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Xác minh hồ sơ</span>
              <span className="font-semibold text-slate-800">
                {entity.verificationStatus === 'verified' ? 'Đã xác minh chính thức' : 'Đang đối soát dữ liệu'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Mức độ công khai</span>
              <span className="font-semibold text-slate-800">
                {entity.publicityLevel === 'public' ? 'Công khai toàn dân' : 'Hạn chế nội bộ'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Chủ quản / Phụ trách</span>
              <span className="font-semibold text-slate-800 truncate block">
                {entity.ownerName || entity.proposingOrg || entity.workplace || 'Chưa cập nhật'}
              </span>
            </div>
          </div>

          {/* Core Summary Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
              Tóm tắt tổng quan
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm bg-white p-4 rounded-xl border border-slate-200">
              {entity.description || 'Chưa có thông tin tóm tắt.'}
            </p>
          </div>

          {/* Specific Domain Fields for Sáng kiến (Initiatives) */}
          {entity.moduleType === 'initiatives' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Chi tiết nghiệp vụ sáng kiến & Hiệu quả tác động
              </h3>

              {/* Proposed vs Recognized Scope distinction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                <div>
                  <span className="text-amber-800 font-medium block mb-1">Phạm vi ảnh hưởng đề xuất:</span>
                  <span className="font-bold text-slate-900">{entity.proposedScope || 'Cấp đơn vị'}</span>
                </div>
                <div>
                  <span className="text-amber-800 font-medium block mb-1">Phạm vi đã được công nhận chính thức:</span>
                  <span className="font-bold text-emerald-800">
                    {entity.recognizedScope || 'Chưa có quyết định công nhận'}
                  </span>
                  {entity.recognitionDecision && (
                    <span className="block text-[11px] text-slate-500 mt-0.5">Căn cứ: {entity.recognitionDecision}</span>
                  )}
                </div>
              </div>

              {/* Problem & Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-900 block mb-1 text-xs">Vấn đề thực tế cần giải quyết:</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{entity.problemSolved}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-900 block mb-1 text-xs">Nội dung giải pháp & Tính mới:</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{entity.solutionDetails || entity.noveltyPoints}</p>
                </div>
              </div>

              {/* Economic & Social Impact Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block">Chi phí tiết kiệm</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{formatVND(entity.costSavings)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block">Chi phí đầu tư</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{formatVND(entity.investmentCost)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block">Số người/đơn vị thụ hưởng</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{(entity.beneficiaryCount || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block">Khả năng nhân rộng</span>
                  <span className="font-bold text-teal-800 text-sm">{entity.scalabilityPotential || 'Cao'}</span>
                </div>
              </div>

              {entity.beforeAfterComparison && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs">
                  <span className="font-semibold text-emerald-950 block mb-1">Kết quả đo lường trước và sau khi áp dụng:</span>
                  <p className="text-slate-700 leading-relaxed">{entity.beforeAfterComparison}</p>
                </div>
              )}
            </div>
          )}

          {/* Specific Domain Fields for Nhiệm vụ KH&CN (Science Tasks) */}
          {entity.moduleType === 'science_tasks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Thông tin nhiệm vụ & Tiến độ triển khai
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Chủ nhiệm nhiệm vụ</span>
                  <span className="font-semibold text-slate-800">{entity.principalInvestigator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cơ quan chủ trì</span>
                  <span className="font-semibold text-slate-800">{entity.leadOrganization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phương thức thực hiện</span>
                  <span className="font-semibold text-slate-800">{entity.selectionMethod}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Tổng kinh phí duyệt</span>
                  <span className="font-bold text-slate-900 text-sm">{formatVND(entity.totalBudgetApproved)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Ngân sách sự nghiệp KH</span>
                  <span className="font-bold text-teal-800 text-sm">{formatVND(entity.stateBudget)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Nguồn đối ứng</span>
                  <span className="font-bold text-slate-700 text-sm">{formatVND(entity.counterpartBudget)}</span>
                </div>
              </div>

              {entity.mainContents && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-900 block mb-1">Nội dung nghiên cứu chính:</span>
                  <p className="text-slate-600 leading-relaxed">{entity.mainContents}</p>
                </div>
              )}

              {entity.expectedOutputs && (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl text-xs">
                  <span className="font-semibold text-blue-950 block mb-1">Sản phẩm khoa học dự kiến & Chỉ tiêu KPI:</span>
                  <p className="text-slate-700 leading-relaxed">{entity.expectedOutputs} · {entity.kpiTargets}</p>
                </div>
              )}
            </div>
          )}

          {/* Specific Domain Fields for Chuyên gia (Experts) */}
          {entity.moduleType === 'experts' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Hồ sơ khoa học & Năng lực hợp tác
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Bài báo & Công bố</span>
                  <span className="font-bold text-slate-900 text-sm">{entity.publicationsCount || 0} bài</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Sáng chế & Giải pháp</span>
                  <span className="font-bold text-teal-800 text-sm">{entity.patentsCount || 0}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Đề tài đã chủ trì</span>
                  <span className="font-bold text-slate-900 text-sm">{entity.headedTopicsCount || 0}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 font-sans block">Trạng thái hợp tác</span>
                  <span className="font-bold text-emerald-700 font-sans text-sm">{entity.collaborationReadiness || 'Sẵn sàng'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-900">Trình độ đào tạo:</span> {entity.educationLevel}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Kinh nghiệm cố vấn khởi nghiệp & Thẩm định:</span> {entity.advisoryExperience} · {entity.startupMentoringExperience}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Email công khai:</span> {entity.publicEmail || 'Liên hệ qua cổng'}
                </div>
              </div>
            </div>
          )}

          {/* Specific Domain Fields for Doanh nghiệp & Dự án khởi nghiệp */}
          {(entity.moduleType === 'startups' || entity.moduleType === 'startup_projects') && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Mô hình kinh doanh & Nhu cầu đầu tư
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Công nghệ cốt lõi</span>
                  <span className="font-semibold text-slate-800">{entity.coreTech || entity.techUsed}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Giai đoạn phát triển</span>
                  <span className="font-semibold text-purple-700">{entity.developmentStage || entity.stage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nhu cầu vốn gọi</span>
                  <span className="font-mono font-bold text-emerald-700">{formatVND(entity.fundingNeeds || entity.capitalNeeded)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khách hàng & Thị trường mục tiêu</span>
                  <span className="font-semibold text-slate-800">{entity.targetCustomers || entity.targetSegment}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specific Domain Fields for Sáng chế (Patents) */}
          {entity.moduleType === 'patents' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Thông tin Văn bằng Bảo hộ & Sở hữu Trí tuệ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Số văn bằng bảo hộ</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">{entity.patentNumber || 'Đang cấp'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phân loại sáng chế quốc tế (IPC)</span>
                  <span className="font-mono font-semibold text-slate-800">{entity.ipcClass || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tác giả sáng chế</span>
                  <span className="font-semibold text-slate-800">{Array.isArray(entity.inventors) ? entity.inventors.join(', ') : entity.inventors}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tình trạng thương mại hóa</span>
                  <span className="font-semibold text-emerald-700">{entity.commercializationStatus || 'Sẵn sàng chuyển giao'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specific Domain Fields for Công bố khoa học (Publications) */}
          {entity.moduleType === 'publications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Thông tin Công bố Khoa học & Chỉ số Tạp chí
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Tạp chí / Hội thảo</span>
                  <span className="font-semibold text-slate-900">{entity.journalName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chỉ số IF & Xếp hạng Scopus</span>
                  <span className="font-mono font-bold text-purple-800">IF: {entity.impactFactor || '—'} · Xếp hạng: {entity.scopusRanking || 'Q1'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tập / Số / Năm xuất bản</span>
                  <span className="font-mono text-slate-800">{entity.volumeIssue || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mã định danh số (DOI)</span>
                  <span className="font-mono text-teal-800">{entity.doi || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specific Domain Fields for Thiết bị PTN (Lab Equipments) */}
          {entity.moduleType === 'lab_equipments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Hạ tầng Kỹ thuật & Chính sách Dùng chung
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Model & Xuất xứ</span>
                  <span className="font-semibold text-slate-900">{entity.equipmentModel} ({entity.countryOfOrigin})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Đơn giá dịch vụ dùng chung</span>
                  <span className="font-mono font-bold text-teal-800">{formatVND(entity.hourlyRateVND)}/giờ</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Chính sách khai thác dùng chung:</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{entity.sharingPolicy}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Đầu mối liên hệ đăng ký:</span>
                  <span className="font-medium text-slate-900">{entity.contactPerson}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specific Domain Fields for Chính sách & Văn bản (Policies) */}
          {entity.moduleType === 'policies' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Căn cứ Pháp lý & Hiệu lực Văn bản
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Số ký hiệu văn bản</span>
                  <span className="font-mono font-bold text-slate-900">{entity.documentNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cơ quan ban hành & Người ký</span>
                  <span className="font-semibold text-slate-900">{entity.issuingBody} ({entity.signer})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày ban hành</span>
                  <span className="font-mono text-slate-800">{entity.promulgationDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày có hiệu lực</span>
                  <span className="font-mono text-emerald-800 font-semibold">{entity.effectiveDate || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cross-Cutting Multi-Dimensional Linked Entities */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-teal-700" />
              Thực thể & Bản ghi liên kết đa chiều ({relationships.length})
            </h3>
            
            {relationships.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                Chưa có liên kết đa chiều được thiết lập cho bản ghi này.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relationships.map(rel => {
                  const isSource = rel.sourceId === entity.id;
                  const targetId = isSource ? rel.targetId : rel.sourceId;
                  const targetTitle = isSource ? rel.targetTitle : rel.sourceTitle;
                  const targetModule = isSource ? rel.targetModule : rel.sourceModule;

                  return (
                    <div
                      key={rel.id}
                      onClick={() => onOpenEntity(targetModule, targetId)}
                      className="p-3 bg-white hover:bg-teal-50/40 rounded-xl border border-slate-200 hover:border-teal-300 transition-all cursor-pointer flex items-start justify-between gap-2 group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-medium">
                          <span className="capitalize">{targetModule.replace('_', ' ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 font-normal">{rel.relationType}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-900 line-clamp-1">
                          {targetTitle}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attachments & Proof Docs */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Văn bản pháp lý & Minh chứng đính kèm
            </h3>
            <div className="space-y-1.5">
              {(entity.attachments && entity.attachments.length > 0 ? entity.attachments : [
                { name: `Hồ_sơ_thuyết_minh_${entity.code || entity.id}.pdf`, size: '2.4 MB' },
                { name: `Bản_đăng_ký_và_Biên_bản_thẩm_định_${entity.code || entity.id}.doc`, size: '1.6 MB' }
              ]).map((file: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(file.name)}
                    className="text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg border border-teal-200 font-semibold flex items-center gap-1 text-xs shrink-0 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data Correction / Report Form */}
          {showReportForm && (
            <form onSubmit={handleSendReport} className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs">
              <div className="font-semibold text-amber-900">Gửi phản hồi / Đề xuất đính chính dữ liệu:</div>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Nhập nội dung cần điều chỉnh hoặc bổ sung chứng cứ pháp lý..."
                className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={3}
                required
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium"
                >
                  {reportSubmitted ? 'Đã gửi phản hồi thành công!' : 'Gửi cho cơ quan quản lý'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-10">
          <button
            type="button"
            onClick={() => setShowReportForm(!showReportForm)}
            className="text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Đề xuất đính chính hoặc phản hồi dữ liệu
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onOpenConnectModal(entity)}
              className="flex-1 sm:flex-none px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Gửi yêu cầu kết nối / Hợp tác
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
