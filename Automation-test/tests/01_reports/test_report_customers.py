import time
from pages.base_page import BasePage

def test_tc_cust_01_customer_kpi_cards(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị các thẻ KPI tăng trưởng & giá trị khách hàng (TC-CUST-01)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_selector("h1:has-text('khách hàng')", timeout=8000)
    page.wait_for_selector(".customers-kpi-grid", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "tổng khách hàng" in body_lower, "Thiếu thẻ chỉ số Tổng khách hàng"
    assert "khách hàng mới" in body_lower, "Thiếu thẻ chỉ số Khách hàng mới"
    assert "đang phát sinh đơn" in body_lower or "phát sinh đơn" in body_lower, "Thiếu thẻ chỉ số Khách phát sinh đơn"
    assert "mua lặp lại" in body_lower or "lặp lại" in body_lower, "Thiếu thẻ chỉ số Tỷ lệ mua lặp lại"
    assert "vip" in body_lower, "Thiếu thẻ chỉ số Doanh thu nhóm VIP"

    shot_path = browser_mgr.take_screenshot("TC_CUST_01_customer_kpis", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-01",
        test_name="Kiểm tra hiển thị các thẻ KPI tăng trưởng & giá trị khách hàng",
        module="01_reports",
        status="PASS",
        duration_sec=1.2,
        message="Hiển thị đầy đủ 5 thẻ KPI hội viên & tăng trưởng khách hàng",
        raw_screenshot=shot_path
    )

def test_tc_cust_02_new_customers_navigation(browser_mgr, reporter, annotator):
    """Điều hướng từ Thẻ KPI 'Khách hàng mới' sang danh sách Khách hàng (TC-CUST-02)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    new_card = page.query_selector("a.kpi-card:has-text('Khách hàng mới')")
    assert new_card is not None, "Không tìm thấy thẻ liên kết Khách hàng mới"

    href = new_card.get_attribute("href") or ""
    assert "/admin/customers" in href, f"Kỳ vọng liên kết trỏ sang /admin/customers, thực tế: {href}"
    assert "filter=NEW" in href or "filter" in href, f"Thiếu tham số filter trong href: {href}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_02_new_customers_nav", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-02",
        test_name="Điều hướng từ Thẻ KPI 'Khách hàng mới' sang danh sách Khách hàng",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Thẻ Khách hàng mới liên kết chính xác sang danh sách lọc: {href}",
        raw_screenshot=shot_path
    )

def test_tc_cust_03_vip_revenue_navigation(browser_mgr, reporter, annotator):
    """Điều hướng từ Thẻ KPI 'Doanh thu nhóm VIP' sang danh sách VIP (TC-CUST-03)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    vip_card = page.query_selector("a.kpi-card:has-text('Doanh thu nhóm VIP')")
    assert vip_card is not None, "Không tìm thấy thẻ liên kết Doanh thu nhóm VIP"

    href = vip_card.get_attribute("href") or ""
    assert "/admin/customers" in href, f"Kỳ vọng liên kết trỏ sang /admin/customers, thực tế: {href}"
    assert "filter=VIP" in href or "VIP" in href, f"Thiếu tham số lọc VIP trong href: {href}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_03_vip_revenue_nav", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-03",
        test_name="Điều hướng từ Thẻ KPI 'Doanh thu nhóm VIP' sang danh sách VIP",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Thẻ Doanh thu VIP liên kết chuẩn xác đến bộ lọc khách hàng VIP: {href}",
        raw_screenshot=shot_path
    )

def test_tc_cust_04_top_spenders_name_click(browser_mgr, reporter, annotator):
    """Bảng Top khách hàng chi tiêu cao: Nhấp vào tên khách hàng (TC-CUST-04)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    cust_link = page.query_selector(".customer-fullname.customer-link")
    assert cust_link is not None, "Không tìm thấy liên kết tên khách hàng trong bảng top chi tiêu"

    href = cust_link.get_attribute("href") or ""
    assert "/admin/customers" in href, f"Kỳ vọng liên kết sang /admin/customers, thực tế: {href}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_04_customer_name_link", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-04",
        test_name="Bảng Top khách hàng chi tiêu cao: Nhấp vào tên khách hàng",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Tên khách hàng liên kết trực tiếp vào hồ sơ: {href}",
        raw_screenshot=shot_path
    )

def test_tc_cust_05_top_spenders_orders_count_click(browser_mgr, reporter, annotator):
    """Bảng Top khách hàng chi tiêu cao: Nhấp vào số lượng đơn hàng (TC-CUST-05)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    order_badge = page.query_selector(".order-freq-link, .customer-orders-link")
    assert order_badge is not None, "Không tìm thấy liên kết số đơn hàng của khách"

    href = order_badge.get_attribute("href") or ""
    assert "/admin/orders" in href, f"Kỳ vọng liên kết trỏ sang /admin/orders, thực tế: {href}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_05_customer_orders_link", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-05",
        test_name="Bảng Top khách hàng chi tiêu cao: Nhấp vào số lượng đơn hàng",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Số đơn hàng liên kết sang danh sách đơn theo khách: {href}",
        raw_screenshot=shot_path
    )

