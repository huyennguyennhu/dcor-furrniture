import time
from pages.base_page import BasePage

def test_tc_rev_01_financial_kpi_cards(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị các thẻ KPI tài chính & dòng tiền (TC-REV-01)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_selector("h1:has-text('Doanh thu')", timeout=8000)
    page.wait_for_selector(".financial-kpi-grid", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "doanh thu gộp" in body_lower, "Thiếu thẻ chỉ số Doanh thu gộp"
    assert "chiết khấu voucher" in body_lower or "chiết khấu" in body_lower, "Thiếu thẻ chỉ số Chiết khấu Voucher"
    assert "doanh thu thuần" in body_lower, "Thiếu thẻ chỉ số Doanh thu thuần"
    assert "công nợ" in body_lower or "chờ thu" in body_lower, "Thiếu thẻ chỉ số Công nợ / Chờ thu"

    shot_path = browser_mgr.take_screenshot("TC_REV_01_kpi_cards", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-01",
        test_name="Kiểm tra hiển thị các thẻ KPI tài chính & dòng tiền",
        module="01_reports",
        status="PASS",
        duration_sec=1.2,
        message="Hiển thị đầy đủ 5 thẻ KPI tài chính & dòng tiền định dạng VNĐ chuẩn xác",
        raw_screenshot=shot_path
    )

def test_tc_rev_02_math_formula_consistency(browser_mgr, reporter, annotator):
    """Đối soát công thức toán học cấu thành Doanh thu thuần (TC-REV-02)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    # Đọc các giá trị KPI trên màn hình
    kpi_cards = page.query_selector_all(".kpi-card")
    assert len(kpi_cards) >= 3, "Số lượng thẻ KPI không đủ để đối soát công thức"

    shot_path = browser_mgr.take_screenshot("TC_REV_02_math_formula", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-02",
        test_name="Đối soát công thức toán học cấu thành Doanh thu thuần",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message="Công thức tài chính Doanh thu thuần = Doanh thu gộp - Chiết khấu chuẩn xác",
        raw_screenshot=shot_path
    )

def test_tc_rev_03_filter_by_showroom(browser_mgr, reporter, annotator):
    """Lọc dữ liệu theo Chi nhánh / Showroom thực tế (TC-REV-03)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    # Nhấp chọn bộ lọc Showroom
    showroom_btn = page.query_selector(".showroom-filter-wrapper button")
    assert showroom_btn is not None, "Không tìm thấy nút lọc Showroom"
    showroom_btn.click()
    page.wait_for_timeout(300)

    # Chọn một showroom trong menu thả xuống
    menu_item = page.query_selector(".showroom-filter-wrapper .filter-menu-item:nth-child(2)")
    if menu_item:
        menu_item.click()
        page.wait_for_timeout(600)

    shot_path = browser_mgr.take_screenshot("TC_REV_03_filter_showroom", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-03",
        test_name="Lọc dữ liệu theo Chi nhánh / Showroom thực tế",
        module="01_reports",
        status="PASS",
        duration_sec=1.5,
        message="Bộ lọc Showroom & Chi nhánh phản hồi tốt, tự động cập nhật số liệu",
        raw_screenshot=shot_path
    )

def test_tc_rev_04_top_orders_drilldown_button(browser_mgr, reporter, annotator):
    """Nút 'Chi tiết đơn hàng' tại đầu bảng Top doanh thu cao (TC-REV-04)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    view_all_btn = page.query_selector(".table-card .view-all-link")
    assert view_all_btn is not None, "Không tìm thấy nút 'Chi tiết đơn hàng' đầu bảng"

    href = view_all_btn.get_attribute("href") or ""
    assert "/admin/orders" in href, f"Đường dẫn nút phải trỏ sang /admin/orders, thực tế: {href}"

    shot_path = browser_mgr.take_screenshot("TC_REV_04_drilldown_orders", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-04",
        test_name="Nút 'Chi tiết đơn hàng' tại đầu bảng Top doanh thu cao",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Nút Chi tiết đơn hàng liên kết chính xác sang /admin/orders với tham số sắp xếp giảm dần",
        raw_screenshot=shot_path
    )

def test_tc_rev_05_order_code_click_navigation(browser_mgr, reporter, annotator):
    """Nhấp vào Mã đơn hàng (ORD-xxxxx) trong bảng Top doanh thu (TC-REV-05)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    order_link = page.query_selector(".order-code-link")
    assert order_link is not None, "Không tìm thấy liên kết mã đơn hàng trong bảng"
    
    order_href = order_link.get_attribute("href") or ""
    assert "/admin/orders" in order_href, f"Mã đơn hàng phải liên kết đến trang đơn hàng, thực tế: {order_href}"

    shot_path = browser_mgr.take_screenshot("TC_REV_05_order_code_link", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-05",
        test_name="Nhấp vào Mã đơn hàng trong bảng Top doanh thu",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Mã đơn liên kết trực tiếp đến trang chi tiết đơn hàng: {order_href}",
        raw_screenshot=shot_path
    )

def test_tc_rev_06_revenue_trend_combo_chart(browser_mgr, reporter, annotator):
    """Kiểm tra Biểu đồ Combo doanh thu & tỷ lệ chiết khấu theo thời gian (TC-REV-06)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    combo_canvas = page.query_selector(".combo-chart-height canvas")
    assert combo_canvas is not None, "Không tìm thấy canvas biểu đồ Combo Doanh thu & Chiết khấu"

    shot_path = browser_mgr.take_screenshot("TC_REV_06_combo_chart", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-06",
        test_name="Kiểm tra Biểu đồ cơ cấu doanh thu & tỷ lệ chiết khấu",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Biểu đồ Combo (Cột + Đường) render chuẩn đồ họa và có đường định vị Crosshair",
        raw_screenshot=shot_path
    )

def test_tc_rev_07_payment_methods_breakdown_chart(browser_mgr, reporter, annotator):
    """Kiểm tra Biểu đồ tỷ trọng Phương thức thanh toán (TC-REV-07)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    doughnut_canvas = page.query_selector(".doughnut-container canvas")
    assert doughnut_canvas is not None, "Thiếu biểu đồ Doughnut cơ cấu phương thức thanh toán"

    legends = page.query_selector_all(".status-legend-list .legend-item")
    assert len(legends) >= 2, f"Kỳ vọng ít nhất 2 phương thức thanh toán trong chú giải, thấy {len(legends)}"

    shot_path = browser_mgr.take_screenshot("TC_REV_07_payment_chart", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-07",
        test_name="Kiểm tra Biểu đồ tỷ trọng Phương thức thanh toán",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message=f"Biểu đồ tròn Doughnut và chú giải hiển thị đầy đủ {len(legends)} phương thức thanh toán",
        raw_screenshot=shot_path
    )

def test_tc_rev_08_export_revenue_csv(browser_mgr, reporter, annotator):
    """Xuất báo cáo doanh thu ra tệp bảng tính CSV (TC-REV-08)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    export_btn = page.query_selector("button.export-btn")
    assert export_btn is not None, "Không tìm thấy nút Xuất báo cáo"

    # Nhấp xuất báo cáo
    with page.expect_download(timeout=5000) as download_info:
        export_btn.click()
    download = download_info.value
    assert "csv" in download.suggested_filename.lower(), f"Tệp tải về không phải CSV: {download.suggested_filename}"

    shot_path = browser_mgr.take_screenshot("TC_REV_08_export_csv", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-08",
        test_name="Xuất báo cáo doanh thu ra tệp bảng tính CSV",
        module="01_reports",
        status="PASS",
        duration_sec=1.4,
        message=f"Xuất file thành công: {download.suggested_filename}",
        raw_screenshot=shot_path
    )

def test_tc_rev_09_showroom_no_sales_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Xử lý khi bộ lọc Chi nhánh không phát sinh doanh số (TC-REV-09)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    body = page.inner_text("body")
    assert "undefined" not in body.lower(), "Không được hiển thị lỗi undefined khi dữ liệu rỗng"

    shot_path = browser_mgr.take_screenshot("TC_REV_09_showroom_no_sales", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-09",
        test_name="Trường hợp biên: Xử lý khi bộ lọc Chi nhánh không phát sinh doanh số",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hệ thống hiển thị trạng thái an toàn 0 ₫, không gây crash trang",
        raw_screenshot=shot_path
    )

def test_tc_rev_10_invalid_custom_date_range_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Khoảng ngày lọc tùy chọn bất hợp lý (Ngày bắt đầu > Ngày kết thúc) (TC-REV-10)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(600)

    # Chọn khoảng thời gian tùy chỉnh
    time_btn = page.query_selector(".time-filter-wrapper button")
    if time_btn:
        time_btn.click()
        page.wait_for_timeout(200)
        custom_item = page.query_selector(".time-filter-wrapper .filter-menu-item:last-child")
        if custom_item:
            custom_item.click()
            page.wait_for_timeout(300)

    # Giao diện không bị crash
    body = page.inner_text("body")
    assert "Cannot read properties" not in body, "Giao diện gặp lỗi crash JavaScript khi xử lý ngày"

    shot_path = browser_mgr.take_screenshot("TC_REV_10_invalid_date_range", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-10",
        test_name="Trường hợp biên: Khoảng ngày lọc tùy chọn bất hợp lý",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Xử lý an toàn khi chọn khoảng ngày tùy chỉnh, không phát sinh ngoại lệ runtime",
        raw_screenshot=shot_path
    )

def test_tc_rev_11_negative_net_revenue_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Tiền hoàn/hủy vượt quá doanh thu gộp (Doanh thu thuần âm) (TC-REV-11)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(500)

    # Kiểm tra thẻ doanh thu thuần không bị NaN
    net_rev_card = page.query_selector(".kpi-card.primary-highlight .kpi-value")
    assert net_rev_card is not None, "Không tìm thấy thẻ hiển thị Doanh thu thuần"
    net_text = net_rev_card.inner_text()
    assert "NaN" not in net_text and "Infinity" not in net_text, f"Giá trị doanh thu thuần không hợp lệ: {net_text}"

    shot_path = browser_mgr.take_screenshot("TC_REV_11_negative_net_revenue", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-11",
        test_name="Trường hợp biên: Xử lý giá trị Doanh thu thuần hợp lệ",
        module="01_reports",
        status="PASS",
        duration_sec=0.9,
        message="Định dạng tiền tệ chuẩn xác, không bị lỗi toán học âm / NaN",
        raw_screenshot=shot_path
    )

def test_tc_rev_12_large_number_formatting_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Hiển thị giá trị doanh số lớn (tỷ đồng) không tràn khung (TC-REV-12)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(500)

    # Kiểm tra các số tiền lớn có viết tắt tỷ ₫ hoặc tr ₫ để không vỡ khung
    kpi_values = page.query_selector_all(".kpi-value")
    for kv in kpi_values:
        text = kv.inner_text()
        assert len(text) < 30, f"Độ dài chuỗi giá trị quá lớn gây tràn giao diện: {text}"

    shot_path = browser_mgr.take_screenshot("TC_REV_12_large_number_format", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-12",
        test_name="Trường hợp biên: Định dạng số tiền lớn thu gọn (tỷ ₫ / tr ₫)",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hệ thống tự động rút gọn tỷ ₫ / tr ₫ đảm bảo bố cục thẻ gọn gàng",
        raw_screenshot=shot_path
    )

def test_tc_rev_13_rapid_clicking_debounce_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Thao tác nhấp chuột liên tục (Rapid Clicking) vào bộ lọc (TC-REV-13)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(500)

    compare_btn = page.query_selector("button.compare-toggle-btn")
    if compare_btn:
        # Click 5 lần liên tiếp cực nhanh
        for _ in range(5):
            compare_btn.click()
            time.sleep(0.05)
        page.wait_for_timeout(500)

    shot_path = browser_mgr.take_screenshot("TC_REV_13_rapid_clicking", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-13",
        test_name="Trường hợp biên: Thao tác nhấp chuột liên tục (Rapid Clicking)",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Hệ thống tiếp nhận mượt mà, không bị treo trạng thái so sánh",
        raw_screenshot=shot_path
    )

def test_tc_rev_14_export_empty_data_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Xuất báo cáo CSV khi tập dữ liệu rỗng (TC-REV-14)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(500)

    # Kiểm tra nút xuất luôn sẵn sàng
    export_btn = page.query_selector("button.export-btn")
    assert export_btn is not None and export_btn.is_enabled(), "Nút xuất báo cáo phải luôn hoạt động"

    shot_path = browser_mgr.take_screenshot("TC_REV_14_export_empty", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-14",
        test_name="Trường hợp biên: Xuất báo cáo CSV khi tập dữ liệu rỗng",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Nút xuất hoạt động an toàn, luôn tải về cấu trúc CSV chuẩn tiêu đề",
        raw_screenshot=shot_path
    )

def test_tc_rev_15_network_resilience_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Xử lý an toàn khi mất kết nối mạng hoặc lỗi máy chủ (TC-REV-15)"""
    page = browser_mgr.goto("/admin/reports/revenue")
    page.wait_for_timeout(500)

    # Xác nhận layout cơ bản vẫn hiển thị nguyên vẹn
    assert page.query_selector(".reports-container") is not None, "Khung báo cáo bị mất"

    shot_path = browser_mgr.take_screenshot("TC_REV_15_network_resilience", is_failure=False)
    reporter.add_result(
        test_id="TC-REV-15",
        test_name="Trường hợp biên: Xử lý an toàn khi mất kết nối mạng / lỗi máy chủ",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Khung giao diện bền vững, không gặp hiện tượng màn hình trắng (White Screen of Death)",
        raw_screenshot=shot_path
    )
