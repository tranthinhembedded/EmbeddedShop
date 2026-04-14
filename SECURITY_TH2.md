# Báo Cáo Bảo Mật (SECURITY_TH2)

Tài liệu này trình bày các biện pháp bảo mật và quản lý luồng dữ liệu cơ bản được áp dụng trong ứng dụng, tuân thủ theo tinh thần của Chương 8. Thêm vào đó là những phân tích về các giới hạn và định hướng quy chuẩn an toàn.

## 1. Validation phía Client (Liên hệ Form Đăng ký/Đăng nhập)
Trong ứng dụng, các nhóm form như Đăng nhập (`LoginScreen`) và Đăng ký (`RegisterScreen`) đều áp dụng thư viện `react-hook-form` kết hợp chặt chẽ với lược đồ xác thực `zod` (Validation Schema). Việc thực hiện validation mạnh mẽ phía thiết bị (client) mang lại các lợi ích bảo mật và trải nghiệm:
- **Kiểm soát dữ liệu đầu vào:** Ngăn chặn ngay lập tức người dùng nhập các chuỗi không đúng định dạng (email sai format, password quá ngắn), các Injection pattern cơ bản trước khi tạo payload gửi lên server.
- **Tối ưu băng thông & Server:** Tránh việc gọi API rác/sai định dạng về phía backend, đồng thời trả lỗi ngữ cảnh rõ ràng (inline error) cho người dùng ngay ở frontend.

## 2. Cách lưu Token trong đề thi và giới hạn lưu trữ (Async/MMKV so với Keychain/Keystore)
- **Cách lưu token tại thiết kế hiện tại:** Ứng dụng lưu session đăng nhập và token ảo/giả lập (`mock-jwt`) bằng kiến trúc quản lý state `Zustand` tích hợp cùng engine lưu trữ tốc độ cao `react-native-mmkv`. (Tương đương việc dùng `AsyncStorage` nhưng ở một phiên bản hiệu năng cao hơn).
- **Giới hạn của AsyncStorage/MMKV so với Keychain/Keystore (Chương 8):**
  - **AsyncStorage / MMKV** thuần túy chỉ ghi dữ liệu thành file văn bản (JSON/plaintext) trên thư mục sandbox của app. Nó không hề có cơ chế mã hoá mạnh. Nếu thiết bị hệ điều hành bị Jailbreak hoặc Root, hacker hoàn toàn có thể sao chép được token.
  - Hệ thống an toàn thật sự cần tới **Keychain** (đối với iOS) và **Keystore** (đối với Android). Các nền tảng này sử dụng Secure Enclave cấu thành từ phần cứng, dữ liệu như JWT sẽ được mã hoá cấp hệ điều hành và cực kỳ khó để giải mã trái phép.

## 3. Vì sao không expose thông báo lỗi chi tiết cho User?
Trong màn hình Đăng nhập hay Tạo tài khoản, nếu gọi API thất bại, ứng dụng chỉ dùng UI alert/inline chữ đỏ cảnh báo lỗi chung chung (thông qua hàm format `getApiErrorMessage` như *"Thông tin đăng nhập không hợp lệ"*). Việc chúng ta ẩn đi Stack Trace và các Log chi tiết từ server nhằm:
- **Phòng chống Information Leakage:** Stack error thường để lộ tên Database, phiên bản Framework backend (ví dụ: Node 20 / Postgres format), hoặc thông tin đường dẫn folder máy chủ. Tin tặc lợi dụng những dữ kiện chi tiết này (CWE-209) để nhắm mục tiêu khai thác lỗ hổng đặc thù.
- **Bảo mật danh tính:** Một lỗi trả về *"Tài khoản admin không tồn tại"* lại dễ dàng tiết lộ cho hacker biết list người dùng nào có hay không có trong hệ thống thay vì báo *"Thông tin không hợp lệ"*.

## 4. Ý tưởng Bảo mật Nâng cao (Session Timeout & Background Obfuscation)
Để phát triển đúng khái niệm của hệ thống bảo mật nội bộ theo Chương 8, ứng dụng có thể thiết lập bổ sung định mức:
- **Session Timeout (Hết hạn phiên chặn nhàn rỗi):** JWT token cấp ra nên có thời lượng sống (TTL) ngắn. Giao diện frontend sẽ hook vào `AppState` của React Native; nếu người dùng chuyển app xuống Background quá 15 phút hoặc màn hình không ghi nhận tương tác chạm, App sẽ chủ động `clearSession()` tự động đăng xuất user và đẩy về lại `LoginScreen`. (Mô hình này phổ biến trong các ứng dụng Enterprise / ngân hàng nhằm tránh người khác mượn điện thoại để thao tác lén).
- **Deep Link Validation:** Khi App mở lên với deep link (ví dụ `embeddedshop://`), mọi tham số query đi kèm URL đều cần được xác thực nghiêm ngặt để đảm bảo tin tặc không thể tiêm mã nhắm đổi chiều luồng auth.
