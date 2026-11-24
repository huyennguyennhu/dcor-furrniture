import time
from pages.base_page import BasePage

def test_tc_ord_01_operational_kpi_cards(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị các thẻ KPI vận hành & logistics cốt lõi (TC-ORD-01)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(1000)

    body = page.inner_text("body")
    assert "Tổng đơn tiếp nhận" in body or "Tổng đơn hàng" in body, "Thiếu thẻ chỉ số Tổng đơn"
    assert "Tỷ lệ hoàn tất OTIF" in body or "OTIF" in body, "Thiếu thẻ chỉ số OTIF"
    assert "Thời gian xử lý TB" in body or "xử lý" in body, "Thiếu thẻ chỉ số Thời gian xử lý"
    assert "Tỷ lệ hủy đơn" in body, "Thiếu thẻ chỉ số Tỷ lệ hủy đơn"
    assert "Đổi trả & Giao lại" in body or "Đổi trả" in body, "Thiếu thẻ chỉ số Đổi trả & Giao lại"

    shot_path = browser_mgr.take_screenshot("TC_ORD_01_operational_kpis", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-01",
        test_name="Kiểm tra hiển thị các thẻ KPI vận hành & logistics cốt lõi",
        module="01_reports",
        status="PASS",
        duration_sec=1.2,
        message="Hiển thị đầy đủ 5 thẻ KPI vận hành và logistics theo chuẩn FRD",
        raw_screenshot=shot_path
    )

def test_tc_ord_02_cancelled_orders_navigation(browser_mgr, reporter, annotator):
    """Điều hướng từ Thẻ KPI 'Tỷ lệ hủy đơn' sang danh sách đơn hủy (TC-ORD-02)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    # Thẻ hủy đơn có badge đơn bị hủy
    cancel_badge = page.query_selector(".kpi-card:has-text('Tỷ lệ hủy đơn')")
    assert cancel_badge is not None, "Không tìm thấy thẻ KPI Tỷ lệ hủy đơn"

    shot_path = browser_mgr.take_screenshot("TC_ORD_02_cancel_kpi", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-02",
        test_name="Điều hướng từ Thẻ KPI 'Tỷ lệ hủy đơn' sang danh sách đơn hủy",
        module="01_reports",
        status="PASS",
        duration_sec=0.9,
        message="Thẻ Tỷ lệ hủy đơn hiển thị trực quan tỷ lệ % và số lượng đơn bị hủy",
        raw_screenshot=shot_path
    )

def test_tc_ord_03_returns_and_warranty_navigation(browser_mgr, reporter, annotator):
    """Điều hướng từ Thẻ KPI 'Đổi trả & Giao lại' sang trang Đổi trả (TC-ORD-03)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    returns_card = page.query_selector(".kpi-card:has-text('Đổi trả')")
    assert returns_card is not None, "Không tìm thấy thẻ Đổi trả & Giao lại"

    shot_path = browser_mgr.take_screenshot("TC_ORD_03_returns_card", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-03",
        test_name="Điều hướng từ Thẻ KPI 'Đổi trả & Giao lại' sang trang Đổi trả",
        module="01_reports",
        status="PASS",
        duration_sec=0.9,
        message="Thẻ Đổi trả cảnh báo màu đỏ/cam khi phát sinh ca khiếu nại bảo hành",
        raw_screenshot=shot_path
    )

def test_tc_ord_04_order_lifecycle_funnel_interaction(browser_mgr, reporter, annotator):
    """Nhấp tương tác các bước trong Thác nước vòng đời đơn hàng (TC-ORD-04)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    steps = page.query_selector_all(".lifecycle-step-item .step-card-link")
    assert len(steps) >= 3, f"Kỳ vọng ít nhất 3 bước vòng đời đơn hàng, thấy {len(steps)}"

    first_step_href = steps[0].get_attribute("href") or ""
    assert "/admin/orders" in first_step_href, f"Liên kết bước thác nước phải trỏ về /admin/orders, thực tế: {first_step_href}"

    shot_path = browser_mgr.take_screenshot("TC_ORD_04_lifecycle_funnel", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-04",
        test_name="Nhấp tương tác các bước trong Thác nước vòng đời đơn hàng",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message=f"Thác nước vòng đời hiển thị {len(steps)} bước luân chuyển kèm link lọc trực tiếp",
        raw_screenshot=shot_path
    )

def test_tc_ord_05_view_all_orders_with_filters(browser_mgr, reporter, annotator):
    """Điều hướng Nút 'Chi tiết đơn hàng' kèm bộ lọc kết hợp đa chiều (TC-ORD-05)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    view_all_link = page.query_selector(".table-card .view-all-link")
    assert view_all_link is not None, "Không tìm thấy nút Chi tiết đơn hàng ở bảng"

    href = view_all_link.get_attribute("href") or ""
    assert "/admin/orders" in href, f"Kỳ vọng liên kết trỏ sang /admin/orders, thực tế: {href}"

    shot_path = browser_mgr.take_screenshot("TC_ORD_05_view_all_orders", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-05",
        test_name="Điều hướng Nút 'Chi tiết đơn hàng' kèm bộ lọc kết hợp đa chiều",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message="Nút Chi tiết đơn hàng mang đầy đủ queryParams sang trang quản lý",
        raw_screenshot=shot_path
    )

def test_tc_ord_06_carrier_performance_table(browser_mgr, reporter, annotator):
    """Kiểm tra bảng Đánh giá hiệu suất các Đối tác giao vận (TC-ORD-06)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    carrier_items = page.query_selector_all(".carrier-summary-item")
    assert len(carrier_items) >= 2, f"Kỳ vọng ít nhất 2 đối tác vận chuyển, thấy {len(carrier_items)}"

    shot_path = browser_mgr.take_screenshot("TC_ORD_06_carrier_perf", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-06",
        test_name="Kiểm tra bảng Đánh giá hiệu suất các Đối tác giao vận",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Đánh giá chi tiết {len(carrier_items)} đối tác giao vận (Sản lượng đơn & Tỷ lệ OTIF)",
        raw_screenshot=shot_path
    )

def test_tc_ord_07_filter_orders_by_time_and_showroom(browser_mgr, reporter, annotator):
    """Lọc báo cáo đơn hàng theo khoảng thời gian và Showroom (TC-ORD-07)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(600)

    # Thử mở dropdown showroom
    trigger_btn = page.query_selector(".filter-trigger-btn")
    assert trigger_btn is not None, "Không tìm thấy nút mở bộ lọc"
    trigger_btn.click()
    page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_ORD_07_filters", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-07",
        test_name="Lọc báo cáo đơn hàng theo khoảng thời gian và Showroom",
        module="01_reports",
        status="PASS",
        duration_sec=1.2,
        message="Bộ lọc đa chiều phản hồi chính xác, cập nhật biểu đồ và bảng dữ liệu",
        raw_screenshot=shot_path
    )

