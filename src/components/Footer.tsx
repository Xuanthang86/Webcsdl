import React from 'react';
import { SystemConfig } from '../types';
import { ShieldCheck, Mail, Phone, MapPin, Globe } from 'lucide-react';

interface FooterProps {
  config: SystemConfig;
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 sm:gap-8 mb-6 sm:mb-8">
          
          {/* Col 1: Portal Name & Agency */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                K
              </div>
              <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                {config.portalName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Cổng dữ liệu tập trung thống nhất kết nối và quản lý các nhiệm vụ KH&CN, sáng kiến có tác động thành phố, mạng lưới chuyên gia, tổ chức nghiên cứu và hệ sinh thái khởi nghiệp đổi mới sáng tạo.
            </p>
            <div className="text-xs text-slate-400">
              <span className="font-medium text-slate-200">Cơ quan chủ quản:</span> <span>ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ</span>
            </div>
          </div>

          {/* Col 2: Contact Info */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-1">Thông tin liên hệ</div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span>{config.contactAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{config.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{config.contactEmail}</span>
            </div>
          </div>

          {/* Col 3: Principles & Compliance */}
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-1">Tiêu chuẩn & Nguyên tắc</div>
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Dữ liệu xác thực, bảo mật quyền riêng tư cá nhân theo Nghị định 13/2023/NĐ-CP.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Phân định minh bạch giữa phạm vi đề xuất và phạm vi đã công nhận cấp thành phố.</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright line: centered, with policy links directly underneath and centered */}
        <div className="pt-5 border-t border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-xs">
          <div className="text-slate-300 font-medium leading-relaxed">
            © 2026 ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG - SỞ KHOA HỌC VÀ CÔNG NGHỆ. Tất cả quyền được bảo lưu.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-500">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Chính sách dữ liệu mở</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Điều khoản khai thác</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Bản quyền thông tin</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
