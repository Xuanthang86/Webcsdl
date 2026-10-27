import React, { useState } from 'react';
import { BaseEntity } from '../types';
import { api } from '../services/api';
import { X, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface ConnectionModalProps {
  entity: BaseEntity | null;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ entity, onClose }) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderOrg, setSenderOrg] = useState('');
  const [proposedCapability, setProposedCapability] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.sendConnection({
        needId: entity.id,
        senderName,
        senderEmail,
        senderPhone,
        senderOrg,
        proposedCapability,
        message
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi gửi yêu cầu kết nối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
              Kết nối & Hợp tác đa chiều
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Gửi yêu cầu kết nối tới: {entity.title}
            </h2>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Mã đối tượng: {entity.code} · Chủ quản: {entity.ownerName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="text-base font-bold text-slate-900">Yêu cầu kết nối đã được gửi thành công!</div>
            <p className="text-slate-600 max-w-sm mx-auto text-xs">
              Thông tin đề xuất hợp tác đã được chuyển đến đầu mối quản lý đối tượng và được ghi nhận trong nhật ký hệ thống.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên người gửi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cơ quan / Doanh nghiệp công tác
                </label>
                <input
                  type="text"
                  placeholder="Công ty CP / Viện nghiên cứu..."
                  value={senderOrg}
                  onChange={(e) => setSenderOrg(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email liên hệ <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@domain.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0987.xxx.xxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Năng lực đáp ứng hoặc hình thức đề xuất hợp tác
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Có xưởng chế tạo, nguồn vốn đầu tư, chuyên môn phản biện..."
                value={proposedCapability}
                onChange={(e) => setProposedCapability(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nội dung đề xuất hợp tác / trao đổi chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Trình bày cụ thể nhu cầu kết nối, đề xuất chuyển giao hoặc phương thức triển khai..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
