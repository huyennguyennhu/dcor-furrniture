# ĐẶC TẢ HỆ THỐNG DASHBOARD QUẢN TRỊ THEO DÕI - DCOR STUDIO
> **Dự án**: DCOR Studio - Hệ thống Thương mại Điện tử & Quản trị Chuỗi Showroom Nội thất Cao cấp  
> **Tài liệu**: Đặc tả Yêu cầu Quản trị (Dashboard & Analytics Specification)  
> **Căn cứ kỹ thuật**: Prisma Schema, Backend Controllers (`report.controller.ts`, `admin-order`, `inventory`, `consultation`) & Frontend Angular `dcor-studio`.

---

## TỔNG QUAN CẤU TRÚC ĐIỀU HƯỚNG & MA TRẬN PHÂN VAI (STAKEHOLDER MATRIX)

### 1. Kiến trúc Điều hướng Menu Quản trị (Admin Sidebar Navigation)
Hệ thống báo cáo và bảng điều khiển được tổ chức thành các trang **độc lập trực tiếp trên Sidebar** (không sử dụng thanh tab chuyển đổi lặp lại bên trong trang để giữ giao diện thông thoáng, chuẩn Dashboard chuyên nghiệp):
* **Menu Tổng quan**: `/admin/dashboard` (đồng bộ `/admin/reports/overview`) - Dành cho Super Admin / CEO.
* **Menu Báo cáo & Thống kê** (Accordion Menu gồm 4 trang báo cáo chuyên sâu):
  * 📊 **Báo cáo Doanh thu & Dòng tiền**: `/admin/reports/revenue`
  * 📦 **Báo cáo đơn hàng**: `/admin/reports/orders`
  * 🛋️ **Báo cáo Sản phẩm & Xu hướng**: `/admin/reports/products`
  * 👥 **Báo cáo Khách hàng & Showroom**: `/admin/reports/customers`
* **Các trang nghiệp vụ chuyên trách liên kết**:
  * 🏬 **Quản trị Tồn kho & Chuỗi cung ứng**: `/admin/inventory`
  * 📅 **Lịch hẹn Showroom**: `/admin/appointments`
  * 🎨 **Thiết kế & Phối cảnh 3D**: `/admin/designs`

### 2. Ma trận Phân vai Người dùng (Stakeholder Matrix)

| Trang Báo cáo / Dashboard | URL Route | Stakeholder chính | Mục tiêu quản trị & Ra quyết định |
| :--- | :--- | :--- | :--- |
| **1. Executive Overview (Tổng quan)** | `/admin/dashboard` | **Super Admin / Ban Giám đốc (CEO/Store Owner)** | Nắm bắt toàn cảnh sức khỏe kinh doanh trong ngày/tuần: dòng tiền, tốc độ đơn, rủi ro kho và hiệu quả showroom. |
| **2. Báo cáo Doanh thu & Dòng tiền** | `/admin/reports/revenue` | **Kế toán trưởng / Quản lý Tài chính (CFO)** | Kiểm soát dòng tiền thực thu (Net Revenue), cơ cấu thanh toán (VNPAY/COD/Cọc 30%), rủi ro công nợ đơn hàng giá trị cao. |
| **3. Báo cáo đơn hàng** | `/admin/reports/orders` | **QL Đơn hàng (Order/Fulfillment Manager)** | Giải quyết điểm nghẽn xử lý đơn: đơn chờ duyệt cọc, đơn chờ QC xuất kho, tỷ lệ giao trễ/thất bại và luồng đổi trả/bảo hành. |
| **4. Báo cáo Sản phẩm & Xu hướng** | `/admin/reports/products` | **QL Sản phẩm / Merchandiser / Design Lead** | Tối ưu danh mục bán chạy (Best-sellers), vòng đời sản phẩm, hiệu quả chuyển đổi từ mẫu thiết kế 3D/Cộng đồng sang đơn hàng. |
| **5. Báo cáo Khách hàng & Showroom** | `/admin/reports/customers` | **Trưởng phòng Kinh doanh / Sales Lead / Support** | Quản lý quy mô khách, tỷ lệ lấp đầy ca tư vấn Showroom, chuyển đổi khách VIP, hiệu suất phản hồi Chat & CSKH. |
| **6. Quản trị Kho Vận & Chuỗi cung ứng** | `/admin/inventory` | **QL Kho (Warehouse & Inventory Manager)** | Kiểm soát xuất-nhập-tồn tại Kho Tổng và các Showroom, cảnh báo SKU chạm ngưỡng an toàn, độ lệch kiểm kê định kỳ. |

---

