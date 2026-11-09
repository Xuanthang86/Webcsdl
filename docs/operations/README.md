# Vận hành, giám sát và ứng phó sự cố – WebCSDL KHCN

Tài liệu này là quy trình vận hành chuẩn cho website production:

- Website: https://khcn.xuanthang.io.vn
- Worker: `webcsdlkhcn`
- D1: `khcn-portal-db`
- Mã nguồn: https://github.com/Xuanthang86/Webcsdl (chỉ nhánh `main`)

## Hướng dẫn thiết lập lần đầu – làm theo thứ tự

**Không cần cài phần mềm trên laptop/PC để bắt đầu.** Better Stack là dịch vụ sử dụng qua trình duyệt web. Nếu muốn nhận cảnh báo đẩy trên điện thoại, có thể cài ứng dụng **Better Stack On-call** từ App Store hoặc Google Play; đây là tùy chọn, không bắt buộc nếu đã dùng cuộc gọi/SMS.

### A. Tạo tài khoản và thiết lập người nhận cảnh báo

1. Mở https://betterstack.com/ và đăng ký tài khoản bằng email công vụ hoặc email quản trị của đơn vị.
2. Xác nhận email, đăng nhập và tạo/chọn Team dành riêng cho WebCSDL.
3. Mở mục quản lý thành viên (People / Team members, tên mục có thể thay đổi theo giao diện), thêm người phụ trách chính và ít nhất một người dự phòng. Mỗi người dùng tài khoản riêng; bật xác thực đa yếu tố nếu tài khoản hỗ trợ.
4. Kiểm tra số điện thoại và email của người nhận cảnh báo. Không dùng chung tài khoản quản trị.

### B. Tạo hai monitor kiểm tra website

Thực hiện lần lượt cho từng URL:

1. Chọn **Monitors → Create monitor**.
2. Chọn loại **HTTP(s) / HTTP status**.
3. Nhập URL tương ứng trong bảng ở Mục 2; đặt tên rõ ràng.
4. Chọn điều kiện thành công là phản hồi HTTP thuộc nhóm **2xx**; bật kiểm tra SSL/chứng chỉ nếu có lựa chọn.
5. Chọn chu kỳ 60 giây nếu gói dịch vụ hỗ trợ. Chọn ít nhất hai vùng kiểm tra nếu gói dịch vụ cho phép.
6. Ở phần **How should we escalate incidents?**, chọn người trực chính hoặc escalation policy.
7. Bật ít nhất **Call + Push** cho sự cố nghiêm trọng; có thể bật thêm SMS và Email. Lưu monitor.
8. Lặp lại với URL còn lại. Sau khi tạo, mở từng monitor và kiểm tra trạng thái lần đầu.

Lưu ý: monitor trang chủ xác nhận người dùng truy cập được website; monitor `/health` kiểm tra thêm kết nối D1. Hai monitor có mục đích khác nhau, không thay thế cho nhau.

### C. Bật trợ lý AI SRE tự động điều tra incident

1. Trong Better Stack, mở **Incidents → Integrations → AI SRE** (tên/đường dẫn có thể thay đổi theo gói dịch vụ).
2. Tạo hoặc kết nối AI SRE integration.
3. Bật **Investigate new incidents automatically with AI SRE** để AI tự bắt đầu điều tra khi có incident mới.
4. Kết nối GitHub repository `Xuanthang86/Webcsdl`. Chỉ cấp quyền đọc repository/commit; không cấp quyền quản trị repository.
5. Chỉ bật nhóm công cụ **read-only**. Không cấp quyền truy cập Cloudflare, secrets, D1 write, restore, deploy, merge hoặc push.
6. Dán nội dung **Custom system prompt** ở Mục 3 vào cấu hình AI SRE.
7. Tạo một incident thử nghiệm an toàn (ví dụ monitor thử một URL không tồn tại, không làm thay đổi website thật) để xác nhận AI có ghi nhận và gửi báo cáo điều tra.
8. Không bật tự tạo Pull Request nếu chưa có chấp thuận riêng; dự án hiện sử dụng duy nhất nhánh `main`.

Nếu tài khoản không hiển thị AI SRE hoặc mục tự động điều tra, hãy kiểm tra gói dịch vụ/quyền sử dụng với Better Stack; không cần cài thêm chatbot khác vào website.

### D. Tạo nguồn log Better Stack và kết nối Worker

1. Trong Better Stack, mở **Telemetry → Sources → Connect source**.
2. Đặt tên nguồn, ví dụ `WebCSDL Cloudflare Worker`; chọn loại nguồn **HTTP**.
3. Mở trang cấu hình nguồn vừa tạo, sao chép **Source token** và **Ingesting host**. Không chia sẻ hai giá trị này trong chat, ảnh chụp hoặc GitHub.
4. Mở Cloudflare Dashboard → chọn tài khoản → **Workers & Pages → webcsdlkhcn → Settings → Variables and Secrets**.
5. Thêm `BETTERSTACK_SOURCE_TOKEN` với giá trị Source token; đánh dấu là **Secret**.
6. Thêm `BETTERSTACK_INGESTING_HOST` với giá trị Ingesting host; nhập đúng hostname Better Stack được cấp.
7. Lưu cấu hình theo hướng dẫn Cloudflare. Không ghi token vào `wrangler.jsonc`, mã nguồn hoặc GitHub.
8. Sau khi phiên bản Worker có cấu hình mới được áp dụng, truy cập website và kiểm tra **Telemetry → Live tail**. Chờ sự kiện vận hành phát sinh; không tạo lỗi giả trên D1 production chỉ để thử.
9. Nếu chưa thấy log, kiểm tra lại tên hai biến, hostname và việc áp dụng cấu hình Worker. Chỉ gửi ảnh chụp đã che toàn bộ giá trị bí mật.

