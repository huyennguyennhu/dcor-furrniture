import os
from pathlib import Path
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

class ImageAnnotator:
    """
    Công cụ chuyên nghiệp xử lý hình ảnh chụp màn hình kiểm thử:
    - Tự động vẽ khung viền đỏ (Bounding Box) khoanh vùng vị trí phát sinh lỗi
    - Vẽ mũi tên chỉ điểm lỗi
    - Gắn nhãn huy hiệu [BUG-XX] nổi bật kèm mô tả ngắn gọn và thời gian phát hiện
    - Lưu vào thư mục screenshots/annotated/ để gửi cho QC và Dev đối soát
    """
    def __init__(self):
        self.base_dir = Path(__file__).resolve().parent.parent
        self.annotated_dir = self.base_dir / "screenshots" / "annotated"
        self.annotated_dir.mkdir(parents=True, exist_ok=True)

    def _get_font(self, size=16, bold=False):
        """Lấy font chữ hệ thống hỗ trợ tiếng Việt Unicode tốt trên Windows"""
        font_names = [
            "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\tahoma.ttf"
        ]
        for font_path in font_names:
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    def annotate_bug(
        self,
        raw_image_path,
        bug_id,
        bug_title,
        bounding_box=None,
        output_filename=None,
        note=None
    ):
        """
        Khoanh đỏ và đánh dấu lỗi lên ảnh chụp màn hình.
        :param raw_image_path: Đường dẫn ảnh chụp gốc (raw)
        :param bug_id: Mã định danh lỗi (ví dụ: BUG-REV-01)
        :param bug_title: Tên mô tả lỗi (ví dụ: Doanh thu thuần tính toán sai lệch)
        :param bounding_box: Tọa độ phần tử lỗi dict(x=..., y=..., width=..., height=...)
        :param output_filename: Tên file kết quả lưu ra (tùy chọn)
        :param note: Ghi chú thêm
        :return: Đường dẫn tuyệt đối của ảnh đã khoanh đỏ
        """
        if not os.path.exists(raw_image_path):
            raise FileNotFoundError(f"Không tìm thấy file ảnh gốc: {raw_image_path}")

        image = Image.open(raw_image_path).convert("RGBA")
        overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)

        font_badge = self._get_font(size=18, bold=True)
        font_title = self._get_font(size=16, bold=True)
        font_desc = self._get_font(size=14, bold=False)

        border_color = (239, 68, 68, 255) # Đỏ rực #EF4444
        highlight_bg = (239, 68, 68, 45) # Nền đỏ mờ 18% để làm nổi bật vùng lỗi
        badge_bg = (220, 38, 38, 245) # Nền huy hiệu đỏ đậm
        text_color = (255, 255, 255, 255)

        # 1. Vẽ khung đỏ bao quanh phần tử nếu có tọa độ bounding_box
        if bounding_box and isinstance(bounding_box, dict):
            x = int(bounding_box.get("x", 0))
            y = int(bounding_box.get("y", 0))
            w = int(bounding_box.get("width", 100))
            h = int(bounding_box.get("height", 40))

            pad = 6
            x0 = max(0, x - pad)
            y0 = max(0, y - pad)
            x1 = min(image.width - 1, x + w + pad)
            y1 = min(image.height - 1, y + h + pad)

            # Vẽ nền mờ cảnh báo bên trong
            draw.rectangle([x0, y0, x1, y1], fill=highlight_bg)

            # Vẽ viền đỏ dày 4px
            for i in range(4):
                draw.rectangle([x0 - i, y0 - i, x1 + i, y1 + i], outline=border_color)

            # Vẽ nhãn cắm ngay trên đầu phần tử lỗi
            tag_text = f"[{bug_id}]"
            tag_bbox = font_badge.getbbox(tag_text)
            tw = tag_bbox[2] - tag_bbox[0] + 16
            th = tag_bbox[3] - tag_bbox[1] + 10

            tag_y = y0 - th - 4 if (y0 - th - 4) > 10 else y1 + 4
            draw.rectangle([x0, tag_y, x0 + tw, tag_y + th], fill=badge_bg)
            draw.text((x0 + 8, tag_y + 4), tag_text, fill=text_color, font=font_badge)

        # 2. Vẽ Banner tóm tắt lỗi tổng quan ở góc trên bên phải ảnh
        banner_w = 580
        banner_h = 100 if note else 75
        margin_x = image.width - banner_w - 25
        margin_y = 25

        # Đổ bóng nhẹ cho banner
        draw.rectangle(
            [margin_x - 3, margin_y - 3, margin_x + banner_w + 3, margin_y + banner_h + 3],
            fill=(0, 0, 0, 70)
        )
        # Nền banner
        draw.rectangle([margin_x, margin_y, margin_x + banner_w, margin_y + banner_h], fill=(24, 24, 27, 240)) # Nền than chì
        # Viền trái màu đỏ cảnh báo dày 8px
        draw.rectangle([margin_x, margin_y, margin_x + 8, margin_y + banner_h], fill=border_color)

        # In thông tin Bug
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        draw.text((margin_x + 20, margin_y + 12), f"[{bug_id}] PHÁT HIỆN LỖI KIỂM THỬ", fill=(248, 113, 113), font=font_title)
        draw.text((margin_x + 20, margin_y + 36), f"Mô tả: {bug_title}", fill=text_color, font=font_desc)
        if note:
            draw.text((margin_x + 20, margin_y + 58), f"Chi tiết: {note}", fill=(209, 213, 219), font=font_desc)
            draw.text((margin_x + 20, margin_y + 80), f"Thời gian: {now_str}", fill=(156, 163, 175), font=font_desc)
        else:
            draw.text((margin_x + 20, margin_y + 56), f"Thời gian: {now_str}", fill=(156, 163, 175), font=font_desc)

        # Ghép layer và lưu ra file
        final_image = Image.alpha_composite(image, overlay).convert("RGB")

        if not output_filename:
            raw_stem = Path(raw_image_path).stem
            output_filename = f"{raw_stem}_{bug_id}_annotated.png"
        elif not output_filename.endswith(".png"):
            output_filename = f"{output_filename}.png"

        dest_path = self.annotated_dir / output_filename
        final_image.save(dest_path, "PNG", quality=95)
        return str(dest_path)

