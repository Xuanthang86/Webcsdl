# Vận hành, giám sát và ứng phó sự cố – WebCSDL KHCN

Tài liệu này là quy trình vận hành chuẩn cho website production:

- Website: https://khcn.xuanthang.io.vn
- Worker: `webcsdlkhcn`
- D1: `khcn-portal-db`
- Mã nguồn: https://github.com/Xuanthang86/Webcsdl (chỉ nhánh `main`)

## 1. Nguyên tắc quyền hạn và bảo vệ dữ liệu

1. AI SRE và đơn vị giám sát chỉ được cấp quyền tối thiểu cần thiết. Không cấp Super Admin, Cloudflare Administrator, quyền ghi/xóa D1 hoặc quyền quản lý secrets.
2. AI được đọc incident, log, metrics, traces, trạng thái monitor và lịch sử commit để điều tra. Không được tự ý sửa dữ liệu production, chạy SQL ghi/xóa, restore backup, thay đổi DNS/WAF/secrets, deploy Worker hoặc merge code.
3. Mọi sửa đổi code phải được người phụ trách xem xét. Tôn trọng quy ước hiện tại: nhánh `main`; không tự tạo nhánh/PR nếu chưa được chủ hệ thống chấp thuận.
4. Không đưa mật khẩu, session cookie, token, API key, nội dung hồ sơ cá nhân hoặc dữ liệu D1 vào log, prompt AI, issue hay báo cáo incident.
5. Không kết luận đã khắc phục chỉ vì API trả 200 một lần. Cần kiểm tra monitor phục hồi, `/health` trả 200 và không tái diễn trong thời gian quan sát.

## 2. Better Stack – monitors cần tạo

Trong Better Stack → Uptime → Monitors, tạo tối thiểu hai HTTP status monitors:

| Tên monitor | URL | Kiểm tra |
|---|---|---|
| WebCSDL – Trang chủ | `https://khcn.xuanthang.io.vn/` | HTTP 2xx, xác thực SSL |
| WebCSDL – Worker và D1 | `https://khcn.xuanthang.io.vn/health` | HTTP 2xx; endpoint tự trả 503 nếu D1 không kết nối |

Cấu hình khuyến nghị:
- Chu kỳ kiểm tra: 60 giây (hoặc tần suất ngắn hơn nếu gói dịch vụ hỗ trợ và ngân sách cho phép).
- Bật xác thực chứng chỉ SSL.
- Bật cảnh báo SSL sắp hết hạn trước 14 ngày và tên miền trước 30 ngày nếu gói dịch vụ hỗ trợ.
- Chọn ít nhất hai vùng kiểm tra, ưu tiên Asia và một vùng độc lập khác.
- Cấu hình thông báo qua push và email; với monitor trọng yếu, bật SMS/cuộc gọi.
- Thiết lập escalation: báo người phụ trách chính trước, sau đó chuyển người dự phòng nếu không xác nhận. Cần có người dự phòng thật thì mới bảo đảm trực 24/7.

Better Stack tự tạo incident khi monitor không đạt điều kiện và có thể gửi cuộc gọi, SMS, email, push theo lịch trực/escalation policy. Không nên chỉ dựa vào email cho sự cố nghiêm trọng.

## 3. Better Stack AI SRE – cấu hình trợ lý AI

Trong Better Stack → Incidents → Integrations → AI SRE:

1. Tạo AI SRE integration.
2. Bật **Investigate new incidents automatically with AI SRE**.
3. Kết nối repository GitHub `Xuanthang86/Webcsdl` với quyền đọc tối thiểu.
4. Ban đầu chỉ bật **All read-only tools**. Không bật công cụ merge/deploy, sửa Cloudflare, truy cập D1 hoặc thay đổi dữ liệu.
5. Không bật công cụ tạo PR tự động nếu chưa có chấp thuận riêng, do quy trình dự án hiện chỉ sử dụng nhánh `main`.
6. AI SRE cần ghi kết quả điều tra vào timeline incident: mức độ nghiêm trọng, thời điểm bắt đầu, phạm vi ảnh hưởng, bằng chứng log/metrics/monitor, thay đổi gần nhất, nguyên nhân khả dĩ, biện pháp giảm thiểu an toàn, việc cần người quản trị thực hiện và trạng thái xác minh.

### Chỉ dẫn hệ thống đề xuất cho AI SRE

Dán nội dung sau vào phần Custom system prompt của AI SRE:

