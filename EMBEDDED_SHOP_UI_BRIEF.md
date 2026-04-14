# Brief Thiết Kế UI Cho Ứng Dụng Embedded Shop

## 1. Mục đích tài liệu

Tài liệu này dùng để mô tả đầy đủ ứng dụng **Embedded Shop** cho đội UI/UX dựa trên các yêu cầu của bài tập App Shop ở Chương 4 và Chương 5, nhưng đã được chuyển đổi sang domain **linh kiện điện tử, bo mạch nhúng, FPGA, cảm biến và thiết bị phục vụ robot**.

Mục tiêu là để designer có thể:

- Hiểu đúng bản chất sản phẩm cần thiết kế.
- Nắm được tinh thần hình ảnh của ứng dụng.
- Biết rõ những màn hình, component và trạng thái cần làm.
- Thiết kế theo hướng công nghệ, kỹ thuật, đáng tin cậy, không bị giống một app bán hàng thời trang hoặc lifestyle.

## 2. Mô tả ngắn gọn về sản phẩm

**Embedded Shop** là ứng dụng mobile bán các sản phẩm phục vụ cho học tập, nghiên cứu và phát triển hệ thống nhúng, robot và tự động hóa. App tập trung vào các nhóm sản phẩm như:

- Raspberry Pi và các bo mạch SBC, Edge AI.
- Bo FPGA phục vụ xử lý thời gian thực, điều khiển, tăng tốc phần cứng.
- Cảm biến như lidar, camera stereo, cảm biến đo khoảng cách, cảm biến công nghiệp.
- Driver động cơ, mạch nguồn, HAT mở rộng, gateway, module giao tiếp công nghiệp.
- Bộ kit robot, chassis, module điều khiển chuyển động.

Đây là một ứng dụng e-commerce mang màu sắc kỹ thuật rõ ràng, phục vụ nhóm người dùng có nhu cầu tra cứu thông số, khả năng tương thích, tình trạng tồn kho và đặt mua các phần cứng phục vụ dự án.

## 3. Mục tiêu trải nghiệm người dùng

Thiết kế cần hướng tới 4 mục tiêu chính:

1. **Tạo cảm giác công nghệ và chuyên nghiệp**  
   App phải nhìn giống một nền tảng bán thiết bị kỹ thuật, không phải shop tiêu dùng đại trà.

2. **Giúp người dùng ra quyết định nhanh**  
   Thông tin quan trọng như loại bo mạch, thông số, tồn kho, khả năng tương thích, lead time, giá và ứng dụng cần được nhìn thấy nhanh.

3. **Tăng độ tin cậy**  
   Giao diện cần tạo cảm giác chính xác, rõ ràng, có tổ chức, giống môi trường lab, workbench hoặc control room.

4. **Dễ mở rộng thành full app shop**  
   Thiết kế phải đủ hệ thống để sau này mở rộng sang checkout, order history, profile, settings, dark/light theme, loading, empty state, error state.

## 4. Nhóm người dùng mục tiêu

### 4.1. Sinh viên ngành nhúng, điện tử, robot

- Cần tìm kit học tập và module dễ triển khai.
- Quan tâm tới giá, khả năng tương thích, độ phổ biến, tài liệu đi kèm.

### 4.2. Kỹ sư R&D, kỹ sư robot, kỹ sư tự động hóa

- Cần lọc nhanh theo chuẩn giao tiếp, điện áp, công suất, dòng tải, chuẩn bus.
- Quan tâm tới độ tin cậy, hàng sẵn kho, lead time, tài liệu kỹ thuật.

### 4.3. Người quản lý phòng lab hoặc giảng viên

- Cần mua theo bộ, theo nhóm linh kiện phục vụ môn học hoặc đề tài.
- Quan tâm tới tổng chi phí, số lượng, lịch sử đơn hàng và trạng thái giao hàng.

## 5. Tính cách thương hiệu và định hướng hình ảnh

### 5.1. Tính cách thương hiệu

Embedded Shop nên mang cảm giác:

- Chính xác
- Công nghệ
- Tin cậy
- Chuyên nghiệp
- Gọn gàng
- Có chiều sâu kỹ thuật

### 5.2. Từ khóa hình ảnh

Designer nên bám theo các từ khóa sau:

- Control room
- Electronics lab
- Engineering dashboard
- Workbench
- Industrial clean
- Modular hardware
- Precision interface

### 5.3. Những hướng cần tránh

