# CỔNG DỮ LIỆU TỔNG HỢP KH&CN, ĐỔI MỚI SÁNG TẠO VÀ KHỞI NGHIỆP THÀNH PHỐ ĐÀ NẴNG
ỦY BAN NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG — SỞ KHOA HỌC VÀ CÔNG NGHỆ

Hệ thống quản lý, tích hợp, tra cứu và khai thác dữ liệu tập trung phục vụ công tác quản lý nhà nước, nghiên cứu khoa học, thương mại hóa công nghệ và phát triển hệ sinh thái khởi nghiệp đổi mới sáng tạo (ĐMST).

---

## 1. Kiến trúc hệ thống

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
  - Thiết kế đáp ứng (Responsive) hoàn toàn trên mọi độ phân giải: Mobile (360px - 430px), Tablet (768px - 1024px) và Desktop (1280px - 1920px).
  - Phân loại rõ ràng 5 nhóm cơ sở dữ liệu lớn và 17 phân hệ dữ liệu thành phần.
  - Bảng chỉ số Dashboard thời gian thực, bộ lọc tìm kiếm nâng cao, phân trang và tải tệp hồ sơ trích xuất.
- **Backend:** Node.js, Express, Middleware phân quyền RBAC đa cấp độ, Cookie-parser.
- **Bảo mật & Toàn vẹn dữ liệu:**
  - Token phiên làm việc ký mật mã học **HMAC-SHA256** với cơ chế so sánh hằng số thời gian (`crypto.timingSafeEqual`).
  - Chống mạo danh vai trò (`user_role`, `x-user-role`, `x-user-id` không thể tự nâng quyền).
  - Mã hóa mật khẩu an toàn theo chuẩn **PBKDF2 (SHA-512 + Salt ngẫu nhiên)**; tự động nâng cấp bảo mật cho tài khoản kế thừa; che giấu tuyệt đối password hash trong toàn bộ luồng phản hồi API.
  - Cơ chế lưu trữ nguyên tử (**Atomic Writes**): ghi qua tệp đệm tạm thời `.tmp` rồi hoán đổi (`renameSync`), triệt tiêu hoàn toàn nguy cơ hỏng tệp khi mất điện hay tiến trình dừng đột ngột.
  - Khử mã độc XSS, kiểm tra whitelist 17 phân hệ, phòng chống tấn công chèn lệnh công thức trong tệp CSV (**CSV Formula Injection / DDE**).
  - Khóa tài khoản tạm thời chống dò mật khẩu brute-force.

---

## 2. Danh mục 5 nhóm cơ sở dữ liệu & 17 phân hệ chuẩn hóa

1. **Nhiệm vụ, đề tài KH&CN** (`science_tasks`)
2. **Sáng kiến có tác dụng, ảnh hưởng đối với thành phố** (`initiatives`)
3. **Sáng chế & Sở hữu trí tuệ** (`patents`)
4. **Chuyên gia & Nhà khoa học** (`experts`)
   - Tích hợp trường dữ liệu Bài báo & Công bố khoa học (`publications`)
5. **Dữ liệu Hệ sinh thái khởi nghiệp ĐMST:**
   - Doanh nghiệp khởi nghiệp (`startups`)
   - Dự án khởi nghiệp (`startup_projects`)
   - Ý tưởng khởi nghiệp (`startup_ideas`)
   - Nhà đầu tư (`investors`)
   - Quỹ đầu tư (`investment_funds`)
   - Tổ chức hỗ trợ, Vườn ươm (`support_organizations`)
   - Chương trình hỗ trợ & Cơ hội hỗ trợ (`programs`)
   - Tổ chức KH&CN, Viện trường (`organizations`)
   - Công nghệ & Kết quả nghiên cứu (`technologies`)
   - Nhu cầu kết nối & Đặt hàng thành phố (`collaboration_needs`)
   - Thiết bị & Phòng thí nghiệm trọng điểm (`lab_equipments`)
   - Chính sách, Văn bản & Quy định KH&CN (`policies`)

---

## 3. Ma trận phân quyền người dùng (RBAC)

Hệ thống thiết lập 9 vai trò người dùng chuẩn theo quy định:
- `super_admin`: Quản trị cấp cao toàn quyền cấu hình, tài khoản và phân hệ.
- `system_admin`: Quản trị viên hệ thống, quản lý dữ liệu và biểu mẫu.
- `agency_leader`: Lãnh đạo cơ quan (Sở KH&CN), phê duyệt chính thức sáng kiến và đề tài.
- `data_officer`: Cán bộ quản lý dữ liệu, kiểm tra sơ bộ và biên tập hồ sơ.
- `evaluator_expert`: Chuyên gia thẩm định chuyên môn.
- `partner_officer`: Cán bộ đơn vị phối hợp (Viện, Trường, Quận, Huyện).
- `org_representative`: Đại diện doanh nghiệp ĐMST.
- `expert_user`: Chuyên gia / nhà khoa học cập nhật hồ sơ nghiên cứu.
- `investor_user`: Nhà đầu tư / Quỹ đầu tư.
- `public_user`: Khách vãng lai, công dân tra cứu công khai và gửi sáng kiến trực tuyến.

---

## 4. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- Node.js >= 20.x
- npm hoặc bun

### Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
# Máy chủ khởi động tại http://localhost:3000
```

### Kiểm tra cú pháp và loại dữ liệu (Type-check)
```bash
npm run lint
```

### Đóng gói ứng dụng (Production Build)
```bash
npm run build
```

### Khởi chạy dịch vụ môi trường Production
```bash
npm start
```

---

## 5. Bộ kiểm thử nghiệm thu Section XVI (18/18 Tiêu chí)

Hệ thống tích hợp sẵn bộ kiểm thử nghiệm thu tự động bao phủ 18 tình huống thực tế:
1. Tạo, sửa, xem, tìm kiếm và lọc từng loại dữ liệu.
2. Liên kết dữ liệu đa chiều 2 chiều giữa các thực thể.
3. Xác thực tài khoản và ma trận phân quyền 9 vai trò.
4. Kiểm tra middleware bảo vệ endpoint API ở backend.
5. Ngăn người dùng không có quyền truy cập dữ liệu nội bộ.
6. Tiếp nhận, thẩm định, phê duyệt và bổ sung hồ sơ theo quy trình.
7. Nhập dữ liệu CSV/Excel và xử lý tệp sai cấu trúc.
8. Phát hiện và ngăn chặn dữ liệu trùng lặp.
9. Xuất dữ liệu CSV an toàn, chống chèn công thức độc hại.
10. Ghi nhật ký truy vết hệ thống (Audit Logs).
11. Đảm bảo giao diện đa thiết bị (Responsive Mobile & Desktop).
12. Sao lưu (Backup) và phục hồi (Restore) snapshot toàn vẹn.
13. Hiệu năng tính toán chỉ số thống kê tổng hợp (< 50ms).
14. Xử lý ngoại lệ an toàn và mã lỗi chuẩn HTTP.
15. Tự động công khai bản ghi sau khi được phê duyệt chính thức.
16. Tính toàn vẹn và không đếm trùng số liệu thống kê.
17. Bảo mật phiên làm việc và chống mạo danh vai trò (Anti-tampering).
18. Cơ chế lưu trữ nguyên tử (Atomic Writes) và độ bền dữ liệu.

Thực thi kiểm thử thông qua giao diện Quản trị (`/admin` → tab Kiểm thử) hoặc qua API:
```bash
POST /api/test-suite/run
Authorization: Bearer <ADMIN_SESSION_TOKEN>
```
