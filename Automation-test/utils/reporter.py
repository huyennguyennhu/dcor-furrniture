import os
import json
from pathlib import Path
from datetime import datetime

class TestReporter:
    """
    Công cụ xuất báo cáo kiểm thử tự động chuyên nghiệp:
    - Sinh báo cáo Markdown tổng hợp (summary_latest.md)
    - Sinh báo cáo HTML trực quan, hiện đại, có xem ảnh chụp khoanh đỏ lỗi phóng to
    - Phân tích thống kê: Tỷ lệ Pass/Fail, Tổng thời gian, Danh mục lỗi phát hiện
    """
    def __init__(self, run_name="Kiểm thử Hệ thống DCOR Studio"):
        self.base_dir = Path(__file__).resolve().parent.parent
        self.reports_dir = self.base_dir / "reports"
        self.history_dir = self.reports_dir / "history"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.history_dir.mkdir(parents=True, exist_ok=True)
        
        self.run_name = run_name
        self.start_time = datetime.now()
        self.results = []

    def add_result(
        self,
        test_id,
        test_name,
        module,
        status, # "PASS", "FAIL", "SKIPPED"
        duration_sec=0.0,
        message="",
        raw_screenshot="",
        annotated_screenshot="",
        bug_id=""
    ):
        """Ghi nhận kết quả của một kịch bản test case"""
        self.results.append({
            "test_id": test_id,
            "test_name": test_name,
            "module": module,
            "status": status.upper(),
            "duration": round(duration_sec, 2),
            "message": message,
            "raw_screenshot": raw_screenshot,
            "annotated_screenshot": annotated_screenshot,
            "bug_id": bug_id
        })

    def generate_summary(self):
        """Tính toán các chỉ số thống kê tổng hợp"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIPPED")
        pass_rate = round((passed / total * 100), 1) if total > 0 else 0.0
        
        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": pass_rate,
            "duration": round((datetime.now() - self.start_time).total_seconds(), 2)
        }

    def export_markdown(self):
        """Xuất file báo cáo Markdown chuẩn cho QC"""
        stats = self.generate_summary()
        timestamp_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        status_badge = "🟢 ĐẠT CHUẨN" if stats["failed"] == 0 else "🔴 CẦN XỬ LÝ LỖI"

        md = []
        md.append(f"# Báo Cáo Kết Quả Kiểm Thử Tự Động: {self.run_name}")
        md.append(f"\n* **Thời gian thực hiện:** {timestamp_str}")
        md.append(f"* **Đánh giá tổng thể:** {status_badge}")
        md.append(f"* **Tổng số kịch bản:** {stats['total']} | **Đạt:** {stats['passed']} | **Lỗi:** {stats['failed']} | **Tỷ lệ Pass:** {stats['pass_rate']}%")
        md.append(f"* **Tổng thời gian chạy:** {stats['duration']} giây\n")
        md.append("---\n")

        # Bảng tóm tắt
        md.append("## 1. Bảng Thống Kê Tổng Quan")
        md.append("| Chỉ số | Số lượng | Tỷ lệ (%) |")
        md.append("| :--- | :---: | :---: |")
        md.append(f"| ✅ **Kịch bản Thành Công (PASS)** | {stats['passed']} | {stats['pass_rate']}% |")
        md.append(f"| ❌ **Kịch bản Phát Hiện Lỗi (FAIL)** | {stats['failed']} | {round(100 - stats['pass_rate'], 1) if stats['total'] > 0 else 0}% |")
        md.append(f"| ⚠️ **Kịch bản Bỏ qua (SKIPPED)** | {stats['skipped']} | - |")
        md.append(f"| 📊 **TỔNG CỘNG** | **{stats['total']}** | **100%** |\n")

        # Danh sách chi tiết
        md.append("## 2. Kết Quả Chi Tiết Từng Kịch Bản Kiểm Thử")
        md.append("| STT | Mã Test Case | Tên Kịch Bản | Phân Hệ | Trạng Thái | Thời Gian | Bằng Chứng Lỗi (Ảnh Khoanh Đỏ) |")
        md.append("| :---: | :--- | :--- | :--- | :---: | :---: | :--- |")

        for idx, r in enumerate(self.results, 1):
            status_pill = "✅ PASS" if r["status"] == "PASS" else ("❌ FAIL" if r["status"] == "FAIL" else "⚠️ SKIP")
            
            evidence = "-"
            if r["annotated_screenshot"]:
                rel_path = os.path.relpath(r["annotated_screenshot"], self.reports_dir).replace("\\", "/")
                bug_tag = f"**[{r['bug_id']}]** " if r["bug_id"] else ""
                evidence = f"[{bug_tag}Xem ảnh lỗi khoanh đỏ]({rel_path})"
            elif r["raw_screenshot"]:
                rel_path = os.path.relpath(r["raw_screenshot"], self.reports_dir).replace("\\", "/")
                evidence = f"[Xem ảnh chụp]({rel_path})"

            md.append(f"| {idx} | **{r['test_id']}** | {r['test_name']} | {r['module']} | {status_pill} | {r['duration']}s | {evidence} |")

        # Danh mục lỗi cần sửa (nếu có)
        failures = [r for r in self.results if r["status"] == "FAIL"]
        if failures:
            md.append("\n---\n")
            md.append("## 3. Danh Mục Lỗi Phát Hiện Cần Khắc Phục (Action Items)")
            for f in failures:
                md.append(f"### ❌ [{f['bug_id'] or 'BUG'}] {f['test_id']}: {f['test_name']}")
                md.append(f"* **Phân hệ:** {f['module']}")
                md.append(f"* **Mô tả lỗi:** {f['message']}")
                if f["annotated_screenshot"]:
                    md.append(f"* **Ảnh bằng chứng:** `{f['annotated_screenshot']}`")
                md.append("")

        content = "\n".join(md)

        # Lưu file mới nhất
        latest_path = self.reports_dir / "summary_latest.md"
        with open(latest_path, "w", encoding="utf-8") as f:
            f.write(content)

        # Lưu lịch sử
        history_path = self.history_dir / f"report_{file_timestamp}.md"
        with open(history_path, "w", encoding="utf-8") as f:
            f.write(content)

        return str(latest_path)

    def export_html(self):
        """Xuất file báo cáo HTML trực quan xem trên trình duyệt"""
        stats = self.generate_summary()
        timestamp_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        rows_html = []
        for idx, r in enumerate(self.results, 1):
            is_pass = r["status"] == "PASS"
            status_class = "badge-pass" if is_pass else "badge-fail"
            status_text = "PASS" if is_pass else "FAIL"

            evidence_html = '<span class="text-muted">-</span>'
            bug_label = f"[{r['bug_id']}]" if r.get("bug_id") else ""
            item_title = f"{r['test_id']}: {r['test_name']}".replace("'", "\\'")
            if r["annotated_screenshot"]:
                rel_path = os.path.relpath(r["annotated_screenshot"], self.reports_dir).replace("\\", "/")
                evidence_html = f'<a href="{rel_path}" onclick="openLightbox(\'{rel_path}\', \'{item_title}\'); return false;" class="btn-evidence">🔍 Xem ảnh khoanh đỏ {bug_label}</a>'
            elif r["raw_screenshot"]:
                rel_path = os.path.relpath(r["raw_screenshot"], self.reports_dir).replace("\\", "/")
                evidence_html = f'<a href="{rel_path}" onclick="openLightbox(\'{rel_path}\', \'{item_title}\'); return false;" class="btn-evidence-gray">📸 Xem ảnh chụp</a>'

            rows_html.append(f"""
            <tr class="{'row-fail' if not is_pass else ''}">
                <td style="text-align: center;">{idx}</td>
                <td><strong>{r['test_id']}</strong></td>
                <td>{r['test_name']}</td>
                <td><span class="module-tag">{r['module']}</span></td>
                <td style="text-align: center;"><span class="badge {status_class}">{status_text}</span></td>
                <td style="text-align: right;">{r['duration']}s</td>
                <td>{evidence_html}</td>
                <td class="msg-col">{r['message'] or '<span class="text-muted">Hoàn thành đúng kịch bản</span>'}</td>
            </tr>
            """)

        html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo Cáo Kiểm Thử - {self.run_name}</title>
    <style>
        :root {{
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
            --pass: #10b981;
            --fail: #ef4444;
            --primary: #3b82f6;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 30px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title h1 {{ margin: 0 0 8px 0; font-size: 24px; color: #fff; }}
        .title p {{ margin: 0; color: var(--text-muted); font-size: 14px; }}
        
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .kpi-card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
        }}
        .kpi-card .label {{ color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase; }}
        .kpi-card .value {{ font-size: 32px; font-weight: 700; margin-top: 8px; }}
        .val-pass {{ color: var(--pass); }}
        .val-fail {{ color: var(--fail); }}
        .val-total {{ color: var(--primary); }}

        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border);
        }}
        th, td {{
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
        }}
        th {{ background: #1a2234; color: var(--text-muted); font-weight: 600; }}
        tr:hover {{ background: rgba(255, 255, 255, 0.02); }}
        .row-fail {{ background: rgba(239, 68, 68, 0.08); }}
        
        .badge {{
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
        }}
        .badge-pass {{ background: rgba(16, 185, 129, 0.2); color: var(--pass); border: 1px solid var(--pass); }}
        .badge-fail {{ background: rgba(239, 68, 68, 0.2); color: var(--fail); border: 1px solid var(--fail); }}
        .module-tag {{ background: #334155; padding: 3px 8px; border-radius: 6px; font-size: 12px; }}
        .btn-evidence {{
            background: #ef4444; color: #fff; text-decoration: none; padding: 5px 10px; border-radius: 6px;
            font-size: 12px; font-weight: 600; display: inline-block;
        }}
        .btn-evidence-gray {{
            background: #475569; color: #fff; text-decoration: none; padding: 5px 10px; border-radius: 6px;
            font-size: 12px; display: inline-block;
        }}
        .msg-col {{ max-width: 300px; color: #cbd5e1; font-size: 13px; }}
        .text-muted {{ color: var(--text-muted); }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">
            <h1>📊 {self.run_name}</h1>
            <p>Hệ thống Quản trị Thương mại Điện tử DCOR Studio • Chạy lúc: {timestamp_str}</p>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="label">Tổng Test Cases</div>
            <div class="value val-total">{stats['total']}</div>
        </div>
        <div class="kpi-card">
            <div class="label">Thành Công (Pass)</div>
            <div class="value val-pass">{stats['passed']}</div>
        </div>
        <div class="kpi-card">
            <div class="label">Phát Hiện Lỗi (Fail)</div>
            <div class="value val-fail">{stats['failed']}</div>
        </div>
        <div class="kpi-card">
            <div class="label">Tỷ Lệ Pass Rate</div>
            <div class="value {'val-pass' if stats['pass_rate'] >= 90 else 'val-fail'}">{stats['pass_rate']}%</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50px; text-align: center;">STT</th>
                <th style="width: 140px;">Mã Test</th>
                <th>Tên Kịch Bản Kiểm Thử</th>
                <th style="width: 160px;">Phân Hệ</th>
                <th style="width: 100px; text-align: center;">Kết Quả</th>
                <th style="width: 90px; text-align: right;">Thời Gian</th>
                <th style="width: 220px;">Minh Chứng Lỗi</th>
                <th>Ghi Chú Nghiệm Thu</th>
            </tr>
        </thead>
        <tbody>
            {"".join(rows_html)}
        </tbody>
    </table>

    <!-- Modal Xem Ảnh Trực Tiếp Phóng To (Interactive Lightbox) -->
    <div id="imageModal" style="display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.88); align-items:center; justify-content:center; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:92%; max-width:1500px; margin-bottom:12px; color:#fff;">
            <h3 id="modalTitle" style="margin:0; font-size:16px; font-weight:600; color:#f8fafc;">Ảnh bằng chứng kiểm thử</h3>
            <div>
                <a id="modalOpenNew" href="#" target="_blank" style="color:#38bdf8; text-decoration:none; margin-right:20px; font-size:14px; font-weight:600; padding:6px 12px; background:rgba(56,189,248,0.15); border-radius:6px;">↗ Mở trong tab mới</a>
                <span onclick="closeLightbox()" style="cursor:pointer; font-size:22px; font-weight:bold; color:#ef4444; padding:4px 10px; background:rgba(239,68,68,0.15); border-radius:6px;">✕ Đóng</span>
            </div>
        </div>
        <div style="width:92%; max-width:1500px; height:84vh; background:#0b0f19; display:flex; align-items:center; justify-content:center; border:1px solid #334155; border-radius:10px; overflow:auto; padding:10px; box-sizing:border-box;">
            <img id="modalImg" src="" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:6px; box-shadow:0 10px 25px rgba(0,0,0,0.5);" />
        </div>
    </div>

    <script>
        function openLightbox(src, title) {{
            document.getElementById('modalImg').src = src;
            document.getElementById('modalTitle').innerText = title || 'Ảnh kiểm thử';
            document.getElementById('modalOpenNew').href = src;
            document.getElementById('imageModal').style.display = 'flex';
        }}
        function closeLightbox() {{
            document.getElementById('imageModal').style.display = 'none';
        }}
        document.addEventListener('keydown', function(e) {{
            if (e.key === 'Escape') closeLightbox();
        }});
    </script>
</body>
</html>"""

        latest_html = self.reports_dir / "report_latest.html"
        with open(latest_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        history_html = self.history_dir / f"report_{file_timestamp}.html"
        with open(history_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        return str(latest_html)
