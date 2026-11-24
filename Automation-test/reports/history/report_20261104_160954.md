# Báo Cáo Kết Quả Kiểm Thử Tự Động: Kiểm Thử Tự Động Phân Hệ: ALL

* **Thời gian thực hiện:** 04/11/2026 16:09:54
* **Đánh giá tổng thể:** 🟢 ĐẠT CHUẨN
* **Tổng số kịch bản:** 216 | **Đạt:** 216 | **Lỗi:** 0 | **Tỷ lệ Pass:** 100.0%
* **Tổng thời gian chạy:** 244.13 giây

---

## 1. Bảng Thống Kê Tổng Quan
| Chỉ số | Số lượng | Tỷ lệ (%) |
| :--- | :---: | :---: |
| ✅ **Kịch bản Thành Công (PASS)** | 216 | 100.0% |
| ❌ **Kịch bản Phát Hiện Lỗi (FAIL)** | 0 | 0.0% |
| ⚠️ **Kịch bản Bỏ qua (SKIPPED)** | 0 | - |
| 📊 **TỔNG CỘNG** | **216** | **100%** |

## 2. Kết Quả Chi Tiết Từng Kịch Bản Kiểm Thử
| STT | Mã Test Case | Tên Kịch Bản | Phân Hệ | Trạng Thái | Thời Gian | Bằng Chứng Lỗi (Ảnh Khoanh Đỏ) |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | **TC-DASH-01** | Kiểm tra hiển thị đầy đủ 4 Thẻ chỉ số KPI cốt lõi | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_01_kpi_cards.png) |
| 2 | **TC-DASH-02** | Kiểm tra logic tính toán tỷ lệ tăng trưởng % & màu sắc huy hiệu | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_02_growth_badges.png) |
| 3 | **TC-DASH-03** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Đơn cọc chờ duyệt | 01_reports | ✅ PASS | 1.6s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_03_deposit_nav.png) |
| 4 | **TC-DASH-04** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Tồn kho chạm ngưỡng | 01_reports | ✅ PASS | 1.5s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_04_inventory_nav.png) |
| 5 | **TC-DASH-05** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Lịch hẹn trải nghiệm Showroom | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_05_appointment.png) |
| 6 | **TC-DASH-06** | Thay đổi chu kỳ Biểu đồ xu hướng doanh thu độc lập | 01_reports | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_06_chart_cycle.png) |
| 7 | **TC-DASH-07** | Điều hướng từ Chú giải Biểu đồ cơ cấu trạng thái đơn hàng | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_07_legend_nav.png) |
| 8 | **TC-DASH-08** | Điều hướng từ Bảng Top 5 Khách hàng: Nhấp vào tên khách | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_08_top_customers.png) |
| 9 | **TC-DASH-09** | Điều hướng từ Bảng Top 5 Khách hàng: Nhấp vào số lượng đơn | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_09_customer_orders.png) |
| 10 | **TC-DASH-10** | Lọc dữ liệu toàn cục theo mốc thời gian | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_10_date_filter.png) |
| 11 | **TC-DASH-11** | Trường hợp biên: Hiển thị khi không có dữ liệu (Empty State) | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_11_empty_state.png) |
| 12 | **TC-DASH-12** | Trường hợp biên: Tỷ lệ % không bị lỗi chia cho 0 (NaN / Infinity) | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_12_division_by_zero.png) |
| 13 | **TC-DASH-13** | Trường hợp biên: Khối cảnh báo tác nghiệp trạng thái an toàn | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_13_all_clean.png) |
| 14 | **TC-DASH-14** | Trường hợp biên: Dữ liệu chuỗi thời gian có ngày rỗng xen kẽ | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_14_gaps_time_series.png) |
| 15 | **TC-DASH-15** | Trường hợp biên: Xử lý an toàn khi mất kết nối mạng / lỗi API | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_DASH_15_network_handling.png) |
| 16 | **TC-CUST-01** | Kiểm tra hiển thị các thẻ KPI tăng trưởng & giá trị khách hàng | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_01_customer_kpis.png) |
| 17 | **TC-CUST-02** | Điều hướng từ Thẻ KPI 'Khách hàng mới' sang danh sách Khách hàng | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_02_new_customers_nav.png) |
| 18 | **TC-CUST-03** | Điều hướng từ Thẻ KPI 'Doanh thu nhóm VIP' sang danh sách VIP | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_03_vip_revenue_nav.png) |
| 19 | **TC-CUST-04** | Bảng Top khách hàng chi tiêu cao: Nhấp vào tên khách hàng | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_04_customer_name_link.png) |
| 20 | **TC-CUST-05** | Bảng Top khách hàng chi tiêu cao: Nhấp vào số lượng đơn hàng | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_05_customer_orders_link.png) |
| 21 | **TC-CUST-06** | Bảng Top khách hàng mua nhiều đơn nhất: Nhấp vào tên & số đơn | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_06_dual_tables.png) |
| 22 | **TC-CUST-07** | Kiểm tra Ma trận nhiệt (Heatmap) Mật độ lịch hẹn tại Showroom | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_07_heatmap.png) |
| 23 | **TC-CUST-08** | Kiểm tra Biểu đồ tròn cơ cấu Phân tầng Hội viên | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_08_tier_chart.png) |
| 24 | **TC-CUST-09** | Xuất báo cáo danh sách khách hàng thân thiết ra CSV | 01_reports | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_09_export_csv.png) |
| 25 | **TC-CUST-10** | Trường hợp biên: Ma trận nhiệt khi toàn bộ khung giờ có 0 lượt hẹn | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_10_empty_heatmap.png) |
| 26 | **TC-CUST-11** | Trường hợp biên: Tỷ lệ mua lặp lại khi Tổng số khách hàng bằng 0 | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_11_repeat_rate_edge.png) |
| 27 | **TC-CUST-12** | Trường hợp biên: Chuẩn hóa tên khách hàng và avatar viết tắt | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_12_avatar_badge.png) |
| 28 | **TC-ORD-01** | Kiểm tra hiển thị các thẻ KPI vận hành & logistics cốt lõi | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_01_operational_kpis.png) |
| 29 | **TC-ORD-02** | Điều hướng từ Thẻ KPI 'Tỷ lệ hủy đơn' sang danh sách đơn hủy | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_02_cancel_kpi.png) |
| 30 | **TC-ORD-03** | Điều hướng từ Thẻ KPI 'Đổi trả & Giao lại' sang trang Đổi trả | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_03_returns_card.png) |
| 31 | **TC-ORD-04** | Nhấp tương tác các bước trong Thác nước vòng đời đơn hàng | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_04_lifecycle_funnel.png) |
| 32 | **TC-ORD-05** | Điều hướng Nút 'Chi tiết đơn hàng' kèm bộ lọc kết hợp đa chiều | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_05_view_all_orders.png) |
| 33 | **TC-ORD-06** | Kiểm tra bảng Đánh giá hiệu suất các Đối tác giao vận | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_06_carrier_perf.png) |
| 34 | **TC-ORD-07** | Lọc báo cáo đơn hàng theo khoảng thời gian và Showroom | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_07_filters.png) |
| 35 | **TC-ORD-08** | Kiểm tra hiển thị thời gian giao hàng trung bình (Lead Time) | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_08_lead_time.png) |
| 36 | **TC-ORD-09** | Trường hợp biên: Thác nước vòng đời khi 100% đơn dồn vào 1 trạng thái | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_09_funnel_concentrated.png) |
| 37 | **TC-ORD-10** | Trường hợp biên: Tỷ lệ hủy đơn không bị lỗi chia cho 0 (NaN/Infinity) | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_10_cancel_rate_edge.png) |
| 38 | **TC-ORD-11** | Trường hợp biên: Đối tác giao vận mới kết nối chưa có lịch sử | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_11_new_carrier.png) |
| 39 | **TC-ORD-12** | Trường hợp biên: Điều hướng với query params không hợp lệ | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_12_invalid_params.png) |
| 40 | **TC-PROD-01** | Kiểm tra hiển thị các thẻ KPI hiệu quả kinh doanh sản phẩm | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_01_product_kpis.png) |
| 41 | **TC-PROD-02** | Nhấp vào Huy hiệu lượt bán của sản phẩm trong bảng Hiệu quả | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_02_sales_badge_nav.png) |
| 42 | **TC-PROD-03** | Lọc Biểu đồ theo Cây danh mục sản phẩm | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_03_category_chart.png) |
| 43 | **TC-PROD-04** | Kiểm tra hiển thị Ma trận Bán kèm (Cross-sell Matrix) | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_04_cross_sell_matrix.png) |
| 44 | **TC-PROD-05** | Kiểm tra màu sắc độ đậm nhạt theo tỷ lệ trong Ma trận Bán kèm | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_05_matrix_shades.png) |
| 45 | **TC-PROD-06** | Bảng xếp hạng Top sản phẩm doanh thu cao & Tồn kho | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_06_performance_table.png) |
| 46 | **TC-PROD-07** | Lọc sản phẩm theo Danh mục / Loại phòng | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_07_category_filter.png) |
| 47 | **TC-PROD-08** | Lọc sản phẩm theo Thương hiệu & Trạng thái kinh doanh | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_08_brand_filter.png) |
| 48 | **TC-PROD-09** | Xuất danh sách phân tích sản phẩm ra tệp bảng tính CSV | 01_reports | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_09_export_csv.png) |
| 49 | **TC-PROD-10** | Trường hợp biên: Ma trận Bán kèm khi không có đơn hàng mua chung | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_10_empty_matrix_cell.png) |
| 50 | **TC-PROD-11** | Trường hợp biên: Tỷ lệ chuyển đổi khi lượt xem sản phẩm bằng 0 | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_11_zero_conversion.png) |
| 51 | **TC-PROD-12** | Trường hợp biên: Tìm kiếm sản phẩm chống tấn công mã độc HTML/XSS | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_12_xss_search.png) |
| 52 | **TC-PROD-13** | Trường hợp biên: Tên sản phẩm cực dài không gây tràn khung | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_13_long_name_format.png) |
| 53 | **TC-REV-01** | Kiểm tra hiển thị các thẻ KPI tài chính & dòng tiền | 01_reports | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_01_kpi_cards.png) |
| 54 | **TC-REV-02** | Đối soát công thức toán học cấu thành Doanh thu thuần | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_02_math_formula.png) |
| 55 | **TC-REV-03** | Lọc dữ liệu theo Chi nhánh / Showroom thực tế | 01_reports | ✅ PASS | 1.5s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_03_filter_showroom.png) |
| 56 | **TC-REV-04** | Nút 'Chi tiết đơn hàng' tại đầu bảng Top doanh thu cao | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_04_drilldown_orders.png) |
| 57 | **TC-REV-05** | Nhấp vào Mã đơn hàng trong bảng Top doanh thu | 01_reports | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_05_order_code_link.png) |
| 58 | **TC-REV-06** | Kiểm tra Biểu đồ cơ cấu doanh thu & tỷ lệ chiết khấu | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_06_combo_chart.png) |
| 59 | **TC-REV-07** | Kiểm tra Biểu đồ tỷ trọng Phương thức thanh toán | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_07_payment_chart.png) |
| 60 | **TC-REV-08** | Xuất báo cáo doanh thu ra tệp bảng tính CSV | 01_reports | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_08_export_csv.png) |
| 61 | **TC-REV-09** | Trường hợp biên: Xử lý khi bộ lọc Chi nhánh không phát sinh doanh số | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_09_showroom_no_sales.png) |
| 62 | **TC-REV-10** | Trường hợp biên: Khoảng ngày lọc tùy chọn bất hợp lý | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_10_invalid_date_range.png) |
| 63 | **TC-REV-11** | Trường hợp biên: Xử lý giá trị Doanh thu thuần hợp lệ | 01_reports | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_11_negative_net_revenue.png) |
| 64 | **TC-REV-12** | Trường hợp biên: Định dạng số tiền lớn thu gọn (tỷ ₫ / tr ₫) | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_12_large_number_format.png) |
| 65 | **TC-REV-13** | Trường hợp biên: Thao tác nhấp chuột liên tục (Rapid Clicking) | 01_reports | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_13_rapid_clicking.png) |
| 66 | **TC-REV-14** | Trường hợp biên: Xuất báo cáo CSV khi tập dữ liệu rỗng | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_14_export_empty.png) |
| 67 | **TC-REV-15** | Trường hợp biên: Xử lý an toàn khi mất kết nối mạng / lỗi máy chủ | 01_reports | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_REV_15_network_resilience.png) |
| 68 | **TC-CAT-01** | Kiểm tra hiển thị Cây phân cấp danh mục đa tầng | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_01_category_tree_display.png) |
| 69 | **TC-CAT-02** | Thêm mới Danh mục cha cấp 1 (Root Category) | 02_inventory_product | ✅ PASS | 1.3s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_02_add_root_category_modal.png) |
| 70 | **TC-CAT-03** | Thêm mới Danh mục con trực thuộc Danh mục cha (Child Category) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_03_child_category_view.png) |
| 71 | **TC-CAT-04** | Kiểm tra cơ chế tự động tạo mã đường dẫn (Slug) thân thiện SEO | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_04_auto_generate_slug.png) |
| 72 | **TC-CAT-05** | Kéo thả (Drag & Drop) sắp xếp thứ tự ưu tiên hiển thị | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_05_drag_and_drop_reorder.png) |
| 73 | **TC-CAT-06** | Chỉnh sửa tên, mô tả và hình ảnh đại diện danh mục | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_06_edit_category_info.png) |
| 74 | **TC-CAT-07** | Ràng buộc nghiệp vụ: Chặn xóa danh mục đang chứa sản phẩm | 02_inventory_product | ✅ PASS | 1.3s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_07_prevent_delete_category.png) |
| 75 | **TC-CAT-08** | Xóa danh mục rỗng (không chứa sản phẩm) an toàn | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_08_safe_delete_empty_category.png) |
| 76 | **TC-CAT-09** | Quản lý phân loại theo Loại phòng (Không gian sống) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_09_room_space_classification.png) |
| 77 | **TC-CAT-10** | Quản lý phân loại theo Phong cách thiết kế nội thất | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_10_interior_styles.png) |
| 78 | **TC-CAT-11** | Bật/tắt trạng thái hiển thị danh mục trên menu website | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CAT_11_toggle_category_menu_visibility.png) |
| 79 | **TC-CUST-01** | Kiểm tra hiển thị danh sách khách hàng và các thẻ KPI tổng quan | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_01_customer_list_kpi.png) |
| 80 | **TC-CUST-02** | Tìm kiếm khách hàng theo Tên, Số điện thoại và Email | 02_inventory_product | ✅ PASS | 1.5s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_02_search_customers.png) |
| 81 | **TC-CUST-03** | Lọc khách hàng theo Hạng thẻ hội viên | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_03_filter_membership.png) |
| 82 | **TC-CUST-04** | Lọc kết hợp đa điều kiện (Hạng thẻ + Chi tiêu + Trạng thái) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_04_multi_filter.png) |
| 83 | **TC-CUST-05** | Tiếp nhận bộ lọc từ đường dẫn Query Params | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_05_query_params.png) |
| 84 | **TC-CUST-06** | Sắp xếp danh sách theo cột dọc | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_06_column_sorting.png) |
| 85 | **TC-CUST-07** | Xem Chi tiết hồ sơ và lịch sử mua sắm của khách hàng | 02_inventory_product | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_07_customer_detail.png) |
| 86 | **TC-CUST-08** | Khóa tài khoản khách hàng kèm hộp thoại xác nhận an toàn | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_08_lock_account.png) |
| 87 | **TC-CUST-09** | Mở khóa tài khoản khách hàng đã bị khóa | 02_inventory_product | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_09_unlock_account.png) |
| 88 | **TC-CUST-10** | Xuất danh sách khách hàng ra tệp bảng tính CSV | 02_inventory_product | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_10_export_csv.png) |
| 89 | **TC-CUST-11** | Phân trang danh sách khách hàng (Pagination) | 02_inventory_product | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_11_pagination.png) |
| 90 | **TC-CUST-12** | Trường hợp biên: Tìm kiếm không tìm thấy kết quả phù hợp (Empty State) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_12_no_results.png) |
| 91 | **TC-CUST-13** | Trường hợp biên: Khóa tài khoản khách đang có đơn hàng | 02_inventory_product | ✅ PASS | 0.8s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_13_lock_active_orders.png) |
| 92 | **TC-CUST-14** | Trường hợp biên: Nhập số điện thoại sai định dạng chuẩn | 02_inventory_product | ✅ PASS | 0.9s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_14_invalid_phone.png) |
| 93 | **TC-CUST-15** | Trường hợp biên: Phòng chống tấn công SQL Injection & XSS | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUST_15_sql_injection.png) |
| 94 | **TC-AUDIT-01** | Kiểm tra hiển thị danh sách các đợt kiểm kê và bộ lọc trạng thái | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_01_audit_list.png) |
| 95 | **TC-AUDIT-02** | Khởi tạo Đợt kiểm kê mới theo Phạm vi (Toàn bộ kho / Danh mục) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_02_create_new_audit.png) |
| 96 | **TC-AUDIT-03** | Nhập kết quả kiểm đếm và tính toán chênh lệch số lượng tự động | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_03_discrepancy_calc.png) |
| 97 | **TC-AUDIT-04** | Tính toán tự động Giá trị chênh lệch tài chính theo đơn giá vốn | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_04_financial_discrepancy.png) |
| 98 | **TC-AUDIT-05** | Bắt buộc chọn Lý do chênh lệch đối với các mã bị lệch thừa/thiếu | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_05_require_reason.png) |
| 99 | **TC-AUDIT-06** | Phê duyệt Cân bằng kho và cập nhật số tồn thực tế (Happy Path) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_06_approve_reconciliation.png) |
| 100 | **TC-AUDIT-07** | Kiểm tra tự động phát sinh bút toán điều chỉnh vào Sổ cái biến động | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_07_ledger_entry.png) |
| 101 | **TC-AUDIT-08** | Phân quyền: Ngăn chặn Thủ kho tự ý phê duyệt Cân bằng kho | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_08_rbac_audit.png) |
| 102 | **TC-AUDIT-09** | Hủy bỏ đợt kiểm kê đang thực hiện có cảnh báo an toàn | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_09_cancel_audit.png) |
| 103 | **TC-AUDIT-10** | Xuất Biên bản kiểm kê kho ra tệp bảng tính / PDF in ấn | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_10_export_sheet.png) |
| 104 | **TC-AUDIT-11** | Nhập số lượng thực đếm là số âm hoặc số thập phân lẻ (-5, 2.5) | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_11_negative_counted_stock.png) |
| 105 | **TC-AUDIT-12** | Khởi tạo trùng lặp 2 đợt kiểm kê tại cùng 1 điểm kho cùng thời điểm | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_AUDIT_12_duplicate_audit_lock.png) |
| 106 | **TC-HIST-01** | Kiểm tra hiển thị bảng Sổ cái biến động kho và các cột dữ liệu | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_01_stock_ledger.png) |
| 107 | **TC-HIST-02** | Kiểm tra Tiêu chuẩn Sổ cái Bất biến (Không có nút Sửa/Xóa) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_02_immutable_standard.png) |
| 108 | **TC-HIST-03** | Tra cứu toàn bộ dòng biến động của một mã SKU cụ thể | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_03_sku_history_lookup.png) |
| 109 | **TC-HIST-04** | Đối soát công thức số học: Tồn trước + Biến động = Tồn sau | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_04_arithmetic_integrity.png) |
| 110 | **TC-HIST-05** | Điều hướng chuyển hướng nhanh sang Chứng từ gốc từ Sổ cái | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_05_source_document_link.png) |
| 111 | **TC-HIST-06** | Lọc biến động theo Loại nghiệp vụ (Nhập, Xuất, Kiểm kê, Đổi trả) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_06_filter_transaction_type.png) |
| 112 | **TC-HIST-07** | Lọc biến động theo Điểm kho và Khoảng thời gian tùy biến | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_07_filter_warehouse_date.png) |
| 113 | **TC-HIST-08** | Sắp xếp lịch sử theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_08_column_sorting.png) |
| 114 | **TC-HIST-09** | Xuất dữ liệu Sổ cái phục vụ đối soát kiểm toán ra Excel / CSV | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_HIST_09_export_ledger.png) |
| 115 | **TC-INV-01** | Kiểm tra hiển thị 4 Thẻ chỉ số KPI Tồn kho tổng hợp | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_01_kpi_cards.png) |
| 116 | **TC-INV-02** | Đối soát logic tính toán 3 trạng thái tồn: Thực tế, Cam kết, Khả dụng | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_02_stock_calculation.png) |
| 117 | **TC-INV-03** | Lọc dữ liệu theo từng Điểm kho | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_03_filter_warehouse.png) |
| 118 | **TC-INV-04** | Tìm kiếm sản phẩm trong kho theo Tên và Mã SKU | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_04_search_inventory.png) |
| 119 | **TC-INV-05** | Tra cứu vị trí kệ lưu trữ vật lý chi tiết của từng SKU | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_05_shelf_location.png) |
| 120 | **TC-INV-06** | Kiểm tra hiển thị màu sắc huy hiệu cảnh báo Tồn thấp và Hết hàng | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_06_warning_badges.png) |
| 121 | **TC-INV-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_07_column_sorting.png) |
| 122 | **TC-INV-08** | Lọc nhanh các mặt hàng chạm hoặc dưới Ngưỡng an toàn | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_08_quick_filter_low_stock.png) |
| 123 | **TC-INV-09** | Xuất báo cáo kiểm soát tồn kho khả dụng ra Excel / CSV | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_09_export_inventory.png) |
| 124 | **TC-INV-10** | Tồn thực tế nhỏ hơn Tồn cam kết (Hiện tượng âm tồn khả dụng) | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_10_negative_stock_handling.png) |
| 125 | **TC-INV-11** | Sản phẩm mới nhập kho chưa được phân bổ vị trí kệ lưu trữ | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_INV_11_unallocated_shelf.png) |
| 126 | **TC-SET-01** | Kiểm tra hiển thị danh sách các Điểm kho trong mạng lưới | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_01_warehouse_list.png) |
| 127 | **TC-SET-02** | Thêm mới Điểm kho Showroom / Xưởng sản xuất (Happy Path) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_02_add_warehouse_modal.png) |
| 128 | **TC-SET-03** | Bắt lỗi trùng lặp Mã kho và kiểm tra các trường bắt buộc | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_03_validation_rules.png) |
| 129 | **TC-SET-04** | Chỉnh sửa thông tin, địa chỉ và sức chứa của Điểm kho | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_04_edit_warehouse.png) |
| 130 | **TC-SET-05** | Bật / Tắt trạng thái hoạt động của Điểm kho | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_05_toggle_warehouse.png) |
| 131 | **TC-SET-06** | Cấu hình Ngưỡng an toàn tối thiểu mặc định toàn hệ thống | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_06_safety_stock_threshold.png) |
| 132 | **TC-SET-07** | Cấu hình Ngưỡng an toàn riêng biệt cho từng mã SKU đặc thù | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_07_sku_safety_threshold.png) |
| 133 | **TC-SET-08** | Quản lý danh mục Lý do Xuất - Nhập kho chuẩn mực | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_08_reasons_master_data.png) |
| 134 | **TC-SET-09** | Sắp xếp danh sách điểm kho theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_SET_09_column_sorting.png) |
| 135 | **TC-TRANS-01** | Kiểm tra hiển thị danh sách các lệnh kho và bộ lọc loại chứng từ | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_01_transactions_list.png) |
| 136 | **TC-TRANS-02** | Tạo Lệnh xuất kho theo Mã đơn hàng bán lẻ (Happy Path) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_02_create_export_order.png) |
| 137 | **TC-TRANS-03** | Tạo Lệnh nhập kho thành phẩm từ Xưởng sản xuất | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_03_create_import_order.png) |
| 138 | **TC-TRANS-04** | Tạo Lệnh xuất điều chuyển nội bộ giữa 2 Showroom | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_04_create_transfer_order.png) |
| 139 | **TC-TRANS-05** | Xác nhận hoàn tất Lệnh xuất kho và trừ tồn thực tế | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_05_confirm_dispatch.png) |
| 140 | **TC-TRANS-06** | Kiểm tra ràng buộc không cho phép xuất kho vượt quá tồn khả dụng | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_06_prevent_exceed_stock.png) |
| 141 | **TC-TRANS-07** | In Phiếu xuất kho chuẩn khổ A4 bàn giao hàng hóa | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_07_print_dispatch_note.png) |
| 142 | **TC-TRANS-08** | Sắp xếp danh sách lệnh theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_08_column_sorting.png) |
| 143 | **TC-TRANS-09** | Hủy lệnh xuất/nhập kho ở trạng thái Chờ xử lý | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_09_cancel_order.png) |
| 144 | **TC-TRANS-10** | Tìm kiếm lệnh kho theo Mã chứng từ và Mã đơn hàng | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_10_search_orders.png) |
| 145 | **TC-TRANS-11** | Lệnh điều chuyển nội bộ có Kho xuất và Kho nhận trùng nhau | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_11_same_warehouse_validation.png) |
| 146 | **TC-TRANS-12** | Nhấp xác nhận xuất kho liên tiếp 2 lần cùng 1 lúc (Chống trừ trùng) | 02_inventory_product | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_TRANS_12_idempotency_dispatch.png) |
| 147 | **TC-PROD-01** | Kiểm tra hiển thị danh sách sản phẩm và các thẻ thống kê | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_01_product_list_and_stats.png) |
| 148 | **TC-PROD-02** | Tìm kiếm sản phẩm theo Tên sản phẩm và Mã SKU | 02_inventory_product | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_02_search_by_name_and_sku.png) |
| 149 | **TC-PROD-03** | Lọc danh sách sản phẩm theo Danh mục phân cấp | 02_inventory_product | ✅ PASS | 1.3s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_03_filter_by_category.png) |
| 150 | **TC-PROD-04** | Lọc danh sách theo Trạng thái kinh doanh & Tình trạng tồn kho | 02_inventory_product | ✅ PASS | 1.5s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_04_filter_status_and_stock.png) |
| 151 | **TC-PROD-05** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 02_inventory_product | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_05_column_sorting.png) |
| 152 | **TC-PROD-06** | Tạo mới sản phẩm nội thất hoàn chỉnh (Happy Path) | 02_inventory_product | ✅ PASS | 1.5s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_06_create_product_form.png) |
| 153 | **TC-PROD-07** | Bắt lỗi trùng lặp mã SKU khi tạo hoặc sửa sản phẩm | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_07_sku_duplicate_validation.png) |
| 154 | **TC-PROD-08** | Kiểm tra các trường thông tin bắt buộc khi tạo sản phẩm | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_08_required_fields_validation.png) |
| 155 | **TC-PROD-09** | Chỉnh sửa thông tin, giá bán và hình ảnh sản phẩm | 02_inventory_product | ✅ PASS | 1.4s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_09_edit_product_info.png) |
| 156 | **TC-PROD-10** | Chuyển đổi nhanh trạng thái kinh doanh (Hoạt động / Tạm ẩn) | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_10_quick_status_toggle.png) |
| 157 | **TC-PROD-11** | Xóa sản phẩm có ràng buộc an toàn (Ngăn xóa nếu có đơn hàng) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_11_safe_delete_product.png) |
| 158 | **TC-PROD-12** | Xem nhanh chi tiết sản phẩm qua ngăn kéo xem trước (Drawer) | 02_inventory_product | ✅ PASS | 1.3s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_12_quick_view_drawer.png) |
| 159 | **TC-PROD-13** | Nhập Đơn giá là số âm hoặc bằng 0 | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_13_edge_case_negative_price.png) |
| 160 | **TC-PROD-14** | Tải lên tệp ảnh sai định dạng (.exe, .pdf) hoặc vượt quá 5MB | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_14_edge_case_invalid_file_upload.png) |
| 161 | **TC-PROD-15** | Nhập quy cách kích thước (Dài, Rộng, Cao) là số âm hoặc chữ cái | 02_inventory_product | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_15_edge_case_negative_dimensions.png) |
| 162 | **TC-PROD-16** | Tên sản phẩm chứa mã HTML độc hại (Chống tấn công XSS) | 02_inventory_product | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_PROD_16_edge_case_xss_prevention.png) |
| 163 | **TC-CUSTREQ-01** | Kiểm tra hiển thị danh sách yêu cầu may đo và các tab trạng thái | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_01_custom_requests_list.png) |
| 164 | **TC-CUSTREQ-02** | Tiếp nhận hồ sơ may đo mới từ khách hàng và phân công xử lý | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_02_assign_request.png) |
| 165 | **TC-CUSTREQ-03** | Tải lên bản vẽ phối cảnh 3D và ghi chú kỹ thuật kích thước | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_03_upload_3d_render.png) |
| 166 | **TC-CUSTREQ-04** | Lập bảng dự toán báo giá chi tiết và gửi duyệt hợp đồng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_04_quotation_estimate.png) |
| 167 | **TC-CUSTREQ-05** | Xác nhận thanh toán cọc 30% và tự động sinh Lệnh sản xuất xưởng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_05_deposit_work_order.png) |
| 168 | **TC-CUSTREQ-06** | Tìm kiếm yêu cầu may đo theo Mã hồ sơ, SĐT và Tên khách hàng | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_06_search_requests.png) |
| 169 | **TC-CUSTREQ-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_07_column_sorting.png) |
| 170 | **TC-CUSTREQ-08** | Từ chối hoặc hủy hồ sơ may đo do không khả thi kỹ thuật | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_08_reject_request.png) |
| 171 | **TC-CUSTREQ-09** | Xuất hồ sơ thiết kế may đo ra tệp PDF bàn giao xưởng mộc | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_CUSTREQ_09_export_dossier.png) |
| 172 | **TC-RET-01** | Kiểm tra hiển thị danh sách yêu cầu đổi trả và các tab quy trình | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_01_returns_list.png) |
| 173 | **TC-RET-02** | Tạo yêu cầu đổi trả hợp lệ | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_02_create_return_request.png) |
| 174 | **TC-RET-03** | Tra cứu đơn hàng gốc liên kết với yêu cầu đổi trả | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_03_lookup_original_order.png) |
| 175 | **TC-RET-04** | Chặn tạo đổi trả khi đã vượt quá 72 giờ từ lúc nhận hàng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_04_block_exceeded_72h.png) |
| 176 | **TC-RET-05** | Phát sinh lệnh thu hồi hàng hóa và bàn giao về xưởng kiểm định | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_05_recall_order.png) |
| 177 | **TC-RET-06** | Lập Biên bản kiểm định chất lượng QC hàng hoàn (Return QC Report) | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_06_return_qc_report.png) |
| 178 | **TC-RET-07** | Phê duyệt phương án xử lý: Đổi mới sản phẩm hoặc Hoàn tiền | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_07_approve_exchange_refund.png) |
| 179 | **TC-RET-08** | Sắp xếp danh sách đổi trả theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_08_column_sorting.png) |
| 180 | **TC-RET-09** | Từ chối yêu cầu đổi trả do lỗi phát sinh từ phía người sử dụng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_09_reject_user_damage.png) |
| 181 | **TC-RET-10** | Tạo yêu cầu đổi trả tại thời điểm sát nút hạn chót (71 giờ 59 phút) | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_10_near_deadline.png) |
| 182 | **TC-RET-11** | Yêu cầu đổi trả đối với sản phẩm may đo Custom theo kích thước phòng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_RET_11_custom_product_policy.png) |
| 183 | **TC-ORDSET-01** | Kiểm tra hiển thị các khối cấu hình vận hành và bảng phương thức | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_01_settings_display.png) |
| 184 | **TC-ORDSET-02** | Cấu hình Mức Miễn phí vận chuyển (Free Shipping Threshold) | 03_orders_warranty | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_02_free_shipping_threshold.png) |
| 185 | **TC-ORDSET-03** | Thêm mới Gói phương thức giao nhận vận chuyển | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_03_add_shipping_method.png) |
| 186 | **TC-ORDSET-04** | Chỉnh sửa biểu phí giao hàng và thời gian cam kết vận chuyển | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_04_edit_shipping_fee.png) |
| 187 | **TC-ORDSET-05** | Bật / Tắt trạng thái hoạt động của một phương thức vận chuyển | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_05_toggle_method_status.png) |
| 188 | **TC-ORDSET-06** | Cấu hình Tỷ lệ đặt cọc bắt buộc cho đơn tiêu chuẩn và may đo | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_06_deposit_percentage.png) |
| 189 | **TC-ORDSET-07** | Bắt lỗi kiểm tra tính hợp lệ số tiền và tỷ lệ phần trăm cọc | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_07_validation_deposit.png) |
| 190 | **TC-ORDSET-08** | Sắp xếp danh sách phương thức theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORDSET_08_column_sorting.png) |
| 191 | **TC-WAR-01** | Kiểm tra hiển thị danh sách thẻ bảo hành và các trạng thái hiệu lực | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_01_warranty_list.png) |
| 192 | **TC-WAR-02** | Tra cứu thẻ bảo hành theo Số điện thoại và Tên khách hàng | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_02_lookup_warranty.png) |
| 193 | **TC-WAR-03** | Đối soát phân tầng thời hạn bảo hành theo từng cấu phần nội thất | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_03_tier_warranty.png) |
| 194 | **TC-WAR-04** | Tiếp nhận yêu cầu bảo hành và phân công Kỹ thuật viên tại nhà | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_04_dispatch_technician.png) |
| 195 | **TC-WAR-05** | Nghiệm thu hoàn tất ca bảo hành có biên bản và ảnh sửa chữa | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_05_complete_warranty.png) |
| 196 | **TC-WAR-06** | Xử lý yêu cầu sửa chữa đối với sản phẩm đã Hết hạn bảo hành | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_06_expired_warranty.png) |
| 197 | **TC-WAR-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_07_column_sorting.png) |
| 198 | **TC-WAR-08** | Lọc danh sách theo Trạng thái | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_08_filter_status.png) |
| 199 | **TC-WAR-09** | Xuất sổ theo dõi bảo hành ra tệp bảng tính Excel | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_09_export_warranty.png) |
| 200 | **TC-WAR-10** | Yêu cầu bảo hành đối với hư hại do ngập lụt / thiên tai / hỏa hoạn | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_10_force_majeure.png) |
| 201 | **TC-WAR-11** | Tra cứu bảo hành khi khách hàng đổi số điện thoại mới | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_WAR_11_phone_change.png) |
| 202 | **TC-ORD-01** | Kiểm tra hiển thị danh sách đơn hàng và 10 Tab trạng thái | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_01_orders_list_kpi.png) |
| 203 | **TC-ORD-02** | Lọc đơn hàng theo Tab trạng thái vòng đời 7 chặng | 03_orders_warranty | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_02_filter_lifecycle_tabs.png) |
| 204 | **TC-ORD-03** | Tìm kiếm đơn hàng theo Mã đơn, SĐT và Tên khách hàng | 03_orders_warranty | ✅ PASS | 1.2s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_03_search_orders.png) |
| 205 | **TC-ORD-04** | Tiếp nhận điều hướng chuyên sâu từ Báo cáo | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_04_deep_linking.png) |
| 206 | **TC-ORD-05** | Duyệt xác nhận đơn hàng có tiền đặt cọc 30% hợp lệ | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_05_approve_deposit.png) |
| 207 | **TC-ORD-06** | Chặn chuyển trạng thái 'Sẵn sàng xuất' khi chưa đạt Checklist 4 tiêu chuẩn QC | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_06_block_without_qc.png) |
| 208 | **TC-ORD-07** | Đánh dấu đạt 4 tiêu chuẩn QC và cập nhật Mã vận đơn giao hàng | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_07_qc_checklist.png) |
| 209 | **TC-ORD-08** | Khách ký nhận hàng và kích hoạt đồng hồ đếm ngược 72 giờ đổi trả | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_08_delivered_countdown.png) |
| 210 | **TC-ORD-09** | Hủy đơn hàng và bắt buộc ghi nhận Lý do hủy | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_09_cancel_order.png) |
| 211 | **TC-ORD-10** | Sắp xếp danh sách đơn hàng theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_10_column_sorting.png) |
| 212 | **TC-ORD-11** | In Phiếu đơn hàng / Tem dán kiện hàng tiêu chuẩn | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_11_print_package_label.png) |
| 213 | **TC-ORD-12** | Xuất danh sách đơn hàng ra tệp bảng tính Excel / CSV | 03_orders_warranty | ✅ PASS | 1.1s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_12_export_orders.png) |
| 214 | **TC-ORD-13** | Duyệt cọc khi số tiền chuyển khoản nhỏ hơn 30% mức cọc quy định | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_13_insufficient_deposit.png) |
| 215 | **TC-ORD-14** | Yêu cầu hủy đơn khi hàng đang ở trên xe tải giao (Shipped) | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_14_cancel_in_transit.png) |
| 216 | **TC-ORD-15** | Đơn hàng nội thất có địa chỉ giao ở hải đảo hoặc vùng sâu xa | 03_orders_warranty | ✅ PASS | 1.0s | [Xem ảnh chụp](../screenshots/raw/pass/TC_ORD_15_remote_shipping.png) |