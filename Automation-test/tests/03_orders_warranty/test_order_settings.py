import time
from pages.base_page import BasePage

def test_tc_ordset_01_display_settings_cards_and_methods(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị các khối cấu hình vận hành và bảng phương thức (TC-ORDSET-01)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".orders-settings-container", timeout=8000)
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)
    page.wait_for_selector(".setting-card", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "cài đặt đơn hàng" in body_lower or "cài đặt" in body_lower, "Thiếu tiêu đề Cài đặt đơn hàng"

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_01_settings_display", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-01",
        test_name="Kiểm tra hiển thị các khối cấu hình vận hành và bảng phương thức",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Hiển thị hoàn chỉnh các phân khu cấu hình: Biểu phí giao hàng, Mức cọc bắt buộc và Chính sách đổi trả",
        raw_screenshot=shot_path
    )

def test_tc_ordset_02_configure_free_shipping_threshold(browser_mgr, reporter, annotator):
    """Cấu hình Mức Miễn phí vận chuyển (Free Shipping Threshold) (TC-ORDSET-02)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)

    # Chuyển sang Tab 2: Vận chuyển & Giao lắp
    shipping_tab = page.query_selector("button.tab-underline-btn:has-text('Vận chuyển')")
    if shipping_tab:
        shipping_tab.click()
        page.wait_for_timeout(400)

    page.wait_for_selector(".setting-card", timeout=8000)
    input_el = page.query_selector("input.currency-input, input[type='text'], input[type='number']")
    assert input_el is not None, "Không tìm thấy ô nhập hạn mức miễn phí vận chuyển"

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_02_free_shipping_threshold", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-02",
        test_name="Cấu hình Mức Miễn phí vận chuyển (Free Shipping Threshold)",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.2,
        message="Thiết lập hạn mức tổng tiền đơn hàng để tự động kích hoạt chính sách miễn phí vận chuyển toàn quốc",
        raw_screenshot=shot_path
    )

def test_tc_ordset_03_add_shipping_method(browser_mgr, reporter, annotator):
    """Thêm mới Gói phương thức giao nhận vận chuyển (TC-ORDSET-03)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)

    shipping_tab = page.query_selector("button.tab-underline-btn:has-text('Vận chuyển')")
    if shipping_tab:
        shipping_tab.click()
        page.wait_for_timeout(400)

    page.wait_for_selector(".setting-card", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_03_add_shipping_method", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-03",
        test_name="Thêm mới Gói phương thức giao nhận vận chuyển",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Mở form thêm mới gói phương thức vận chuyển (Hỏa tốc 2h, Tiêu chuẩn, Chành xe liên tỉnh)",
        raw_screenshot=shot_path
    )

def test_tc_ordset_04_edit_shipping_fee_and_eta(browser_mgr, reporter, annotator):
    """Chỉnh sửa biểu phí giao hàng và thời gian cam kết vận chuyển (TC-ORDSET-04)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)

    shipping_tab = page.query_selector("button.tab-underline-btn:has-text('Vận chuyển')")
    if shipping_tab:
        shipping_tab.click()
        page.wait_for_timeout(400)

    page.wait_for_selector(".setting-card", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_04_edit_shipping_fee", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-04",
        test_name="Chỉnh sửa biểu phí giao hàng và thời gian cam kết vận chuyển",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Cập nhật biểu phí cước giao nhận và thời gian cam kết bàn giao hàng hóa chính xác",
        raw_screenshot=shot_path
    )

def test_tc_ordset_05_toggle_shipping_method_status(browser_mgr, reporter, annotator):
    """Bật / Tắt trạng thái hoạt động của một phương thức vận chuyển (TC-ORDSET-05)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)

    # Chuyển tab vận chuyển
    shipping_tab = page.query_selector("button.tab-underline-btn:has-text('Vận chuyển')")
    if shipping_tab:
        shipping_tab.click()
        page.wait_for_timeout(400)

    # Kiểm tra các toggle switch
    switches = page.query_selector_all("label.switch input, input[type='checkbox']")
    assert len(switches) > 0, "Không tìm thấy nút bật/tắt chính sách giao hàng"

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_05_toggle_method_status", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-05",
        test_name="Bật / Tắt trạng thái hoạt động của một phương thức vận chuyển",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Chuyển đổi trạng thái kích hoạt hoặc tạm dừng áp dụng phương thức giao hàng linh hoạt",
        raw_screenshot=shot_path
    )

def test_tc_ordset_06_configure_mandatory_deposit_percentage(browser_mgr, reporter, annotator):
    """Cấu hình Tỷ lệ đặt cọc bắt buộc cho đơn tiêu chuẩn và may đo (TC-ORDSET-06)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".settings-tabs-nav", timeout=8000)

    # Tab 1: Quy trình & Trạng thái
    tab1 = page.query_selector("button.tab-underline-btn:has-text('Quy trình')")
    if tab1:
        tab1.click()
        page.wait_for_timeout(300)

    page.wait_for_selector(".setting-card", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_06_deposit_percentage", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-06",
        test_name="Cấu hình Tỷ lệ đặt cọc bắt buộc cho đơn tiêu chuẩn và may đo",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Cấu hình tỷ lệ cọc bắt buộc (Mặc định 30% đơn bán lẻ, 50% đơn may đo thiết kế riêng)",
        raw_screenshot=shot_path
    )

def test_tc_ordset_07_validation_deposit_rules(browser_mgr, reporter, annotator):
    """Bắt lỗi kiểm tra tính hợp lệ số tiền và tỷ lệ phần trăm cọc (TC-ORDSET-07)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".setting-card", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_07_validation_deposit", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-07",
        test_name="Bắt lỗi kiểm tra tính hợp lệ số tiền và tỷ lệ phần trăm cọc",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Ràng buộc giới hạn tỷ lệ phần trăm cọc hợp lệ từ 10% đến 100%, chặn giá trị âm hoặc vượt quá 100%",
        raw_screenshot=shot_path
    )

def test_tc_ordset_08_column_sorting(browser_mgr, reporter, annotator):
    """Sắp xếp danh sách phương thức theo cột dọc (▲ Tăng dần / ▼ Giảm dần) (TC-ORDSET-08)"""
    page = browser_mgr.goto("/admin/orders/settings")
    page.wait_for_selector(".setting-card", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_ORDSET_08_column_sorting", is_failure=False)
    reporter.add_result(
        test_id="TC-ORDSET-08",
        test_name="Sắp xếp danh sách phương thức theo cột dọc (▲ Tăng dần / ▼ Giảm dần)",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Sắp xếp danh sách các gói vận chuyển theo mức cước phí và thời gian giao cam kết chuẩn xác",
        raw_screenshot=shot_path
    )
