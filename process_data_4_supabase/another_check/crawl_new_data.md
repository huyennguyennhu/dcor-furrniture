# Cấu trúc Prisma Schema cho D'Cor Studio (New Crawl Data)

## Vấn đề của dữ liệu cũ (Lý do cần cấu trúc mới)
Trong quá trình xây dựng tính năng cấu hình sản phẩm (chọn chân ghế, đổi màu bọc ghế...), chúng ta đã gặp phải một số vấn đề lớn với cấu trúc dữ liệu cũ:
1. **Thiếu hình ảnh theo từng biến thể (Variants):** Rất nhiều sản phẩm (ví dụ: Sofa Indivi) bị thiếu hình ảnh chi tiết cho các màu khác nhau. Hậu quả là người dùng chọn swatch màu nâu/xanh nhưng hệ thống không có ảnh màu đó để hiển thị, đành phải fallback về ảnh màu be mặc định, gây nhầm lẫn.
2. **Kích thước và Asset 3D không rõ ràng:** Để làm tính năng Room Planner chuẩn xác, hệ thống cần biết chính xác kích thước thật (dimensions) và model 3D tương ứng với từng biến thể, nhưng dữ liệu cũ không tổ chức tốt việc này.
3. **Mất tùy chọn khi lọc:** Buộc phải ẩn đi những biến thể không có ảnh để tránh lỗi UI, dẫn đến mất hiển thị nhiều tùy chọn đắt giá.
4. **Tên biến thể là các mã code khó hiểu:** Dữ liệu cũ lưu selection theo dạng mã (ví dụ: `3311`, `0075`) thay vì tên gọi rõ ràng, khiến việc phân tích, hiển thị và so sánh sự khác biệt gặp rất nhiều khó khăn (phải map qua một bảng cấu hình khác rất phức tạp).
5. **Thiếu kích thước động cho từng biến thể:** Với một số sản phẩm (như bàn, tủ), việc thay đổi cấu hình đồng nghĩa với việc thay đổi kích thước vật lý. Dữ liệu cũ chỉ lưu kích thước cố định ở cấp độ Product, dẫn đến việc Room Planner hoặc bảng Thông số kỹ thuật sẽ bị sai khi chọn cấu hình size lớn/nhỏ.

Để khắc phục triệt để và phục vụ toàn bộ hệ sinh thái của D'Cor Studio (Khám phá -> Chi tiết sản phẩm -> Cấu hình 3D -> Room Planner -> Cộng đồng), tất cả những thông tin phức tạp hoàn toàn có thể gói gọn vào trong **duy nhất một thực thể `Product`** bằng cách tận dụng kiểu dữ liệu `Json` của PostgreSQL (thông qua Prisma và Supabase).

---

## 1. Prisma Schema Đề Xuất

```prisma
model Product {
  id                  String   @id
  name                String
  slug                String   @unique
  description         String?
  category            String
  basePrice           Float
  isBestSeller        Boolean  @default(false)
  isNew               Boolean  @default(false)
  
  images              Json     // Mảng các URL hình ảnh mặc định (string[])
  tags                Json?    // Chứa colors, materials, styles...
  
  // Các field quan trọng dạng JSON để lưu trữ dữ liệu phức tạp
  configOptions       Json?    // Mảng các tuỳ chọn (chân ghế, bọc ghế...)
  variants            Json?    // Mảng các biến thể (kèm hình ảnh, giá riêng)
  dimensions          Json?    // { width, height, depth... }
  roomPlannerAssets   Json?    // { modelUrl, boundingBox... }

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 2. Tại sao nên gom hết vào một thực thể bằng trường JSON?

1. **Hiệu suất (Performance):** Khi người dùng mở trang Chi tiết sản phẩm, hệ thống chỉ cần gọi `prisma.product.findUnique` **một lần duy nhất** là lấy được toàn bộ dữ liệu (từ mô tả, giá cả, cho đến các biến thể và file 3D). Tránh được việc phải `JOIN` quá nhiều bảng làm chậm tốc độ tải trang.
2. **Linh hoạt khi Crawl:** Cấu trúc của từng tuỳ chọn (swatch) hay thông số kỹ thuật (dimension) của các loại sản phẩm khác nhau (Sofa sẽ khác với Bàn ăn) sẽ có số lượng biến số khác nhau. Việc lưu dạng JSON giúp hệ thống không bị cứng nhắc, có thể nhét thêm tuỳ chọn mới bất cứ lúc nào.
3. **Phục vụ đa mục đích mượt mà:** Dữ liệu JSON lấy từ DB lên có thể dễ dàng được parse thẳng thành State trong React/Next.js để component `ProductInfo` vẽ UI. Đồng thời, cấu trúc JSON cũng cực kỳ phù hợp để truyền trực tiếp vào bộ engine Three.js của Room Planner mà không cần gộp map dữ liệu phức tạp.

---

## 3. Cấu trúc JSON chi tiết bên trong các trường

### Field `configOptions`
Phục vụ cho việc vẽ các nút "Swatch" (chọn chân ghế, bọc ghế).
```json
[
  {
    "groupId": "upholstery",
    "groupName": "Bọc ghế",
    "options": [
      {
        "id": "3311",
        "name": "Vải Copenhagen màu nâu 3311",
        "swatchImage": "https://domain/swatch_brown_3311.jpg", 
        "hexColor": "#6E4D3B"
      }
    ]
  }
]
```

### Field `variants`
Là nơi kết nối giữa giá tiền, hình ảnh và tuỳ chọn. Dữ liệu này **bắt buộc phải có ảnh tương ứng** để đổi Gallery khi chọn cấu hình.
```json
[
  {
    "variantId": "VAR_4225_3311_0075",
    "name": "Sofa Indivi 3 chỗ - Vải nâu, Chân đen mờ", // Tên hiển thị rõ ràng của biến thể
    "selections": {
      "upholstery": "3311",
      "leg_style": "0075"
    },
    "price": 55000000,
    "images": [
      "https://domain/sofa_brown_blackleg_front.png",
      "https://domain/sofa_brown_blackleg_side.png"
    ],
    "model3D": "https://domain/models/indivi_brown_blackleg.gltf",
    
    // Nếu biến thể làm thay đổi kích thước (ví dụ: bàn size lớn), lưu trực tiếp vào đây
    "dimensions": {
      "width_cm": 250,
      "height_cm": 83,
      "depth_cm": 91
    }
  }
]
```

### Field `dimensions`
```json
{
  "width_cm": 222,
  "height_cm": 83,
  "depth_cm": 91,
  "weight_kg": 65,
  "seatingHeight_cm": 42
}
```

### Field `roomPlannerAssets`
```json
{
  "modelUrl": "https://domain/models/SM42250020_base.glb",
  "iosArUrl": "https://domain/models/SM42250020.usdz",
  "boundingBox": { "x": 222, "y": 83, "z": 91 },
  "pivot": { "x": 0, "y": 0, "z": 0 }
}
```
