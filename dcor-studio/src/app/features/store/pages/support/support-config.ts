/**
 * Các hằng số nghiệp vụ dùng trong nội dung trang hỗ trợ và chính sách DCor.
 * Ghi chú: Đã xác nhận với Leader.
 * Tất cả số liệu, thời hạn, hạn mức trong các bài viết đều được tham chiếu từ file này.
 */

// Hạn mức đơn hàng lớn (VND) - Trên mức này chỉ áp dụng thanh toán online và yêu cầu đặt cọc
export const CODE_LOCK_THRESHOLD = 50_000_000;

// Tỷ lệ phần trăm đặt cọc bắt buộc cho đơn trên hạn mức hoặc đơn đặt làm riêng (Custom Design)
export const DEPOSIT_PERCENT = 30;

// Thời gian (ngày) hệ thống tự động hoàn tất đơn hàng nếu khách không bấm 'Đã nhận hàng'
export const AUTO_COMPLETE_DAYS = 3;

// Thông tin liên hệ và cơ sở dịch vụ
export const HOTLINE = '1900 1234';
export const EMAIL = 'dcorfurniture406@gmail.com';
export const ADDRESS = '669 QL1A, TP. Hồ Chí Minh';
export const WORKING_HOURS = '8:00 - 22:00, Thứ 2 - Chủ nhật';

// Ngày cập nhật chính sách áp dụng toàn hệ thống
export const POLICY_LAST_UPDATED = '15/10/2026';

/**
 * Hàm định dạng tiền tệ VND chuẩn hiển thị
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export const CODE_LOCK_THRESHOLD_FORMATTED = formatVND(CODE_LOCK_THRESHOLD);

