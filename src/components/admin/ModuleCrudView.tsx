import React, { useState, useEffect, useRef } from 'react';
import { ModuleType, BaseEntity, User, ApprovalStatus } from '../../types';
import { api } from '../../services/api';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Link as LinkIcon, 
  Filter, 
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  X,
  Paperclip,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttachmentManagerModal } from '../AttachmentManagerModal';
import { deliverFile } from '../../utils/fileDownload';
import { getScienceTaskUnits, getScienceTaskYears, getScienceTaskLevel, matchesScienceTaskLevel, normalizeScienceTaskText } from '../../utils/scienceTaskFilters';

interface ModuleCrudViewProps {
  moduleType: ModuleType;
  currentUser?: User;
  onViewDetail: (entity: BaseEntity) => void;
  onOpenImport: (mod: ModuleType) => void;
  onManageRelations: (entity: BaseEntity) => void;
}

const MODULE_CODE_PREFIXES: Partial<Record<ModuleType, string>> = {
  science_tasks: 'DT', initiatives: 'SKTP', patents: 'SC', experts: 'CG', startups: 'DNKNST',
  support_organizations: 'TCTG', startup_projects: 'DAKN', startup_ideas: 'YTKN', wards: 'XP',
  universities: 'ĐHCĐ', featured_startups: 'DNKNTB', investors: 'NĐT', investment_funds: 'QĐT',
  organizations: 'TCKHCN', technologies: 'CN', programs: 'CT', collaboration_needs: 'NC',
  publications: 'CB', lab_equipments: 'PTN', policies: 'CS'
};

const getDisplayRecordCode = (item: BaseEntity, moduleType: ModuleType): string => {
  const prefix = MODULE_CODE_PREFIXES[moduleType];
  if (!prefix) return item.code && item.code !== item.id ? String(item.code) : '—';
  return item.code && new RegExp('^' + prefix + '-\\d{6}$', 'u').test(String(item.code).trim())
    ? String(item.code).trim()
    : 'Đang cập nhật mã';
};

export const MODULE_NAMES: Record<ModuleType, string> = {
  science_tasks: 'Đề tài, nhiệm vụ KH&CN',
  initiatives: 'Sáng kiến có tác dụng, ảnh hưởng đối với thành phố',
  experts: 'Chuyên gia & Nhà khoa học',
  startups: 'Doanh nghiệp khởi nghiệp sáng tạo',
  support_organizations: 'Tổ chức trung gian',
  startup_projects: 'Dự án khởi nghiệp',
  startup_ideas: 'Ý tưởng khởi nghiệp',
  wards: 'Danh sách xã/phường',
  universities: 'Trường Đại học/Cao đẳng trên địa bàn',
  featured_startups: 'Doanh nghiệp khởi nghiệp tiêu biểu',
  organizations: 'Tổ chức KH&CN',
  investors: 'Nhà đầu tư',
  investment_funds: 'Quỹ đầu tư',
  technologies: 'Công nghệ & Kết quả nghiên cứu',
  programs: 'Chương trình hỗ trợ',
  collaboration_needs: 'Nhu cầu kết nối & Hợp tác',
  patents: 'Sáng chế & Sở hữu trí tuệ',
  publications: 'Bài báo & Công bố khoa học',
  lab_equipments: 'Thiết bị & Phòng thí nghiệm trọng điểm',
  policies: 'Chính sách, Văn bản & Quy định'
};

export const getModuleListTitle = (mod: ModuleType): string => {
  switch (mod) {
    case 'science_tasks':
      return 'DANH SÁCH CÁC ĐỀ TÀI, NHIỆM VỤ KH&CN';
    case 'initiatives':
      return 'DANH SÁCH SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ';
    case 'experts':
      return 'DANH SÁCH CHUYÊN GIA';
    case 'startups':
      return 'DANH SÁCH CÁC DOANH NGHIỆP KHỞI NGHIỆP';
    case 'support_organizations':
      return 'DANH SÁCH CÁC TỔ CHỨC TRUNG GIAN';
    case 'startup_projects':
      return 'DANH SÁCH CÁC DỰ ÁN KHỞI NGHIỆP';
    case 'startup_ideas':
      return 'DANH SÁCH CÁC Ý TƯỞNG KHỞI NGHIỆP';
    case 'wards':
      return 'DANH SÁCH CÁC XÃ, PHƯỜNG, ĐẶC KHU TRÊN ĐỊA BÀN';
    case 'universities':
      return 'DANH SÁCH CÁC TRƯỜNG ĐẠI HỌC, CAO ĐẲNG TRÊN ĐỊA BÀN';
    case 'featured_startups':
      return 'DANH SÁCH CÁC DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU';
    default:
      return `DANH SÁCH ${MODULE_NAMES[mod] ? MODULE_NAMES[mod].toUpperCase() : 'BẢN GHI'}`;
  }
};

