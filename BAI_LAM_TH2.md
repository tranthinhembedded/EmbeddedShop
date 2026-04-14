# BAI_LAM_TH2

## Toi uu tim kiem

Trong man hinh co o tim kiem, moi lan nguoi dung nhap ky tu thi component cha se render lai. Neu loc danh sach truc tiep trong JSX, phep loc se chay lai o moi lan render, ke ca khi du lieu san pham khong doi. `useMemo` giup ghi nho ket qua loc va chi tinh lai khi `products` hoac tu khoa tim kiem thay doi, nen giam tinh toan thua. Khi tach tung dong thanh `ProductRow` va boc bang `React.memo`, cac item co props khong doi se khong render lai theo component cha. Nho vay man hinh tim kiem muot hon, giam re-render khong can thiet va phan hoi tot hon khi nguoi dung go nhanh.

## TanStack Query

`staleTime = 30 giay` nghia la du lieu sau khi fetch se duoc xem la con moi trong 30 giay. Trong khoang nay, mo lai man hinh thuong se dung cache va khong refetch ngay. Het 30 giay, query moi du dieu kien refetch khi co trigger phu hop.

## Bổ sung Modal Xác nhận Điều khoản (Chương 5)

Tại màn hình đăng ký (`RegisterScreen`), luồng đăng ký đã được tích hợp Component `Modal` theo đúng yêu cầu đề bài:
1. Giao diện mặc định có sử dụng component `Switch` native để người dùng bật tắt đánh dấu đồng ý điều khoản. (Nếu Switch được bật, state form cập nhật cho phép submit).
2. Khi người dùng click vào chữ "terms and conditions", Pop-up `Modal` xuất hiện nổi lên với back-drop tối mờ, hiển thị giao diện chứa nội dung điều khoản.
3. Trong `Modal` có nút **Đóng** để tắt Pop-up và nút **Tôi đồng ý**. 
4. Nút "Tôi đồng ý" xử lý logic kép: 1) gán giá trị React Hook Form `acceptTerms = true` (tick tự động bật) và 2) Trạng thái local `setTermsModalVisible(false)` để tắt pop-up. Như vậy đáp ứng được luật 2 cách chọn 1.