## PHẦN 1: TRANG DASHBOARD TỔNG QUAN (EXECUTIVE OVERVIEW)
* **Đường dẫn**: `/admin/dashboard` & `/admin/reports/overview`
* **Stakeholder chính**: **Super Admin / Ban Giám đốc (CEO/Store Owner)**
* **Mục tiêu**: Cung cấp bức tranh toàn cảnh "sức khỏe" doanh nghiệp trong vòng 30 giây để đưa ra chỉ đạo điều hành kịp thời.

### 1. Chỉ số KPIs & Khối Tác nghiệp Khẩn cấp (Actionable KPIs)
* **Tổng doanh thu thuần (Net Revenue)**: Doanh thu thực nhận sau khi trừ chiết khấu voucher và loại bỏ đơn hủy.
* **Tổng đơn hàng & Tỷ lệ hoàn tất (Fulfillment Rate)**: Tỷ lệ phần trăm đơn hoàn thành (`DELIVERED`/`COMPLETED`) trên tổng đơn phát sinh.
* **Giá trị đơn trung bình (AOV - Average Order Value)**: Đo lường mức chi trả trung bình cho một đơn hàng nội thất.
* **Đơn cọc/Đơn giá trị cao chờ duyệt**: Cảnh báo số đơn $\ge 50$ triệu hoặc hàng Custom may đo cần nhân viên xác nhận đã thu cọc tối thiểu $30\%$.
* **Cảnh báo SKU nguy cấp**: Số lượng mặt hàng có tồn kho vật lý bằng 0 hoặc dưới ngưỡng an toàn (`stock <= safetyThreshold`).
* **Lịch hẹn tư vấn Showroom hôm nay**: Số lượt khách đã đặt lịch trải nghiệm thực tế tại Showroom trong ngày.

### 2. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Đường kép: Xu hướng Doanh thu so với Kỳ trước (Revenue vs Previous Period Line Chart)**
   * *Loại chart*: Multi-line Chart (Đường kép có vùng phủ gradient).
   * *Trục X*: Mốc thời gian (Giờ trong ngày, hoặc các ngày trong tuần/tháng).
   * *Trục Y*: Doanh thu (triệu VNĐ).
   * *Dữ liệu hiển thị*: Đường thực tế kỳ hiện tại (xanh đậm) song hành cùng đường kỳ trước (xám nét đứt) để nhận biết ngay đà tăng trưởng.
2. **Biểu đồ Cột chồng: Phân bổ Doanh số theo Kênh & Showroom (Sales by Channel & Showroom Stacked Bar)**
   * *Loại chart*: Stacked Bar Chart.
   * *Trục X*: Các đơn vị kinh doanh (Online Web Store, Flagship Showroom Q.1, Showroom Thủ Đức).
   * *Trục Y*: Doanh thu đóng góp.
   * *Ý nghĩa*: Đánh giá kênh nào đang là đầu kéo doanh số chính của chuỗi.
3. **Biểu đồ Tròn: Cơ cấu Trạng thái Đơn hàng (Order Status Doughnut Chart)**
   * *Loại chart*: Doughnut / Pie Chart.
   * *Phân đoạn*: Hoàn thành (`DELIVERED`), Đang xử lý/Giao (`PROCESSING`/`SHIPPED`), Chờ xác nhận/cọc (`PENDING`), Đã hủy (`CANCELLED`).
   * *Ý nghĩa*: Giám sát tỷ lệ đơn bị nghẽn trong khâu vận hành.
4. **Biểu đồ Phễu: Tỷ lệ Chuyển đổi Khách hàng (Conversion Funnel Chart)**
   * *Loại chart*: Horizontal Funnel Chart.
   * *Các tầng phễu*: Lượt truy cập web $\rightarrow$ Xem chi tiết sản phẩm $\rightarrow$ Thêm giỏ hàng $\rightarrow$ Đặt lịch hẹn/Bấm thanh toán $\rightarrow$ Đơn hàng thành công.
   * *Ý nghĩa*: Phát hiện điểm rơi của khách hàng trên hành trình mua sắm.

### 3. Bộ lọc Dữ liệu (Filters)
* **Khoảng thời gian (Time Range)**: Hôm nay (`today`), 7 ngày qua (`7_days`), Tháng này (`month`), Quý này, và Tùy chỉnh ngày (`startDate` - `endDate`).
* **Chu kỳ hiển thị (Interval)**: Theo Giờ, Theo Ngày, Theo Tuần, Theo Tháng.
* **Chi nhánh / Showroom**: Tất cả Showroom, Showroom Flagship Quận 1 (`SR_Q1`), Showroom Thủ Đức (`SR_THU_DUC`), Kho Tổng HCM.
* **Kênh phát sinh đơn**: Tất cả, Website trực tuyến, Khách ghé Showroom.
* **Toggle So sánh kỳ trước**: Bật/tắt đường tham chiếu quá khứ.