export const ModuleCrudView: React.FC<ModuleCrudViewProps> = ({
  moduleType,
  currentUser,
  onViewDetail,
  onOpenImport,
  onManageRelations
}) => {
  const showClassificationColumns = !['wards', 'universities'].includes(moduleType);
  const [records, setRecords] = useState<BaseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskLevelFilter, setTaskLevelFilter] = useState('all');
  const [taskYearFilter, setTaskYearFilter] = useState('all');
  const [taskUnitFilter, setTaskUnitFilter] = useState('all');
  const [showTaskUnitSuggestions, setShowTaskUnitSuggestions] = useState(false);
  const taskUnitFilterRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [actionErrorToast, setActionErrorToast] = useState<string | null>(null);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BaseEntity | null>(null);
  const [workflowRecord, setWorkflowRecord] = useState<BaseEntity | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<ApprovalStatus>('approved');
  const [workflowNote, setWorkflowNote] = useState('');
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<BaseEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachmentEntity, setAttachmentEntity] = useState<BaseEntity | null>(null);

  // Inline Import State
  const [showInlineImportModal, setShowInlineImportModal] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importConflictAction, setImportConflictAction] = useState<'skip' | 'overwrite'>('overwrite');
  const [isImporting, setIsImporting] = useState(false);
  const [pendingApprovalIds, setPendingApprovalIds] = useState<string[]>([]);
  const [isApprovingImported, setIsApprovingImported] = useState(false);
  const [showImportApprovalModal, setShowImportApprovalModal] = useState(false);
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);
  const [importPreviewError, setImportPreviewError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number; total: number; percent: number; batchIndex: number; totalBatches: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    importedCount: number; errors: string[]; duplicates: string[];
  } | null>(null);

  const normalizeInlineHeader = (value: any) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const inlinePrimaryHeaders: Partial<Record<ModuleType, string[]>> = {
    initiatives: ['tensangkien', 'tengiaphap', 'sangkien', 'initiativename'],
    startups: ['tendoanhnghiep', 'tendoanhnghiepkhoinghiep', 'tendoanhnghiepkhoinghiepsangtao', 'tencongty', 'tenstartup', 'companyname'],
    startup_projects: ['tenduan', 'tenduankhoinghiep', 'tenduanstartup', 'projectname', 'projecttitle'],
    startup_ideas: ['tenytuong', 'tenytuongkhoinghiep', 'ideaname', 'ideatitle'],
    wards: ['tenxaphuong', 'tenxaphuongdackhu', 'tenxa', 'tenphuong', 'tendackhu', 'wardname'],
    universities: ['tentruong', 'tentruongdaihoc', 'tentruongcaodang', 'tentruongdaihoccaodang', 'tendaotao', 'schoolname', 'universityname']
  };

  const inlineMatrixToRecords = (source: any[][]) => {
    const matrix = (source || []).map(row => Array.isArray(row) ? row : []);
    if (matrix.length < 2) return [];
    const aliases = inlinePrimaryHeaders[moduleType] || [
      'tendetai', 'tensangkien', 'tenchuyengia', 'tendoanhnghiep',
      'tenduan', 'tenytuong', 'tentochuc', 'tenxaphuong', 'tentruong'
    ];
    let headerIndex = -1;
    for (let index = 0; index < Math.min(matrix.length - 1, 12); index++) {
      const row = matrix[index] || [];
      const nonEmpty = row.filter(cell => String(cell ?? '').trim() !== '').length;
      const hasPrimary = row.some(cell => {
        const key = normalizeInlineHeader(cell);
        return aliases.some(alias => key === alias || key.startsWith(alias));
      });
      if (nonEmpty >= 2 && hasPrimary) {
        headerIndex = index;
        break;
      }
    }
    if (headerIndex < 0) return [];
    const headers = (matrix[headerIndex] || []).map(cell => String(cell ?? '').replace(/^\uFEFF/, '').trim());
    if (headers.filter(Boolean).length < 2) return [];
    return matrix.slice(headerIndex + 1).map(values => {
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header) record[header] = values?.[index] ?? '';
      });
      return record;
    }).filter(record => Object.values(record).some(value => String(value ?? '').trim() !== ''));
  };

  const parseInlineCsv = (text: string) => {
    const input = String(text || '').replace(/^\uFEFF/, '');
    if (!input.trim()) return [];
    const candidateLines = input.split(/\r?\n/).slice(0, 12);
    const delimiters = [',', ';', '\t'];
    let delimiter = ',';
    let bestDelimiterCount = 0;
    for (const line of candidateLines) {
      for (const candidate of delimiters) {
        let count = 0, inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') {
            if (inQuotes && line[i + 1] === '"') i++;
            else inQuotes = !inQuotes;
          } else if (line[i] === candidate && !inQuotes) count++;
        }
        if (count > bestDelimiterCount) {
          bestDelimiterCount = count;
          delimiter = candidate;
        }
      }
    }
    if (bestDelimiterCount === 0) return [];
    const matrix: string[][] = [];
    let row: string[] = [], cell = '', inQuotes = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '"') {
        if (inQuotes && input[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(cell.trim()); cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && input[i + 1] === '\n') i++;
        row.push(cell.trim());
        if (row.some(value => value.length > 0)) matrix.push(row);
        row = []; cell = '';
      } else cell += char;
    }
    row.push(cell.trim());
    if (row.some(value => value.length > 0)) matrix.push(row);
    return inlineMatrixToRecords(matrix);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImportPreviewError(null);
    const isExcel = /\.xlsx?$|\.xls$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '', raw: false });
          const rows = inlineMatrixToRecords(matrix);
          setImportParsedRows(rows);
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          setImportRawText(csvText);
          setImportPreviewError(rows.length === 0 ? 'Tệp Excel không chứa dòng dữ liệu nào.' : null);
        } catch (err: any) {
          setImportPreviewError('Lỗi đọc tệp Excel (.xlsx): ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setImportRawText(content);
        try {
          const rows = parseInlineCsv(content);
          setImportParsedRows(rows);
          setImportPreviewError(rows.length === 0 ? 'Tệp CSV không chứa dòng dữ liệu nào.' : null);
        } catch (err: any) {
          setImportPreviewError('Lỗi đọc cú pháp tệp CSV: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = async () => {
    if (importParsedRows.length === 0) {
      setImportPreviewError('Vui lòng tải tệp Excel/CSV hoặc dán dữ liệu hợp lệ trước khi nhập.');
      return;
    }
    setIsImporting(true);
    setImportPreviewError(null);
    setImportResult(null);
    const BATCH_SIZE = 50;
    const total = importParsedRows.length;
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    let importedCount = 0;
    const importedIds: string[] = [], errors: string[] = [], duplicates: string[] = [];
    setImportProgress({ current: 0, total, percent: 0, batchIndex: 0, totalBatches });
    try {
      for (let offset = 0; offset < total; offset += BATCH_SIZE) {
        const batch = importParsedRows.slice(offset, offset + BATCH_SIZE);
        const result = await api.batchImport(moduleType, batch, importConflictAction);
        importedCount += Number(result.importedCount || 0);
        importedIds.push(...(result.importedIds || []));
        errors.push(...(result.errors || []));
        duplicates.push(...(result.duplicates || []));
        const current = Math.min(offset + batch.length, total);
        setImportProgress({
          current, total, percent: Math.round(current / total * 100),
          batchIndex: Math.floor(offset / BATCH_SIZE) + 1, totalBatches
        });
      }
      setImportResult({ importedCount, errors, duplicates });
      setPendingApprovalIds([...new Set(importedIds)]);
      if (importedCount > 0) {
        showToast(`Đã nhập ${importedCount}/${total} bản ghi vào trạng thái nháp trong ${MODULE_NAMES[moduleType]}.${duplicates.length ? ` Bỏ qua ${duplicates.length} bản ghi trùng.` : ''}`);
      } else if (duplicates.length > 0 && errors.length === 0) {
        showToast(`Không có bản ghi mới: ${duplicates.length} dòng trùng dữ liệu đã tồn tại và được bỏ qua.`);
      } else {
        showErrorToast(`Không nhập được bản ghi nào. Có ${errors.length} lỗi cần kiểm tra trong báo cáo bên dưới.`);
      }
      setShowImportApprovalModal(Boolean(importedIds.length && canApprove));
      await loadData();
    } catch (err: any) {
      setImportPreviewError(err.message || 'Lỗi trong quá trình nhập dữ liệu');
      showErrorToast(err.message || 'Lỗi nhập dữ liệu');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleOpenApproveAllDrafts = () => {
    const draftIds = records
      .filter(record => String(record.status || '').toLowerCase() === 'draft')
      .map(record => record.id);
    if (!draftIds.length) return;
    setPendingApprovalIds(draftIds);
    setShowImportApprovalModal(true);
  };

  const handleApproveImported = async () => {
    if (!pendingApprovalIds.length) return;
    setIsApprovingImported(true);
    try {
      const result = await api.approveImportedRecords(moduleType, pendingApprovalIds);
      showToast(`Đã phê duyệt và công khai ${result.approvedCount} bản ghi.`);
      setPendingApprovalIds([]);
      setShowImportApprovalModal(false);
      await loadData();
    } catch (err: any) {
      showErrorToast(err.message || 'Không thể phê duyệt dữ liệu vừa nhập.');
    } finally {
      setIsApprovingImported(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(api.getExportUrl(moduleType), {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Không thể tải tệp CSV từ máy chủ');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `du-lieu-${moduleType}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Đã xuất dữ liệu CSV thành công');
    } catch (err: any) {
      showErrorToast(err.message || 'Lỗi xuất file CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportSource = moduleType === 'experts' ? records : filteredRecords;
      const exportData = exportSource.map((r, i) => {
        const base: Record<string, any> = {
          'Mã định danh': r.code,
          'Tên bản ghi': r.title,
          'Lĩnh vực': r.field,
          'Đơn vị / Chủ thể': r.ownerName,
          'Trạng thái': r.status,
          'Phạm vi': r.publicityLevel === 'public' ? 'Công khai' : 'Nội bộ'
        };
        // Append extra attributes, but never allow an imported STT field to
        // overwrite the sequential row number generated for this export.
        Object.entries(r).forEach(([k, v]) => {
          const normalizedKey = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!['id', 'code', 'title', 'field', 'ownerName', 'status', 'publicityLevel', 'history'].includes(k)
            && !['stt', 'sothutu'].includes(normalizedKey)
            && typeof v !== 'object') {
            base[k] = v;
          }
        });
        // Set STT last so it is always 1, 2, 3... in the exported row order.
        base['STT'] = i + 1;
        return base;
      });

      const ws = XLSX.utils.json_to_sheet(exportData.length > 0 ? exportData : [{ 'Mã': 'MDD-01', 'Tên': 'Mẫu' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, moduleType.slice(0, 31));
      const excelBytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
      const blob = new Blob([excelBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `du-lieu-${moduleType}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const delivery = await deliverFile(blob, fileName);
      showToast(delivery === 'shared'
        ? 'Đã mở bảng Chia sẻ. Chọn “Lưu vào Tệp” để lưu bảng Excel.'
        : delivery === 'opened'
          ? 'Tệp Excel đã mở trong tab mới. Chọn Chia sẻ → Lưu vào Tệp.'
          : 'Đã tạo tệp Excel và gửi đến mục Tải về.');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showErrorToast(err.message || 'Lỗi xuất file Excel');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      let sampleRows: Record<string, any>[] = [];
      if (moduleType === 'science_tasks') {
        sampleRows = [
          { 'code': 'DT-123456', 'title': 'Nghiên cứu ứng dụng AI trong quản lý giao thông', 'field': 'Công nghệ thông tin', 'ownerName': 'Đại học Bách Khoa', 'principalInvestigator': 'PGS.TS Nguyễn Văn A', 'managementLevel': 'Cấp thành phố', 'executionTime': '2024-2026', 'totalBudgetApproved': 1500000000 }
        ];
      } else if (moduleType === 'initiatives') {
        sampleRows = [
          { 'code': 'SKTP-234567', 'title': 'Giải pháp tiết kiệm năng lượng tòa nhà hành chính', 'field': 'Tiết kiệm năng lượng', 'ownerName': 'Trung tâm Tiết kiệm Năng lượng', 'recognitionYear': 2026, 'authors': 'Nguyễn Văn B', 'costSavings': 250000000 }
        ];
      } else if (moduleType === 'experts') {
        sampleRows = [
          { 'code': 'CG-345678', 'title': 'GS.TS. Trần Quốc Hùng', 'field': 'Tự động hóa', 'ownerName': 'Đại học Bách Khoa', 'birthYear': '1975', 'email': 'hung.tq@dut.udn.vn', 'phone': '0905123456', 'specialty': 'Robot y tế & Tự động hóa', 'academicDegree': 'Tiến sĩ' }
        ];
      } else if (moduleType === 'startups') {
        sampleRows = [
          { 'code': 'DN-KN-01', 'title': 'Công ty CP Công nghệ Xanh Đà Nẵng', 'field': 'Công nghệ môi trường', 'ownerName': 'Lê Văn C', 'address': 'Hòa Khánh Bắc, Liên Chiểu', 'foundedYear': '2023', 'leaderPhone': '0912345678', 'leaderEmail': 'info@greendanang.vn' }
        ];
      } else {
        sampleRows = [
          { 'code': 'MA-01', 'title': 'Bản ghi mẫu', 'field': 'Công nghệ thông tin', 'ownerName': 'Đơn vị chủ quản', 'description': 'Mô tả tóm tắt nội dung' }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap');
      XLSX.writeFile(wb, `bieu-mau-nhap-${moduleType}.xlsx`);
      showToast('Đã tải tệp mẫu Excel (.xlsx) chuẩn');
    } catch (err: any) {
      showErrorToast(err.message || 'Lỗi tải tệp mẫu');
    }
  };

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formField, setFormField] = useState('Công nghệ thông tin và Truyền thông');
  const [formOwner, setFormOwner] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<ApprovalStatus>('draft');
  const [formCostSavings, setFormCostSavings] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [extraFields, setExtraFields] = useState<Record<string, any>>({});

  const setExtra = (key: string, val: any) => {
    setExtraFields(prev => ({ ...prev, [key]: val }));
  };

  const isSuperUser = ['super_admin', 'system_admin'].includes(currentUser?.role || '');
  const isReadOnly = ['viewer', 'read_only'].includes(currentUser?.role || '') || 
    Boolean(currentUser?.customPermissions?.includes('read_only'));

  // Check if current user is restricted to specific managedModules
  const isModuleRestricted = !isSuperUser && 
    Boolean(currentUser?.managedModules && 
    currentUser.managedModules.length > 0 && 
    !currentUser.managedModules.includes(moduleType));

  const canCreate = !isReadOnly && !isModuleRestricted && (isSuperUser || ['data_officer', 'partner_officer', 'agency_leader'].includes(currentUser?.role || ''));
  const canEdit = !isReadOnly && !isModuleRestricted && (isSuperUser || ['data_officer', 'partner_officer', 'agency_leader'].includes(currentUser?.role || ''));
  const canDelete = !isReadOnly && !isModuleRestricted && (isSuperUser || currentUser?.role === 'data_officer');
  const canImport = !isReadOnly && !isModuleRestricted && (isSuperUser || ['data_officer', 'partner_officer'].includes(currentUser?.role || ''));
  const canApprove = !isReadOnly && ['super_admin', 'system_admin', 'agency_leader'].includes(currentUser?.role || '');
  const canManageRel = !isReadOnly && !isModuleRestricted && (isSuperUser || ['data_officer', 'agency_leader'].includes(currentUser?.role || ''));

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 8000);
  };

  const showErrorToast = (msg: string) => {
    setActionErrorToast(msg);
    setTimeout(() => setActionErrorToast(null), 15000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getModuleRecords(moduleType);
      setRecords(data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu module:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSelectedIds([]);
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setTaskLevelFilter('all');
    setTaskYearFilter('all');
    setTaskUnitFilter('all');
  }, [moduleType]);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormField('Công nghệ thông tin và Truyền thông');
    setFormOwner(currentUser?.fullName || '');
    setFormDesc('');
    setFormStatus('draft');
    setFormCostSavings('');
    setFormBudget('');
    setExtraFields({});
    setShowCreateModal(true);
  };

  const handleOpenEdit = (rec: BaseEntity) => {
    setEditingRecord(rec);
    setFormTitle(rec.title);
    setFormField(rec.field || 'Công nghệ thông tin');
    setFormOwner(rec.ownerName || '');
    setFormDesc(rec.description || '');
    setFormStatus(rec.status);
    setFormCostSavings(rec.costSavings ? String(rec.costSavings) : '');
    setFormBudget(rec.totalBudgetApproved ? String(rec.totalBudgetApproved) : '');
    setExtraFields({ ...rec });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    try {
      const payload: Record<string, any> = {
        ...extraFields,
        title: formTitle,
        field: formField,
        ownerName: formOwner,
        description: formDesc,
        status: formStatus,
        costSavings: Number(formCostSavings) || extraFields.costSavings || undefined,
        totalBudgetApproved: Number(formBudget) || extraFields.totalBudgetApproved || undefined
      };

      if (editingRecord) {
        payload.updateNote = 'Chỉnh sửa thông tin từ giao diện quản trị';
        await api.updateRecord(moduleType, editingRecord.id, payload);
        showToast(`Đã cập nhật bản ghi [${editingRecord.code}] thành công`);
        setEditingRecord(null);
      } else {
        await api.createRecord(moduleType, payload);
        showToast(`Đã tạo bản ghi mới thành công trong ${MODULE_NAMES[moduleType]}`);
        setShowCreateModal(false);
      }
      await loadData();
    } catch (err: any) {
      showErrorToast(err.message || 'Lỗi lưu bản ghi');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    setIsDeleting(true);
    try {
      await api.deleteRecord(moduleType, deleteConfirmRecord.id);
      showToast(`Đã xóa bản ghi [${deleteConfirmRecord.title || deleteConfirmRecord.name || deleteConfirmRecord.code || 'bản ghi'}] thành công`);
      setDeleteConfirmRecord(null);
      await loadData();
    } catch (err: any) {
      showErrorToast(err.message || 'Lỗi xóa bản ghi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedIds.filter(id => records.some(record => record.id === id));
    if (!ids.length) return;
    const confirmed = window.confirm(`Bạn chắc chắn muốn xóa ${ids.length} bản ghi đã chọn trong phân hệ ${MODULE_NAMES[moduleType]}? Thao tác này không thể hoàn tác.`);
    if (!confirmed) return;
    setIsDeleting(true);
    const failures: string[] = [];
    let deleted = 0;
    try {
      for (const id of ids) {
        try {
          await api.deleteRecord(moduleType, id);
          deleted++;
        } catch (error: any) {
          failures.push(`${id}: ${error.message || 'Không thể xóa'}`);
        }
      }
      setSelectedIds([]);
      await loadData();
      if (failures.length) {
        showErrorToast(`Đã xóa ${deleted}/${ids.length} bản ghi. ${failures.length} bản ghi chưa xóa được: ${failures.slice(0, 5).join('; ')}`);
      } else {
        showToast(`Đã xóa thành công ${deleted} bản ghi đã chọn.`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransitionWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowRecord) return;
    try {
      await api.transitionWorkflow(moduleType, workflowRecord.id, workflowStatus, workflowNote);
      showToast(`Đã chuyển trạng thái bản ghi [${workflowRecord.code}] sang [${workflowStatus}]`);
      setWorkflowRecord(null);
      setWorkflowNote('');
      await loadData();
    } catch (err: any) {
      showErrorToast(err.message || 'Lỗi chuyển trạng thái quy trình');
    }
  };

  // Accent-insensitive search across every hydrated field, including imported spreadsheet extras.
  const normalizeSearchText = (value: any): string => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();

  const availableTaskYears = moduleType === 'science_tasks'
    ? Array.from(new Set(records.flatMap(getScienceTaskYears))).sort().reverse()
    : [];
  const availableTaskUnits = moduleType === 'science_tasks'
    ? Array.from(new Set(records.flatMap(getScienceTaskUnits))).sort((a, b) => a.localeCompare(b, 'vi'))
    : [];
  const filteredTaskUnitSuggestions = availableTaskUnits
    .filter(unit => taskUnitFilter === 'all' || normalizeScienceTaskText(unit).includes(normalizeScienceTaskText(taskUnitFilter)))
    .slice(0, 30);

  useEffect(() => {
    if (!showTaskUnitSuggestions) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!taskUnitFilterRef.current?.contains(event.target as Node)) setShowTaskUnitSuggestions(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showTaskUnitSuggestions]);

  const filteredRecords = records.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery.trim());
      const searchableText = Object.values(item as any)
        .map(value => Array.isArray(value) ? value.join(' ') : (value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')))
        .join(' ');
      if (!normalizeSearchText(searchableText).includes(q)) return false;
    }

    if (moduleType === 'science_tasks') {
      if (taskLevelFilter !== 'all' && !matchesScienceTaskLevel(item, taskLevelFilter)) return false;
      if (taskYearFilter !== 'all' && !getScienceTaskYears(item).includes(taskYearFilter)) return false;
      if (taskUnitFilter !== 'all') {
        const unitQuery = normalizeScienceTaskText(taskUnitFilter);
        if (!getScienceTaskUnits(item).some(value => normalizeScienceTaskText(value).includes(unitQuery))) return false;
      }
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);

  if (isModuleRestricted) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Phân hệ dữ liệu này nằm ngoài phạm vi được phân quyền
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Tài khoản của bạn ({currentUser?.fullName}) hiện được phân công quản lý các phân hệ sau:
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {currentUser?.managedModules?.map(mKey => (
            <span key={mKey} className="px-2.5 py-1 bg-teal-50 text-teal-900 border border-teal-200 rounded-lg text-xs font-semibold">
              {(MODULE_NAMES as Record<string, string>)[mKey] || mKey}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-700 animate-in fade-in">
          <span>✓</span>
          <span>{actionSuccessToast}</span>
        </div>
      )}
      {actionErrorToast && (
        <div className="fixed top-20 right-6 z-50 max-w-[min(92vw,560px)] bg-rose-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-start gap-2 border border-rose-700 animate-in fade-in whitespace-pre-wrap break-words">
          <span>⚠</span>
          <span>{actionErrorToast}</span>
        </div>
      )}
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase">
            {getModuleListTitle(moduleType)}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-semibold text-slate-800 font-mono">{records.length}</span> bản ghi · Đang hiển thị {filteredRecords.length} kết quả phù hợp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isReadOnly && (
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold">
              Chế độ chỉ xem (Read-only)
            </span>
          )}

          {canDelete && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} bản ghi đã chọn`}
            </button>
          )}

          {pendingApprovalIds.length > 0 && canApprove && (
            <button
              type="button"
              onClick={() => setShowImportApprovalModal(true)}
              className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg"
            >
              Phê duyệt {pendingApprovalIds.length} bản ghi vừa nhập
            </button>
          )}

          {canApprove && records.some(record => String(record.status || '').toLowerCase() === 'draft') && (
            <button
              type="button"
              onClick={handleOpenApproveAllDrafts}
              className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg"
              title="Chọn toàn bộ bản ghi đang ở trạng thái nháp để phê duyệt công khai"
            >
              Phê duyệt toàn bộ bản nháp ({records.filter(record => String(record.status || '').toLowerCase() === 'draft').length})
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xuất danh sách ra tệp bảng tính Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xuất danh sách ra tệp CSV chuẩn UTF-8"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          {canImport && (
            <button
              type="button"
              onClick={() => {
                setImportRawText('');
                setImportParsedRows([]);
                setImportPreviewError(null);
                setShowInlineImportModal(true);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Nhập dữ liệu hàng loạt trực tiếp từ tệp Excel (.xlsx) hoặc CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập Excel/CSV</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo bản ghi mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên bản ghi, đơn vị chủ trì, lĩnh vực..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {moduleType === 'science_tasks' && (
            <>
              <select
                aria-label="Lọc cấp quản lý"
                value={taskLevelFilter}
                onChange={(e) => { setTaskLevelFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 max-w-full px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium"
              >
                <option value="all">Tất cả cấp quản lý</option>
                <option value="Cấp Bộ">Cấp Bộ</option>
                <option value="Cấp Tỉnh/Thành phố">Cấp Tỉnh/Thành phố</option>
                <option value="Cấp Cơ sở">Cấp Cơ sở</option>
              </select>
              <select
                aria-label="Lọc năm thực hiện"
                value={taskYearFilter}
                onChange={(e) => { setTaskYearFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 max-w-full px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium"
              >
                <option value="all">Tất cả năm</option>
                {availableTaskYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              <div ref={taskUnitFilterRef} className="relative w-full sm:w-52 min-w-0">
                <input
                  aria-label="Tìm đơn vị chủ trì"
                  type="search"
                  list="admin-task-unit-options"
                  value={taskUnitFilter === 'all' ? '' : taskUnitFilter}
                  onFocus={() => setShowTaskUnitSuggestions(true)}
                  onChange={(e) => { setTaskUnitFilter(e.target.value.trim() ? e.target.value : 'all'); setCurrentPage(1); setShowTaskUnitSuggestions(true); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setShowTaskUnitSuggestions(false); }}
                  placeholder="Đơn vị chủ trì..."
                  autoComplete="off"
                  aria-expanded={showTaskUnitSuggestions}
                  aria-controls="admin-task-unit-suggestions"
                  className="h-9 w-full min-w-0 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
                <datalist id="admin-task-unit-options">
                  {availableTaskUnits.map(unit => <option key={unit} value={unit} />)}
                </datalist>
                {showTaskUnitSuggestions && (
                  <div id="admin-task-unit-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-500">Gợi ý đơn vị chủ trì</span>
                      <button type="button" onClick={() => setShowTaskUnitSuggestions(false)} className="text-[10px] font-semibold text-teal-700 px-2 py-1">Đóng ✕</button>
                    </div>
                    {filteredTaskUnitSuggestions.length > 0 ? filteredTaskUnitSuggestions.map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => { setTaskUnitFilter(unit); setCurrentPage(1); setShowTaskUnitSuggestions(false); }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                      >
                        {unit}
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-xs text-slate-500">Không có đơn vị phù hợp.</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          <span className="text-slate-400 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="under_review">Đang thẩm định</option>
            <option value="needs_revision">Yêu cầu bổ sung</option>
            <option value="submitted">Đã gửi</option>
            <option value="rejected">Từ chối</option>
            <option value="archived">Lưu trữ</option>
            <option value="draft">Bản nháp</option>
          </select>

          <button
            onClick={loadData}
            title="Làm mới dữ liệu"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                {canDelete && (
                  <th className="py-3 px-2 w-9 text-center">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả bản ghi đang hiển thị"
                      checked={visibleRecords.length > 0 && visibleRecords.every(record => selectedIds.includes(record.id))}
                      onChange={(event) => setSelectedIds(event.target.checked
                        ? [...new Set([...selectedIds, ...visibleRecords.map(record => record.id)])]
                        : selectedIds.filter(id => !visibleRecords.some(record => record.id === id)))}
                    />
                  </th>
                )}
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-32">Mã bản ghi</th>
                <th className="py-3 px-4">Tên / Tiêu đề</th>
                {showClassificationColumns && <>
                  <th className="py-3 px-4 w-40">Lĩnh vực</th>
                  <th className="py-3 px-4 w-44">Đơn vị / Cá nhân</th>
                </>}
                <th className="py-3 px-4 w-28 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-24 text-center">Công khai</th>
                <th className="py-3 px-4 w-36 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={(canDelete ? 7 : 6) + (showClassificationColumns ? 2 : 0)} className="py-8 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={(canDelete ? 7 : 6) + (showClassificationColumns ? 2 : 0)} className="py-8 text-center text-slate-400">
                    Không có bản ghi nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {canDelete && (
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Chọn bản ghi ${item.title || item.name || item.id}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) => setSelectedIds(current => event.target.checked
                            ? [...current, item.id]
                            : current.filter(id => id !== item.id))}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm font-semibold text-teal-800 whitespace-nowrap">
                      {getDisplayRecordCode(item, moduleType)}
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => onViewDetail(item)}
                        className="font-semibold text-base leading-snug text-slate-900 hover:text-teal-800 cursor-pointer whitespace-normal break-words"
                      >
                        {item.title}
                      </div>
                      
                      {/* Specialized Contextual Metadata per Module */}
                      {moduleType === 'science_tasks' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded border border-teal-200">{({ national: 'Cấp Bộ', provincial: 'Cấp Tỉnh/Thành phố', local: 'Cấp Cơ sở', unknown: 'Chưa xác định' } as const)[getScienceTaskLevel(item)]}</span>
                          {item.principalInvestigator && <span>Chủ nhiệm: <strong className="text-slate-700">{item.principalInvestigator}</strong></span>}
                          {item.executionTime && <span className="text-slate-400">· {item.executionTime}</span>}
                        </div>
                      )}

                      {moduleType === 'initiatives' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.recognitionYear && <span className="bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.2 rounded border border-amber-200">Năm {item.recognitionYear}</span>}
                          {item.authors && <span>Tác giả: <strong className="text-slate-700">{item.authors}</strong></span>}
                          {item.ownerAddress && <span className="text-slate-400">· Đ/c: {item.ownerAddress}</span>}
                        </div>
                      )}

                      {moduleType === 'experts' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.birthYear && <span className="text-slate-600">Sinh: {item.birthYear}</span>}
                          {item.email && <span className="text-teal-700">{item.email}</span>}
                          {item.specialty && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">{item.specialty}</span>}
                        </div>
                      )}

                      {moduleType === 'startups' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.address && <span>Đ/c: {item.address}</span>}
                          {item.foundedYear && <span className="text-slate-400">· Khởi nghiệp: {item.foundedYear}</span>}
                          {item.website && <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">Website</a>}
                        </div>
                      )}

                      {moduleType === 'support_organizations' && item.address && (
                        <div className="text-xs text-slate-500 mt-1">
                          Địa chỉ: {item.address}
                        </div>
                      )}

                      {moduleType === 'startup_projects' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.address && <span>Đ/c: {item.address}</span>}
                          {item.originType && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">{item.originType}</span>}
                          {item.wardSchool && <span>{item.wardSchool}</span>}
                          {item.incubator && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">Ươm tạo: {item.incubator}</span>}
                          {item.startYear && <span className="text-slate-400">· Năm KN: {item.startYear}</span>}
                        </div>
                      )}

                      {moduleType === 'startup_ideas' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.wardSchool && <span className="bg-yellow-50 text-yellow-800 px-1.5 py-0.2 rounded border border-yellow-200">{item.wardSchool}</span>}
                          {item.mentorTeacher && <span>GV hướng dẫn: {item.mentorTeacher}</span>}
                        </div>
                      )}

                      {moduleType === 'wards' && item.address && (
                        <div className="text-xs text-slate-500 mt-1">
                          Địa chỉ: {item.address}
                        </div>
                      )}

                      {moduleType === 'universities' && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {item.ward && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">{item.ward}</span>}
                          {item.address && <span>Địa chỉ: {item.address}</span>}
                        </div>
                      )}

                      {moduleType === 'featured_startups' && item.website && (
                        <div className="text-xs mt-1">
                          <a href={item.website} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                            {item.website}
                          </a>
                        </div>
                      )}

                      {item.description && !['wards', 'universities', 'featured_startups'].includes(moduleType) && (
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    {showClassificationColumns && <>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{item.field || item.primaryField || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[170px]">{item.ownerName || item.proposingOrg || item.leadOrganization || item.leaderName || item.representative || item.workplace || item.mentorTeacher || '—'}</td>
                    </>}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        item.status === 'under_review' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        item.status === 'needs_revision' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status === 'approved' ? 'Đã duyệt' : item.status === 'under_review' ? 'Đang duyệt' : item.status === 'needs_revision' ? 'Bổ sung' : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium ${(['approved', 'published'].includes(String(item.status || '').toLowerCase()) && item.publicityLevel === 'public') ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {(['approved', 'published'].includes(String(item.status || '').toLowerCase()) && item.publicityLevel === 'public') ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDetail(item)}
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-400 hover:text-teal-800 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canManageRel && (
                          <button
                            onClick={() => onManageRelations(item)}
                            title="Quản lý liên kết đa chiều"
                            className="p-1.5 text-slate-400 hover:text-indigo-800 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setAttachmentEntity(item)}
                          title="Quản lý tệp đính kèm & Media (ImageKit CDN)"
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>

                        {canApprove && (
                          <button
                            onClick={() => {
                              setWorkflowRecord(item);
                              setWorkflowStatus(item.status === 'approved' ? 'needs_revision' : 'approved');
                              setWorkflowNote('');
                            }}
                            title="Chuyển trạng thái quy trình phê duyệt"
                            className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Chỉnh sửa bản ghi"
                            className="p-1.5 text-slate-400 hover:text-blue-800 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmRecord(item)}
                            title="Xóa bản ghi"
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs">
          <div className="text-slate-500">
            Hiển thị {filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRecords.length)} / {filteredRecords.length} bản ghi
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 whitespace-nowrap" htmlFor="module-page-size">Số dòng/trang</label>
            <select
              id="module-page-size"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-8 px-2 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Trước
            </button>
            <span className="text-slate-600 tabular-nums">Trang {currentPage}/{totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (2-step verification) */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa bản ghi
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hành động này sẽ xóa dữ liệu và cập nhật nhật ký truy vết
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-mono text-teal-800 font-semibold">{deleteConfirmRecord.code}</div>
              <div className="font-bold text-slate-900 line-clamp-2">{deleteConfirmRecord.title}</div>
              <div className="text-[11px] text-slate-500">Phân hệ: {MODULE_NAMES[moduleType]}</div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Bạn có chắc chắn muốn xóa bản ghi này? Các mối liên kết đa chiều liên quan sẽ được tự động gỡ bỏ an toàn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingRecord ? `Chỉnh sửa bản ghi: [${editingRecord.code}]` : `Thêm mới bản ghi: ${MODULE_NAMES[moduleType]}`}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Phân hệ {MODULE_NAMES[moduleType]} · Điền đầy đủ các thông tin chuyên ngành
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setEditingRecord(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto pr-1 py-4 space-y-3.5">
              {/* Core Information */}
              <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  1. Thông tin chung
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tiêu đề / Tên đối tượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lĩnh vực chuyên môn
                    </label>
                    <input
                      type="text"
                      value={formField}
                      onChange={(e) => setFormField(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Đơn vị chủ trì / Chủ sở hữu
                    </label>
                    <input
                      type="text"
                      value={formOwner}
                      onChange={(e) => setFormOwner(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mô tả / Tóm tắt nội dung
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Module-Specific Fields */}
              <div className="space-y-3 bg-teal-50/40 p-3.5 rounded-xl border border-teal-100">
                <div className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                  2. Trường dữ liệu đặc thù phân hệ
                </div>

                {/* Module 1: ĐỀ TÀI, NHIỆM VỤ KH&CN */}
                {moduleType === 'science_tasks' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cấp quản lý</label>
                        <select
                          value={extraFields.managementLevel || 'Cấp Tỉnh/Thành phố'}
                          onChange={(e) => setExtra('managementLevel', e.target.value)}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Cấp Bộ">Cấp Bộ</option>
                          <option value="Cấp Tỉnh/Thành phố">Cấp Tỉnh/Thành phố</option>
                          <option value="Cấp Cơ sở">Cấp Cơ sở</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cơ quan chủ trì</label>
                        <input
                          type="text"
                          value={extraFields.leadOrganization || ''}
                          onChange={(e) => setExtra('leadOrganization', e.target.value)}
                          placeholder="VD: Trường ĐH Bách Khoa - ĐH Đà Nẵng"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Chủ nhiệm đề tài</label>
                        <input
                          type="text"
                          value={extraFields.principalInvestigator || ''}
                          onChange={(e) => setExtra('principalInvestigator', e.target.value)}
                          placeholder="Họ và tên chủ nhiệm đề tài..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Thời gian thực hiện</label>
                        <input
                          type="text"
                          value={extraFields.executionTime || ''}
                          onChange={(e) => setExtra('executionTime', e.target.value)}
                          placeholder="VD: 2023 - 2025 hoặc 24 tháng"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tiến độ thực hiện (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={extraFields.executionProgress ?? 100}
                          onChange={(e) => setExtra('executionProgress', Number(e.target.value))}
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tổng kinh phí duyệt (VND)</label>
                        <input
                          type="number"
                          value={formBudget}
                          onChange={(e) => setFormBudget(e.target.value)}
                          placeholder="VD: 850000000"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 2: SÁNG KIẾN CÓ TÁC DỤNG, ẢNH HƯỞNG ĐỐI VỚI THÀNH PHỐ */}
                {moduleType === 'initiatives' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năm công nhận</label>
                        <input
                          type="number"
                          value={extraFields.recognitionYear || ''}
                          onChange={(e) => setExtra('recognitionYear', Number(e.target.value))}
                          placeholder="VD: 2024"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tác giả sáng kiến</label>
                        <input
                          type="text"
                          value={extraFields.authors || ''}
                          onChange={(e) => setExtra('authors', e.target.value)}
                          placeholder="Họ tên một hoặc các tác giả..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Địa chỉ chủ sở hữu</label>
                      <input
                        type="text"
                        value={extraFields.ownerAddress || ''}
                        onChange={(e) => setExtra('ownerAddress', e.target.value)}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Số tiền làm lợi / tiết kiệm (VND)</label>
                      <input
                        type="number"
                        value={formCostSavings}
                        onChange={(e) => setFormCostSavings(e.target.value)}
                        placeholder="VD: 450000000"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Module 3: CHUYÊN GIA */}
                {moduleType === 'experts' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năm sinh</label>
                        <input
                          type="number"
                          value={extraFields.birthYear || ''}
                          onChange={(e) => setExtra('birthYear', Number(e.target.value))}
                          placeholder="VD: 1980"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
                        <input
                          type="email"
                          value={extraFields.email || ''}
                          onChange={(e) => setExtra('email', e.target.value)}
                          placeholder="chuyengia@example.vn"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Điện thoại</label>
                        <input
                          type="text"
                          value={extraFields.phone || ''}
                          onChange={(e) => setExtra('phone', e.target.value)}
                          placeholder="VD: 0905 123 456"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số CCCD / CMND</label>
                        <input
                          type="text"
                          value={extraFields.idCard || extraFields.cccd || ''}
                          onChange={(e) => {
                            setExtra('idCard', e.target.value);
                            setExtra('cccd', e.target.value);
                          }}
                          placeholder="VD: 04809200xxxx"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Chuyên ngành đào tạo / nghiên cứu</label>
                        <input
                          type="text"
                          value={extraFields.specialty || ''}
                          onChange={(e) => setExtra('specialty', e.target.value)}
                          placeholder="Trí tuệ nhân tạo, Tự động hóa, Vi mạch..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Đơn vị công tác</label>
                        <input
                          type="text"
                          value={extraFields.workplace || ''}
                          onChange={(e) => setExtra('workplace', e.target.value)}
                          placeholder="ĐH Bách Khoa, Viện Công nghệ..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Ngoại ngữ: Tiếng Anh, Nhật, Hàn và chọn thêm ngoại ngữ khác */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <label className="block font-semibold text-slate-700 text-xs">
                        Ngoại ngữ (tiếng Anh, Nhật, Hàn và ngoại ngữ khác)
                      </label>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {['Tiếng Anh', 'Tiếng Nhật', 'Tiếng Hàn'].map((lang) => {
                          const currentLangs: string[] = Array.isArray(extraFields.foreignLanguages)
                            ? extraFields.foreignLanguages
                            : (typeof extraFields.foreignLanguages === 'string' && extraFields.foreignLanguages.trim()
                              ? extraFields.foreignLanguages.split(',').map((s: string) => s.trim())
                              : ['Tiếng Anh']);
                          const isChecked = currentLangs.includes(lang);
                          return (
                            <label key={lang} className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...currentLangs, lang]
                                    : currentLangs.filter(l => l !== lang);
                                  setExtra('foreignLanguages', updated);
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-slate-800">{lang}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="pt-1">
                        <input
                          type="text"
                          value={extraFields.otherLanguage || ''}
                          onChange={(e) => setExtra('otherLanguage', e.target.value)}
                          placeholder="Ngoại ngữ khác (VD: Tiếng Pháp, Tiếng Đức, Tiếng Trung...)"
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 4: DOANH NGHIỆP KHỞI NGHIỆP SÁNG TẠO */}
                {moduleType === 'startups' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Địa chỉ hoạt động</label>
                        <input
                          type="text"
                          value={extraFields.address || ''}
                          onChange={(e) => setExtra('address', e.target.value)}
                          placeholder="Địa chỉ trụ sở / văn phòng..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Website doanh nghiệp (nếu có)</label>
                        <input
                          type="url"
                          value={extraFields.website || ''}
                          onChange={(e) => setExtra('website', e.target.value)}
                          placeholder="https://..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">File Logo doanh nghiệp (URL / Tên tệp)</label>
                        <input
                          type="text"
                          value={extraFields.logoUrl || ''}
                          onChange={(e) => setExtra('logoUrl', e.target.value)}
                          placeholder="https://... hoặc /assets/logo.png"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năm bắt đầu khởi nghiệp</label>
                        <input
                          type="number"
                          value={extraFields.foundedYear || ''}
                          onChange={(e) => setExtra('foundedYear', Number(e.target.value))}
                          placeholder="VD: 2021"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sản phẩm giải quyết vấn đề gì</label>
                      <textarea
                        rows={2}
                        value={extraFields.problemSolved || ''}
                        onChange={(e) => setExtra('problemSolved', e.target.value)}
                        placeholder="Nêu rõ bài toán, nỗi đau thị trường hoặc vấn đề xã hội mà sản phẩm giải quyết..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số lượng sáng lập viên</label>
                        <input
                          type="number"
                          value={extraFields.founderCount || ''}
                          onChange={(e) => setExtra('founderCount', Number(e.target.value))}
                          placeholder="VD: 3"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tổng số nhân sự ở thời điểm hiện tại</label>
                        <input
                          type="number"
                          value={extraFields.currentStaffCount || ''}
                          onChange={(e) => setExtra('currentStaffCount', Number(e.target.value))}
                          placeholder="VD: 25"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Họ và tên người đứng đầu</label>
                        <input
                          type="text"
                          value={extraFields.leaderName || ''}
                          onChange={(e) => setExtra('leaderName', e.target.value)}
                          placeholder="Họ tên CEO / Giám đốc..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">SĐT người đứng đầu</label>
                        <input
                          type="text"
                          value={extraFields.leaderPhone || ''}
                          onChange={(e) => setExtra('leaderPhone', e.target.value)}
                          placeholder="09xx..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email người đứng đầu</label>
                        <input
                          type="email"
                          value={extraFields.leaderEmail || ''}
                          onChange={(e) => setExtra('leaderEmail', e.target.value)}
                          placeholder="ceo@startup.vn"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 5: TỔ CHỨC TRUNG GIAN */}
                {moduleType === 'support_organizations' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Địa chỉ hoạt động</label>
                      <input
                        type="text"
                        value={extraFields.address || ''}
                        onChange={(e) => setExtra('address', e.target.value)}
                        placeholder="Số nhà, đường, quận/huyện, Đà Nẵng..."
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Loại hình hỗ trợ</label>
                        <select
                          value={extraFields.facilityType || 'Vườn ươm doanh nghiệp'}
                          onChange={(e) => setExtra('facilityType', e.target.value)}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Vườn ươm doanh nghiệp">Vườn ươm doanh nghiệp</option>
                          <option value="Không gian làm việc chung">Không gian làm việc chung (Co-working)</option>
                          <option value="Trung tâm Đổi mới sáng tạo">Trung tâm Đổi mới sáng tạo</option>
                          <option value="Lab chế thử trọng điểm">Lab chế thử trọng điểm</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năng lực hỗ trợ (DN/năm)</label>
                        <input
                          type="text"
                          value={extraFields.capacity || ''}
                          onChange={(e) => setExtra('capacity', e.target.value)}
                          placeholder="VD: 50 doanh nghiệp / năm"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 6: DỰ ÁN KHỞI NGHIỆP */}
                {moduleType === 'startup_projects' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Dự án thuộc Xã/phường - Trường học</label>
                        <select
                          value={extraFields.originType || ''}
                          onChange={(e) => setExtra('originType', e.target.value)}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Chọn một loại hình</option>
                          <option value="Trường học">Trường học</option>
                          <option value="Xã/phường">Xã/phường</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tên trường học hoặc xã/phường</label>
                        <input
                          type="text"
                          value={extraFields.wardSchool || ''}
                          onChange={(e) => setExtra('wardSchool', e.target.value)}
                          placeholder="Chỉ nhập một trường học hoặc một xã/phường"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Địa chỉ hoạt động</label>
                        <input
                          type="text"
                          value={extraFields.address || ''}
                          onChange={(e) => setExtra('address', e.target.value)}
                          placeholder="Địa chỉ hoạt động của dự án..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năm bắt đầu khởi nghiệp</label>
                        <input
                          type="number"
                          value={extraFields.startYear || ''}
                          onChange={(e) => setExtra('startYear', Number(e.target.value))}
                          placeholder="VD: 2023"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sản phẩm giải quyết vấn đề gì</label>
                      <textarea
                        rows={2}
                        value={extraFields.problemSolved || ''}
                        onChange={(e) => setExtra('problemSolved', e.target.value)}
                        placeholder="Nêu bài toán thực tiễn mà sản phẩm dự án giải quyết..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số lượng thành viên tham gia</label>
                        <input
                          type="number"
                          value={extraFields.memberCount || ''}
                          onChange={(e) => setExtra('memberCount', Number(e.target.value))}
                          placeholder="VD: 5"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Dự án được ươm tạo từ tổ chức nào</label>
                        <input
                          type="text"
                          value={extraFields.incubator || ''}
                          onChange={(e) => setExtra('incubator', e.target.value)}
                          placeholder="Tên vườn ươm / Tự hình thành dự án"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Người đứng đầu dự án</label>
                        <input
                          type="text"
                          value={extraFields.leaderName || ''}
                          onChange={(e) => setExtra('leaderName', e.target.value)}
                          placeholder="Họ tên trưởng dự án..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">SĐT người đứng đầu</label>
                        <input
                          type="text"
                          value={extraFields.leaderPhone || ''}
                          onChange={(e) => setExtra('leaderPhone', e.target.value)}
                          placeholder="09xx..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email người đứng đầu</label>
                        <input
                          type="email"
                          value={extraFields.leaderEmail || ''}
                          onChange={(e) => setExtra('leaderEmail', e.target.value)}
                          placeholder="project@startup.vn"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 7: Ý TƯỞNG KHỞI NGHIỆP */}
                {moduleType === 'startup_ideas' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ý tưởng thuộc Xã/phường - Trường học</label>
                        <select
                          value={extraFields.originType || ''}
                          onChange={(e) => setExtra('originType', e.target.value)}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="">Chọn một loại hình</option>
                          <option value="Trường học">Trường học</option>
                          <option value="Xã/phường">Xã/phường</option>
                        </select>
                      </div>

                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Địa chỉ hoạt động (Nếu có)</label>
                        <input
                          type="text"
                          value={extraFields.address || ''}
                          onChange={(e) => setExtra('address', e.target.value)}
                          placeholder="Địa chỉ hoạt động nhóm..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tên trường học hoặc xã/phường</label>
                        <input
                          type="text"
                          value={extraFields.wardSchool || ''}
                          onChange={(e) => setExtra('wardSchool', e.target.value)}
                          placeholder="Chỉ nhập một trường học hoặc một xã/phường"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sản phẩm giải quyết vấn đề gì</label>
                      <textarea
                        rows={2}
                        value={extraFields.problemSolved || ''}
                        onChange={(e) => setExtra('problemSolved', e.target.value)}
                        placeholder="Nêu vướng mắc thực tiễn hoặc nhu cầu mà ý tưởng nhắm tới..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số lượng thành viên tham gia</label>
                        <input
                          type="number"
                          value={extraFields.memberCount || ''}
                          onChange={(e) => setExtra('memberCount', Number(e.target.value))}
                          placeholder="VD: 4"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Thầy/cô giáo hướng dẫn</label>
                        <input
                          type="text"
                          value={extraFields.mentorTeacher || ''}
                          onChange={(e) => setExtra('mentorTeacher', e.target.value)}
                          placeholder="Họ tên thầy/cô hướng dẫn (nếu có)..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Người đứng đầu nhóm</label>
                        <input
                          type="text"
                          value={extraFields.leaderName || ''}
                          onChange={(e) => setExtra('leaderName', e.target.value)}
                          placeholder="Họ tên trưởng nhóm..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">SĐT người đứng đầu</label>
                        <input
                          type="text"
                          value={extraFields.leaderPhone || ''}
                          onChange={(e) => setExtra('leaderPhone', e.target.value)}
                          placeholder="09xx..."
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email người đứng đầu</label>
                        <input
                          type="email"
                          value={extraFields.leaderEmail || ''}
                          onChange={(e) => setExtra('leaderEmail', e.target.value)}
                          placeholder="lead@startup.vn"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nhóm đang học tập/công tác tại đơn vị nào? (Tên đơn vị & Địa chỉ)</label>
                      <input
                        type="text"
                        value={extraFields.currentAffiliation || ''}
                        onChange={(e) => setExtra('currentAffiliation', e.target.value)}
                        placeholder="VD: Khoa CNTT, ĐH Sư phạm Kỹ thuật Đà Nẵng - 48 Cao Thắng, Hải Châu"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Module 8: DANH SÁCH XÃ/PHƯỜNG */}
                {moduleType === 'wards' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trụ sở / Khu vực</label>
                      <input
                        type="text"
                        value={extraFields.address || ''}
                        onChange={(e) => setExtra('address', e.target.value)}
                        placeholder="VD: Quận Hải Châu, TP Đà Nẵng"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Module 9: TRƯỜNG ĐẠI HỌC/CAO ĐẲNG TRÊN ĐỊA BÀN */}
                {moduleType === 'universities' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Xã / Phường trực thuộc</label>
                        <input
                          type="text"
                          value={extraFields.ward || ''}
                          onChange={(e) => setExtra('ward', e.target.value)}
                          placeholder="VD: Phường Hòa Khánh Bắc, Liên Chiểu"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                        <input
                          type="text"
                          value={extraFields.address || ''}
                          onChange={(e) => setExtra('address', e.target.value)}
                          placeholder="VD: 54 Nguyễn Lương Bằng, Liên Chiểu, TP Đà Nẵng"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Module 10: DOANH NGHIỆP KHỞI NGHIỆP TIÊU BIỂU */}
                {moduleType === 'featured_startups' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Link Website</label>
                      <input
                        type="url"
                        value={extraFields.website || ''}
                        onChange={(e) => setExtra('website', e.target.value)}
                        placeholder="https://..."
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Phân hệ bổ sung: Sáng chế & SHTT */}
                {moduleType === 'patents' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số văn bằng / đơn bảo hộ</label>
                        <input
                          type="text"
                          value={extraFields.patentNumber || ''}
                          onChange={(e) => setExtra('patentNumber', e.target.value)}
                          placeholder="VD: VN 1-0028456"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Loại hình sở hữu trí tuệ</label>
                        <select
                          value={extraFields.ipType || 'Sáng chế'}
                          onChange={(e) => setExtra('ipType', e.target.value)}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Sáng chế">Sáng chế</option>
                          <option value="Giải pháp hữu ích">Giải pháp hữu ích</option>
                          <option value="Kiểu dáng công nghiệp">Kiểu dáng công nghiệp</option>
                          <option value="Nhãn hiệu">Nhãn hiệu</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {moduleType === 'technologies' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mức độ TRL (1 - 9)</label>
                      <select
                        value={extraFields.trlLevel || 'TRL 7 - Thử nghiệm thực tế'}
                        onChange={(e) => setExtra('trlLevel', e.target.value)}
                        className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                      >
                        <option value="TRL 4 - Đã kiểm chứng phòng lab">TRL 4 - Kiểm chứng phòng Lab</option>
                        <option value="TRL 6 - Mẫu thử nghiệm quy mô nhỏ">TRL 6 - Mẫu thử nghiệm quy mô nhỏ</option>
                        <option value="TRL 7 - Thử nghiệm thực tế">TRL 7 - Thử nghiệm thực tế</option>
                        <option value="TRL 9 - Sẵn sàng thương mại hóa">TRL 9 - Sẵn sàng thương mại hóa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phương thức chuyển giao</label>
                      <input
                        type="text"
                        value={extraFields.transferMethod || 'Chuyển giao quyền sở hữu & Li-xăng'}
                        onChange={(e) => setExtra('transferMethod', e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {moduleType === 'policies' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Số hiệu văn bản</label>
                      <input
                        type="text"
                        value={extraFields.documentNumber || ''}
                        onChange={(e) => setExtra('documentNumber', e.target.value)}
                        placeholder="VD: 15/2026/NQ-HĐND"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cơ quan ban hành</label>
                      <input
                        type="text"
                        value={extraFields.issuingAuthority || ''}
                        onChange={(e) => setExtra('issuingAuthority', e.target.value)}
                        placeholder="UBND TP Đà Nẵng / HĐND TP"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ngày có hiệu lực</label>
                      <input
                        type="date"
                        value={extraFields.effectiveDate || ''}
                        onChange={(e) => setExtra('effectiveDate', e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Approvals */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái quy trình hồ sơ
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ApprovalStatus)}
                  className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="submitted">Gửi duyệt (Submitted)</option>
                  <option value="under_review">Đang thẩm định (Under Review)</option>
                  <option value="needs_revision">Yêu cầu bổ sung (Needs Revision)</option>
                  <option value="approved">Đã phê duyệt (Approved)</option>
                  <option value="rejected">Từ chối (Rejected)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingRecord(null); }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  {editingRecord ? 'Lưu thay đổi' : 'Tạo mới bản ghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Transition Modal */}
      {workflowRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
              Quy Trình Thẩm Định & Phê Duyệt Hồ Sơ
            </h2>
            <div className="text-[11px] text-slate-500 py-1">
              Bản ghi: <span className="font-semibold text-slate-800">{workflowRecord.code}</span> - {workflowRecord.title}
            </div>

            <form onSubmit={handleTransitionWorkflow} className="pt-3 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chuyển sang trạng thái tiếp theo <span className="text-red-500">*</span>
                </label>
                <select
                  value={workflowStatus}
                  onChange={(e) => setWorkflowStatus(e.target.value as ApprovalStatus)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="under_review">1. Tiếp nhận & Kiểm tra hồ sơ</option>
                  <option value="needs_revision">2. Yêu cầu sửa đổi / bổ sung tài liệu</option>
                  <option value="approved">3. Phê duyệt chính thức & Công khai</option>
                  <option value="rejected">4. Từ chối phê duyệt</option>
                  <option value="archived">5. Lưu trữ / Hết hiệu lực</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ý kiến thẩm định / Lý do phê duyệt hoặc yêu cầu bổ sung <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi nhận căn cứ quyết định, kết quả thẩm định hoặc danh mục tài liệu cần bổ sung..."
                  value={workflowNote}
                  onChange={(e) => setWorkflowNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkflowRecord(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Xác nhận chuyển trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Import Modal (Không redirect sang Dashboard) */}
      {showInlineImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nhập dữ liệu hàng loạt: {MODULE_NAMES[moduleType]}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tải tệp bảng tính Excel (.xlsx, .xls) hoặc CSV để nhập hàng loạt dữ liệu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isImporting && setShowInlineImportModal(false)}
                disabled={isImporting}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importPreviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importPreviewError}</span>
              </div>
            )}

            {/* Template Download & File Upload Box */}
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-slate-700 text-xs">Tải lên tệp dữ liệu:</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-2.5 py-1 text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Tải tệp mẫu Excel có cấu trúc cột chuẩn của phân hệ này"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                <span>Tải tệp mẫu Excel (.xlsx)</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 sm:p-6 text-center space-y-2 bg-slate-50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-slate-700 font-semibold text-xs">
                Chọn tệp Excel (.xlsx, .xls) hoặc CSV
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-800 file:text-white hover:file:bg-teal-700 cursor-pointer"
              />
            </div>

            {/* Paste Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 text-xs">
                  Hoặc dán nội dung CSV trực tiếp:
                </label>
                {importParsedRows.length > 0 && (
                  <span className="text-teal-800 font-semibold font-mono text-[11px]">
                    Đã nhận diện: {importParsedRows.length} bản ghi
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                value={importRawText}
                onChange={(e) => {
                  setImportRawText(e.target.value);
                  setImportResult(null);
                  try {
                    const rows = parseInlineCsv(e.target.value);
                    setImportParsedRows(rows);
                    setImportPreviewError(null);
                  } catch (err: any) {
                    setImportPreviewError('Lỗi định dạng: ' + err.message);
                  }
                }}
                placeholder="code,title,field,ownerName&#10;MA-01,Tên bản ghi mẫu 1,Công nghệ thông tin,Đơn vị A&#10;MA-02,Tên bản ghi mẫu 2,Y tế & Dược phẩm,Đơn vị B"
                className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            {/* Duplicate conflict handling */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-700 text-xs">Xử lý khi trùng mã định danh (Code):</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="conflict"
                    checked={importConflictAction === 'overwrite'}
                    onChange={() => setImportConflictAction('overwrite')}
                  />
                  <span>Ghi đè cập nhật</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="conflict"
                    checked={importConflictAction === 'skip'}
                    onChange={() => setImportConflictAction('skip')}
                  />
                  <span>Bỏ qua bản ghi trùng</span>
                </label>
              </div>
            </div>

            {/* Preview sample */}
            {importParsedRows.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-slate-700 text-xs">Xem trước (tối đa 3 dòng):</div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold text-slate-600">
                      <tr>
                        {Object.keys(importParsedRows[0] || {}).slice(0, 5).map(col => (
                          <th key={col} className="p-2 border-b border-slate-200">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importParsedRows.slice(0, 3).map((r, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          {Object.values(r).slice(0, 5).map((val: any, vi) => (
                            <td key={vi} className="p-2 truncate max-w-[120px]">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isImporting && importProgress && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-emerald-950">
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang nhập dữ liệu vào Cloudflare D1...</span>
                  <span className="font-mono">{importProgress.current}/{importProgress.total} ({importProgress.percent}%)</span>
                </div>
                <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${importProgress.percent}%` }} />
                </div>
                <div className="text-[11px] text-emerald-800">Lô {importProgress.batchIndex}/{importProgress.totalBatches} · Mỗi lô tối đa 50 bản ghi</div>
              </div>
            )}
            {importResult && (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">Kết quả nhập dữ liệu: {importResult.importedCount}/{importParsedRows.length} bản ghi được nhập.</div>
                {importResult.duplicates.length > 0 && <div className="text-amber-800 text-[11px]">Bản ghi trùng được bỏ qua: {importResult.duplicates.length}</div>}
                {importResult.errors.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto text-[11px] text-rose-700">
                    <div className="font-semibold">Chi tiết lỗi ({importResult.errors.length}):</div>
                    {importResult.errors.map((error, index) => <div key={index}>• {error}</div>)}
                  </div>
                )}
                {importResult.duplicates.length > 0 && (
                  <details className="text-[11px] text-amber-800">
                    <summary className="cursor-pointer font-semibold">Xem chi tiết {importResult.duplicates.length} dòng trùng</summary>
                    <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                      {importResult.duplicates.map((duplicate, index) => <div key={index}>• {duplicate}</div>)}
                    </div>
                  </details>
                )}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => !isImporting && setShowInlineImportModal(false)}
                disabled={isImporting}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-40"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isImporting || importParsedRows.length === 0}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold cursor-pointer flex items-center gap-1.5"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isImporting ? `Đang nhập... ${importProgress?.percent ?? 0}%` : `Xác nhận nhập ${importParsedRows.length} bản ghi`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportApprovalModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Các bản ghi đang ở trạng thái nháp</h3>
                <p className="text-xs text-slate-500 mt-0.5">{pendingApprovalIds.length} bản ghi chưa được công khai và đang chờ bước phê duyệt.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Các bản ghi nháp này chưa được hiển thị công khai. Chỉ khi xác nhận phê duyệt, hệ thống mới chuyển trạng thái sang “Đã phê duyệt” và công khai theo quy trình.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowImportApprovalModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold">
                Giữ ở trạng thái nháp
              </button>
              <button type="button" disabled={isApprovingImported} onClick={handleApproveImported} className="px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold">
                {isApprovingImported ? 'Đang phê duyệt...' : `Phê duyệt và công khai ${pendingApprovalIds.length} bản ghi`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Manager Modal (ImageKit CDN) */}
      <AttachmentManagerModal
        isOpen={!!attachmentEntity}
        onClose={() => setAttachmentEntity(null)}
        entityId={attachmentEntity?.id}
        entityTitle={attachmentEntity?.title}
        moduleType={moduleType}
      />

    </div>
  );
};
