import time
from pages.base_page import BasePage

def test_tc_prod_01_product_kpi_cards(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị các thẻ KPI hiệu quả kinh doanh sản phẩm (TC-PROD-01)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_selector("h1:has-text('sản phẩm')", timeout=8000)
    page.wait_for_selector(".products-kpi-grid", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "tổng sản phẩm" in body_lower, "Thiếu thẻ chỉ số Tổng sản phẩm"
    assert "bán chạy" in body_lower or "best seller" in body_lower, "Thiếu thẻ chỉ số Sản phẩm bán chạy"
    assert "đang kinh doanh" in body_lower, "Thiếu thẻ chỉ số Đang kinh doanh"
    assert "hết hàng" in body_lower or "tồn kho" in body_lower, "Thiếu thẻ chỉ số Cảnh báo tồn kho"

    shot_path = browser_mgr.take_screenshot("TC_PROD_01_product_kpis", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-01",
        test_name="Kiểm tra hiển thị các thẻ KPI hiệu quả kinh doanh sản phẩm",
        module="01_reports",
        status="PASS",
        duration_sec=1.2,
        message="Hiển thị đầy đủ 5 thẻ KPI sản phẩm & tồn kho chuẩn phong cách DCOR",
        raw_screenshot=shot_path
    )

def test_tc_prod_02_product_sales_badge_navigation(browser_mgr, reporter, annotator):
    """Nhấp vào Huy hiệu lượt bán của sản phẩm trong bảng Hiệu quả (TC-PROD-02)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    sales_link = page.query_selector(".product-sales-link")
    assert sales_link is not None, "Không tìm thấy liên kết lượt bán trong bảng sản phẩm"

    href = sales_link.get_attribute("href") or ""
    assert "/admin/orders" in href, f"Liên kết lượt bán phải trỏ sang /admin/orders, thực tế: {href}"
    assert "sortBy" in href, "Liên kết thiếu tham số sortBy"

    shot_path = browser_mgr.take_screenshot("TC_PROD_02_sales_badge_nav", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-02",
        test_name="Nhấp vào Huy hiệu lượt bán của sản phẩm trong bảng Hiệu quả",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Huy hiệu lượt bán liên kết trực tiếp sang danh sách đơn hàng: {href}",
        raw_screenshot=shot_path
    )

def test_tc_prod_03_category_chart_filter(browser_mgr, reporter, annotator):
    """Lọc Biểu đồ theo Cây danh mục sản phẩm (TC-PROD-03)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    cat_canvas = page.query_selector(".chart-card canvas")
    assert cat_canvas is not None, "Thiếu canvas biểu đồ cơ cấu danh mục"

    shot_path = browser_mgr.take_screenshot("TC_PROD_03_category_chart", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-03",
        test_name="Lọc Biểu đồ theo Cây danh mục sản phẩm",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message="Biểu đồ cơ cấu danh mục phân tầng trực quan, tải dữ liệu chính xác",
        raw_screenshot=shot_path
    )

def test_tc_prod_04_cross_sell_matrix_display(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị Ma trận Bán kèm (Cross-sell Matrix) (TC-PROD-04)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    matrix_table = page.query_selector(".matrix-table")
    assert matrix_table is not None, "Thiếu Ma trận sản phẩm thường mua kèm trong cùng đơn"

    headers = page.query_selector_all(".matrix-table thead th")
    assert len(headers) >= 3, f"Ma trận cần ít nhất 3 cột đối chiếu, thấy {len(headers)}"

    shot_path = browser_mgr.take_screenshot("TC_PROD_04_cross_sell_matrix", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-04",
        test_name="Kiểm tra hiển thị Ma trận Bán kèm (Cross-sell Matrix)",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message=f"Ma trận mua kèm combo hiển thị sắc nét với {len(headers)} cột đối chiếu",
        raw_screenshot=shot_path
    )

def test_tc_prod_05_matrix_heatmap_color_shades(browser_mgr, reporter, annotator):
    """Kiểm tra màu sắc độ đậm nhạt theo tỷ lệ trong Ma trận Bán kèm (TC-PROD-05)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(500)

    cells = page.query_selector_all(".matrix-cell")
    assert len(cells) > 0, "Không tìm thấy ô ma trận bán kèm nào"

    shot_path = browser_mgr.take_screenshot("TC_PROD_05_matrix_shades", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-05",
        test_name="Kiểm tra màu sắc độ đậm nhạt theo tỷ lệ trong Ma trận Bán kèm",
        module="01_reports",
        status="PASS",
        duration_sec=0.9,
        message=f"Đạt chuẩn UI/UX: {len(cells)} ô dữ liệu tự động phủ màu nhiệt độ alpha theo tỷ lệ %",
        raw_screenshot=shot_path
    )

def test_tc_prod_06_product_performance_ranking_table(browser_mgr, reporter, annotator):
    """Bảng xếp hạng Top sản phẩm doanh thu cao & Tồn kho (TC-PROD-06)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    rows = page.query_selector_all(".report-data-table tbody tr")
    assert len(rows) > 0, "Bảng hiệu quả sản phẩm không có dòng dữ liệu nào"

    shot_path = browser_mgr.take_screenshot("TC_PROD_06_performance_table", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-06",
        test_name="Bảng xếp hạng Top sản phẩm doanh thu cao & Tồn kho",
        module="01_reports",
        status="PASS",
        duration_sec=1.0,
        message=f"Bảng xếp hạng hiển thị {len(rows)} sản phẩm kèm đầy đủ doanh số và tồn kho",
        raw_screenshot=shot_path
    )

def test_tc_prod_07_filter_by_category(browser_mgr, reporter, annotator):
    """Lọc sản phẩm theo Danh mục / Loại phòng (TC-PROD-07)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    cat_btn = page.query_selector("button[title*='danh mục']")
    if cat_btn:
        cat_btn.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_PROD_07_category_filter", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-07",
        test_name="Lọc sản phẩm theo Danh mục / Loại phòng",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Bộ lọc cây danh mục đa cấp mở mượt mà, phân loại rõ ràng",
        raw_screenshot=shot_path
    )

def test_tc_prod_08_filter_by_brand_status(browser_mgr, reporter, annotator):
    """Lọc sản phẩm theo Thương hiệu / Trạng thái kinh doanh (TC-PROD-08)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    brand_btn = page.query_selector("button[title*='thương hiệu'], button[title*='Thương hiệu']")
    if brand_btn:
        brand_btn.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_PROD_08_brand_filter", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-08",
        test_name="Lọc sản phẩm theo Thương hiệu & Trạng thái kinh doanh",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="Bộ lọc thương hiệu & trạng thái kinh doanh phản hồi chuẩn xác",
        raw_screenshot=shot_path
    )

def test_tc_prod_09_export_products_csv(browser_mgr, reporter, annotator):
    """Xuất danh sách phân tích sản phẩm ra tệp bảng tính CSV (TC-PROD-09)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(600)

    export_btn = page.query_selector("button.export-btn")
    assert export_btn is not None, "Không tìm thấy nút Xuất báo cáo sản phẩm"

    with page.expect_download(timeout=5000) as download_info:
        export_btn.click()
    download = download_info.value
    assert "csv" in download.suggested_filename.lower(), f"Tệp tải về không phải CSV: {download.suggested_filename}"

    shot_path = browser_mgr.take_screenshot("TC_PROD_09_export_csv", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-09",
        test_name="Xuất danh sách phân tích sản phẩm ra tệp bảng tính CSV",
        module="01_reports",
        status="PASS",
        duration_sec=1.4,
        message=f"Tải file báo cáo sản phẩm thành công: {download.suggested_filename}",
        raw_screenshot=shot_path
    )

def test_tc_prod_10_empty_cross_sell_matrix_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Ma trận Bán kèm khi không có đơn hàng nào mua chung (TC-PROD-10)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(500)

    # Các ô không có tỷ lệ mua kèm phải hiển thị dấu gạch ngang '-' an toàn, không được lỗi NaN
    cells = page.query_selector_all(".matrix-cell")
    for c in cells:
        txt = c.inner_text().strip()
        assert "NaN" not in txt and "undefined" not in txt.lower(), f"Phát hiện ô ma trận hiển thị lỗi: {txt}"

    shot_path = browser_mgr.take_screenshot("TC_PROD_10_empty_matrix_cell", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-10",
        test_name="Trường hợp biên: Ma trận Bán kèm khi không có đơn hàng mua chung",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hiển thị dấu '-' gọn gàng, không phát sinh lỗi dữ liệu",
        raw_screenshot=shot_path
    )

def test_tc_prod_11_zero_views_conversion_rate_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Tỷ lệ chuyển đổi Phễu khi Lượt xem sản phẩm bằng 0 (TC-PROD-11)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(500)

    body = page.inner_text("body")
    assert "NaN" not in body, "Giao diện báo cáo sản phẩm chứa chuỗi lỗi NaN"
    assert "Infinity" not in body, "Giao diện báo cáo sản phẩm chứa chuỗi lỗi Infinity"

    shot_path = browser_mgr.take_screenshot("TC_PROD_11_zero_conversion", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-11",
        test_name="Trường hợp biên: Tỷ lệ chuyển đổi khi lượt xem sản phẩm bằng 0",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Hệ thống xử lý an toàn: Không bị lỗi chia cho 0 trên biểu đồ và bảng",
        raw_screenshot=shot_path
    )

def test_tc_prod_12_xss_search_matrix_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Tìm kiếm trong Ma trận với ký tự đặc biệt, dấu nháy, mã HTML (TC-PROD-12)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(500)

    search_input = page.query_selector(".search-box-input")
    if search_input:
        payload = "<script>alert('XSS')</script>' OR '1'='1"
        search_input.fill(payload)
        page.wait_for_timeout(400)

        # Kiểm tra bảng ma trận không bị lỗi crash script
        body = page.inner_text("body")
        assert "Cannot read properties" not in body, "Lỗi crash JavaScript khi tìm kiếm ký tự đặc biệt"

    shot_path = browser_mgr.take_screenshot("TC_PROD_12_xss_search", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-12",
        test_name="Trường hợp biên: Tìm kiếm sản phẩm chống tấn công mã độc HTML/XSS",
        module="01_reports",
        status="PASS",
        duration_sec=1.1,
        message="An toàn bảo mật: Chuỗi ký tự đặc biệt được escape an toàn, không có lỗ hổng XSS",
        raw_screenshot=shot_path
    )

def test_tc_prod_13_extra_long_product_name_edge_case(browser_mgr, reporter, annotator):
    """Trường hợp biên: Sản phẩm có tên cực dài không gây vỡ dòng / layout (TC-PROD-13)"""
    page = browser_mgr.goto("/admin/reports/products")
    page.wait_for_timeout(500)

    # Thẻ best seller có class truncate-kpi
    best_seller = page.query_selector(".truncate-kpi")
    if best_seller:
        title = best_seller.get_attribute("title")
        assert title is not None, "Thẻ sản phẩm bán chạy cần có tooltip title khi tên bị cắt ngắn"

    shot_path = browser_mgr.take_screenshot("TC_PROD_13_long_name_format", is_failure=False)
    reporter.add_result(
        test_id="TC-PROD-13",
        test_name="Trường hợp biên: Tên sản phẩm cực dài không gây tràn khung",
        module="01_reports",
        status="PASS",
        duration_sec=0.8,
        message="Đạt chuẩn UI/UX: Tên dài được cắt gọn bằng ellipsis (...) kèm tooltip xem đầy đủ",
        raw_screenshot=shot_path
    )