- Quá thời trang, mềm mại, nữ tính
- Quá giống app mỹ phẩm hoặc clothing shop
- Quá nhiều hiệu ứng neon kiểu gaming
- Bố cục rối, nhiều màu, thiếu tính kỹ thuật
- Chỉ đẹp hình thức nhưng không làm rõ thông số sản phẩm

## 6. Phong cách giao diện đề xuất

### 6.1. Hướng chính: Control Room

Đây là phong cách chủ đạo của app.

- Nền tối, sâu, thiên về xanh than và graphite.
- Các khối nội dung giống panel kỹ thuật.
- Accent sáng kiểu cyan hoặc lime cho trạng thái active.
- Các card nhìn giống module phần cứng hoặc bảng điều khiển.
- Cảm giác chung: hiện đại, tập trung, kỹ thuật, có chiều sâu.

### 6.2. Hướng phụ: Workbench

Đây là phiên bản sáng hơn, dùng khi cần light theme.

- Nền sáng sạch sẽ như mặt bàn làm việc kỹ thuật.
- Card trắng hoặc xanh xám rất nhạt.
- Accent xanh dương công nghệ.
- Vẫn phải giữ tinh thần kỹ thuật, không chuyển thành phong cách lifestyle.

## 7. Hệ màu đề xuất

### 7.1. Dark theme chính

- Background chính: `#07111A`
- Surface: `#0C1A26`
- Panel: `#0F1F2D`
- Panel phụ: `#12293C`
- Border: `#1F3A50`
- Text chính: `#E8F3FF`
- Text phụ: `#7D96AA`
- Accent chính: `#41D7FF`
- Accent hỗ trợ: `#B7FF5A`
- Màu cảnh báo: `#FFBA49`
- Màu lỗi hoặc trạng thái nguy hiểm: `#FF6B7C`

### 7.2. Light theme phụ

- Background chính: `#F1F6FA`
- Surface: `#FFFFFF`
- Surface phụ: `#F8FBFF`
- Panel phụ: `#EBF3FA`
- Border: `#D6E0E8`
- Text chính: `#0C1821`
- Text phụ: `#667A89`
- Accent chính: `#0E86FF`
- Accent hỗ trợ: `#3EA864`
- Amber: `#D4832F`
- Danger: `#D44B60`

### 7.3. Nguyên tắc dùng màu

- Dùng ít màu nhưng đúng vai trò.
- Accent chỉ nên xuất hiện ở CTA, trạng thái active, chip quan trọng, badge, chỉ báo kỹ thuật.
- Không dùng các gradient quá mềm hoặc quá “mơ màng”.
- Trạng thái tồn kho, đơn hàng, thông báo phải dễ quét bằng màu sắc.

## 8. Typography và cảm giác chữ

UI cần tạo cảm giác kỹ thuật, dễ đọc và có thứ bậc rõ ràng.

- Heading: mạnh, gọn, chắc, hiện đại.
- Body text: dễ đọc, sạch, không quá mềm.
- Mã sản phẩm, nhãn kỹ thuật, badge: có thể dùng phong cách semi-mono hoặc cảm giác terminal nhẹ.
- Số liệu như giá, tồn kho, mã đơn hàng, thông số nên nổi bật và rõ.

Nếu designer cần chọn font trong Figma, nên ưu tiên nhóm sans-serif hiện đại, công nghệ, rõ nét. Có thể tham khảo tinh thần của các cặp font như:

- Space Grotesk / Inter
- Sora / Inter
- IBM Plex Sans / IBM Plex Mono

Không bắt buộc đúng font này, nhưng cần giữ cảm giác “engineering UI”.

## 9. Nguyên tắc bố cục

- Ưu tiên panel, card, khối nội dung rõ ràng.
- Bo góc vừa phải, không quá tròn kiểu lifestyle.
- Khoảng cách đều và có hệ thống.
- Tạo các cụm thông tin giúp quét nhanh: tên sản phẩm, giá, hãng, tồn kho, thông số nổi bật.
- Dùng grid rõ cho danh sách sản phẩm.
- Các modal và bottom sheet cần có cảm giác gọn, chắc, kỹ thuật.

## 10. Kiến trúc thông tin tổng thể của app

Ứng dụng nên được thiết kế như một app shop hoàn chỉnh với các khu vực chính sau:

### 10.1. Tab chính

- Home
- Catalog hoặc Search
- Saved hoặc Favorites
- Cart
- Profile

