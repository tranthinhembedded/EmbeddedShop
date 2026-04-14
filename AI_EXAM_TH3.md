# Tài liệu AI Chatbot (Chương 10)

## 1. Lưu trữ và Bảo mật API Key
Sử dụng thư viện `react-native-dotenv` để load biến môi trường từ tệp `.env`. Tệp `.env` đã được đưa vào git ignore, không commit lên GitHub. File `.env.example` với giá trị ảo được lưu giữ trên repo nhằm làm document cho các developer khác có thể tự set up API key an toàn. Điều này ngăn việc lộ lọt (leak) các secret key lên môi trường public.

## 2. Chiến lược xử lý lỗi (Error Handling)
- **Cho User**: Thông qua `Alert` hiển thị một câu xin lỗi đơn giản, thân thiện như "Dịch vụ AI đang bận hoặc gián đoạn mạng. Bạn thử lại sau nhé!" để user không hoang mang.
- **Cho Dev**: Dùng `console.warn(error)` lưu lại log raw chứa status code / chi tiết lỗi vào console để dễ debug, nhưng không dump bừa bãi dữ liệu nhạy cảm mang API key ra giao diện.

## 3. Giới hạn độ dài và số lượng Request
Việc giới hạn `maxLength=500` cho `TextInput` giúp ngăn user tự ý lạm dụng gửi lượng lớn văn bản vào model, gây rò rỉ và tiêu tốn cost Token không cần thiết, đồng thời tối ưu thời gian chờ trả lời. Trong code, hệ thống có cảnh báo đếm ngược và sẽ show Alert chặn đứng trước khi submit gửi. Việc chỉ tự động gọi lại (Retry) duy nhất 1 lần thay vì vòng lặp vô hạn kết hợp thời gian nghỉ 2s, giúp không bị chặn bởi HTTP 429 quá nhanh.

## 4. Bảo mật dữ liệu trên Cloud AI (Privacy & Content Filtering)
Gemini API cung cấp hệ thống Content Filtering tự động để khoá các Request vi phạm chính sách (thù hận, gợi dục, v.v.). Tuy nhiên ở khía cạnh Privacy, ta vẫn phải ý thức là các Request lên API Cloud có thể được log lại tạm thời. Hướng dẫn UX tốt là phải cảnh báo user không điền các thông tin ngân hàng, mật khẩu, PII (thông tin cá nhân) trên giao diện trò chuyện.
