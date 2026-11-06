import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ModuleType } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  RotateCcw, 
  Database,
  FileSpreadsheet,
  Layers,
  Info,
  Loader2
} from 'lucide-react';

interface ImportExportStudioProps {
  initialModule?: ModuleType;
  onImportComplete: () => void;
}

export const ImportExportStudio: React.FC<ImportExportStudioProps> = ({
  initialModule = 'science_tasks',
  onImportComplete
}) => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApprovalIds, setPendingApprovalIds] = useState<string[]>([]);
  const [isApprovingImported, setIsApprovingImported] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    errors: string[];
    duplicates: string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [d1Report, setD1Report] = useState<any | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    batchIndex: number;
    totalBatches: number;
  } | null>(null);

  // Multi-sheet Excel workbook state
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Sample CSV / Excel data definitions for all 10 modules
  const getSampleDataMatrix = (mod: ModuleType): { headers: string[]; rows: string[][] } => {
    switch (mod) {
      case 'science_tasks':
        return {
          headers: [
            'STT',
            'Tên đề tài',
            'Cấp quản lý',
            'Cơ quan chủ trì',
            'Chủ nhiệm đề tài',
            'Thành viên tham gia',
            'Thời gian thực hiện',
            'Lĩnh vực',
            'Tóm tắt đề tài',
            'Tài liệu minh chứng',
            'Ký hiệu Kho'
          ],
          rows: [
            [
              '1',
              'Nghiên cứu ứng dụng công nghệ AI trong cảnh báo sạt lở ven sông',
              'Cấp Thành phố',
              'Trường Đại học Bách khoa - Đại học Đà Nẵng',
              'PGS.TS. Lê Quang Dũng',
              'TS. Trần Văn Nam, ThS. Nguyễn Thị Mai, KS. Đỗ Quốc Huy',
              '2024 - 2026',
              'Công nghệ thông tin',
              'Ứng dụng học sâu và cảm biến địa chấn không dây để cảnh báo nguy cơ sạt lở ven sông Vu Gia - Thu Bồn và chuyển giao cho Ban Chỉ huy PCTT thành phố.',
              'Thuyết minh đề tài; Quyết định phê duyệt số 142/QĐ-SKHCN',
              'KHO-CNTT-2024-01'
            ],
            [
              '2',
              'Hoàn thiện quy trình chế biến nano đông trùng hạ thảo',
              'Cấp Thành phố',
              'Viện Công nghệ Sinh học MT',
              'TS. Phạm Thị Bích',
              'ThS. Hoàng Trọng Đức, KS. Lê Thu Trang, CN. Vũ Đình Hùng',
              '2023 - 2025',
              'Công nghệ Sinh học',
              'Quy trình tách chiết nano tăng sinh khả dụng và chuyển giao cho hợp tác xã dược liệu Hòa Vang tạo sản phẩm OCOP đạt chuẩn.',
              'Hợp đồng nghiên cứu; Biên bản nghiệm thu chính thức',
              'KHO-SH-2023-04'
            ]
          ]
        };

      case 'initiatives':
        return {
          headers: ['STT', 'Năm công nhận', 'Tên sáng kiến', 'Tác giả', 'Chủ sở hữu', 'Địa chỉ chủ sở hữu', 'Lĩnh vực'],
          rows: [
            ['1', '2026', 'Hệ thống camera AI giám sát xả rác và an ninh trật tự khu dân cư', 'Nguyễn Văn Hoàng', 'UBND Phường Thạch Thang', 'Quận Hải Châu - TP Đà Nẵng', 'Công nghệ thông tin'],
            ['2', '2026', 'Thiết bị lọc nước mặn thành nước ngọt mini cho ngư dân đánh bắt xa bờ', 'Trần Đình Nam', 'Hợp tác xã Nghề cá Sơn Trà', 'Quận Sơn Trà - TP Đà Nẵng', 'Kỹ thuật cơ khí']
          ]
        };

      case 'experts':
        return {
          headers: ['STT', 'Tên Chuyên gia', 'Năm sinh', 'Chuyên ngành'],
          rows: [
            ['1', 'GS.TS. Trần Quốc Hùng', '1975', 'Trí tuệ nhân tạo & Robot y tế'],
            ['2', 'PGS.TS. Hoàng Kim Oanh', '1980', 'Công nghệ Sinh học & Y dược'],
            ['3', 'TS. Lê Mai Anh', '1985', 'Khoa học Môi trường & Năng lượng mới']
          ]
        };

      case 'startups':
        return {
          headers: [
            'STT', 'Tên doanh nghiệp', 'Địa chỉ hoạt động', 'Website doanh nghiệp (nếu có)', 'File logo doanh nghiệp',
            'Lĩnh vực kinh doanh', 'Tóm tắt về doanh nghiệp và sản phẩm', 'Sản phẩm giải quyết vấn đề gì',
            'Số lượng sáng lập viên', 'Tổng số nhân sự ở thời điểm hiện tại', 'Họ và tên người đứng đầu doanh nghiệp',
            'Số điện thoại người đứng đầu doanh nghiệp', 'Email người đứng đầu doanh nghiệp', 'Năm bắt đầu khởi nghiệp'
          ],
          rows: [
            ['1', 'Công ty CP Dat Bike Việt Nam', 'Số 48 Phan Đình Phùng - Hải Châu - Đà Nẵng', 'https://dat.bike', '/logos/datbike.png', 'Phương tiện điện thông minh', 'Sản xuất xe máy điện hiệu năng cao pin sạc nhanh', 'Giảm ô nhiễm khí thải đô thị và tiết kiệm chi phí nhiên liệu', '2', '45', 'Nguyễn Bá Cảnh Sơn', '0905123456', 'contact@dat.bike', '2022'],
            ['2', 'Công ty CP EM&AI', 'Số 123 Nguyễn Văn Linh - Hải Châu - Đà Nẵng', 'https://emandai.net', '/logos/emandai.png', 'Trí tuệ nhân tạo (AI)', 'Nền tảng Voicebot AI trợ lý ảo thông minh cho doanh nghiệp', 'Tự động hóa chăm sóc khách hàng và giải phóng nhân lực trực tổng đài', '3', '30', 'Lê Ngọc Trí', '0905888999', 'info@emandai.net', '2023']
          ]
        };

      case 'support_organizations':
        return {
          headers: ['STT', 'Tên tổ chức', 'Địa chỉ', 'Thông tin về tổ chức'],
          rows: [
            ['1', 'Trung tâm Hỗ trợ Khởi nghiệp Đổi mới sáng tạo Đà Nẵng', 'Số 48 Phan Đình Phùng - Quận Hải Châu - Đà Nẵng', 'Đơn vị sự nghiệp công lập hỗ trợ ươm tạo kết nối quỹ đầu tư và đào tạo khởi nghiệp'],
            ['2', 'Vườn ươm Doanh nghiệp Đà Nẵng (DNES)', 'Số 31 Trần Phú - Quận Hải Châu - Đà Nẵng', 'Vườn ươm đối tác công tư đầu tiên của miền Trung với chương trình Surf và tăng tốc khởi nghiệp']
          ]
        };

      case 'startup_projects':
        return {
          headers: ['STT', 'Tên dự án', 'Lĩnh vực khởi nghiệp', 'Sản phẩm giải quyết vấn đề', 'Người đứng đầu', 'Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án)', 'Năm bắt đầu khởi nghiệp'],
          rows: [
            ['1', 'Hệ thống trạm sạc xe điện thông minh SmartCharge', 'Năng lượng xanh', 'Mạng lưới trạm sạc nhanh đa năng tích hợp thanh toán qua App', 'Phạm Minh Tuấn', 'Vườn ươm Doanh nghiệp Đà Nẵng (DNES)', '2024'],
            ['2', 'Robot lau pin mặt trời tự động SolarClean', 'Tự động hóa', 'Làm sạch các tấm pin trên mái nhà xưởng không dùng nước', 'Đỗ Hoàng Long', 'Trung tâm Đổi mới sáng tạo Đà Nẵng', '2024']
          ]
        };

      case 'startup_ideas':
        return {
          headers: ['STT', 'Tên ý tưởng', 'Lĩnh vực khởi nghiệp', 'Người đứng đầu', 'Giáo viên hướng dẫn'],
          rows: [
            ['1', 'Vật liệu đóng gói tự phân hủy từ vỏ tôm phế phụ phẩm thủy sản', 'Công nghệ vật liệu mới', 'Lê Thị Thu Thảo', 'TS. Nguyễn Đắc Lực'],
            ['2', 'Ứng dụng vi tảo xử lý nước thải dệt nhuộm và thu hồi sinh khối', 'Môi trường & Sinh học', 'Trần Anh Khoa', 'PGS.TS. Vũ Đình Thành']
          ]
        };

      case 'wards':
        return {
          headers: ['STT', 'Tên xã/phường/đặc khu', 'Địa chỉ', 'Thông tin liên hệ', 'Website'],
          rows: [
            ['1', 'Phường Thạch Thang', 'Số 12 Quang Trung - Quận Hải Châu - Đà Nẵng', '0236.3822123', 'https://thachthang.danang.gov.vn'],
            ['2', 'Xã Hòa Tiến', 'Huyện Hòa Vang - TP Đà Nẵng', '0236.3789123', 'https://hoatien.danang.gov.vn'],
            ['3', 'Đặc khu Hoàng Sa', 'Huyện Hoàng Sa - TP Đà Nẵng', '0236.3899123', 'https://hoangsa.danang.gov.vn']
          ]
        };

      case 'universities':
        return {
          headers: ['STT', 'Tên trường', 'Thuộc xã/ phường', 'Địa chỉ', 'Thông tin liên hệ', 'Website'],
          rows: [
            ['1', 'Trường Đại học Bách Khoa - Đại học Đà Nẵng', 'Phường Hòa Khánh Bắc', 'Số 54 Nguyễn Lương Bằng - Quận Liên Chiểu - Đà Nẵng', '0236.3842308', 'https://dut.udn.vn'],
            ['2', 'Trường Đại học Kinh tế - Đại học Đà Nẵng', 'Phường Mỹ An', 'Số 71 Ngũ Hành Sơn - Quận Ngũ Hành Sơn - Đà Nẵng', '0236.3836169', 'https://due.udn.vn'],
            ['3', 'Trường Cao đẳng Công nghệ Thông tin Đà Nẵng', 'Phường Khuê Trung', 'Khu Đô thị ĐH Đà Nẵng - Cẩm Lệ - Đà Nẵng', '0236.3667117', 'https://cit.udn.vn']
          ]
        };

      case 'featured_startups':
        return {
          headers: ['STT', 'Tên doanh nghiệp', 'Tên dự án', 'Người đại diện dự án', 'Địa chỉ', 'Thông tin liên hệ', 'Website', 'Thuộc xã/ phường'],
          rows: [
            ['1', 'Công ty CP EM&AI', 'Nền tảng Voicebot AI trợ lý ảo thông minh', 'Lê Ngọc Trí', 'Tầng 5 Tòa nhà DNC - Hải Châu - Đà Nẵng', '0905888999', 'https://emandai.net', 'Phường Thạch Thang'],
            ['2', 'Công ty CP Dat Bike Việt Nam', 'Xe máy điện thông minh hiệu năng cao Weaver++', 'Nguyễn Bá Cảnh Sơn', 'Số 48 Phan Đình Phùng - Hải Châu - Đà Nẵng', '0905123456', 'https://dat.bike', 'Phường Hải Châu 1']
          ]
        };

      default:
        return {
          headers: ['STT', 'Tên', 'Lĩnh vực', 'Chủ trì', 'Mô tả'],
          rows: [
            ['1', 'Bản ghi mẫu 1', 'Công nghệ thông tin', 'Đơn vị A', 'Mô tả chi tiết nội dung bản ghi 1'],
            ['2', 'Bản ghi mẫu 2', 'Nông nghiệp công nghệ cao', 'Hợp tác xã B', 'Mô tả chi tiết nội dung bản ghi 2']
          ]
        };
    }
  };

  const getSampleCsv = (mod: ModuleType) => {
    const matrix = getSampleDataMatrix(mod);
    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const headerLine = matrix.headers.map(escapeCsv).join(',');
    const rowLines = matrix.rows.map(r => r.map(escapeCsv).join(','));
    return [headerLine, ...rowLines].join('\n');
  };

  const handleLoadSample = () => {
    const csv = getSampleCsv(selectedModule);
    setRawText(csv);
    setWorkbook(null);
    setSheetNames([]);
    setActiveSheet('');
    setUploadedFileName('Dữ liệu mẫu chuẩn');
    const rows = parseCsvText(csv);
    setParsedRows(rows);
    setImportResult(null);
    setImportError(null);
  };

  const handleDownloadExcelTemplate = () => {
    const matrix = getSampleDataMatrix(selectedModule);
    const dataAoa = [matrix.headers, ...matrix.rows];
    const ws = XLSX.utils.aoa_to_sheet(dataAoa);
    
    // Auto-fit column widths
    const colWidths = matrix.headers.map((h, i) => {
      let maxLen = h.length;
      matrix.rows.forEach(r => {
        if (r[i] && r[i].length > maxLen) maxLen = Math.min(r[i].length, 50);
      });
      return { wch: Math.max(maxLen + 4, 12) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetTitle = (MODULE_NAMES[selectedModule] || selectedModule).slice(0, 31).replace(/[\\/?*[\]]/g, '');
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, `Mau_Nhap_Lieu_${selectedModule}.xlsx`);
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = '\uFEFF' + getSampleCsv(selectedModule);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_Nhap_Lieu_${selectedModule}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if ((char === ',' || char === ';' || char === '\t') && !insideQuote) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseLine(line);
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      // Check if at least one value is non-empty
      if (Object.values(obj).some(v => String(v).trim().length > 0)) {
        rows.push(obj);
      }
    }
    return rows;
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const jsonRows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
    // Filter out completely blank rows
    const cleanRows = jsonRows.filter(r => 
      Object.values(r).some(v => v !== null && v !== undefined && String(v).trim().length > 0)
    );
    setParsedRows(cleanRows);
    
    // Also generate a preview CSV text
    const csv = XLSX.utils.sheet_to_csv(ws);
    setRawText(csv);
    setImportResult(null);
    setImportError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setImportResult(null);
    setImportError(null);

    const isExcel = /\.xlsx$|\.xls$/i.test(file.name);

    if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const defaultSheet = wb.SheetNames[0] || '';
        setActiveSheet(defaultSheet);
        loadSheetData(wb, defaultSheet);
      } catch (err: any) {
        setImportError(`Không thể đọc tệp Excel (${file.name}): ${err.message || 'Tệp bị lỗi hoặc không đúng định dạng.'}`);
      }
    } else {
      // CSV or TXT file
      setWorkbook(null);
      setSheetNames([]);
      setActiveSheet('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
          const rows = parseCsvText(text);
          setParsedRows(rows);
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleSheetChange = (newSheet: string) => {
    setActiveSheet(newSheet);
    if (workbook) {
      loadSheetData(workbook, newSheet);
    }
  };

  const handlePreview = () => {
    const rows = parseCsvText(rawText);
    setParsedRows(rows);
    setImportResult(null);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setImportError(null);
    setImportResult(null);

    const BATCH_SIZE = 50;
    const total = parsedRows.length;
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    let allImportedCount = 0;
    const allImportedIds: string[] = [];
    const allErrors: string[] = [];
    const allDuplicates: string[] = [];

    setImportProgress({
      current: 0,
      total,
      percent: 0,
      batchIndex: 0,
      totalBatches
    });

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = parsedRows.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

        const res = await api.importRecords(selectedModule, batch);
        if (res.importedCount) allImportedCount += res.importedCount;
        if (res.importedIds?.length) allImportedIds.push(...res.importedIds);
        if (res.errors && res.errors.length > 0) allErrors.push(...res.errors);
        if (res.duplicates && res.duplicates.length > 0) allDuplicates.push(...res.duplicates);

        const currentCount = Math.min(i + batch.length, total);
        const percent = Math.round((currentCount / total) * 100);
        setImportProgress({
          current: currentCount,
          total,
          percent,
          batchIndex,
          totalBatches
        });
      }

      setImportResult({
        importedCount: allImportedCount,
        errors: allErrors,
        duplicates: allDuplicates
      });
      setPendingApprovalIds(allImportedIds);
      onImportComplete();
    } catch (err: any) {
      setImportError(err.message || 'Lỗi nhập dữ liệu.');
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const handleApproveImported = async () => {
    if (!pendingApprovalIds.length) return;
    setIsApprovingImported(true);
    try {
      const result = await api.approveImportedRecords(selectedModule, pendingApprovalIds);
      setPendingApprovalIds([]);
      setImportError(null);
      setImportResult(prev => prev ? { ...prev, importedCount: result.approvedCount } : prev);
    } catch (err: any) {
      setImportError(err.message || 'Không thể phê duyệt dữ liệu vừa nhập.');
    } finally {
      setIsApprovingImported(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!importResult) return;
    const lines = ['\uFEFFSTT,Loại vấn đề,Chi tiết thông báo,Thời gian'];
    let idx = 1;
    importResult.errors.forEach(err => {
      lines.push(`${idx++},Lỗi dữ liệu,"${err.replace(/"/g, '""')}",${new Date().toLocaleString('vi-VN')}`);
    });
    importResult.duplicates.forEach(dup => {
      lines.push(`${idx++},Bản ghi trùng lặp,"${dup.replace(/"/g, '""')}",${new Date().toLocaleString('vi-VN')}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_doi_soat_${selectedModule}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReconcileD1 = async () => {
    try {
      setIsReconciling(true);
      const report = await api.reconcileD1();
      setD1Report(report);
    } catch (err: any) {
      alert(err.message || 'Lỗi đối soát dữ liệu Cloudflare D1');
    } finally {
      setIsReconciling(false);
    }
  };

  // Row validation calculation
  const totalRows = parsedRows.length;
  const validRowsCount = parsedRows.filter(r => {
    const titleVal = r['Tên đề tài'] || r['title'] || r['Tên sáng kiến'] || r['Tên Chuyên gia'] || 
                     r['Tên doanh nghiệp'] || r['Tên tổ chức'] || r['Tên dự án'] || r['Tên ý tưởng'] || 
                     r['Tên xã/phường/đặc khu'] || r['Tên trường'] || r['name'] || Object.values(r)[1];
    return titleVal && String(titleVal).trim().length > 0;
  }).length;
  const invalidRowsCount = totalRows - validRowsCount;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Công cụ Nhập, Chuẩn hóa, Sao lưu & Cloudflare D1
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Quản trị & Xuất/Nhập Dữ liệu Tập trung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ nhập Excel (.xlsx, .xls) và CSV chuẩn 11 trường, đối soát trùng lặp và tự động sinh khóa ID/Code
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/d1/export-sql?download=1"
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs"
            title="Tải tệp lệnh SQL batch cho Cloudflare D1 database"
          >
            <Database className="w-3.5 h-3.5" />
            Xuất SQL Cloudflare D1
          </a>
          <button
            type="button"
            onClick={handleReconcileD1}
            disabled={isReconciling}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Đang đối soát...' : 'Đối soát CSDL D1'}
          </button>
          <a
            href={api.getExportUrl(selectedModule)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-slate-300 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Tải CSV phân hệ
          </a>
        </div>
      </div>

      {/* SYSTEM NOTICE BANNER: NO ID REQUIRED */}
      <div className="p-3.5 bg-teal-50/90 border border-teal-200 rounded-xl flex items-start gap-3 text-slate-800 shadow-2xs">
        <Info className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-teal-950 text-xs">
            Lưu ý quan trọng về cấu trúc tệp nhập liệu:
          </div>
          <div className="text-[11px] text-teal-900 leading-relaxed">
            Hệ thống <strong>tự động sinh mã quản lý (Code) và khóa định danh (ID) duy nhất</strong> cho từng bản ghi khi nhập khẩu. 
            Người dùng <strong>KHÔNG CẦN</strong> và <strong>KHÔNG BẮT BUỘC</strong> có cột ID trong file Excel hay CSV. 
            Cột <strong>STT</strong> là số thứ tự tham khảo hiển thị và không được sử dụng làm khóa chính.
          </div>
        </div>
      </div>

      {/* D1 Reconciliation Report Card */}
      {d1Report && (
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-700" />
              Kết quả đối soát tính toàn vẹn CSDL Cloudflare D1 ({d1Report.totalTables} bảng dữ liệu, {d1Report.totalRecords} bản ghi)
            </div>
            <button
              onClick={() => setD1Report(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px]">
            {d1Report.summary.slice(0, 12).map((item: any, idx: number) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-teal-100 shadow-2xs">
                <div className="font-semibold text-slate-700 truncate" title={item.table}>{item.table}</div>
                <div className="text-teal-800 font-bold font-mono mt-0.5">{item.inMemoryCount} bản ghi</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Select Module & Download Templates */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <label className="block text-slate-700 font-bold">
          1. Chọn phân hệ dữ liệu & Tải biểu mẫu chuẩn:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value as ModuleType);
                setImportResult(null);
                setParsedRows([]);
                setWorkbook(null);
                setSheetNames([]);
                setActiveSheet('');
              }}
              className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-teal-700 cursor-pointer text-xs"
            >
              {Object.entries(MODULE_NAMES).map(([mod, name]) => (
                <option key={mod} value={mod}>{name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-7 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="px-3 h-9 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
              title="Tải tệp mẫu Excel (.xlsx) chuẩn 11 cột với dữ liệu mẫu thực tế"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tải Mẫu Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="px-3 h-9 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
              title="Tải tệp mẫu CSV UTF-8 with BOM chuẩn"
            >
              <Download className="w-3.5 h-3.5 text-teal-800" />
              <span>Tải Mẫu CSV (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 h-9 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
              title="Điền dữ liệu mẫu trực tiếp vào trình soạn thảo"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Nạp mẫu thử</span>
            </button>
          </div>
        </div>

        {selectedModule === 'science_tasks' && (
          <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
            <strong className="text-teal-800">Cấu trúc 11 cột chuẩn cho Đề tài, nhiệm vụ KH&CN:</strong>{' '}
            <span className="font-mono text-[10px] text-slate-600">
              STT, Tên đề tài, Cấp quản lý, Cơ quan chủ trì, Chủ nhiệm đề tài, Thành viên tham gia, Thời gian thực hiện, Lĩnh vực, Tóm tắt đề tài, Tài liệu minh chứng, Ký hiệu Kho
            </span>
          </div>
        )}
      </div>

      {/* Step 2: File Upload and Sheet Selection Area */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="block text-slate-700 font-bold">
              2. Tải tệp từ máy tính (.xlsx, .xls, .csv, .txt) hoặc dán dữ liệu:
            </label>
            {uploadedFileName && (
              <span className="text-[11px] text-teal-800 font-medium">
                Tệp đang mở: <strong>{uploadedFileName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn tệp Excel / CSV</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handlePreview}
              disabled={!rawText.trim()}
              className="px-3.5 py-1.5 bg-white border border-slate-300 disabled:opacity-50 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Phân tích lại</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-Sheet Selector for Excel */}
        {sheetNames.length > 1 && (
          <div className="p-3 bg-white border border-teal-200 rounded-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-teal-950 text-xs shrink-0">
              <Layers className="w-3.5 h-3.5 text-teal-800" />
              <span>Tệp Excel có nhiều Sheet:</span>
            </div>
            <select
              value={activeSheet}
              onChange={(e) => handleSheetChange(e.target.value)}
              className="px-2.5 py-1 bg-teal-50 border border-teal-300 text-teal-900 font-semibold rounded-md text-xs cursor-pointer"
            >
              {sheetNames.map((sName) => (
                <option key={sName} value={sName}>
                  Sheet: {sName}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500">
              (Hệ thống đang hiển thị và xử lý dữ liệu của Sheet đã chọn)
            </span>
          </div>
        )}

        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dữ liệu dạng bảng hoặc CSV sẽ hiển thị tại đây sau khi chọn tệp hoặc dán trực tiếp..."
          className="w-full p-3 font-mono text-[11px] bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-inner"
        />
      </div>

      {/* Step 3: Preview Table & Statistics */}
      {parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                3. Bản xem trước kết quả ánh xạ dữ liệu:
              </div>
              <div className="flex items-center gap-3 text-slate-600 mt-0.5">
                <span>Tổng cộng: <strong className="text-slate-900">{totalRows}</strong> dòng</span>
                <span>• Hợp lệ: <strong className="text-emerald-700">{validRowsCount}</strong> dòng</span>
                {invalidRowsCount > 0 && (
                  <span>• Cần lưu ý: <strong className="text-rose-600">{invalidRowsCount}</strong> dòng thiếu tiêu đề</span>
                )}
              </div>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-900 disabled:opacity-80 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang nhập... {importProgress ? `${importProgress.percent}%` : ''}</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Xác nhận nhập {totalRows} bản ghi</span>
                </>
              )}
            </button>
          </div>

          {/* Live Progress Bar Indicator */}
          {isProcessing && importProgress && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Đang xác thực & nhập dữ liệu vào Cloudflare D1...</span>
                </div>
                <div className="font-mono text-emerald-800 font-extrabold">
                  {importProgress.current} / {importProgress.total} dòng ({importProgress.percent}%)
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${importProgress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-emerald-800">
                <span>
                  Đang ghi lô {importProgress.batchIndex} / {importProgress.totalBatches} (mỗi lô 50 dòng an toàn giao dịch)
                </span>
                <span className="font-semibold">
                  {importProgress.percent === 100 ? 'Đang hoàn tất lưu vào D1...' : `Tiến độ: ${importProgress.percent}%`}
                </span>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto shadow-inner">
            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 shadow-2xs">
                <tr>
                  <th className="py-2 px-3 w-10">#</th>
                  {Object.keys(parsedRows[0] || {}).map(k => (
                    <th key={k} className="py-2 px-3 font-mono text-slate-800 whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                    {Object.values(r).map((val: any, j) => (
                      <td key={j} className="py-2 px-3 truncate max-w-[220px]" title={String(val)}>
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {importError && (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Step 4: Import Result Box */}
      {importResult && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Kết quả xử lý nhập khẩu dữ liệu:
            </div>
            
            {(importResult.duplicates.length > 0 || importResult.errors.length > 0) && (
              <button
                type="button"
                onClick={handleDownloadErrorReport}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs text-xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-800" />
                <span>Tải báo cáo lỗi & trùng lặp (.csv)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg">
              <span className="block font-medium">Nhập thành công:</span>
              <span className="text-xl font-bold font-mono">{importResult.importedCount} bản ghi</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg">
              <span className="block font-medium">Trùng lặp (đã bỏ qua):</span>
              <span className="text-xl font-bold font-mono">{importResult.duplicates.length}</span>
            </div>
            <div className="p-3 bg-red-50 text-red-950 border border-red-200 rounded-lg">
              <span className="block font-medium">Lỗi dữ liệu (thiếu trường):</span>
              <span className="text-xl font-bold font-mono">{importResult.errors.length}</span>
            </div>
          </div>

          {pendingApprovalIds.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <div className="font-semibold text-amber-950 text-xs">
                {pendingApprovalIds.length} bản ghi đã được nhập ở trạng thái nháp và chưa hiển thị công khai.
              </div>
              <div className="text-[11px] text-amber-900">
                Chỉ thực hiện bước tiếp theo sau khi đã kiểm tra nội dung và xác nhận đủ điều kiện công khai.
              </div>
              <button
                type="button"
                disabled={isApprovingImported}
                onClick={handleApproveImported}
                className="px-3 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {isApprovingImported ? 'Đang phê duyệt...' : `Phê duyệt và công khai ${pendingApprovalIds.length} bản ghi`}
              </button>
            </div>
          )}

          {(importResult.duplicates.length > 0 || importResult.errors.length > 0) && (
            <div className="pt-2 space-y-1 text-[11px] text-slate-600 max-h-48 overflow-y-auto border-t border-slate-200">
              <div className="font-semibold text-slate-700 pt-1">Chi tiết các bản ghi cần lưu ý:</div>
              {importResult.errors.map((err, idx) => (
                <div key={`err-${idx}`} className="text-red-600 flex items-start gap-1">
                  <span>❌</span>
                  <span>{err}</span>
                </div>
              ))}
              {importResult.duplicates.map((dup, idx) => (
                <div key={`dup-${idx}`} className="text-amber-700 flex items-start gap-1">
                  <span>⚠️</span>
                  <span>{dup}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