### 10.2. Màn hình hoặc lớp điều hướng mở rộng

- Splash Screen
- Product Detail
- Filter Modal
- Checkout
- Order History
- Settings
- Các modal xác nhận hoặc thông báo

## 11. Mô tả từng màn hình cho designer

### 11.1. Splash Screen

Mục tiêu:

- Hiển thị logo hoặc wordmark của Embedded Shop.
- Tạo ấn tượng đầu tiên về thương hiệu công nghệ.
- Có thể gợi nhẹ visual của bo mạch, trace line, chip layout hoặc glow kỹ thuật.

Yêu cầu thiết kế:

- Tối giản, sang, có chiều sâu.
- Có thể có hiệu ứng nhẹ kiểu scan line, pulse hoặc glow.
- Thời gian xuất hiện ngắn nhưng đủ tạo dấu ấn.

### 11.2. Home Screen

Vai trò:

- Là landing page chính của app.
- Truyền tải ngay việc đây là shop phần cứng nhúng và robot.

Nội dung nên có:

- Hero section nổi bật.
- Tagline hoặc mô tả ngắn về shop.
- Metrics ngắn như số SKU, thời gian giao, mức độ sẵn kho.
- Danh mục nổi bật: SBC, FPGA, Robotics, Sensors, Power, Connectivity.
- Collection hoặc section như:
  - Rapid Prototype Bench
  - Motion and Control Stack
  - Realtime Logic Lab
- Khu featured products.

Tinh thần visual:

- Hero mạnh, có cấu trúc kỹ thuật.
- Card collection giống module hoặc tray phần cứng.
- Có cảm giác “bàn lab được tổ chức tốt”.

### 11.3. Search / Catalog Screen

Vai trò:

- Cho phép tra cứu nhanh linh kiện và bo mạch.

Nội dung chính:

- Search bar nổi bật, dễ dùng.
- Các từ khóa trending: ROS2, FPGA, Raspberry Pi, Motor driver, Lidar, Industrial IO.
- Filter button mở bottom sheet.
- Khu hiển thị số lượng kết quả.
- Product grid hoặc list.

Filter cần hỗ trợ:

- Category
- In stock only
- Sort theo featured, rating, stock, price tăng dần, price giảm dần

Yêu cầu trải nghiệm:

- Người dùng phải nhìn ra đây là trang tra cứu phần cứng.
- Kết quả cần quét nhanh, không bị “nhiễu”.
- Search state, no-result state và loading state phải được thiết kế rõ.

### 11.4. Product Listing / Product Grid

Mỗi card sản phẩm cần thể hiện:

- Mã sản phẩm
- Tên sản phẩm
- Hãng hoặc vendor
- Mô tả ngắn
- Giá hiện tại
- Giá cũ nếu có
- Tình trạng lưu hoặc yêu thích
- CTA thêm vào giỏ

Ngoài ra nên có chỗ hiển thị:

- Rating
- Badge giảm giá
- Tình trạng kho
- Lead time

Visual sản phẩm:

- Nếu không dùng ảnh thật, có thể dùng minh họa dạng hardware illustration, board silhouette, module glyph hoặc hình render tối giản mang tính kỹ thuật.

### 11.5. Product Detail Screen

Đây là màn hình quan trọng nhất của ứng dụng.

Nội dung cần có:

- Ảnh hoặc minh họa chính của sản phẩm
- Tên sản phẩm
- Giá
- Hãng
- Rating
- Highlight ngắn
- Overview mô tả dài hơn
- Danh sách thông số kỹ thuật
- Tags
- Ứng dụng thực tế
- Khả năng tương thích
- Tồn kho
- Lead time

Phần chọn biến thể sản phẩm cần được chuyển đổi từ logic shop thông thường sang logic linh kiện:

- Model
- Dung lượng RAM
- Điện áp
- Chuẩn giao tiếp
- Kiểu package
- Revision

Không dùng tư duy “size / color” theo kiểu thời trang, trừ khi đó là màu hoặc version thật của bo mạch.

CTA cần có:

- Add to cart
- Save
- Share

Thành phần tương tác:

- Quantity selector
- Button states
- Tồn kho hoặc disabled state
- Success feedback khi thêm vào giỏ

Phần mở rộng nên thiết kế trước:

- Reviews
- Related products
- Quick add bottom sheet

### 11.6. Saved / Favorites Screen

Vai trò:

- Nơi người dùng lưu lại các module đang cân nhắc.

Nội dung:

- Danh sách sản phẩm đã lưu
- Empty state hấp dẫn nhưng đúng phong cách kỹ thuật
- Tùy chọn bỏ lưu, chia sẻ hoặc chuyển sang cart

### 11.7. Cart Screen

Vai trò:

- Cho người dùng rà lại cấu hình linh kiện trước khi đặt hàng.

Mỗi cart item cần có:

- Tên sản phẩm
- Hình hoặc glyph
- Hãng
- Lead time
- Giá
- Số lượng
- Tổng tiền theo dòng
- Nút xóa

Khu tổng kết đơn hàng cần có:

- Subtotal
- Phí chuẩn bị đơn hoặc vận chuyển
- Tổng cuối
- Nút checkout

Nên tạo cảm giác như một “procurement bench”, nơi người dùng đang ráp đủ các phần cứng cho một hệ thống.

### 11.8. Checkout Screen

Vai trò:

- Hoàn tất việc đặt mua.

Thông tin cần có:

- Company hoặc Lab name
- Contact person
- Email
- Địa chỉ nhận hàng
- Tóm tắt số lượng dòng hàng
- Nút Place order

Theo yêu cầu bài, designer nên chuẩn bị tư duy cho checkout nhiều bước:

- Shipping address
- Payment method
- Review order

Nếu giai đoạn đầu chỉ làm bản đơn giản, giao diện vẫn nên có cấu trúc cho phép mở rộng thành multi-step sau này.

### 11.9. Profile Screen

Vai trò:

- Quản lý thông tin người dùng hoặc tổ chức đặt hàng.

Nội dung chính:

- Avatar hoặc badge thương hiệu người dùng
- Tên lab hoặc tên người dùng
- Email
- Vai trò hoặc mô tả ngắn
- Các thống kê nhỏ: số sản phẩm lưu, số item trong cart, số đơn hàng

Khu preferences:

- Đổi theme Dark/Light
- Bật tắt thông báo đơn hàng

Mở rộng theo yêu cầu bài:

- Chỉnh sửa hồ sơ
- Địa chỉ
- Phương thức thanh toán
- Cài đặt tài khoản
- Bảo mật
- Hỗ trợ
- Đăng xuất

### 11.10. Order History Screen

Nội dung:

- Mã đơn hàng
- Ngày đặt
- Trạng thái
- Số lượng item
- Tổng tiền

Trạng thái đơn hàng nên có badge rõ ràng:

- Delivered
- Processing
- Ready to ship
- Awaiting payment

Thiết kế phải giúp quét nhanh lịch sử mua hàng, đặc biệt với người dùng đặt nhiều phần cứng cho dự án.

### 11.11. Settings Screen

Theo yêu cầu bài, đây là màn hình mở rộng nên được designer chuẩn bị:

- Cài đặt tài khoản
- Thông báo
- Bảo mật
- Ngôn ngữ
- Giao diện sáng / tối
- Trợ giúp
- Giới thiệu ứng dụng

Visual nên tiếp tục bám đúng design system, không tách thành phong cách khác.

## 12. Danh mục component cần thiết kế

Designer nên thiết kế đầy đủ component library cho app, ít nhất gồm:

- Button
- Input
- Card
- Loading
- Error state
- Modal
- Bottom sheet
- Badge
- Avatar
- Tab item
- Search bar
- Filter chip
- Category card
- Product card
- Product list item
- Cart item
- Quantity stepper
- Price block
- Order status badge
- Metric card
- Preference row
- Checkout form field

## 13. Trạng thái UI bắt buộc phải có

Theo yêu cầu bài, bộ thiết kế không chỉ có trạng thái “đẹp nhất”, mà phải có đủ trạng thái vận hành:

### 13.1. Loading state

- Loading trang chủ
- Loading danh sách sản phẩm
- Loading chi tiết sản phẩm
- Loading nút hành động
- Skeleton cho card hoặc chi tiết

### 13.2. Empty state

- Không có kết quả tìm kiếm
- Chưa có sản phẩm yêu thích
- Giỏ hàng trống
- Chưa có lịch sử đơn hàng

### 13.3. Error state

- Lỗi tải dữ liệu
- Lỗi mạng
- Retry state
- Lỗi form validation

### 13.4. Interactive state

- Default
- Hover nếu cần cho web preview
- Pressed
- Active
- Disabled
- Selected
- Success
- Danger