> Bạn là trợ lý SRE giám sát hệ thống WebCSDL KHCN & KNĐMST TP Đà Nẵng. Website production là https://khcn.xuanthang.io.vn; backend là Cloudflare Worker webcsdlkhcn; dữ liệu production nằm trong D1 khcn-portal-db; mã nguồn là GitHub Xuanthang86/Webcsdl, nhánh main.
>
> Ưu tiên cao nhất là tính sẵn sàng, an toàn thông tin và toàn vẹn dữ liệu. Khi có incident, tự động điều tra bằng các nguồn dữ liệu được cấp quyền đọc: monitor, log, metrics, traces, lịch sử triển khai và GitHub. Xác minh sự cố từ nhiều tín hiệu, không suy đoán khi thiếu bằng chứng.
>
> Tuyệt đối không yêu cầu hoặc tiết lộ secrets, mật khẩu, cookie, token, dữ liệu cá nhân hoặc nội dung bản ghi D1. Không chạy lệnh SQL ghi/xóa; không restore hoặc sửa D1 production; không thay đổi DNS, WAF, Worker secrets, quyền truy cập hay cấu hình Cloudflare; không deploy, merge hoặc push code.
>
> Không tự ý thay đổi giao diện, nội dung, chức năng đang hoạt động ổn định. Không tạo nhánh GitHub hoặc PR nếu chưa được chủ hệ thống cho phép. Nếu cần sửa code, trình bày nguyên nhân, file/vị trí bị ảnh hưởng, phương án thay đổi nhỏ nhất, rủi ro hồi quy và cách kiểm thử để chủ hệ thống phê duyệt.
>
> Trước mọi đề xuất can thiệp dữ liệu: yêu cầu xác nhận bản sao lưu gần nhất, kiểm tra khả năng đọc và tính toàn vẹn bản sao lưu, ưu tiên thử phục hồi trên môi trường riêng. Không phục hồi trực tiếp production nếu chưa có phê duyệt rõ ràng.
>
> Mỗi incident phải có báo cáo ngắn gọn: mức độ P1/P2/P3, dịch vụ bị ảnh hưởng, thời gian, bằng chứng, nguyên nhân đã xác nhận/chưa xác nhận, hành động an toàn có thể thực hiện, người cần can thiệp, tiêu chí xác minh phục hồi và khuyến nghị ngăn tái diễn. Chỉ đánh dấu đã khắc phục khi monitor và health check trở lại bình thường, dữ liệu không bị ảnh hưởng và có thời gian quan sát đủ để loại trừ tái phát.

## 4. Đẩy log vận hành sang Better Stack

Worker đã hỗ trợ gửi các sự kiện vận hành đã lọc thông tin nhạy cảm nếu được cấu hình hai secret:

- `BETTERSTACK_SOURCE_TOKEN`: Source token của nguồn log Better Stack.
- `BETTERSTACK_INGESTING_HOST`: Ingesting host do Better Stack cấp (chỉ hostname hoặc HTTPS URL của Better Stack).

Trong Better Stack → Telemetry → Sources, tạo source dành cho WebCSDL/Cloudflare Worker, sau đó lấy Source token và Ingesting host.

Trong Cloudflare → Workers & Pages → webcsdlkhcn → Settings → Variables and Secrets, thêm hai giá trị trên dưới dạng secrets/variables phù hợp. Không đưa chúng vào GitHub, mã nguồn, file `wrangler.jsonc` hoặc gửi qua hội thoại.

Worker chỉ gửi một số sự kiện đã chuẩn hóa:
- D1 health probe thất bại.
- Tài khoản bị khóa do vượt ngưỡng đăng nhập sai.
- Lỗi Worker không xử lý được.

Log không chứa username, mật khẩu, IP người dùng, session cookie, request body, dữ liệu hồ sơ hay thông báo lỗi SQL thô. Nếu Better Stack không cấu hình hoặc không sẵn sàng, luồng xử lý yêu cầu website vẫn tiếp tục; lỗi gửi log không được làm hỏng chức năng chính.

Cloudflare Workers Observability cũng được bật trong Wrangler config để hỗ trợ tra cứu log tại Cloudflare.

## 5. Cloudflare WAF – giới hạn truy cập theo IP

Thực hiện trong Cloudflare Dashboard → Security → WAF → Rate limiting rules. Các quy tắc khởi điểm:

### Quy tắc 1 – Đăng nhập

- Tên: `WebCSDL - Login rate limit`
- Expression: `http.request.uri.path eq "/api/auth/login"`
- Counting characteristic: IP
- Threshold: 5 requests / 60 seconds / IP
- Action: Managed Challenge (nếu gói hỗ trợ); nếu không, dùng Block với thời gian chặn ngắn và kiểm tra kỹ tác động người dùng hợp lệ.

### Quy tắc 2 – Bootstrap quản trị viên lần đầu

- Tên: `WebCSDL - Bootstrap rate limit`
- Expression: `http.request.uri.path eq "/api/auth/bootstrap-admin"`
- Counting characteristic: IP
- Threshold: 3 requests / 600 seconds / IP
- Action: Block trong 10 phút.

Lưu ý: Trên gói Free, biểu thức rate limiting có thể chỉ hỗ trợ trường Path/Verified Bot; vì vậy rule dùng path và đếm theo IP, không giả định có thể lọc riêng HTTP method. Không áp dụng giới hạn rộng cho toàn bộ `/api/*`, vì có thể làm gián đoạn tra cứu, tải dữ liệu và chức năng người dùng hợp lệ. Chưa thêm rule cho endpoint tiếp nhận hồ sơ công khai khi chưa xác định chính xác route và lưu lượng hợp lệ.

Sau khi tạo từng rule, dùng Security Events để kiểm tra tác động và điều chỉnh ngưỡng trước khi tăng mức chặn.

## 6. Sao lưu, phục hồi và bàn giao

- Duy trì bản sao lưu D1 định kỳ, lưu tối thiểu một bản ngoài môi trường production và giới hạn người được truy cập.
- Sau mỗi lần sao lưu, xác nhận tệp có thể đọc, dung lượng hợp lý, thời điểm và checksum; không chỉ dựa vào thông báo “backup thành công”.
- Thử phục hồi trên D1 staging riêng theo lịch. Không thử restore trên D1 production.
- Trước khi cập nhật schema hoặc thay đổi dữ liệu lớn, bắt buộc có backup mới và kế hoạch rollback đã kiểm thử.
- Nhật ký bàn giao mỗi incident phải có: ID incident, thời gian, người/AI tiếp nhận, mức độ, bằng chứng, thay đổi đã thực hiện, kết quả kiểm thử, trạng thái backup, trạng thái phục hồi và người phê duyệt.
- Duy trì ít nhất một người dự phòng có quyền can thiệp khẩn cấp được cấp riêng, MFA và lưu trong password manager của tổ chức. Không chia sẻ tài khoản Super Admin.

## 7. Quy trình xử lý incident

1. **Phát hiện:** Better Stack monitor hoặc AI SRE ghi nhận sự cố và gửi thông báo cho người trực.
2. **Xác minh:** Kiểm tra monitor trang chủ, `/health`, trạng thái D1, log Worker và thời điểm deploy gần nhất.
3. **Phân loại:** P1 – website/D1 ngừng hoạt động hoặc có dấu hiệu xâm nhập; P2 – một chức năng quan trọng suy giảm; P3 – lỗi nhỏ, không ảnh hưởng dữ liệu.
4. **Khoanh vùng:** AI đề xuất biện pháp không phá hủy; không tự ý chặn diện rộng, xóa dữ liệu, thay secret hoặc rollback.
5. **Khắc phục:** Người có thẩm quyền thực hiện hoặc phê duyệt thay đổi. Sửa code qua quy trình kiểm tra; dữ liệu production cần phê duyệt riêng.
6. **Xác minh:** Kiểm tra lại monitor, health, chức năng liên quan, tính toàn vẹn dữ liệu và theo dõi tái phát.
7. **Bàn giao:** Cập nhật timeline incident và báo cáo nguyên nhân gốc, biện pháp phòng ngừa.

## 8. Giới hạn trách nhiệm

AI SRE là trợ lý điều tra và đề xuất, không phải cam kết có kỹ sư con người trực 24/7. Để bảo đảm có người xử lý khi AI không thể tự khắc phục, phải thiết lập on-call schedule, escalation policy, số điện thoại dự phòng và SLA với đơn vị vận hành. Không có giải pháp AI nào có thể bảo đảm xử lý dứt điểm mọi cuộc tấn công hoặc sự cố mà không có quyền hạn, bằng chứng và người chịu trách nhiệm phù hợp.
