import os
import sys
import json
import time
from pathlib import Path

base_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(base_dir))

from utils.browser_manager import BrowserManager

output_dir = r"C:\Users\ASUS\.gemini\antigravity\brain\fcd5191c-a9ef-4e0b-8b41-69ac258766b8\custom_detail_test"
os.makedirs(output_dir, exist_ok=True)

bm = BrowserManager(env="local", headless=True)
bm.start()
page = bm.page

try:
    # 1. Start at staff accounts
    page.goto("http://localhost:4200/admin/staff/accounts")
    page.wait_for_timeout(2000)

    # 2. Make sure sidebar 'Nhân sự' is open and capture screenshot of sidebar
    nhan_su_link = page.locator(".sidebar-item").filter(has_text="Nhân sự").first
    # Check if submenu is visible
    vai_tro_link = page.locator(".admin-sub-item").filter(has_text="Vai trò").first
    if vai_tro_link.count() == 0 or not vai_tro_link.is_visible():
        nhan_su_link.click()
        page.wait_for_timeout(500)

    page.screenshot(path=os.path.join(output_dir, "77_sidebar_with_roles_tab.png"))
    print("Captured 77_sidebar_with_roles_tab.png")

    # 3. Click 'Vai trò' link
    print("Clicking Vai trò...")
    page.locator(".admin-sub-item").filter(has_text="Vai trò").first.click()
    page.wait_for_selector(".staff-roles-page", timeout=12000)
    page.wait_for_timeout(2000)

    # 4. Capture full roles page screenshot
    page.screenshot(path=os.path.join(output_dir, "78_roles_management_table.png"))
    print("Captured 78_roles_management_table.png")

    # 5. Find the staff count button for 'Kiến trúc sư' and click it
    kts_row = page.locator("tr.role-row").filter(has_text="Kiến trúc sư")
    if kts_row.count() > 0:
        print("Found row for Kiến trúc sư. Clicking staff count button...")
        kts_btn = kts_row.locator(".btn-staff-count")
        kts_btn.click()
        page.wait_for_timeout(1000)
        page.wait_for_selector(".staff-list-container", timeout=6000)
        page.screenshot(path=os.path.join(output_dir, "79_architect_staff_modal.png"))
        print("Captured 79_architect_staff_modal.png")

        # Close staff modal
        close_btn = page.locator(".modal-card button").filter(has_text="Đóng").first
        if close_btn.count() > 0:
            close_btn.click()
        else:
            page.locator(".admin-close-btn").first.click()
        page.wait_for_timeout(500)

    # 6. Open 'Thêm vai trò mới' modal
    add_btn = page.locator("button").filter(has_text="Thêm vai trò mới").first
    if add_btn.count() > 0:
        print("Opening Add Role modal...")
        add_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, "80_add_role_modal.png"))
        print("Captured 80_add_role_modal.png")
        page.locator(".admin-close-btn").first.click()
        page.wait_for_timeout(400)

    print("ALL ROLES PAGE TESTS COMPLETED SUCCESSFULLY!")

except Exception as ex:
    print(f"Error during test: {ex}")
    page.screenshot(path=os.path.join(output_dir, "error_roles_test.png"))
finally:
    if bm.browser:
        bm.browser.close()
    if bm.playwright:
        bm.playwright.stop()