### 4. Kịch bản Drill-down
* **Click vào Thẻ "SKU sắp hết hàng"** $\rightarrow$ Điều hướng sang `/admin/inventory` với bộ lọc tự động `status=LOW_STOCK`, hiển thị danh sách kèm nút tắt "Lập lệnh nhập kho".
* **Click vào Thẻ "Đơn chờ duyệt cọc"** $\rightarrow$ Điều hướng sang `/admin/orders` với bộ lọc `status=PENDING&isHighValue=true` để kế toán/CSKH kiểm tra ủy nhiệm chi và duyệt đơn.
* **Click vào Thẻ "Lịch hẹn hôm nay"** $\rightarrow$ Mở `/admin/appointments` lọc theo ngày hiện tại để bố trí nhân sự đón khách.
* **Click vào một Showroom trên Biểu đồ phân bổ doanh số** $\rightarrow$ Lọc toàn bộ trang Overview theo riêng Showroom đó.

---

## PHẦN 2: CÁC DASHBOARD CHUYÊN BIỆT PHỤC VỤ QUẢN LÝ TỪNG PHÂN HỆ

---

### 1. Dashboard Quản trị Doanh thu & Dòng tiền
* **Đường dẫn**: `/admin/reports/revenue`
* **Stakeholder chính**: **Kế toán trưởng / Giám đốc Tài chính (CFO) / Ban Quản trị**
* **Mục tiêu**: Kiểm soát dòng tiền thực thu, cơ cấu thanh toán và hiệu quả tài chính của từng dòng sản phẩm.

#### A. Chỉ số KPIs trọng tâm
* **Doanh thu gộp (Gross Sales)**: Tổng giá trị hàng bán trước chiết khấu.
* **Tổng chiết khấu Khuyến mãi/Voucher (Discounts & Promo Loss)**: Giá trị giảm trừ khuyến mãi.
* **Doanh thu thuần (Net Revenue)**: Doanh thu thực tế doanh nghiệp ghi nhận.
* **Giá trị Đơn hàng trung bình (AOV)** & Tốc độ tăng trưởng doanh thu so với kỳ trước.
* **Số dư Công nợ / Đơn hàng chưa thu đủ 100% (Pending Receivables)**: Các đơn trả góp hoặc đơn hàng custom mới cọc 30-50%.

#### B. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Cột & Đường hỗn hợp: Doanh thu thuần & Tỷ lệ Chiết khấu (Net Revenue vs Discount Rate Combo Chart)**
   * *Loại chart*: Combo Bar & Line Chart (Cột: Doanh thu thuần; Đường: % Chiết khấu/Doanh thu gộp).
   * *Trục X*: Thời gian (Ngày/Tuần/Tháng).
   * *Trục Y1*: Doanh thu (triệu VNĐ); *Trục Y2*: % Chiết khấu khuyến mãi.
   * *Ý nghĩa*: Đánh giá chương trình khuyến mãi có thực sự kéo doanh thu hay đang làm xói mòn biên lợi nhuận.
2. **Biểu đồ Tròn: Cơ cấu Phương thức Thanh toán (Payment Method Breakdown Doughnut)**
   * *Loại chart*: Doughnut Chart.
   * *Phân khúc*: VNPAY/Thẻ trực tuyến, Chuyển khoản ngân hàng trực tiếp, Tiền mặt khi giao hàng (COD), Trả góp qua thẻ.
   * *Ý nghĩa*: Theo dõi lượng tiền mặt đang bị các đối tác vận chuyển giam giữ (dòng tiền COD chờ đối soát).
3. **Biểu đồ Cột ngang: Doanh thu theo Danh mục cấp 1 & Bộ sưu tập (Revenue by Category Bar Chart)**
   * *Loại chart*: Horizontal Bar Chart (Sắp xếp giảm dần).
   * *Trục Y*: Danh mục (Sofa phòng khách, Giường ngủ, Bàn ghế ăn, Kệ tủ tivi, Đèn trang trí...).
   * *Trục X*: Doanh thu đạt được.
   * *Ý nghĩa*: Xác định nhóm hàng nào đóng vai trò "nồi cơm điện" của thương hiệu.
4. **Biểu đồ Bản đồ Nhiệt / Phân bổ Địa lý: Doanh số theo Tỉnh thành & Khu vực (Regional Sales Heatmap/Bar)**
   * *Loại chart*: Bar Chart hoặc Geo Map.
   * *Trục X*: Tỉnh thành/Khu vực (TP.HCM, Hà Nội, Đà Nẵng, Bình Dương, Đồng Nai...).
   * *Trục Y*: Doanh thu phát sinh.
   * *Ý nghĩa*: Đánh giá mức độ phủ sóng thị trường ngoài các showroom hiện hữu.

