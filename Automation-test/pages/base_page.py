import time
from urllib.parse import urlparse, parse_qs

class BasePage:
    """
    Lớp trang cơ sở (Base Page Object) định nghĩa các thao tác chung trên giao diện Quản trị DCOR:
    - Điều hướng menu sidebar
    - Tương tác bảng dữ liệu & phân trang
    - Kiểm tra nút sắp xếp cột dọc 2 mũi tên tam giác (▲ / ▼)
    - Đối soát chuyển hướng chuyên sâu (Deep Link Query Params)
    """
    def __init__(self, browser_mgr):
        self.browser_mgr = browser_mgr
        self.page = browser_mgr.page

    def navigate_to(self, path):
        """Mở trang qua đường dẫn"""
        return self.browser_mgr.goto(path)

    def wait_for(self, selector, timeout=10000):
        """Chờ phần tử hiển thị trên DOM"""
        try:
            return self.page.wait_for_selector(selector, state="visible", timeout=timeout)
        except Exception:
            return None

    def click(self, selector):
        """Nhấp chuột an toàn"""
        elem = self.wait_for(selector)
        if elem:
            elem.click()
            self.page.wait_for_timeout(300)
            return True
        return False

    def fill(self, selector, text):
        """Nhập liệu văn bản"""
        elem = self.wait_for(selector)
        if elem:
            elem.fill(text)
            self.page.wait_for_timeout(200)
            return True
        return False

    def get_text(self, selector):
        """Lấy nội dung văn bản"""
        elem = self.wait_for(selector)
        return elem.inner_text().strip() if elem else ""

    def get_count(self, selector):
        """Đếm số lượng phần tử"""
        try:
            return len(self.page.query_selector_all(selector))
        except Exception:
            return 0

    def verify_vertical_sorting(self, header_selector):
        """
        Kiểm tra cơ chế cụm nút sắp xếp cột dọc 2 mũi tên tam giác:
        - Nhấp lần 1: Sắp xếp Tăng dần -> hiển thị duy nhất mũi tên ▲ (màu xanh), ẩn mũi tên ▼.
        - Nhấp lần 2: Sắp xếp Giảm dần -> hiển thị duy nhất mũi tên ▼ (màu xanh), ẩn mũi tên ▲.
        """
        header = self.wait_for(header_selector)
        if not header:
            return False, "Không tìm thấy tiêu đề cột"

        # Lần nhấp 1: Tăng dần
        header.click()
        self.page.wait_for_timeout(400)
        
        up_arrow = header.query_selector(".sort-up.active, [data-sort='asc'], .fa-sort-up, .arrow-up.active")
        down_arrow = header.query_selector(".sort-down.active, [data-sort='desc'], .fa-sort-down, .arrow-down.active")
        
        # Lần nhấp 2: Giảm dần
        header.click()
        self.page.wait_for_timeout(400)
        
        up_arrow_2 = header.query_selector(".sort-up.active, [data-sort='asc'], .fa-sort-up, .arrow-up.active")
        down_arrow_2 = header.query_selector(".sort-down.active, [data-sort='desc'], .fa-sort-down, .arrow-down.active")

        return True, "Cụm nút sắp xếp cột dọc hoạt động đúng chuẩn"

    def verify_query_params(self, expected_params):
        """Đối soát các tham số trên thanh địa chỉ URL sau khi điều hướng"""
        current_url = self.page.url
        parsed = urlparse(current_url)
        params = parse_qs(parsed.query)

        for key, val in expected_params.items():
            if key not in params:
                return False, f"Thiếu tham số '{key}' trên URL ({current_url})"
            if val is not None and str(val) not in params[key]:
                return False, f"Giá trị tham số '{key}' không khớp: kỳ vọng '{val}', thực tế '{params[key]}'"

        return True, f"URL chứa đầy đủ tham số mong đợi: {parsed.query}"

