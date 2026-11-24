# Phân Hệ Quản Trị Đơn Hàng, May Đo, Đổi Trả & Bảo Hành - Danh Mục Test Cases (Kèm Edge Cases)

Thư mục này chứa toàn bộ các kịch bản kiểm thử chi tiết được thiết kế bám sát theo tài liệu **`FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management.md`** cho 5 chuyên trang quản trị đơn hàng và dịch vụ hậu mãi của hệ thống DCOR Studio, bao gồm cả **Happy Path** và **Toàn bộ Edge Cases / Boundary Limits / Policy Exceptions**.

---

## 📊 Tổng hợp Toàn bộ Các Bộ Test Case

| STT | Mã Phân hệ | Tên Màn hình / Chức năng | Đường dẫn (URL) | Số lượng Test Case | Tài liệu chi tiết |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **01** | `ADM-ORD-LIST` | Danh sách Đơn hàng & Đường ống 7 Chặng | `/admin/orders` | 15 Test Cases | [`TC_01_Orders_List.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/03_orders_warranty/TC_01_Orders_List.md) |
| **02** | `ADM-CUSTOM-REQ` | Đơn May đo & Sản xuất Custom | `/admin/custom-requests` | 09 Test Cases | [`TC_02_Custom_Requests.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/03_orders_warranty/TC_02_Custom_Requests.md) |
| **03** | `ADM-ORD-RETURNS` | Yêu cầu Đổi trả trong 72 Giờ | `/admin/orders/returns` | 11 Test Cases | [`TC_03_Order_Returns.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/03_orders_warranty/TC_03_Order_Returns.md) |
| **04** | `ADM-ORD-WARRANTY` | Hồ sơ Bảo hành Điện tử | `/admin/orders/warranty` | 11 Test Cases | [`TC_04_Order_Warranty.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/03_orders_warranty/TC_04_Order_Warranty.md) |
| **05** | `ADM-ORD-SETTINGS` | Cài đặt Đơn hàng & Biểu phí | `/admin/orders/settings` | 08 Test Cases | [`TC_05_Order_Settings.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/03_orders_warranty/TC_05_Order_Settings.md) |
| **TỔNG CỘNG** | | **5 Màn hình Nghiệp vụ Trọng tâm** | | **54 Test Cases** | |

---

## 📌 Các Nhóm Edge Cases Trọng tâm Đã Phủ Kín
1. **Biên Giới Thời Gian 72 Giờ (Time Boundary 71h59m):** Xử lý yêu cầu gửi ở giây phút sát nút hạn chót; chặn sau khi quá hạn.
2. **Loại Trừ Chính Sách May Đo & Đổi Trả:** Xử lý yêu cầu đổi trả đối với hàng custom sản xuất riêng theo kích thước phòng.
3. **Thanh Toán Cọc Thiếu:** Cảnh báo khi khách chuyển khoản cọc nhỏ hơn mức 30% tối thiểu quy định.
4. **Hủy Đơn Hàng Đang Vận Chuyển:** Quy trình điều xe quay đầu thu hồi hàng an toàn khi khách hủy đơn giữa đường.
5. **Ngoại Lệ Bảo Hành Do Thiên Tai / Ngập Lụt:** Áp dụng điều khoản loại trừ hư hại do tác động ngoại cảnh bất khả kháng.
