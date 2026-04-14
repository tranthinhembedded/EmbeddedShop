Phan 1 - Permission UX

Khi người dùng từ chối quyền lần đầu, hệ điều hành thường vẫn cho phép ứng dụng hỏi lại ở lần sau. Trạng thái này cho thấy user chưa sẵn sàng hoặc chưa hiểu lý do cần quyền, nên app cần giải thích ngắn gọn, rõ lợi ích và chỉ xin lại đúng lúc. Ngược lại, trạng thái "blocked" nghĩa là người dùng đã từ chối theo cách khiến app không thể hiện hộp thoại xin quyền nữa. Lúc đó, hướng user tới Settings là cần thiết vì chỉ họ mới có thể bật lại quyền thủ công; app không thể tự thay đổi quyết định này.

Phan 2 - Maps setup

Native files da chinh de maps chay tren Android:
- `android/app/build.gradle`: them `manifestPlaceholders` de nap `MAPS_API_KEY`.
- `android/app/src/main/AndroidManifest.xml`: them `meta-data` `com.google.android.geo.API_KEY`.
- `android/gradle.properties`: them bien `MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY`.

Neu build iOS voi provider mac dinh MapKit thi man hinh map van dung duoc ma chua can sua native file. Neu muon dung Google Maps tren iOS, can bo sung Google Maps SDK/pod trong `ios/Podfile`, chay `pod install`, va goi `GMSServices.provideAPIKey(...)` trong `ios/ShopAIDemo/AppDelegate.swift`.

Phan 3 - Location services
1. Xin quyen: su dung truc tiep `PermissionsAndroid` tu tap thu vien goc `react-native` (de xin quyen `ACCESS_FINE_LOCATION`).
2. Lay vi tri: Cai dat them goi `@react-native-community/geolocation` de su dung API `Geolocation.getCurrentPosition()`. Thong tin nay duoc tich hop cung nut 'Lay vi tri hien tai' tai man hinh MapExamScreen.

Phan 4 - AI Chatbot (Cost Optimization & Retry)

- Giới hạn độ dài tối đa tin nhắn (500 ký tự): Các mô hình ngôn ngữ như Gemini tính tiền theo Token (ký tự quy đổi). Giới hạn này ngăn người dùng gửi tin nhắn cực lớn gây tiêu hao lãng phí ngân sách Tokens, giảm thiểu rủi ro DOS. App tự khóa đầu vào và chỉ cảnh báo chứ không gửi request đến server.
- Retry HTTP 429 và Lỗi Mạng: Thay vì hiện lỗi ngay, App chờ (`setTimeout` delay 2s) rồi tự retry lại ngầm đúng 1 lần. Retry 429 rất quan trọng bởi API thường chặn rate-limiting tạm thời nếu request đến dồn dập, thử lại sau vài giây sẽ có xác suất thành công trót lọt cao hơn. Giới hạn đúng 1 lần báo để tránh bị khoá API vĩnh viễn (Spam vòng lặp).
