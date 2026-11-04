import React, { useState } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportExportStudioProps {
  initialModule?: ModuleType;
  onImportComplete: () => void;
}

export const ImportExportStudio: React.FC<ImportExportStudioProps> = ({
  initialModule = 'initiatives',
  onImportComplete
}) => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    errors: string[];
    duplicates: string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [d1Report, setD1Report] = useState<any | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Sample CSV Templates generator
  const getSampleCsv = (mod: ModuleType) => {
    if (mod === 'initiatives') {
      return `code,title,field,ownerName,problemSolved,solutionDetails,costSavings,investmentCost\nSK-IMP-01,Ứng dụng IoT chiếu sáng công cộng thông minh,Chiếu sáng đô thị & Tiết kiệm năng lượng,Công ty CP Chiếu sáng Đô thị,Lãng phí điện năng chiếu sáng ban đêm,Tự động điều chỉnh độ sáng theo mật độ phương tiện,1200000000,300000000\nSK-IMP-02,Hệ thống camera AI giám sát vứt rác bờ sông,Môi trường đô thị,UBND Quận Hoàn Kiếm,Tình trạng đổ trộm xà bần phế thải ven đê,Camera cảm biến tự phát chuông cảnh báo và gửi hình ảnh về phường,450000000,80000000`;
    }
    if (mod === 'experts') {
      return `code,title,field,ownerName,academicTitle,position,workplace,primaryField,publicEmail,phone,birthYear\nCG-IMP-01,GS.TS. Trần Quốc Hùng,Tự động hóa,Đại học Bách Khoa,GS,Trưởng khoa Cơ điện tử,Đại học Bách Khoa,Tự động hóa & Robot y tế,hung.tq@dut.udn.vn,0905123456,1975\nCG-IMP-02,TS. Lê Mai Anh,Công nghệ sinh học,Viện Hàn lâm KH&CN VN,TS,Nghiên cứu viên cao cấp,Viện Hàn lâm KH&CN VN,Công nghệ Sinh học Vi sinh,anh.lm@vast.vn,0912345678,1982`;
    }
    if (mod === 'science_tasks') {
      return `code,title,field,ownerName,managementLevel,principalInvestigator,executionTime,totalBudgetApproved\nNV-IMP-01,Nghiên cứu công nghệ xử lý nước thải công nghiệp bán dẫn,Môi trường & Công nghệ cao,Đại học Sư phạm Kỹ thuật,Cấp thành phố,PGS.TS Nguyễn Văn A,2024-2026,2000000000\nNV-IMP-02,Phát triển nền tảng dữ liệu mở đô thị thông minh,Công nghệ thông tin,Trung tâm CNTT&TT Đà Nẵng,Cấp sở,ThS. Lê Thị B,2025-2026,1200000000`;
    }
    return `code,title,field,ownerName,description\nTEST-01,Dữ liệu mẫu 1,Công nghệ thông tin,Trung tâm CNTT,Mô tả chi tiết nội dung mẫu 1\nTEST-02,Dữ liệu mẫu 2,Nông nghiệp công nghệ cao,Hợp tác xã xanh,Mô tả chi tiết nội dung mẫu 2`;
  };

  const handleLoadSample = () => {
    setRawText(getSampleCsv(selectedModule));
    setImportResult(null);
  };

  const handleDownloadExcelTemplate = () => {
    try {
      let sampleRows: Record<string, any>[] = [];
      if (selectedModule === 'science_tasks') {
        sampleRows = [
          { 'code': 'NV-01', 'title': 'Nghiên cứu ứng dụng IoT trong giám sát môi trường', 'field': 'Công nghệ thông tin', 'ownerName': 'Đại học Bách Khoa', 'managementLevel': 'Cấp thành phố', 'principalInvestigator': 'PGS.TS Nguyễn Văn A', 'executionTime': '2024-2026', 'totalBudgetApproved': 1500000000 }
        ];
      } else if (selectedModule === 'initiatives') {
        sampleRows = [
          { 'code': 'SK-01', 'title': 'Hệ thống số hóa quy trình một cửa điện tử', 'field': 'Cải cách hành chính', 'ownerName': 'UBND Quận Hải Châu', 'recognitionYear': 2026, 'authors': 'Nguyễn Văn B', 'costSavings': 300000000 }
        ];
      } else if (selectedModule === 'experts') {
        sampleRows = [
          { 'code': 'CG-01', 'title': 'GS.TS. Trần Quốc Hùng', 'field': 'Tự động hóa', 'ownerName': 'Đại học Bách Khoa', 'birthYear': '1975', 'email': 'hung.tq@dut.udn.vn', 'phone': '0905123456', 'specialty': 'Robot y tế', 'academicDegree': 'Tiến sĩ' }
        ];
      } else {
        sampleRows = [
          { 'code': 'MA-01', 'title': 'Bản ghi mẫu', 'field': 'Công nghệ thông tin', 'ownerName': 'Đơn vị phụ trách', 'description': 'Mô tả tóm tắt nội dung bản ghi' }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedModule.slice(0, 31));
      XLSX.writeFile(wb, `bieu-mau-nhap-${selectedModule}.xlsx`);
    } catch (err: any) {
      alert('Lỗi tải tệp mẫu Excel: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
          if (json.length === 0) {
            setImportError('Tệp Excel không chứa dòng dữ liệu nào.');
            setParsedRows([]);
          } else {
            setParsedRows(json);
            setImportError(null);
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            setRawText(csvText);
          }
        } catch (err: any) {
          setImportError('Lỗi đọc tệp Excel: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setRawText(content);
        try {
          const rows = parseCsvText(content);
          setParsedRows(rows);
          setImportError(rows.length ? null : 'Không tìm thấy dữ liệu hợp lệ trong nội dung CSV.');
          setImportResult(null);
        } catch (err: any) {
          setParsedRows([]);
          setImportError(err.message || 'Không thể đọc nội dung CSV.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportExcel = async () => {
    try {
      const records = await api.getModuleRecords(selectedModule);
      const exportData = records.map((r, i) => {
        const base: Record<string, any> = {
          'STT': i + 1,
          'Mã định danh': r.code,
          'Tên bản ghi': r.title,
          'Lĩnh vực': r.field,
          'Đơn vị / Chủ thể': r.ownerName,
          'Trạng thái': r.status,
          'Phạm vi': r.publicityLevel === 'public' ? 'Công khai' : 'Nội bộ'
        };
        Object.entries(r).forEach(([k, v]) => {
          if (!['id', 'code', 'title', 'field', 'ownerName', 'status', 'publicityLevel', 'history'].includes(k) && typeof v !== 'object') {
            base[k] = v;
          }
        });
        return base;
      });

      const ws = XLSX.utils.json_to_sheet(exportData.length > 0 ? exportData : [{ 'Mã': 'MDD-01', 'Tên': 'Mẫu' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedModule.slice(0, 31));
      XLSX.writeFile(wb, `du-lieu-${selectedModule}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert('Lỗi xuất tệp Excel: ' + err.message);
    }
  };

  // RFC 4180-compatible CSV parser
  const parseCsvText = (text: string) => {
    const input = text.replace(/^\uFEFF/, '');
    const matrix: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (quoted) {
        if (char === '"' && input[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          quoted = false;
        } else {
          cell += char;
        }
      } else if (char === '"' && cell.length === 0) {
        quoted = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && input[i + 1] === '\n') i++;
        row.push(cell);
        if (row.some(value => value.length > 0)) matrix.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    if (quoted) throw new Error('Tệp CSV không hợp lệ: có trường văn bản chưa đóng dấu ngoặc kép.');
    row.push(cell);
    if (row.some(value => value.length > 0)) matrix.push(row);
    if (matrix.length < 2) return [];

    const headers = matrix[0].map(header => header.trim());
    if (headers.some(header => !header)) {
      throw new Error('Tệp CSV không hợp lệ: tên cột không được để trống.');
    }

    return matrix.slice(1).map((values, rowIndex) => {
      if (values.length > headers.length) {
        throw new Error('Dòng ' + (rowIndex + 2) + ' có nhiều cột hơn tiêu đề CSV.');
      }
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (values[index] ?? '').trim();
      });
      return record;
    });
  };

  const handlePreview = () => {
    try {
      const rows = parseCsvText(rawText);
      setParsedRows(rows);
      setImportError(rows.length ? null : 'Không tìm thấy dữ liệu hợp lệ trong nội dung CSV.');
      setImportResult(null);
    } catch (err: any) {
      setParsedRows([]);
      setImportError(err.message || 'Không thể đọc nội dung CSV.');
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setImportError(null);
    try {
      const res = await api.importRecords(selectedModule, parsedRows);
      setImportResult(res);
      onImportComplete();
    } catch (err: any) {
      setImportError(err.message || 'Lỗi nhập dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
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
            Hỗ trợ nhập Excel (.xlsx, .xls), CSV chuẩn UTF-8, đối soát trùng lặp và sao lưu D1
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs cursor-pointer"
            title="Xuất dữ liệu toàn bộ phân hệ ra tệp Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Tải Excel (.xlsx)
          </button>

          <a
            href={api.getExportUrl(selectedModule)}
            download={selectedModule + '.csv'}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-slate-300 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Tải CSV phân hệ
          </a>

          <a
            href="/api/d1/export-sql?download=1"
            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs"
            title="Tải tệp lệnh SQL batch cho Cloudflare D1 database"
          >
            <Database className="w-3.5 h-3.5" />
            Xuất SQL D1
          </a>

          <button
            type="button"
            onClick={handleReconcileD1}
            disabled={isReconciling}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 text-xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Đang đối soát...' : 'Đối soát CSDL D1'}
          </button>
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
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
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

      {/* Select Module & Load Template */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            1. Chọn phân hệ dữ liệu:
          </label>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value as ModuleType);
              setImportResult(null);
              setParsedRows([]);
            }}
            className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
          >
            {Object.entries(MODULE_NAMES).map(([mod, name]) => (
              <option key={mod} value={mod}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={handleDownloadExcelTemplate}
            className="w-full h-9 px-3 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
            Tải mẫu Excel (.xlsx)
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="w-full h-9 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Xem mẫu CSV
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!rawText.trim()}
            className="w-full h-9 px-3 bg-teal-800 disabled:opacity-50 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Xem trước dữ liệu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File Upload & Drag-and-drop */}
      <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center space-y-2 bg-slate-50/60 transition-colors">
        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
        <div className="text-slate-700 font-semibold text-xs">
          Tải lên tệp Excel (.xlsx, .xls) hoặc tệp CSV
        </div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleFileUpload}
          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-800 file:text-white hover:file:bg-teal-700 cursor-pointer"
        />
      </div>

      {/* CSV Input Area */}
      <div className="space-y-1.5">
        <label className="block text-slate-600 font-semibold">
          Hoặc dán trực tiếp nội dung CSV (Header row):
        </label>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán dữ liệu CSV có dòng tiêu đề (Header row)..."
          className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
        />
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-800">
              Bản xem trước kết quả ánh xạ ({parsedRows.length} dòng):
            </div>
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {isProcessing ? 'Đang xác thực & nhập...' : `Xác nhận nhập ${parsedRows.length} bản ghi`}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-10">#</th>
                  {Object.keys(parsedRows[0] || {}).map(k => (
                    <th key={k} className="py-2 px-3 font-mono">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                    {Object.values(r).map((val: any, j) => (
                      <td key={j} className="py-2 px-3 truncate max-w-[200px]">{String(val)}</td>
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
          <span>⚠</span>
          <span>{importError}</span>
        </div>
      )}

      {/* Import Result Box */}
      {importResult && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Kết quả xử lý nhập khẩu dữ liệu:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg">
              <span className="block font-medium">Nhập thành công:</span>
              <span className="text-xl font-bold font-mono">{importResult.importedCount} bản ghi</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg">
              <span className="block font-medium">Trùng lặp (đã bỏ qua):</span>
              <span className="text-xl font-bold font-mono">{importResult.duplicates.length}</span>
            </div>
            <div className="p-3 bg-red-50 text-red-950 border border-red-200 rounded-lg">
              <span className="block font-medium">Lỗi dữ liệu:</span>
              <span className="text-xl font-bold font-mono">{importResult.errors.length}</span>
            </div>
          </div>

          {(importResult.duplicates.length > 0 || importResult.errors.length > 0) && (
            <div className="pt-2 space-y-1 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-700">Chi tiết đối soát:</div>
              {importResult.errors.map((err, idx) => (
                <div key={idx} className="text-red-600">❌ {err}</div>
              ))}
              {importResult.duplicates.map((dup, idx) => (
                <div key={idx} className="text-amber-700">⚠️ {dup}</div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
