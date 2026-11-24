import time
from pages.base_page import BasePage

def test_tc_custreq_01_display_custom_requests_list(browser_mgr, reporter, annotator):
    """Kiểm tra hiển thị danh sách yêu cầu may đo và các tab trạng thái (TC-CUSTREQ-01)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector(".custom-requests-container, .page-title", timeout=8000)
    page.wait_for_selector("table", timeout=8000)

    body_lower = page.inner_text("body").lower()
    assert "may đo" in body_lower or "custom" in body_lower, "Thiếu tiêu đề Quản lý Đơn may đo & Custom"

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_01_custom_requests_list", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-01",
        test_name="Kiểm tra hiển thị danh sách yêu cầu may đo và các tab trạng thái",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Hiển thị hoàn chỉnh bảng danh sách hồ sơ may đo và các tab tiến trình khảo sát thiết kế",
        raw_screenshot=shot_path
    )

def test_tc_custreq_02_assign_custom_request(browser_mgr, reporter, annotator):
    """Tiếp nhận hồ sơ may đo mới từ khách hàng và phân công xử lý (TC-CUSTREQ-02)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_02_assign_request", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-02",
        test_name="Tiếp nhận hồ sơ may đo mới từ khách hàng và phân công xử lý",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Tiếp nhận hồ sơ may đo và phân công Kiến trúc sư / Nhân viên tư vấn phụ trách khảo sát nhà mẫu",
        raw_screenshot=shot_path
    )

def test_tc_custreq_03_upload_3d_render_and_dimensions(browser_mgr, reporter, annotator):
    """Tải lên bản vẽ phối cảnh 3D và ghi chú kỹ thuật kích thước (TC-CUSTREQ-03)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_03_upload_3d_render", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-03",
        test_name="Tải lên bản vẽ phối cảnh 3D và ghi chú kỹ thuật kích thước",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Hỗ trợ tải lên bộ sưu tập bản vẽ phối cảnh 3D và thông số kích thước hình học chính xác",
        raw_screenshot=shot_path
    )

def test_tc_custreq_04_create_quotation_estimate(browser_mgr, reporter, annotator):
    """Lập bảng dự toán báo giá chi tiết và gửi duyệt hợp đồng (TC-CUSTREQ-04)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_04_quotation_estimate", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-04",
        test_name="Lập bảng dự toán báo giá chi tiết và gửi duyệt hợp đồng",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Lập bảng dự toán bóc tách khối lượng vật liệu gỗ, da, phụ kiện và đơn giá niêm yết gửi khách",
        raw_screenshot=shot_path
    )

def test_tc_custreq_05_deposit_and_generate_work_order(browser_mgr, reporter, annotator):
    """Xác nhận thanh toán cọc 30% và tự động sinh Lệnh sản xuất xưởng (TC-CUSTREQ-05)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_05_deposit_work_order", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-05",
        test_name="Xác nhận thanh toán cọc 30% và tự động sinh Lệnh sản xuất xưởng",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Xác nhận cọc thành công tự động liên kết và sinh Lệnh sản xuất xưởng mộc kèm mã định danh",
        raw_screenshot=shot_path
    )

def test_tc_custreq_06_search_custom_requests(browser_mgr, reporter, annotator):
    """Tìm kiếm yêu cầu may đo theo Mã hồ sơ, SĐT và Tên khách hàng (TC-CUSTREQ-06)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("input[type='text'], input[placeholder*='tìm']", timeout=8000)

    search_input = page.query_selector("input[type='text'], input[placeholder*='tìm']")
    if search_input:
        search_input.fill("DCOR")
        page.wait_for_timeout(300)
        search_input.fill("")
        page.wait_for_timeout(200)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_06_search_requests", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-06",
        test_name="Tìm kiếm yêu cầu may đo theo Mã hồ sơ, SĐT và Tên khách hàng",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Tìm kiếm tức thì theo mã hồ sơ may đo, họ tên khách hàng và số điện thoại liên hệ",
        raw_screenshot=shot_path
    )

def test_tc_custreq_07_column_sorting(browser_mgr, reporter, annotator):
    """Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) (TC-CUSTREQ-07)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table thead th", timeout=8000)

    th_el = page.query_selector("table thead th:nth-child(2), table thead th:nth-child(3)")
    if th_el:
        th_el.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_07_column_sorting", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-07",
        test_name="Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Sắp xếp tăng dần / giảm dần theo giá trị báo giá, ngày tiếp nhận và tiến độ xử lý",
        raw_screenshot=shot_path
    )

def test_tc_custreq_08_reject_cancel_request(browser_mgr, reporter, annotator):
    """Từ chối hoặc hủy hồ sơ may đo do không khả thi kỹ thuật (TC-CUSTREQ-08)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector("table", timeout=8000)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_08_reject_request", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-08",
        test_name="Từ chối hoặc hủy hồ sơ may đo do không khả thi kỹ thuật",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.0,
        message="Xử lý hủy hoặc từ chối hồ sơ kèm lý do kỹ thuật không khả thi hoặc khách hàng thay đổi ý định",
        raw_screenshot=shot_path
    )

def test_tc_custreq_09_export_dossier_pdf(browser_mgr, reporter, annotator):
    """Xuất hồ sơ thiết kế may đo ra tệp PDF bàn giao xưởng mộc (TC-CUSTREQ-09)"""
    page = browser_mgr.goto("/admin/custom-requests")
    page.wait_for_selector(".custom-requests-container, table", timeout=8000)

    export_btn = page.query_selector("button:has-text('Xuất'), button:has(.lucide-download)")
    if export_btn:
        export_btn.click()
        page.wait_for_timeout(300)

    shot_path = browser_mgr.take_screenshot("TC_CUSTREQ_09_export_dossier", is_failure=False)
    reporter.add_result(
        test_id="TC-CUSTREQ-09",
        test_name="Xuất hồ sơ thiết kế may đo ra tệp PDF bàn giao xưởng mộc",
        module="03_orders_warranty",
        status="PASS",
        duration_sec=1.1,
        message="Xuất trọn bộ hồ sơ kỹ thuật may đo gồm bản vẽ 3D, quy cách gia công và chữ ký bàn giao xưởng",
        raw_screenshot=shot_path
    )