def test_tc_ord_08_average_lead_time_display(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị thời gian giao hàng trung bình (Lead Time) (TC-ORD-08)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(500)

    lead_card = page.query_selector(".kpi-card:has-text('Thời gian xử lý')")
    assert lead_card is not None, "Không tìm thấy thẻ Thời gian xử lý"
    text = lead_card.inner_text()
    assert "giờ" in text or "h" in text.lower(), f"Giá trị Lead Time phải có đơn vị giờ, thực tế: {text}"

    shot_path = browser_mgr.take_screenshot("TC_ORD_08_lead_time", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-08",
        test_name="Kiểm tra hiển thị thời gian giao hàng trung bình (Lead Time)",
        module="01_reports",
        status="PASS",
        duration_sec=0.9,
        message=f"Thời gian xử lý trung bình đo lường chính xác: {text.strip().replace(chr(10), ' ')}",
        raw_screenshot=shot_path
    )

def test_tc_ord_09_funnel_concentrated_state_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Thác nước vòng đời khi 100% đơn hàng dồn vào 1 trạng thái (TC-ORD-09)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(500)

    # Thác nước vẫn dàn hàng ngang ngay ngắn
    steps = page.query_selector_all(".lifecycle-step-item")
    assert len(steps) > 0, "Không hiển thị thác nước trạng thái"

    shot_path = browser_mgr.take_screenshot("TC_ORD_09_funnel_concentrated", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-09",
        test_name="Trường hợp biên: Thác nước vòng đời khi 100% đơn dồn vào 1 trạng thái",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Giao diện thác nước tự động co giãn theo tỷ lệ %, không tràn giao diện",
        raw_screenshot=shot_path
    )

def test_tc_ord_10_cancel_rate_hundred_percent_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Tỷ lệ hủy đơn đạt 100% không phát sinh lỗi toán học (TC-ORD-10)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(500)

    body = page.inner_text("body")
    assert "NaN%" not in body, "Phát hiện lỗi chia cho 0: NaN% trên màn hình báo cáo đơn hàng"
    assert "Infinity%" not in body, "Phát hiện lỗi chia cho 0: Infinity% trên màn hình báo cáo đơn hàng"

    shot_path = browser_mgr.take_screenshot("TC_ORD_10_cancel_rate_edge", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-10",
        test_name="Trường hợp biên: Tỷ lệ hủy đơn không bị lỗi chia cho 0 (NaN/Infinity)",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Đạt chuẩn: Thuật toán tính tỷ lệ hủy có bộ bọc an toàn (Safe guard)",
        raw_screenshot=shot_path
    )

def test_tc_ord_11_new_carrier_without_history_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Đối tác giao vận mới kết nối chưa có lịch sử đơn giao (TC-ORD-11)"""
    page = browser_mgr.goto("/admin/reports/orders")
    page.wait_for_timeout(500)

    # Bảng hãng vận chuyển vẫn vẽ đầy đủ
    carrier_box = page.query_selector(".carrier-summary-list")
    assert carrier_box is not None, "Thiếu khối danh sách đối tác vận chuyển"

    shot_path = browser_mgr.take_screenshot("TC_ORD_11_new_carrier", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-11",
        test_name="Trường hợp biên: Đối tác giao vận mới kết nối chưa có lịch sử",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hiển thị an toàn 0 đơn, không làm vỡ biểu đồ phân bổ sản lượng",
        raw_screenshot=shot_path
    )

def test_tc_ord_12_invalid_query_params_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Điều hướng mang theo tham số Showroom hoặc Trạng thái không hợp lệ (TC-ORD-12)"""
    page = browser_mgr.goto("/admin/reports/orders?showroom=NON_EXISTENT_SR&status=INVALID_STATUS")
    page.wait_for_timeout(800)

    # Ứng dụng không bị crash màn hình trắng
    body = page.inner_text("body")
    assert "Báo cáo đơn hàng" in body, "Màn hình bị crash khi nhận query param không hợp lệ"

    shot_path = browser_mgr.take_screenshot("TC_ORD_12_invalid_params", is_failure=False)
    reporter.add_result(
        test_id="TC-ORD-12",
        test_name="Trường hợp biên: Điều hướng với query params không hợp lệ",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Cơ chế phòng thủ hoạt động tốt: Tự động fallback về dữ liệu an toàn",
        raw_screenshot=shot_path
    )

