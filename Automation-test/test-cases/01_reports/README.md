# Phân Hệ Báo Cáo & Dashboard - Danh Mục Test Cases (Kèm Bộ Edge Cases Chi Tiết)

Thư mục này chứa toàn bộ các kịch bản kiểm thử chi tiết được thiết kế bám sát theo tài liệu **`FRD - [ADM-11] Admin Reports & Dashboard.md`** cho 5 chuyên trang phân tích số liệu của hệ thống DCOR Studio, bao gồm đầy đủ **Luồng thành công (Happy Path)** và **Toàn bộ các Trường hợp biên / Ngoại lệ (Edge Cases & Negative Scenarios)**.

---

## 📊 Tổng hợp Các Bộ Test Case (Đã Phủ Kín Edge Cases)

| STT | Mã Phân hệ | Tên Màn hình / Chức năng | Đường dẫn (URL) | Số lượng Test Case | Tài liệu chi tiết |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **01** | `ADM-11-DASH` | Bảng điều khiển Tổng quan (Dashboard) | `/admin/dashboard` | 15 Test Cases | [`TC_01_Dashboard.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/01_reports/TC_01_Dashboard.md) |
| **02** | `ADM-11-REV` | Báo cáo Doanh thu & Dòng tiền | `/admin/reports/revenue` | 15 Test Cases | [`TC_02_Report_Revenue.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/01_reports/TC_02_Report_Revenue.md) |
| **03** | `ADM-11-ORD` | Báo cáo Vận hành Đơn hàng | `/admin/reports/orders` | 12 Test Cases | [`TC_03_Report_Orders.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/01_reports/TC_03_Report_Orders.md) |
| **04** | `ADM-11-PROD` | Báo cáo Hiệu quả Sản phẩm | `/admin/reports/products` | 13 Test Cases | [`TC_04_Report_Products.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/01_reports/TC_04_Report_Products.md) |
| **05** | `ADM-11-CUST` | Báo cáo Khách hàng & Hội viên | `/admin/reports/customers` | 12 Test Cases | [`TC_05_Report_Customers.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/01_reports/TC_05_Report_Customers.md) |
| **TỔNG CỘNG** | | **5 Màn hình Báo cáo & Dashboard** | | **67 Test Cases** | |

---

## 📌 Các Nhóm Edge Cases Trọng tâm Đã Phủ Kín
1. **Toán học & Ngoại lệ Chia cho 0 (Division by Zero / Boundary Numbers):** Xử lý an toàn khi số liệu kỳ trước bằng 0, tỷ lệ chuyển đổi bằng 0, không bao giờ hiển thị `NaN%` hay `Infinity%`.
2. **Dòng tiền Âm (Negative Values):** Khi tiền hoàn/hủy lớn hơn doanh thu gộp trong kỳ, hệ thống hiển thị rõ ràng số âm màu đỏ mà không làm vỡ đồ họa.
3. **Giá trị Cực lớn (Extreme Numbers):** Doanh số lên đến hàng chục/trăm tỷ đồng được tự động co giãn font (Auto-scaling) và viết gọn (Tỷ / Triệu), không tràn khung viền.
4. **Bộ lọc Ngày Bất Hợp Lý (Invalid Date Ranges):** Bắt lỗi khi chọn Ngày bắt đầu > Ngày kết thúc.
5. **Chống Nhấp Chuột Liên Tục (Spam Click Debounce):** Chống giật biểu đồ khi nhấp đổi chu kỳ liên tục nhiều lần trong 1 giây.
6. **Bảo Mật Đầu Vào (Security & Sanitization):** Chống mã độc HTML / XSS trong ô tìm kiếm báo cáo.
7. **Lỗi Mạng & Mất Kết Nối (Network Failure / API 500):** Giao diện kích hoạt màn hình lỗi an toàn (Fallback UI) kèm nút "Thử lại (Retry)", không để trắng màn hình.