#### C. Bộ lọc Dữ liệu
* Thời gian (Ngày / Tuần / Tháng / Quý / Năm / Tùy chọn).
* Showroom / Chi nhánh bán hàng.
* Phương thức thanh toán (COD, Chuyển khoản, VNPAY, Trả góp).
* Danh mục sản phẩm (Category) & Bộ sưu tập (Collection).

#### D. Kịch bản Drill-down
* **Click vào lát cắt "COD"** $\rightarrow$ Mở danh sách đơn hàng COD đang ở trạng thái `DELIVERED` để đối soát với biên bản của đơn vị vận chuyển.
* **Click vào một Danh mục cụ thể (ví dụ: Sofa)** $\rightarrow$ Drill-down xem biểu đồ phân rã theo Danh mục con (Sofa góc L, Sofa văng, Sofa băng đơn).

---

### 2. Dashboard Quản trị Vận hành & Đơn hàng
* **Đường dẫn**: `/admin/reports/orders` & `/admin/orders`
* **Stakeholder chính**: **Trưởng phòng Vận hành Đơn (Order/Fulfillment Manager) & Điều phối viên**
* **Mục tiêu**: Xóa bỏ các điểm nghẽn trong chu trình đơn hàng, giảm thiểu tỷ lệ hủy đơn và tối ưu thời gian giao nhận.

#### A. Chỉ số KPIs trọng tâm
* **Tổng lượng đơn tiếp nhận (Incoming Orders)**.
* **Tỷ lệ Hoàn tất Đơn hàng (OTIF - On-Time In-Full Rate)**: Tỷ lệ giao đúng hạn và đủ hàng.
* **Thời gian xử lý đơn trung bình (Average Fulfillment Lead-Time)**: Thời gian từ lúc khách bấm Đặt $\rightarrow$ Bàn giao đơn vị vận chuyển.
* **Tỷ lệ Hủy đơn (Cancellation Rate)** kèm tỷ lệ Đơn đổi trả / Bảo hành (`Return & Warranty Rate`).
* **Số ca giao hàng thất bại cần xử lý (Pending Re-delivery Attempts)**.

#### B. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Thác nước / Trạng thái Vòng đời Đơn hàng (Order Lifecycle Waterfall/Funnel Chart)**
   * *Loại chart*: Funnel hoặc Stacked Process Bar Chart.
   * *Các bước luân chuyển*: Chờ xác nhận (`PENDING`) $\rightarrow$ Đã xác nhận (`CONFIRMED`) $\rightarrow$ Đang đóng gói & Kiểm tra chất lượng (`PROCESSING`/`READY_TO_SHIP`) $\rightarrow$ Đang giao hàng (`SHIPPED`) $\rightarrow$ Giao thành công (`DELIVERED`) $\rightarrow$ Hoàn tất đơn (`COMPLETED`).
   * *Ý nghĩa*: Định vị chính xác khâu nào đang bị ứ đọng hàng hóa (đặc biệt là khâu QC bọc màng bảo vệ nội thất).
2. **Biểu đồ Cột nhóm: Đơn phát sinh vs Đơn hoàn tất theo ngày (Created vs Completed Orders Multi-bar Chart)**
   * *Loại chart*: Grouped Bar Chart.
   * *Trục X*: Các ngày trong tuần/tháng.
   * *Cột 1*: Số đơn mới tạo; *Cột 2*: Số đơn đóng gói giao thành công.
   * *Ý nghĩa*: Đánh giá năng lực xử lý đơn của kho có bắt kịp tốc độ bán của đội Sales hay không.
3. **Biểu đồ Tròn: Phân tích Nguyên nhân Hủy đơn (Cancellation Root Causes Pie Chart)**
   * *Loại chart*: Pie Chart.
   * *Lát cắt nguyên nhân*: Khách đổi ý, Thời gian giao hàng quá lâu, Sai thông tin địa chỉ, Hết hàng/Chậm sản xuất, Không liên lạc được sau 3 cuộc gọi.
   * *Ý nghĩa*: Cung cấp cơ sở cho Sales & Kho khắc phục tỷ lệ rớt đơn.
4. **Biểu đồ Cột ngang: Hiệu suất Đơn vị Vận chuyển (Carrier Performance Comparison Bar Chart)**
   * *Loại chart*: Horizontal Bar Chart.
   * *Trục Y*: Đơn vị vận chuyển (Đội xe nội bộ Showroom, Giao Hàng Nhanh, Viettel Post...).
   * *Chỉ số*: Tỷ lệ giao đúng hẹn (%) và tỷ lệ làm trầy xước/hư hỏng hàng hóa (%).
   * *Ý nghĩa*: Quyết định phân bổ lượng đơn cho đối tác vận tải phù hợp.

