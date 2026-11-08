import React, { useState } from 'react';
import { api } from '../../services/api';
import { CheckCircle2, XCircle, Play, RotateCcw, ShieldCheck, Clock } from 'lucide-react';

export const TestSuiteView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testReport, setTestReport] = useState<{
    timestamp: string;
    totalTests: number;
    passedTests: number;
    results: Array<{ id: number; name: string; passed: boolean; message: string; durationMs: number }>;
  } | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setTestReport(null);
    try {
      const data = await api.runAcceptanceTests();
      setTestReport(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi chạy kịch bản kiểm thử');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-semibold flex items-center gap-2">
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Đảm bảo chất lượng phần mềm & Nghiệm thu
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Bộ kiểm thử nghiệm thu & an toàn bảo mật (Section XVI acceptance & security test suite)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thực thi tự động 18 kịch bản kiểm định toàn vẹn nghiệp vụ, phân quyền, workflow, chống mạo danh vai trò và lưu trữ nguyên tử
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          {isRunning ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Đang thực thi các kịch bản...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Chạy toàn bộ kịch bản nghiệm thu & bảo mật</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Scorecard */}
      {testReport && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${
              testReport.passedTests === testReport.totalTests ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {testReport.passedTests}/{testReport.totalTests}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {testReport.passedTests === testReport.totalTests 
                  ? `TẤT CẢ ${testReport.totalTests} KỊCH BẢN ĐÃ ĐẠT TIÊU CHUẨN NGHIỆM THU & BẢO MẬT` 
                  : 'MỘT SỐ KỊCH BẢN CẦN KIỂM TRA LẠI'}
              </div>
              <div className="text-[11px] text-slate-500">
                Thời điểm kiểm định: {new Date(testReport.timestamp).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono">
            Tỷ lệ đạt chuẩn: <span className="font-bold text-emerald-700 text-sm">{(testReport.totalTests > 0 ? (testReport.passedTests / testReport.totalTests) * 100 : 0).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Test List Table */}
      <div className="space-y-2">
        <div className="font-semibold text-slate-800">
          Danh mục tình huống kiểm thử bắt buộc theo tài liệu thiết kế & an toàn thông tin:
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {!testReport && (
            <div className="p-6 text-center text-slate-500 bg-slate-50">
              Chưa chạy kiểm thử. Nhấn “Chạy toàn bộ kịch bản nghiệm thu & bảo mật” để bắt đầu đánh giá.
            </div>
          )}
          {testReport && testReport.results.length === 0 && (
            <div className="p-6 text-center text-amber-700 bg-amber-50">
              Máy chủ chưa trả về kết quả kiểm thử. Vui lòng chạy lại hoặc kiểm tra kết nối.
            </div>
          )}
          {(testReport?.results || []).map((t) => (
            <div key={t.id} className="p-3 bg-white hover:bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.message}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="font-mono text-[11px] text-slate-400">
                  {t.durationMs}ms
                </span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  t.passed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {t.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
