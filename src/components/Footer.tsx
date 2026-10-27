import React from 'react';
import { SystemConfig } from '../types';
import { ShieldCheck, Mail, Phone, MapPin, Globe } from 'lucide-react';

interface FooterProps {
  config: SystemConfig;
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Portal Name & Agency */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                K
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                {config.portalName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Cổng dữ liệu tập trung thống nhất kết nối và quản lý các nhiệm vụ KH&CN, sáng kiến có tác động thành phố, mạng lưới chuyên gia, tổ chức nghiên cứu và hệ sinh thái khởi nghiệp đổi mới sáng tạo.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="font-medium text-slate-200">Cơ quan chủ quản:</div>
              <div>{config.governingAgency}</div>
            </div>
          </div>

          {/* Col 2: Contact Info */}
          <div className="space-y-2.5 text-xs text-slate-400">
            <div className="text-sm font-semibold text-white tracking-tight mb-2">Thông tin liên hệ</div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>{config.contactAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{config.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{config.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{config.websiteDomain}</span>
            </div>
          </div>

          {/* Col 3: Principles & Compliance */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="text-sm font-semibold text-white tracking-tight mb-2">Tiêu chuẩn & Nguyên tắc</div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Dữ liệu xác thực, bảo mật quyền riêng tư cá nhân theo Nghị định 13/2023/NĐ-CP.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Phân định minh bạch giữa phạm vi đề xuất và phạm vi đã công nhận cấp thành phố.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Liên kết dữ liệu đa chiều, tra cứu công khai không rào cản.</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {config.governingAgency}. Tất cả quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-6">
            <span>Chính sách dữ liệu mở</span>
            <span aria-hidden="true">·</span>
            <span>Điều khoản khai thác</span>
            <span aria-hidden="true">·</span>
            <span>Bản quyền thông tin</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