#### C. Bộ lọc Dữ liệu
* Toàn bộ trạng thái đơn nội bộ (từ `PENDING` đến `RETURNED`).
* Loại đơn hàng: Đơn thông thường vs Đơn giá trị cao / Đơn may đo Custom (`isCustomDesign=true`).
* Đơn vị vận chuyển (Nội bộ vs 3PL).
* Kho/Showroom phụ trách xuất hàng.

#### D. Kịch bản Drill-down
* **Click vào thanh "Giao thất bại (`FAILED_DELIVERY`)"** $\rightarrow$ Mở bảng danh sách gồm: Tên tài xế, SĐT khách, số lần thử giao và lý do giao thất bại để nhân viên CSKH gọi hỗ trợ ngay.
* **Click vào chỉ số "Yêu cầu đổi trả (`RETURN_REQUESTED`)"** $\rightarrow$ Dẫn trực tiếp sang `/admin/orders/returns/:id` để kiểm tra hình ảnh lỗi sản phẩm do khách tải lên và duyệt phương án bồi hoàn.

---

### 3. Dashboard Quản trị Kho Vận & Chuỗi Cung Ứng
* **Đường dẫn**: `/admin/inventory`
* **Stakeholder chính**: **Trưởng phòng Kho Vận (Warehouse Manager) & Thủ kho chi nhánh**
* **Mục tiêu**: Duy trì định mức tồn kho tối ưu, chống đứt gãy nguồn cung các mã Best-seller và ngăn ngừa thất thoát hàng hóa.

#### A. Chỉ số KPIs trọng tâm
* **Tổng giá trị vốn hàng tồn kho (Total Inventory Valuation - Cost Basis)**.
* **Số lượng mã SKU báo động Hết hàng (Stockout)**: `stock = 0`.
* **Số lượng mã SKU Chạm ngưỡng an toàn (Low Stock Alerts)**: $0 < \text{stock} \le \text{safetyThreshold}$.
* **Tỷ lệ hàng chậm luân chuyển / Hàng tồn chết (Dead Stock Ratio)**: Hàng lưu kho $> 60$ ngày không có giao dịch bán.
* **Tỷ lệ sai lệch kiểm kê định kỳ (Audit Discrepancy Rate)**: Tỷ lệ chênh lệch giữa kiểm đếm thực tế và sổ sách hệ thống.

#### B. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Cột xếp chồng: Cơ cấu Tồn kho theo từng Điểm lưu kho (Stock Distribution by Location Stacked Bar)**
   * *Loại chart*: Stacked Bar Chart.
   * *Trục X*: Các kho (Kho Tổng HCM, Showroom Q.1, Showroom Thủ Đức).
   * *Phân tầng*: Tồn an toàn (Xanh lá), Tồn sắp hết (Vàng), Tồn đọng chậm luân chuyển (Xám).
   * *Ý nghĩa*: Cân bằng tồn kho giữa các showroom, tránh trường hợp Showroom Q.1 cháy hàng trong khi Showroom Thủ Đức dư thừa.
2. **Biểu đồ Cột 2 chiều: Biến động Xuất - Nhập - Tồn theo Tuần (Inbound vs Outbound Inventory Flow)**
   * *Loại chart*: Bi-directional Bar Chart (hoặc Multi-line Chart).
   * *Trục X*: Thời gian theo tuần.
   * *Trục Y dương (+)*: Lượng hàng nhập kho (từ nhà sản xuất); *Trục Y âm (-)*: Lượng hàng xuất bán/xuất showroom.
   * *Ý nghĩa*: Theo dõi xu hướng lưu chuyển hàng hóa vào - ra kho.
3. **Biểu đồ Tán xạ: Phân tích Ma trận ABC Tồn kho (Inventory Velocity vs Value Scatter Plot)**
   * *Loại chart*: Scatter Plot (Ma trận 4 góc phần tư).
   * *Trục X*: Tốc độ bán (Vòng quay tồn kho - Turnover Rate).
   * *Trục Y*: Giá trị tồn kho của mã hàng (VNĐ).
   * *Ý nghĩa*: Nhận diện nhóm A (Giá trị cao, bán nhanh - cần canh tồn sát sao) và nhóm C (Giá trị cao, bán chậm - cần kế hoạch thanh lý).
