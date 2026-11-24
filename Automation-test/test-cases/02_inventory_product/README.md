# Phân Hệ Quản Trị Khách Hàng, Sản Phẩm & Tồn Kho - Danh Mục Test Cases (Kèm Edge Cases)

Thư mục này chứa toàn bộ các kịch bản kiểm thử chi tiết được thiết kế bám sát theo tài liệu **`FRD - [ADM-Master] Product, Inventory & Customer Management.md`** cho 8 chuyên trang quản trị trọng yếu thuộc hệ sinh thái DCOR Studio, bao gồm cả **Happy Path** và **Toàn bộ Edge Cases / Boundary Values / Validation Errors**.

---

## 📊 Tổng hợp Toàn bộ Các Bộ Test Case

| STT | Mã Phân hệ | Tên Màn hình / Chức năng | Đường dẫn (URL) | Số lượng Test Case | Tài liệu chi tiết |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **01** | `ADM-CUST` | Quản trị Khách hàng | `/admin/customers` | 15 Test Cases | [`TC_01_Customers.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_01_Customers.md) |
| **02** | `ADM-PROD-CATALOG` | Danh sách Sản phẩm | `/admin/products` | 16 Test Cases | [`TC_02_Products.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_02_Products.md) |
| **03** | `ADM-PROD-CAT` | Quản lý Danh mục & Phân cấp | `/admin/products/categories` | 11 Test Cases | [`TC_03_Categories.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_03_Categories.md) |
| **04** | `ADM-INV-OVERVIEW` | Tổng quan Kho | `/admin/inventory` | 11 Test Cases | [`TC_04_Inventory_Overview.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_04_Inventory_Overview.md) |
| **05** | `ADM-INV-AUDIT` | Kiểm kê Kho & Cân bằng | `/admin/inventory/audit` | 12 Test Cases | [`TC_05_Inventory_Audit.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_05_Inventory_Audit.md) |
| **06** | `ADM-INV-TRANS` | Lệnh Xuất - Nhập Kho | `/admin/inventory/transactions` | 12 Test Cases | [`TC_06_Inventory_Transactions.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_06_Inventory_Transactions.md) |
| **07** | `ADM-INV-HISTORY` | Lịch sử Biến động Kho | `/admin/inventory/history` | 09 Test Cases | [`TC_07_Inventory_History.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_07_Inventory_History.md) |
| **08** | `ADM-INV-SETTINGS` | Cài đặt Tồn kho & Điểm kho | `/admin/inventory/settings` | 09 Test Cases | [`TC_08_Inventory_Settings.md`](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/test-cases/02_inventory_product/TC_08_Inventory_Settings.md) |
| **TỔNG CỘNG** | | **8 Màn hình Nghiệp vụ Trọng tâm** | | **95 Test Cases** | |

---

## 📌 Các Nhóm Edge Cases Trọng tâm Đã Phủ Kín
1. **Âm tồn khả dụng (Negative Available Stock):** Xử lý khi tồn thực tế nhỏ hơn số lượng đã cam kết giữ hàng do hư hỏng hoặc hủy điều chuyển đột xuất.
2. **Kiểm tra tính hợp lệ đầu vào (Input Validations):** Chặn nhập đơn giá âm, kích thước âm hoặc ký tự chữ cái vào ô số liệu. Chặn nhập số lượng đếm kiểm kê là số âm hoặc số thập phân lẻ cho sản phẩm nguyên chiếc.
3. **Xung đột Kiểm kê (Concurrent Audit Lock):** Chặn tạo trùng lặp 2 đợt kiểm kê đồng thời tại cùng một điểm kho.
4. **Trừ tồn kho trùng lặp (Idempotency):** Chặn thao tác nhấp đúp nút "Xác nhận xuất kho" liên tiếp làm trừ tồn 2 lần.
5. **Bảo mật An toàn dữ liệu:** Chống tấn công SQL Injection và XSS trong toàn bộ các ô tìm kiếm sản phẩm, khách hàng.
