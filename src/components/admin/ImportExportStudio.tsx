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

  // Sample CSV Templates generator for all 10 modules
  const getSampleCsv = (mod: ModuleType) => {
    switch (mod) {
      case 'science_tasks':
        return `STT,Tên đề tài,Cấp quản lý,Cơ quan chủ trì,Chủ nhiệm đề tài,Thời gian thực hiện,Lĩnh vực,Tóm tắt đề tài
1,Nghiên cứu ứng dụng công nghệ AI trong cảnh báo sạt lở ven sông,Cấp Thành phố,Đại học Bách Khoa - ĐH Đà Nẵng,PGS.TS. Lê Quang Dũng,24 tháng,Công nghệ thông tin,Ứng dụng học sâu và cảm biến địa chấn không dây để phát hiện nguy cơ sạt lở
2,Hoàn thiện quy trình chế biến nano đông trùng hạ thảo,Cấp Thành phố,Viện Công nghệ Sinh học MT,TS. Phạm Thị Bích,18 tháng,Công nghệ Sinh học,Quy trình tách chiết nano tăng sinh khả dụng và chuyển giao cho hợp tác xã dược liệu`;

      case 'initiatives':
        return `STT,Năm công nhận,Tên sáng kiến,Tác giả,Chủ sở hữu,Địa chỉ chủ sở hữu,Lĩnh vực
1,2026,Hệ thống camera AI giám sát xả rác và an ninh trật tự khu dân cư,Nguyễn Văn Hoàng,UBND Phường Thạch Thang,Quận Hải Châu - TP Đà Nẵng,Công nghệ thông tin
2,2026,Thiết bị lọc nước mặn thành nước ngọt mini cho ngư dân đánh bắt xa bờ,Trần Đình Nam,Hợp tác xã Nghề cá Sơn Trà,Quận Sơn Trà - TP Đà Nẵng,Kỹ thuật cơ khí`;

      case 'experts':
        return `STT,Tên Chuyên gia,Năm sinh,Chuyên ngành
1,GS.TS. Trần Quốc Hùng,1975,Trí tuệ nhân tạo & Robot y tế
2,PGS.TS. Hoàng Kim Oanh,1980,Công nghệ Sinh học & Y dược
3,TS. Lê Mai Anh,1985,Khoa học Môi trường & Năng lượng mới`;

      case 'startups':
        return `STT,Tên doanh nghiệp,Địa chỉ hoạt động,Website doanh nghiệp (nếu có),File logo doanh nghiệp,Lĩnh vực kinh doanh,Tóm tắt về doanh nghiệp và sản phẩm,Sản phẩm giải quyết vấn đề gì,Số lượng sáng lập viên,Tổng số nhân sự ở thời điểm hiện tại,Họ và tên người đứng đầu doanh nghiệp,Số điện thoại người đứng đầu doanh nghiệp,Email người đứng đầu doanh nghiệp,Năm bắt đầu khởi nghiệp
1,Công ty CP Dat Bike Việt Nam,Số 48 Phan Đình Phùng - Hải Châu - Đà Nẵng,https://dat.bike,/logos/datbike.png,Phương tiện điện thông minh,Sản xuất xe máy điện hiệu năng cao pin sạc nhanh,Giảm ô nhiễm khí thải đô thị và tiết kiệm chi phí nhiên liệu,2,45,Nguyễn Bá Cảnh Sơn,0905123456,contact@dat.bike,2022
2,Công ty CP EM&AI,Số 123 Nguyễn Văn Linh - Hải Châu - Đà Nẵng,https://emandai.net,/logos/emandai.png,Trí tuệ nhân tạo (AI),Nền tảng Voicebot AI trợ lý ảo thông minh cho doanh nghiệp,Tự động hóa chăm sóc khách hàng và giải phóng nhân lực trực tổng đài,3,30,Lê Ngọc Trí,0905888999,info@emandai.net,2023`;

      case 'support_organizations':
        return `STT,Tên tổ chức,Địa chỉ,Thông tin về tổ chức
1,Trung tâm Hỗ trợ Khởi nghiệp Đổi mới sáng tạo Đà Nẵng,Số 48 Phan Đình Phùng - Quận Hải Châu - Đà Nẵng,Đơn vị sự nghiệp công lập hỗ trợ ươm tạo kết nối quỹ đầu tư và đào tạo khởi nghiệp
2,Vườn ươm Doanh nghiệp Đà Nẵng (DNES),Số 31 Trần Phú - Quận Hải Châu - Đà Nẵng,Vườn ươm đối tác công tư đầu tiên của miền Trung với chương trình Surf và tăng tốc khởi nghiệp`;

      case 'startup_projects':
        return `STT,Tên dự án,Lĩnh vực khởi nghiệp,Sản phẩm giải quyết vấn đề,Người đứng đầu,Dự án được ươm tạo từ tổ chức (Nếu có/Tự hình thành dự án),Năm bắt đầu khởi nghiệp
1,Hệ thống trạm sạc xe điện thông minh SmartCharge,Năng lượng xanh,Mạng lưới trạm sạc nhanh đa năng tích hợp thanh toán qua App,Phạm Minh Tuấn,Vườn ươm Doanh nghiệp Đà Nẵng (DNES),2024
2,Robot lau pin mặt trời tự động SolarClean,Tự động hóa,Làm sạch các tấm pin trên mái nhà xưởng không dùng nước,Đỗ Hoàng Long,Trung tâm Đổi mới sáng tạo Đà Nẵng,2024`;

      case 'startup_ideas':
        return `STT,Tên ý tưởng,Lĩnh vực khởi nghiệp,Người đứng đầu,Giáo viên hướng dẫn
1,Vật liệu đóng gói tự phân hủy từ vỏ tôm phế phụ phẩm thủy sản,Công nghệ vật liệu mới,Lê Thị Thu Thảo,TS. Nguyễn Đắc Lực
2,Ứng dụng vi tảo xử lý nước thải dệt nhuộm và thu hồi sinh khối,Môi trường & Sinh học,Trần Anh Khoa,PGS.TS. Vũ Đình Thành`;

      case 'wards':
        return `STT,Tên xã/phường/đặc khu,Địa chỉ,Thông tin liên hệ,Website
1,Phường Thạch Thang,Số 12 Quang Trung - Quận Hải Châu - Đà Nẵng,0236.3822123,https://thachthang.danang.gov.vn
2,Xã Hòa Tiến,Huyện Hòa Vang - TP Đà Nẵng,0236.3789123,https://hoatien.danang.gov.vn
3,Đặc khu Hoàng Sa,Huyện Hoàng Sa - TP Đà Nẵng,0236.3899123,https://hoangsa.danang.gov.vn`;

      case 'universities':
        return `STT,Tên trường,Thuộc xã/ phường,Địa chỉ,Thông tin liên hệ,Website
1,Trường Đại học Bách Khoa - Đại học Đà Nẵng,Phường Hòa Khánh Bắc,Số 54 Nguyễn Lương Bằng - Quận Liên Chiểu - Đà Nẵng,0236.3842308,https://dut.udn.vn
2,Trường Đại học Kinh tế - Đại học Đà Nẵng,Phường Mỹ An,Số 71 Ngũ Hành Sơn - Quận Ngũ Hành Sơn - Đà Nẵng,0236.3836169,https://due.udn.vn
3,Trường Cao đẳng Công nghệ Thông tin Đà Nẵng,Phường Khuê Trung,Khu Đô thị ĐH Đà Nẵng - Cẩm Lệ - Đà Nẵng,0236.3667117,https://cit.udn.vn`;

      case 'featured_startups':
        return `STT,Tên doanh nghiệp,Tên dự án,Người đại diện dự án,Địa chỉ,Thông tin liên hệ,Website,Thuộc xã/ phường
1,Công ty CP EM&AI,Nền tảng Voicebot AI trợ lý ảo thông minh,Lê Ngọc Trí,Tầng 5 Tòa nhà DNC - Hải Châu - Đà Nẵng,0905888999,https://emandai.net,Phường Thạch Thang
2,Công ty CP Dat Bike Việt Nam,Xe máy điện thông minh hiệu năng cao Weaver++,Nguyễn Bá Cảnh Sơn,Số 48 Phan Đình Phùng - Hải Châu - Đà Nẵng,0905123456,https://dat.bike,Phường Hải Châu 1`;

      default:
        return `code,title,field,ownerName,description\nTEST-01,Dữ liệu mẫu 1,Công nghệ thông tin,Trung tâm CNTT,Mô tả chi tiết nội dung mẫu 1\nTEST-02,Dữ liệu mẫu 2,Nông nghiệp công nghệ cao,Hợp tác xã xanh,Mô tả chi tiết nội dung mẫu 2`;
    }
  };

  const handleLoadSample = () => {
    setRawText(getSampleCsv(selectedModule));
    setImportResult(null);
  };

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header row
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
      rows.push(obj);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        const rows = parseCsvText(text);
        setParsedRows(rows);
        setImportResult(null);
      }
    };
    reader.readAsText(file, 'utf-8');
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
        <div className="sm:col-span-2">
          <label className="block text-slate-700 font-bold mb-1">
            1. Chọn phân hệ dữ liệu cần nhập hàng loạt:
          </label>
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value as ModuleType);
              setImportResult(null);
              setParsedRows([]);
            }}
            className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-teal-700 cursor-pointer"
          >
            {Object.entries(MODULE_NAMES).map(([mod, name]) => (
              <option key={mod} value={mod}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <a
            href={api.getTemplateUrl(selectedModule)}
            download={`Mau_${selectedModule}.csv`}
            className="w-full h-9 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            title="Tải tệp mẫu CSV/Excel chuẩn với đầy đủ các trường yêu cầu"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Mẫu Excel/CSV chuẩn</span>
          </a>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="w-full h-9 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            <span>Nạp nội dung mẫu</span>
          </button>
        </div>
      </div>

      {/* File Upload and CSV Input Area */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-slate-700 font-bold">
            2. Tải tệp từ máy tính hoặc dán dữ liệu CSV:
          </label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn tệp tải lên (.csv, .txt)</span>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handlePreview}
              disabled={!rawText.trim()}
              className="px-3.5 py-1.5 bg-teal-800 disabled:opacity-50 hover:bg-teal-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <span>Phân tích dữ liệu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán dữ liệu CSV có dòng tiêu đề chuẩn (hoặc bấm nút 'Chọn tệp tải lên' ở trên)..."
          className="w-full p-3 font-mono text-[11px] bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-inner"
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