4. **Biểu đồ Cột: Chênh lệch Kiểm kê qua các Đợt (Stock Audit Variance Bar Chart)**
   * *Loại chart*: Clustered Bar Chart.
   * *Trục X*: Các đợt kiểm kê định kỳ (Tháng 8, Tháng 9, Tháng 10...).
   * *Chỉ số*: Số lượng thừa (Surplus) vs Số lượng thiếu (Deficit).
   * *Ý nghĩa*: Giám sát mức độ thất thoát và tính kỷ luật vận hành của đội ngũ thủ kho.

#### C. Bộ lọc Dữ liệu
* Kho lưu trữ (`Warehouse`: Kho Tổng HCM, SR Q.1, SR Thủ Đức).
* Tình trạng tồn kho (Hết hàng, Dưới ngưỡng an toàn, Đủ tồn, Tồn đọng quá hạn).
* Trạng thái Lệnh kho (Nháp, Đang vận chuyển điều chuyển, Đã hoàn tất nhập/xuất).
* Danh mục sản phẩm & Nhà cung cấp.

#### D. Kịch bản Drill-down
* **Click vào SKU cảnh báo Đỏ (Hết hàng / Sắp hết)** $\rightarrow$ Mở Drawer hiển thị ngay **Thẻ kho (Stock Card)** kèm nút bấm nhanh *[Tạo Lệnh Nhập Kho / Tạo Lệnh Điều Chuyển Kho]* đã điền sẵn thông tin sản phẩm.
* **Click vào một Đợt kiểm kê có sai lệch** $\rightarrow$ Dẫn vào chi tiết phiếu kiểm kê (`StockAuditItem`) để đối chiếu từng mặt hàng chênh lệch thực tế vs hệ thống.

---

### 4. Dashboard Quản trị Sản phẩm & Thiết kế 3D
* **Đường dẫn**: `/admin/reports/products` & `/admin/designs`
* **Stakeholder chính**: **Quản lý Sản phẩm (Merchandiser / Product Manager) & Trưởng nhóm Thiết kế Không gian (3D Room Planner Lead)**
* **Mục tiêu**: Nhận diện xu hướng thiết kế nội thất được ưa chuộng, tối ưu hóa vòng đời sản phẩm và thúc đẩy doanh số từ công cụ 3D Planner.

#### A. Chỉ số KPIs trọng tâm
* **Top 10 Sản phẩm Doanh thu cao nhất vs Top 10 Sản phẩm Bán chạy nhất (Số lượng)**.
* **Tỷ trọng doanh thu từ Sản phẩm Mới (`isNew=true`)**: Đo lường sức sống của danh mục sản phẩm mới ra mắt.
* **Lượt thiết kế 3D hoàn tất từ người dùng (`UserDesign`)**: Số bản vẽ phối cảnh 3D khách tự xếp đồ nội thất.
* **Tỷ lệ gắn thẻ sản phẩm thành đơn (Tagged Product Conversion Rate)**: Tỷ lệ khách xem các bài đăng cộng đồng thiết kế (`DesignPost`) và click mua sản phẩm được gắn thẻ (Tag).

#### B. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Cột ngang kép: Top 10 Sản phẩm - Doanh thu vs Số lượng bán (Top Products Revenue & Volume Bar Chart)**
   * *Loại chart*: Dual Horizontal Bar Chart.
   * *Trục Y*: Danh sách sản phẩm (Sofa Indivi, Giường Osaka, Bàn Milano...).
   * *Thanh 1*: Doanh thu (triệu VNĐ); *Thanh 2*: Số lượng đã bán (chiếc).
   * *Ý nghĩa*: Nhận biết sản phẩm bán chạy nhờ giá rẻ số lượng lớn hay nhờ giá trị đơn cao.
2. **Biểu đồ Cây: Đóng góp Doanh số theo Danh mục & Phong cách (Category & Style Treemap)**
   * *Loại chart*: Treemap Chart (Phân cấp theo diện tích ô vuông).
   * *Diện tích ô*: Tỷ trọng đóng góp doanh thu của từng nhóm (Scandinavian, Minimalism, Hiện đại, Tân cổ điển...).
   * *Ý nghĩa*: Trực quan hóa cơ cấu danh mục mặt hàng theo phong cách thiết kế chủ đạo.
3. **Biểu đồ Đường: Xu hướng Tương tác Thiết kế 3D theo Thời gian (3D Room Planner Engagement Line Chart)**
   * *Loại chart*: Multi-line Chart.
   * *Trục X*: Thời gian (các tuần trong quý).
   * *Đường 1*: Số bản vẽ 3D mới tạo; *Đường 2*: Số bài đăng cộng đồng được duyệt; *Đường 3*: Lượt click mua hàng từ bản phối cảnh.
   * *Ý nghĩa*: Đo lường mức độ hiệu quả của tính năng Room Planner 3D trong việc tạo cảm hứng mua sắm.
