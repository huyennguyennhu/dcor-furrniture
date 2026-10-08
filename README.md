# Hướng Dẫn Khởi Chạy Dự Án DCOR Studio

Dự án bao gồm 2 phần chính: **Backend** (Node.js/Express) và **Frontend** (Angular 17+).
Dưới đây là các lệnh cơ bản để khởi chạy dự án trong môi trường phát triển (Development).

---

## 1. Khởi Chạy Backend (Node.js)

1. Mở Terminal / Command Prompt.
2. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
3. Cài đặt các thư viện (nếu chạy lần đầu):
   ```bash
   npm install
   ```
4. **Cấu hình Biến môi trường (QUAN TRỌNG):**
   Tạo file `.env` từ file mẫu bằng lệnh sau (hoặc copy thủ công file `.env.example` thành `.env`):
   ```bash
   cp .env.example .env
   ```
   *Sau đó mở file `.env` lên và điền link Database thật vào chỗ `DATABASE_URL` (hỏi Leader để lấy link này).*

5. Chạy Server ở chế độ Development (sử dụng nodemon tự động restart khi lưu code):
   ```bash
   npm run dev
   ```
> **Lưu ý:** Đảm bảo bạn đã điền đúng `DATABASE_URL` trong file `.env` trước khi chạy lệnh này. Backend mặc định sẽ chạy ở cổng `http://localhost:3000` hoặc `http://localhost:3005`.

---

## 2. Khởi Chạy Frontend (Angular)

1. Mở một cửa sổ Terminal / Command Prompt **MỚI** (không tắt terminal của Backend).
2. Di chuyển vào thư mục `dcor-studio`:
   ```bash
   cd dcor-studio
   ```
3. Cài đặt các thư viện (nếu chạy lần đầu):
   ```bash
   npm install
   ```
4. Khởi chạy ứng dụng Angular:
   ```bash
   npm start
   ```
   *(Hoặc sử dụng lệnh `ng serve`)*

> **Lưu ý:** Đợi đến khi Terminal báo `Application bundle generation complete`, sau đó mở trình duyệt và truy cập vào **[http://localhost:4200](http://localhost:4200)**.
