import React, { useState } from 'react';
import { ModuleType } from '../../types';
import { api } from '../../services/api';
import { MODULE_NAMES } from './ModuleCrudView';
import { Upload, Download, CheckCircle2, AlertTriangle, FileText, ArrowRight, RotateCcw, Database } from 'lucide-react';

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
      return `title,academicTitle,position,workplace,primaryField,publicEmail\nGS.TS. Trần Quốc Hùng,GS,Trưởng khoa Cơ điện tử,Đại học Bách Khoa,Tự động hóa & Robot y tế,hung.tq@hust.edu.vn\nTS. Lê Mai Anh,TS,Nghiên cứu viên cao cấp,Viện Hàn lâm KH&CN VN,Công nghệ Sinh học Vi sinh,anh.lm@vast.vn`;
    }
    return `code,title,field,ownerName,description\nTEST-01,Dữ liệu mẫu 1,Công nghệ thông tin,Trung tâm CNTT,Mô tả chi tiết nội dung mẫu 1\nTEST-02,Dữ liệu mẫu 2,Nông nghiệp công nghệ cao,Hợp tác xã xanh,Mô tả chi tiết nội dung mẫu 2`;
  };

  const handleLoadSample = () => {
    setRawText(getSampleCsv(selectedModule));
    setImportResult(null);
  };

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }
    return rows;
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
            Hỗ trợ nhập Excel / CSV, đối soát trùng lặp và xuất batch SQL cho Cloudflare D1
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

      {/* Select Module & Load Template */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            1. Chọn phân hệ dữ liệu cần nhập:
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
            onClick={handleLoadSample}
            className="w-full h-9 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            Tải tệp mẫu chuẩn ({selectedModule})
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!rawText.trim()}
            className="w-full h-9 px-3 bg-teal-800 disabled:opacity-50 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Phân tích & Xem trước dữ liệu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CSV Input Area */}
      <div className="space-y-1.5">
        <label className="block text-slate-600 font-semibold">
          2. Dán nội dung định dạng CSV hoặc tải tệp:
        </label>
        <textarea
          rows={6}
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
              3. Bản xem trước kết quả ánh xạ ({parsedRows.length} dòng):
            </div>
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
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
              <span className="block font-medium">Lỗi dữ liệu (thiếu trường):</span>
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
