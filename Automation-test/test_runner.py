import sys
import os
import argparse
import importlib.util
from pathlib import Path
from datetime import datetime

# Đảm bảo đường dẫn import hoạt động chuẩn xác
base_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(base_dir))

from utils.browser_manager import BrowserManager
from utils.annotator import ImageAnnotator
from utils.reporter import TestReporter

def discover_test_scripts(module_filter=None, file_filter=None):
    """Tìm kiếm tất cả các file script test trong thư mục tests/"""
    tests_dir = base_dir / "tests"
    test_files = []

    for root, _, files in os.walk(tests_dir):
        for f in files:
            if f.startswith("test_") and f.endswith(".py"):
                full_path = Path(root) / f
                rel_path = full_path.relative_to(tests_dir)

                if module_filter and module_filter != "all":
                    if not str(rel_path).startswith(module_filter):
                        continue

                if file_filter and file_filter not in f:
                    continue

                test_files.append(full_path)

    return sorted(test_files)

def run_test_module(test_file_path, browser_mgr, reporter, annotator):
    """Nạp và thực thi các hàm test trong file test script"""
    module_name = test_file_path.stem
    spec = importlib.util.spec_from_file_location(module_name, str(test_file_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    # Tìm tất cả các hàm test bắt đầu bằng test_
    test_functions = [getattr(mod, f) for f in dir(mod) if f.startswith("test_") and callable(getattr(mod, f))]

    print(f"\n📂 Đang thực thi File: {test_file_path.name} ({len(test_functions)} kịch bản)")

    for test_fn in test_functions:
        fn_name = test_fn.__name__
        doc = (test_fn.__doc__ or fn_name).strip().split("\n")[0]
        test_id = fn_name.replace("test_", "").upper()

        start_t = datetime.now()
        try:
            print(f"  ▶ [{test_id}] {doc} ... ", end="", flush=True)
            test_fn(browser_mgr, reporter, annotator)
            duration = (datetime.now() - start_t).total_seconds()
            print(f"✅ PASS ({duration:.1f}s)")
        except AssertionError as ae:
            duration = (datetime.now() - start_t).total_seconds()
            print(f"❌ FAIL ({duration:.1f}s) - {ae}")
            # Chụp ảnh lỗi và khoanh đỏ
            raw_shot = browser_mgr.take_screenshot(f"{test_id}_fail", is_failure=True)
            annotated_shot = annotator.annotate_bug(
                raw_shot,
                bug_id=f"BUG-{test_id}",
                bug_title=str(ae),
                note=f"Phát hiện lỗi tại bước kiểm thử {test_id}"
            )
            reporter.add_result(
                test_id=test_id,
                test_name=doc,
                module=test_file_path.parent.name,
                status="FAIL",
                duration_sec=duration,
                message=str(ae),
                raw_screenshot=raw_shot,
                annotated_screenshot=annotated_shot,
                bug_id=f"BUG-{test_id}"
            )
        except Exception as e:
            duration = (datetime.now() - start_t).total_seconds()
            print(f"💥 ERROR ({duration:.1f}s) - {e}")
            raw_shot = browser_mgr.take_screenshot(f"{test_id}_error", is_failure=True)
            annotated_shot = annotator.annotate_bug(
                raw_shot,
                bug_id=f"ERR-{test_id}",
                bug_title=f"Lỗi ngoại lệ: {type(e).__name__}",
                note=str(e)
            )
            reporter.add_result(
                test_id=test_id,
                test_name=doc,
                module=test_file_path.parent.name,
                status="FAIL",
                duration_sec=duration,
                message=f"Lỗi ngoại lệ: {e}",
                raw_screenshot=raw_shot,
                annotated_screenshot=annotated_shot,
                bug_id=f"ERR-{test_id}"
            )

def main():
    parser = argparse.ArgumentParser(description="DCOR Studio Automation Test Runner CLI")
    parser.add_argument("--module", choices=["01_reports", "02_inventory_product", "03_orders_warranty", "all"], default="all", help="Chọn phân hệ cần chạy test")
    parser.add_argument("--file", type=str, default=None, help="Chạy riêng 1 file test cụ thể")
    parser.add_argument("--env", choices=["dev", "local"], default="dev", help="Môi trường kiểm thử (dev: Vercel, local: localhost:4200)")
    parser.add_argument("--headed", action="store_true", help="Hiển thị cửa sổ trình duyệt Chrome (mặc định là headless)")
    args = parser.parse_args()

    print("=" * 70)
    print("🚀 DCOR STUDIO AUTOMATION TESTING FRAMEWORK")
    print(f"• Môi trường: {args.env.upper()}")
    print(f"• Phân hệ: {args.module}")
    print(f"• Chế độ hiển thị: {'Hiển thị cửa sổ (Headed)' if args.headed else 'Chạy ngầm (Headless)'}")
    print("=" * 70)

    test_files = discover_test_scripts(module_filter=args.module, file_filter=args.file)
    if not test_files:
        print("\n⚠️ Chưa tìm thấy file kịch bản kiểm thử (.py) nào phù hợp trong thư mục tests/")
        print("💡 Hãy thêm các file kịch bản vào Automation-test/tests/<module>/test_*.py để bắt đầu chạy.")
        return

    print(f"🔍 Tìm thấy {len(test_files)} file kịch bản kiểm thử sẵn sàng thực thi.")

    browser_mgr = BrowserManager(env=args.env, headless=not args.headed)
    annotator = ImageAnnotator()
    reporter = TestReporter(run_name=f"Kiểm Thử Tự Động Phân Hệ: {args.module.upper()}")

    try:
        browser_mgr.start()
        for tf in test_files:
            run_test_module(tf, browser_mgr, reporter, annotator)
    finally:
        browser_mgr.close()

    # Xuất báo cáo nghiệm thu
    print("\n" + "=" * 70)
    print("📝 ĐANG TỔNG HỢP VÀ XUẤT BÁO CÁO NGHIỆM THU...")
    md_report = reporter.export_markdown()
    html_report = reporter.export_html()
    stats = reporter.generate_summary()

    print(f"📊 KẾT QUẢ TỔNG QUAN:")
    print(f"  • Tổng số kịch bản: {stats['total']}")
    print(f"  • Đạt chuẩn (PASS): {stats['passed']}")
    print(f"  • Phát hiện lỗi (FAIL): {stats['failed']}")
    print(f"  • Tỷ lệ Pass Rate: {stats['pass_rate']}%")
    print(f"\n📄 Báo cáo Markdown: {md_report}")
    print(f"🌐 Báo cáo HTML trực quan: {html_report}")
    print("=" * 70)

if __name__ == "__main__":
    main()