4. **Biểu đồ Tròn: Phân bổ Tương tác theo Loại Không gian (Room Type Engagement Pie Chart)**
   * *Loại chart*: Donut Chart.
   * *Phân khúc*: Phòng khách, Phòng ngủ, Phòng ăn, Phòng làm việc.
   * *Ý nghĩa*: Giúp đội ngũ R&D và thiết kế biết khách hàng đang tập trung tìm kiếm giải pháp cho không gian nào nhiều nhất.

#### C. Bộ lọc Dữ liệu
* Cây phân cấp danh mục (Danh mục cha $\rightarrow$ Danh mục con).
* Thuộc tính sản phẩm (Hàng Best-seller, Hàng mới ra mắt, Hàng xả kho).
* Trạng thái bài đăng thiết kế (Chờ duyệt, Đã xuất bản, Từ chối).
* Loại không gian mẫu (`RoomTemplate`: Phòng khách, Phòng ngủ, Phòng ăn).

#### D. Kịch bản Drill-down
* **Click vào một Sản phẩm trong bảng Top Best-sellers** $\rightarrow$ Mở bảng phân tích sâu theo từng biến thể (`Variant`: Kích thước 2m vs 2m4; Chất liệu Vải nỉ vs Da Microfiber; Màu sắc Be vs Xám).
* **Click vào bài đăng thiết kế cộng đồng có lượt tương tác cao** $\rightarrow$ Xem danh sách các sản phẩm gắn thẻ được xem nhiều nhất để đưa ra chương trình combo khuyến mãi.

---

### 5. Dashboard Quản trị Khách hàng, Lịch tư vấn & CSKH
* **Đường dẫn**: `/admin/reports/customers`, `/admin/appointments`, `/admin/chat`
* **Stakeholder chính**: **Trưởng phòng Kinh doanh (Sales Manager) & Trưởng nhóm Chăm sóc Khách hàng (Support Lead)**
* **Mục tiêu**: Tối ưu hóa giá trị vòng đời khách hàng (CLV), tỷ lệ lấp đầy ca tư vấn Showroom và chất lượng hỗ trợ tư vấn viên.

#### A. Chỉ số KPIs trọng tâm
* **Tổng quy mô khách hàng & Số khách hàng mới đăng ký trong kỳ**.
* **Tỷ lệ khách mua hàng lặp lại (Repeat Purchase Rate)**.
* **Tỷ lệ Lấp đầy Ca tư vấn Showroom (Slot Utilization Rate)**: Tỷ lệ ca đã được đặt / Tổng công suất tiếp khách tối đa của Showroom.
* **Tỷ lệ chuyển đổi Lịch tư vấn thành Đơn hàng (Appointment-to-Sale Conversion Rate)**: Tỷ lệ khách sau khi ghé Showroom tư vấn ký hợp đồng mua hàng.
* **Hiệu suất Trực Chat (Livechat & Handoff)**: Số lượt hội thoại cần can thiệp của nhân viên (`needsHuman = true`) và Thời gian phản hồi lần đầu (First Response Time).

#### B. Danh sách Biểu đồ trực quan (Charts)
1. **Biểu đồ Cột phân tầng: Cơ cấu Hạng thành viên & Giá trị Đóng góp (Customer Tier & Value Pyramid/Bar)**
   * *Loại chart*: Stacked Bar Chart hoặc Pyramid Chart.
   * *Các tầng thành viên*: Kim Cương ($\ge 200$tr), Vàng ($\ge 80$tr), Bạc ($\ge 30$tr), Thành viên phổ thông ($< 30$tr).
   * *Ý nghĩa*: Thể hiện quy luật 80/20: Nhóm khách VIP (Kim cương/Vàng) chiếm bao nhiêu % doanh thu toàn hệ thống.
2. **Biểu đồ Nhiệt: Lịch tư vấn Showroom theo Khung giờ trong Tuần (Showroom Appointment Heatmap)**
   * *Loại chart*: Heatmap Chart (Ma trận nhiệt độ màu).
   * *Trục X*: Các ngày trong tuần (Thứ 2 $\rightarrow$ Chủ Nhật).
   * *Trục Y*: Các ca tư vấn (09:00 - 10:30, 10:30 - 12:00, 14:00 - 15:30, 16:00 - 17:30, 18:30 - 20:00).
   * *Màu sắc*: Đậm dần theo số lượng khách đặt hẹn.
   * *Ý nghĩa*: Phân bổ lịch trực của các kiến trúc sư / nhân viên tư vấn Showroom vào các khung giờ cao điểm (thường là chiều Thứ 7 & Chủ Nhật).
