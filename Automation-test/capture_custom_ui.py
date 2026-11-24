import os
import sys
from pathlib import Path

base_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(base_dir))

from utils.browser_manager import BrowserManager

output_dir = 'd:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/Automation-test/screenshots/custom_requests'
os.makedirs(output_dir, exist_ok=True)

bm = BrowserManager(env="local", headless=True)
bm.start()
page = bm.page

try:
    bm.goto("/admin/custom-requests")
    page.wait_for_selector(".v2-title", timeout=10000)
    page.wait_for_timeout(1000)

    # 1. Main Page Screenshot
    page.screenshot(path=f"{output_dir}/01_custom_requests_main.png")
    print("Captured 01_custom_requests_main.png")

    # 2. Click on 'Nhận khảo sát' to open Survey Modal (Bước 1)
    btn_survey = page.locator("button.btn-step-consulting").first
    if btn_survey.count() > 0:
        btn_survey.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/02_modal_step1_survey.png")
        print("Captured 02_modal_step1_survey.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    # 3. Click on 'Báo giá & 3D' to open Quote Modal (Bước 2)
    btn_quote = page.locator("button.btn-step-quote").first
    if btn_quote.count() > 0:
        btn_quote.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/03_modal_step2_quote.png")
        print("Captured 03_modal_step2_quote.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    # 4. Click on 'Soạn HĐ may đo' to open Contract Modal (Bước 3)
    btn_contract = page.locator("button.btn-step-contract").first
    if btn_contract.count() > 0:
        btn_contract.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/04_modal_step3_contract.png")
        print("Captured 04_modal_step3_contract.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    # 5. Click on 'Mã VietQR cọc 30%' to open VietQR Modal (Bước 4)
    btn_qr = page.locator("button.btn-step-vietqr").first
    if btn_qr.count() > 0:
        btn_qr.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/05_modal_step4_vietqr.png")
        print("Captured 05_modal_step4_vietqr.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    # 6. Click on Detail button to open Detail Drawer
    btn_detail = page.locator("button.btn-icon-only").first
    if btn_detail.count() > 0:
        btn_detail.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/06_drawer_detail.png")
        print("Captured 06_drawer_detail.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    # 7. Click on 'Nghiệm thu QC' (Nhánh 2 - Chặng 1)
    btn_qc = page.locator("button.btn-step-qc").first
    if btn_qc.count() > 0:
        btn_qc.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/07_modal_step_qc.png")
        print("Captured 07_modal_step_qc.png")
        # Submit QC to advance to QC_PASSED
        page.locator(".dcor-modal-card button.btn-confirm-primary").first.click()
        page.wait_for_timeout(800)

    # 8. Click on 'Giao hàng & Thu 70%' (Nhánh 2 - Chặng 2)
    btn_deliver = page.locator("button.btn-step-deliver").first
    if btn_deliver.count() > 0:
        btn_deliver.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{output_dir}/08_modal_step_delivery.png")
        print("Captured 08_modal_step_delivery.png")
        page.locator(".dcor-modal-card button.btn-cancel").first.click()
        page.wait_for_timeout(400)

    print("ALL SCREENSHOTS CAPTURED PERFECTLY!")
finally:
    bm.close()