Worker hiện gửi các sự kiện bảo mật/vận hành đã chọn lọc, không phải toàn bộ nội dung request. Không có log nào được gửi nếu thiếu một trong hai biến; việc gửi log lỗi không được làm gián đoạn chức năng website.

### E. Tạo quy tắc giới hạn đăng nhập trên Cloudflare

1. Đăng nhập Cloudflare, chọn zone `khcn.xuanthang.io.vn`.
2. Mở **Security → Security rules → Create rule → Rate limiting rules** (một số giao diện cũ hiển thị **Security → WAF → Rate limiting rules**).
3. Tạo quy tắc đăng nhập theo thông số tại Mục 5. Ở phần đếm, giữ **IP** làm đặc tính đếm.
4. Với gói **Free**, chu kỳ đo có thể chỉ có lựa chọn 10 giây và hành động khả dụng là **Block**; chọn ngưỡng và thời gian chặn ngắn theo lựa chọn Cloudflare cung cấp. Với gói Pro trở lên, có thể chọn **Managed Challenge** nếu giao diện cho phép.
5. Tạo quy tắc bootstrap riêng; không gộp chung với đăng nhập.
6. Lưu/Deploy từng quy tắc. Sau đó mở **Security → Events** để kiểm tra các request bị giới hạn.
7. Nếu người dùng hợp lệ bị chặn, điều chỉnh ngưỡng hoặc thời gian chặn trước khi mở rộng quy tắc. Không tạo quy tắc cho toàn bộ `/api/*`.

**Không cần cài tiện ích mở rộng trình duyệt, agent hoặc phần mềm giám sát bên thứ ba trên laptop.** Better Stack kiểm tra website từ bên ngoài; Worker gửi sự kiện trực tiếp qua HTTPS.

## 0. Phiên đăng nhập quản trị trên PC, laptop, tablet và mobile

- Cookie `danang_session` là HttpOnly, Secure, SameSite=Lax và là cookie phiên trình duyệt; không đặt `Max-Age` hoặc `Expires`.
- Khi người dùng không có thao tác thực tế trong 40 phút, lần tương tác tiếp theo hoặc khi quay lại tab sẽ kết thúc phiên và yêu cầu đăng nhập lại. Các thao tác được nhận diện gồm chạm/click, bàn phím, cuộn trang và nhập liệu.
- Khi một tab website được đóng, hệ thống ghi nhận thời điểm đóng. Nếu mở lại sau 20 phút mà không có hoạt động gần đây từ các tab WebCSDL khác, hệ thống xóa phiên và yêu cầu đăng nhập. Nếu người dùng vẫn thao tác trên một tab WebCSDL khác, hoạt động đó được tính chung và không làm gián đoạn phiên đang sử dụng.
- Đóng trình duyệt sẽ kết thúc cookie phiên theo cơ chế browser-session cookie. Tải lại trang trong thời gian cho phép không tự động đăng xuất.
- Token ký số của tài khoản quản trị có thời hạn ngắn 41 phút làm lớp bảo vệ bổ sung; giao diện quản trị áp dụng ngưỡng không hoạt động 40 phút. Token chỉ được gia hạn khi có hoạt động gần đây, không gia hạn vô thời hạn chỉ vì tab đang mở. Các vai trò không thuộc nhóm quản trị giữ nguyên chính sách phiên hiện có.
- `localStorage` chỉ lưu mốc hoạt động, thời điểm đóng tab và lease nhận diện tab; không lưu mật khẩu hoặc token xác thực. Token vẫn nằm trong HttpOnly cookie và JavaScript không thể đọc.


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
- Threshold: khởi điểm 5 requests / 10 seconds / IP trên gói Free (chọn chu kỳ Cloudflare thực sự cung cấp trong tài khoản).
- Action: gói Free dùng Block; Pro trở lên có thể chọn Managed Challenge nếu có. Giữ thời gian chặn ngắn theo lựa chọn khả dụng và theo dõi Security Events.

### Quy tắc 2 – Bootstrap quản trị viên lần đầu

- Tên: `WebCSDL - Bootstrap rate limit`
- Expression: `http.request.uri.path eq "/api/auth/bootstrap-admin"`
- Counting characteristic: IP
- Threshold: khởi điểm 3 requests / 10 seconds / IP trên gói Free.
- Action: Block trong thời gian ngắn mà gói dịch vụ cho phép; theo dõi Security Events sau khi bật.

Lưu ý: Theo giới hạn Cloudflare hiện hành, gói Free thường chỉ cung cấp chu kỳ 10 giây, đặc tính đếm IP và hành động Block; Managed Challenge và các chu kỳ dài hơn phụ thuộc gói dịch vụ. Vì vậy không cấu hình 60 giây/600 giây nếu giao diện tài khoản không hỗ trợ. Trên gói Free, biểu thức dùng path; không giả định có thể lọc riêng HTTP method. Không áp dụng giới hạn rộng cho toàn bộ `/api/*`, vì có thể làm gián đoạn tra cứu, tải dữ liệu và chức năng người dùng hợp lệ. Chưa thêm rule cho endpoint tiếp nhận hồ sơ công khai khi chưa xác định chính xác route và lưu lượng hợp lệ.

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