3. **Biểu đồ Cột đôi: Tỷ lệ Đến hẹn vs Hủy hẹn theo Chi nhánh (Appointment Attendance Rate by Showroom)**
   * *Loại chart*: Grouped Bar Chart.
   * *Trục X*: Các Showroom (`SR_Q1`, `SR_THU_DUC`).
   * *Cột 1*: Khách đến đúng hẹn (Show-up); *Cột 2*: Khách hủy hoặc vắng mặt không báo trước (No-show).
   * *Ý nghĩa*: Nhắc nhở nhân viên CSKH tăng cường gọi điện xác nhận lịch hẹn trước 2 tiếng.
4. **Biểu đồ Vùng: Tốc độ Tăng trưởng Khách hàng Mới (New Customer Acquisition Area Chart)**
   * *Loại chart*: Area Chart (Vùng diện tích).
   * *Trục X*: Thời gian theo ngày/tuần.
   * *Trục Y*: Số tài khoản đăng ký mới.
   * *Ý nghĩa*: Đo lường hiệu quả thu hút khách hàng từ các chiến dịch truyền thông.
5. **Biểu đồ Đo lường Đồng hồ: Tỷ lệ Chuyển giao Chatbot sang Nhân viên (Bot Handoff Gauge Chart)**
   * *Loại chart*: Radial Gauge Chart (Đồng hồ tốc độ).
   * *Chỉ số*: Tỷ lệ cuộc trò chuyện tự động giải quyết được (%) vs Tỷ lệ phải chuyển tiếp cho tư vấn viên (%).
   * *Ý nghĩa*: Giám sát độ thông minh của kịch bản Chatbot Script và phát hiện các trường hợp Bot bế tắc.

#### C. Bộ lọc Dữ liệu
* Hạng thành viên (Kim cương, Vàng, Bạc, Mới).
* Showroom khách đăng ký tư vấn (`SR_Q1` vs `SR_THU_DUC`).
* Trạng thái ca tư vấn (Đã xác nhận, Đang diễn ra, Đã hoàn tất, Đã hủy).
* Loại tài khoản (Khách lẻ RETAIL vs Khách dự án/doanh nghiệp B2B).

#### D. Kịch bản Drill-down
* **Click vào tầng "Khách hàng Kim Cương"** $\rightarrow$ Mở bảng hồ sơ khách VIP 360 độ (SĐT, tổng chi tiêu, lịch sử đơn, phong cách ưa thích) để phân công chuyên viên chăm sóc riêng.
* **Click vào ô màu đậm trên Heatmap Lịch tư vấn** $\rightarrow$ Mở danh sách khách hàng đặt lịch trong ca giờ đó để kiểm tra việc chuẩn bị nước uống, mẫu vật liệu và phòng tiếp khách.

---

## PHẦN 3: ĐÁNH GIÁ KHOẢNG VÊNH CODEBASE & ĐỀ XUẤT NÂNG CẤP THỰC TẾ

| Hạng mục | Hiện trạng Codebase (BE / dcor-studio) | Đề xuất nâng cấp tinh chỉnh tối ưu |
| :--- | :--- | :--- |
| **Trang `/admin/dashboard`** | Đang redirect thẳng vào `reports/overview`. | **Giữ nguyên định tuyến này** (không tách riêng gây trùng lặp). Bổ sung thêm **Khối Cảnh báo Tác nghiệp khẩn cấp** (Đơn cọc chờ duyệt, Lịch hẹn hôm nay, SKU hết hàng) ngay trên đầu trang để người quản lý vào là thấy việc cần làm ngay. |
| **Lọc Showroom Backend** | `report.controller.ts` đang lọc tạm theo chuỗi tên tỉnh thành `province` (Hồ Chí Minh, Hà Nội...). | Chuẩn hóa query khớp trực tiếp với bảng `Warehouse` (`code` như `SR_Q1`, `SR_THU_DUC`, `CENTRAL_WAREHOUSE`) theo đúng mô hình chuỗi showroom trong DB. |
| **Tương tác Drill-down** | Các biểu đồ Chart.js và thẻ KPI hiện tại chỉ là hiển thị tĩnh, chưa gắn sự kiện click. | Bổ sung directive bắt sự kiện click trên chart và KPI card để gọi `router.navigate` kèm query params tương ứng sang trang danh sách (Orders, Inventory, Appointments). |
| **Mảng May đo & Lịch hẹn** | Dashboard hiện tập trung nhiều vào bán lẻ sản phẩm có sẵn, chưa làm nổi bật mảng Custom Design & Lịch hẹn Showroom. | Bổ sung 2 chỉ số đặc thù của Dcor vào tổng quan: **Tỷ lệ chuyển đổi lịch tư vấn Showroom** và **Tiến độ các đơn cọc may đo (`isCustomDesign`)**. |
