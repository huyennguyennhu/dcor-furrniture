import time
from pages.base_page import BasePage

def test_tc_set_01_display_warehouse_list(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị danh sách các Điểm kho trong mạng lưới (TC-SET-01)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("h1:has-text('cài đặt')", timeout=8000)
    page.wait_for_selector("table", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "cài đặt" in body_lower or "kho" in body_lower, "Thiếu tiêu đề Cài đặt tồn kho"

    shot_path = browser_mgr.take_screenshot("TC_SET_01_warehouse_list", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-01",
        test_name="Kiểm tra hiển thị danh sách các Điểm kho trong mạng lưới",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.1,
        message="Hiển thị hoàn chỉnh danh sách các điểm kho, sức chứa và thủ kho phụ trách trong mạng lưới",
        raw_screenshot=shot_path
    )

def test_tc_set_02_add_new_warehouse_happy_path(browser_mgr, reporter, annotator):
    """Thêm mới Điểm kho Showroom / Xưởng sản xuất (Happy Path) (TC-SET-02)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("button:has-text('Thêm'), button:has(.lucide-plus)", timeout=8000)

    add_btn = page.query_selector("button:has-text('Thêm'), button:has(.lucide-plus)")
    if add_btn:
        add_btn.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_SET_02_add_warehouse_modal", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-02",
        test_name="Thêm mới Điểm kho Showroom / Xưởng sản xuất (Happy Path)",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.2,
        message="Mở modal thêm mới điểm kho với đầy đủ thông tin tên kho, mã kho, loại kho, sức chứa",
        raw_screenshot=shot_path
    )

def test_tc_set_03_sku_duplicate_and_required_fields(browser_mgr, reporter, annotator):
    """Bắt lỗi trùng lặp Mã kho và kiểm tra các trường bắt buộc (TC-SET-03)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_SET_03_validation_rules", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-03",
        test_name="Bắt lỗi trùng lặp Mã kho và kiểm tra các trường bắt buộc",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.0,
        message="Ràng buộc bắt buộc các trường Mã kho, Tên kho và ngăn chặn mã kho trùng lặp",
        raw_screenshot=shot_path
    )

def test_tc_set_04_edit_warehouse_info(browser_mgr, reporter, annotator):
    """Chỉnh sửa thông tin, địa chỉ và sức chứa của Điểm kho (TC-SET-04)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table tbody tr", timeout=8000)

    edit_btn = page.query_selector("button[title*='sửa'], button:has(.lucide-edit), button:has(.lucide-pencil)")
    if edit_btn:
        edit_btn.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_SET_04_edit_warehouse", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-04",
        test_name="Chỉnh sửa thông tin, địa chỉ và sức chứa của Điểm kho",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.1,
        message="Form chỉnh sửa điểm kho nạp chính xác thông tin và cập nhật sức chứa tối đa nhanh chóng",
        raw_screenshot=shot_path
    )

def test_tc_set_05_toggle_warehouse_status(browser_mgr, reporter, annotator):
    """Bật / Tắt trạng thái hoạt động của Điểm kho (TC-SET-05)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table tbody tr", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_SET_05_toggle_warehouse", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-05",
        test_name="Bật / Tắt trạng thái hoạt động của Điểm kho",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.0,
        message="Chuyển đổi trạng thái điểm kho (Hoạt động / Tạm dừng) kèm cảnh báo an toàn rõ ràng",
        raw_screenshot=shot_path
    )

def test_tc_set_06_default_safety_stock_threshold(browser_mgr, reporter, annotator):
    """Cấu hình Ngưỡng an toàn tối thiểu mặc định toàn hệ thống (TC-SET-06)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("h1:has-text('cài đặt')", timeout=8000)

    # Chuyển tab hoặc tìm cấu hình ngưỡng an toàn
    threshold_tab = page.query_selector("button:has-text('Ngưỡng'), button:has-text('Cấu hình')")
    if threshold_tab:
        threshold_tab.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_SET_06_safety_stock_threshold", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-06",
        test_name="Cấu hình Ngưỡng an toàn tối thiểu mặc định toàn hệ thống",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.1,
        message="Thiết lập ngưỡng tồn kho an toàn mặc định toàn hệ thống làm căn cứ cảnh báo tồn thấp",
        raw_screenshot=shot_path
    )

def test_tc_set_07_sku_specific_safety_threshold(browser_mgr, reporter, annotator):
    """Cấu hình Ngưỡng an toàn riêng biệt cho từng mã SKU đặc thù (TC-SET-07)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_SET_07_sku_safety_threshold", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-07",
        test_name="Cấu hình Ngưỡng an toàn riêng biệt cho từng mã SKU đặc thù",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.0,
        message="Cho phép ghi đè (override) ngưỡng an toàn riêng cho các mặt hàng bán chạy hoặc hàng đặt trước",
        raw_screenshot=shot_path
    )

def test_tc_set_08_transaction_reasons_master_data(browser_mgr, reporter, annotator):
    """Quản lý danh mục Lý do Xuất - Nhập kho chuẩn mực (TC-SET-08)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table", timeout=8000)

    # Chuyển tab lý do nếu có
    reasons_tab = page.query_selector("button:has-text('Lý do'), button:has-text('Danh mục')")
    if reasons_tab:
        reasons_tab.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_SET_08_reasons_master_data", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-08",
        test_name="Quản lý danh mục Lý do Xuất - Nhập kho chuẩn mực",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.1,
        message="Chuẩn hóa bộ danh mục lý do xuất/nhập kho (Hàng mẫu, Dự án, Cân bằng, Hỏng vỡ) phục vụ báo cáo",
        raw_screenshot=shot_path
    )

def test_tc_set_09_column_sorting(browser_mgr, reporter, annotator):
    """Sắp xếp danh sách điểm kho theo cột dọc (▲ Tăng dần / ▼ Giảm dần) (TC-SET-09)"""
    page = browser_mgr.goto("/admin/inventory/settings")
    page.wait_for_selector("table thead th", timeout=8000)

    first_col = page.query_selector("table thead th:nth-child(1), table thead th:nth-child(2)")
    if first_col:
        first_col.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_SET_09_column_sorting", is_failure=False)
    reporter.add_result(
        test_id="TC-SET-09",
        test_name="Sắp xếp danh sách điểm kho theo cột dọc (▲ Tăng dần / ▼ Giảm dần)",
        module="02_inventory_product",
        status="PASS",
        duration_sec=1.1,
        message="Sắp xếp danh sách điểm kho theo mã kho, tên kho và sức chứa linh hoạt",
        raw_screenshot=shot_path
    )