## 14. Dữ liệu sản phẩm cần được phản ánh trong thiết kế

Khác với app shop thông thường, sản phẩm ở đây cần thể hiện rõ yếu tố kỹ thuật. Thiết kế nên có chỗ cho các trường dữ liệu sau:

- `name`
- `code`
- `vendor`
- `seller`
- `category`
- `highlight`
- `shortDescription`
- `overview`
- `price`
- `previousPrice`
- `rating`
- `reviews`
- `stock`
- `availability`
- `leadTime`
- `specs`
- `tags`
- `applications`
- `compatibility`

Điều này rất quan trọng vì app cần bán “thiết bị kỹ thuật”, không chỉ là hiển thị hình và giá.

## 15. Cách chuyển yêu cầu từ App Shop sang Embedded Shop

Một số yêu cầu trong đề gốc cần được hiểu lại theo ngữ cảnh của Embedded Shop:

- `size selector` có thể đổi thành chọn model, RAM hoặc package
- `color selector` có thể đổi thành revision, phiên bản hoặc chuẩn giao tiếp
- `seller info` nên mang cảm giác nhà cung cấp kỹ thuật hoặc lab partner
- `related products` nên là module tương thích hoặc phụ kiện đi kèm
- `best sellers`, `new arrivals`, `featured products` vẫn giữ nguyên logic nhưng đổi nội dung sang phần cứng nhúng

## 16. Nguyên tắc hình ảnh sản phẩm

Nếu có ảnh thật:

- Ưu tiên ảnh sạch, góc chụp rõ, nền gọn.
- Có thể chụp dạng top-down hoặc isometric nhẹ.
- Nên làm nổi bật bo mạch, chân cắm, connector, heatsink, camera, antenna, terminal block.

Nếu chưa có ảnh thật:

- Dùng illustration hoặc hardware glyph có phong cách thống nhất.
- Nên có cảm giác của PCB, chip, IO, khối module.
- Tránh icon generic quá đơn giản khiến sản phẩm mất chất kỹ thuật.

## 17. Motion và micro-interaction

App nên có chuyển động vừa phải, đủ tạo cảm giác hiện đại nhưng không phô trương.

Nên có:

- Fade in nhẹ cho section
- Slide up cho modal hoặc bottom sheet
- Scale nhẹ khi nhấn CTA
- Feedback rõ khi lưu sản phẩm hoặc thêm vào giỏ
- Chuyển theme mượt nhưng không nặng

Không nên có:

- Animation quá vui nhộn
- Bounce mạnh kiểu social app
- Glow quá nhiều gây cảm giác gaming

## 18. Accessibility và tính thực dụng

Thiết kế cần hỗ trợ tốt cho việc triển khai:

- Tương phản màu đủ mạnh
- Text rõ trên nền tối
- Touch target đủ lớn
- Form nhập liệu dễ dùng
- Có logic cho keyboard avoiding
- Có không gian cho label, hint, validation message
- Hỗ trợ safe area trên mobile

## 19. Phạm vi thiết kế nên bàn giao

Để đáp ứng tốt yêu cầu bài và có thể triển khai code thuận lợi, bộ UI nên bàn giao ít nhất:

1. Bộ màu và typography
2. Bộ spacing, radius, shadow
3. Component library
4. Splash screen
5. Home screen
6. Catalog / Search screen
7. Product detail screen
8. Favorites screen
9. Cart screen
10. Checkout screen
11. Profile screen
12. Order history screen
13. Settings screen
14. Loading / empty / error states
15. Bottom sheet / modal variants
16. Dark theme và light theme

## 20. Kết luận định hướng thiết kế

Embedded Shop phải được nhìn nhận như một **shop công nghệ dành cho giới kỹ thuật**, nơi người dùng cảm thấy họ đang chọn mua các phần cứng thật cho một hệ thống robot hoặc nhúng, chứ không phải đang lướt một cửa hàng tiêu dùng phổ thông.

Thiết kế cần hội tụ đủ 3 lớp:

- **Đẹp và có bản sắc**
- **Rõ thông tin kỹ thuật**
- **Đủ hệ thống để triển khai thành app hoàn chỉnh**

Nếu designer bám đúng tinh thần này, giao diện sẽ vừa phù hợp với yêu cầu bài tập App Shop, vừa tạo được bản sắc riêng mạnh mẽ cho dự án Embedded Shop.
