import React, { useState } from 'react';
import { ModuleType } from '../types';
import { api } from '../services/api';
import { X, CheckCircle, Send, FileUp, Sparkles, Building, User, Info } from 'lucide-react';

interface PublicSubmitModalProps {
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export const PublicSubmitModal: React.FC<PublicSubmitModalProps> = ({ onClose, onSuccess }) => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>('initiatives');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [field, setField] = useState('Công nghệ thông tin và Truyền thông');
  const [ownerName, setOwnerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [solutionDetails, setSolutionDetails] = useState('');
  const [proposedScope, setProposedScope] = useState<'Cấp đơn vị' | 'Cấp thành phố'>('Cấp thành phố');
  const [costSavings, setCostSavings] = useState('');
  const [investmentCost, setInvestmentCost] = useState('');
  const [beneficiaryCount, setBeneficiaryCount] = useState('');
  const [confirmTruthful, setConfirmTruthful] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTruthful) {
      setErrorMsg('Vui lòng tích cam kết tính chính xác của thông tin nộp.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: any = {
        title,
        field,
        ownerName,
        publicEmail: contactEmail,
        publicPhone: contactPhone,
        description,
        problemSolved,
        solutionDetails,
        proposedScope,
        costSavings: Number(costSavings) || 0,
        investmentCost: Number(investmentCost) || 0,
        beneficiaryCount: Number(beneficiaryCount) || 0,
        source: 'Nộp trực tuyến qua Cổng công khai',
        authors: [ownerName],
        status: 'submitted',
        verificationStatus: 'pending',
        publicityLevel: 'restricted'
      };

      const result = await api.createRecord(selectedModule, payload);
      onSuccess(result.code);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi gửi hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 z-10">
          <div>
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Dịch vụ công trực tuyến
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Nộp Hồ Sơ Đề Xuất & Sáng Kiến Đổi Mới Sáng Tạo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator (Clean unboxed style) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
          <span className={step === 1 ? 'text-teal-900 font-bold' : ''}>1. Thông tin chung & Chủ thể</span>
          <span aria-hidden="true">→</span>
          <span className={step === 2 ? 'text-teal-900 font-bold' : ''}>2. Nội dung giải pháp</span>
          <span aria-hidden="true">→</span>
          <span className={step === 3 ? 'text-teal-900 font-bold' : ''}>3. Hiệu quả & Cam kết</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại hình hồ sơ đăng ký <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value as ModuleType)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                >
                  <option value="initiatives">Sáng kiến có tác động thành phố (Đề xuất công nhận)</option>
                  <option value="science_tasks">Đề xuất đặt hàng / Nhiệm vụ KH&CN cấp thành phố</option>
                  <option value="startup_ideas">Ý tưởng khởi nghiệp & Đổi mới sáng tạo</option>
                  <option value="collaboration_needs">Đăng nhu cầu kết nối chuyển giao công nghệ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên sáng kiến / Nhiệm vụ / Ý tưởng đề xuất <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ứng dụng trí tuệ nhân tạo tối ưu hóa chu kỳ đèn tín hiệu giao thông..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lĩnh vực chuyên môn <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  >
                    <option value="Công nghệ thông tin và Truyền thông">Công nghệ thông tin và Truyền thông</option>
                    <option value="Y tế, Sức khỏe cộng đồng & Dược phẩm">Y tế, Sức khỏe cộng đồng & Dược phẩm</option>
                    <option value="Nông nghiệp Công nghệ cao">Nông nghiệp Công nghệ cao</option>
                    <option value="Môi trường, Vật liệu & Kinh tế tuần hoàn">Môi trường, Vật liệu & Kinh tế tuần hoàn</option>
                    <option value="Cải cách hành chính & Chuyển đổi số">Cải cách hành chính & Chuyển đổi số</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tác giả / Cơ quan đề xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Họ tên tác giả hoặc tên tổ chức"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email liên hệ tiếp nhận phản hồi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912.xxx.xxx"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!title || !ownerName || !contactEmail}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-teal-800 disabled:opacity-50 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                >
                  Tiếp tục bước 2
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tóm tắt sự cần thiết & Vấn đề thực tế cần giải quyết <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả thực trạng khó khăn, bất cập hoặc vấn đề xã hội cần giải quyết..."
                  value={problemSolved}
                  onChange={(e) => setProblemSolved(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung giải pháp & Điểm mới so với các giải pháp hiện có <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Trình bày chi tiết giải pháp kỹ thuật, quy trình công nghệ hoặc mô hình tổ chức..."
                  value={solutionDetails}
                  onChange={(e) => setSolutionDetails(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phạm vi ảnh hưởng đề xuất
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={proposedScope === 'Cấp thành phố'}
                      onChange={() => setProposedScope('Cấp thành phố')}
                    />
                    <span>Cấp thành phố (Áp dụng rộng rãi trên toàn địa bàn)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={proposedScope === 'Cấp đơn vị'}
                      onChange={() => setProposedScope('Cấp đơn vị')}
                    />
                    <span>Cấp đơn vị / Cơ sở</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={!problemSolved || !solutionDetails}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-teal-800 disabled:opacity-50 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                >
                  Tiếp tục bước 3
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chi phí tiết kiệm ước tính (VND/năm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 500000000"
                    value={costSavings}
                    onChange={(e) => setCostSavings(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kinh phí đầu tư thực hiện (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 100000000"
                    value={investmentCost}
                    onChange={(e) => setInvestmentCost(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số người/đơn vị hưởng lợi
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 5000"
                    value={beneficiaryCount}
                    onChange={(e) => setBeneficiaryCount(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Legal confirmation checkbox */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="confirm"
                    checked={confirmTruthful}
                    onChange={(e) => setConfirmTruthful(e.target.checked)}
                    className="mt-0.5 rounded text-teal-800 focus:ring-teal-700"
                  />
                  <label htmlFor="confirm" className="text-slate-700 leading-relaxed cursor-pointer select-none">
                    Tôi xin cam đoan toàn bộ thông tin kê khai trên là hoàn toàn trung thực, chính xác và chịu trách nhiệm trước pháp luật về quyền tác giả, sở hữu trí tuệ của giải pháp/nhiệm vụ này.
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !confirmTruthful}
                  className="px-6 py-2 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang gửi hồ sơ...' : 'Nộp hồ sơ chính thức'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