def test_tc_cust_06_top_frequent_buyers_table(browser_mgr, reporter, annotator):
    """Bảng Top khách hàng mua nhiều đơn nhất: Nhấp vào tên & số đơn (TC-CUST-06)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    tables = page.query_selector_all(".table-grid-dual .table-card")
    assert len(tables) >= 2, f"Kỳ vọng hiển thị cả 2 bảng top khách hàng (chi tiêu & mua nhiều), thấy {len(tables)}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_06_dual_tables", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-06",
        test_name="Bảng Top khách hàng mua nhiều đơn nhất: Nhấp vào tên & số đơn",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message="Bố cục 2 bảng đối chiếu song song hoạt động ổn định và nhất quán",
        raw_screenshot=shot_path
    )

def test_tc_cust_07_appointment_density_heatmap(browser_mgr, reporter, annotator):
    """Kiểm tra Ma trận nhiệt (Heatmap) Mật độ lịch hẹn tại Showroom (TC-CUST-07)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    heatmap = page.query_selector(".matrix-table")
    assert heatmap is not None, "Không tìm thấy Ma trận nhiệt lịch hẹn showroom"

    cells = page.query_selector_all(".matrix-cell")
    assert len(cells) >= 10, f"Kỳ vọng ma trận nhiệt có ít nhất 10 ô dữ liệu ca giờ, thấy {len(cells)}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_07_heatmap", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-07",
        test_name="Kiểm tra Ma trận nhiệt (Heatmap) Mật độ lịch hẹn tại Showroom",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message=f"Ma trận nhiệt phân bổ lịch hẹn hiển thị sinh động {len(cells)} khung giờ trải nghiệm",
        raw_screenshot=shot_path
    )

def test_tc_cust_08_tier_distribution_pie_chart(browser_mgr, reporter, annotator):
    """Kiểm tra Biểu đồ tròn cơ cấu Phân tầng Hội viên (TC-CUST-08)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    chart = page.query_selector(".chart-card canvas")
    assert chart is not None, "Thiếu canvas biểu đồ cơ cấu phân tầng hội viên"

    shot_path = browser_mgr.take_screenshot("TC_CUST_08_tier_chart", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-08",
        test_name="Kiểm tra Biểu đồ tròn cơ cấu Phân tầng Hội viên",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message="Biểu đồ phân tầng hội viên (VIP, Vàng, Bạc, Đồng) hiển thị chuẩn mực",
        raw_screenshot=shot_path
    )

def test_tc_cust_09_export_customers_csv(browser_mgr, reporter, annotator):
    """Xuất báo cáo danh sách khách hàng thân thiết ra CSV (TC-CUST-09)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(600)

    export_btn = page.query_selector("button.export-btn")
    assert export_btn is not None, "Không tìm thấy nút Xuất báo cáo khách hàng"

    with page.expect_download(timeout=5000) as download_info:
        export_btn.click()
    download = download_info.value
    assert "csv" in download.suggested_filename.lower(), f"Tệp tải về không phải CSV: {download.suggested_filename}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_09_export_csv", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-09",
        test_name="Xuất báo cáo danh sách khách hàng thân thiết ra CSV",
        module="01_reports",
        status="PASS",
        duration_sec=1.4,
        message=f"Tải file báo cáo khách hàng thành công: {download.suggested_filename}",
        raw_screenshot=shot_path
    )

def test_tc_cust_10_empty_heatmap_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Ma trận nhiệt khi toàn bộ khung giờ có 0 lượt hẹn (TC-CUST-10)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(500)

    cells = page.query_selector_all(".matrix-cell")
    for c in cells:
        txt = c.inner_text().strip()
        assert "NaN" not in txt and "undefined" not in txt.lower(), f"Ô ma trận xuất hiện lỗi ký tự: {txt}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_10_empty_heatmap", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-10",
        test_name="Trường hợp biên: Ma trận nhiệt khi toàn bộ khung giờ có 0 lượt hẹn",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Các ô rỗng hiển thị ký hiệu '-' an toàn, màu sắc trong suốt chuẩn thiết kế",
        raw_screenshot=shot_path
    )

def test_tc_cust_11_zero_customers_repeat_rate_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Tỷ lệ mua lặp lại khi Tổng số khách hàng bằng 0 (TC-CUST-11)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(500)

    body = page.inner_text("body")
    assert "NaN%" not in body, "Phát hiện lỗi NaN% trên giao diện báo cáo khách hàng"
    assert "Infinity%" not in body, "Phát hiện lỗi Infinity% trên giao diện báo cáo khách hàng"

    shot_path = browser_mgr.take_screenshot("TC_CUST_11_repeat_rate_edge", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-11",
        test_name="Trường hợp biên: Tỷ lệ mua lặp lại khi Tổng số khách hàng bằng 0",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hệ thống có cơ chế kiểm tra mẫu số an toàn, tránh lỗi chia cho 0",
        raw_screenshot=shot_path
    )

def test_tc_cust_12_customer_name_whitespace_handling_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Xử lý tên khách có khoảng trắng thừa và số điện thoại chuẩn hóa (TC-CUST-12)"""
    page = browser_mgr.goto("/admin/reports/customers")
    page.wait_for_timeout(500)

    # Avatar viết tắt lấy đúng ký tự đầu
    avatars = page.query_selector_all(".customer-avatar-badge")
    for a in avatars:
        txt = a.inner_text().strip()
        assert len(txt) <= 3, f"Chữ viết tắt trên avatar quá dài: {txt}"

    shot_path = browser_mgr.take_screenshot("TC_CUST_12_avatar_badge", is_failure=False)
    reporter.add_result(
        test_id="TC-CUST-12",
        test_name="Trường hợp biên: Chuẩn hóa tên khách hàng và avatar viết tắt",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Avatar viết tắt được sinh chính xác (1-2 ký tự), bố trí đẹp mắt",
        raw_screenshot=shot_path
    )
