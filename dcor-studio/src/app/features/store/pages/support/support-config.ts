/**
 * Các hằng số nghiệp vụ dùng trong nội dung trang hỗ trợ và chính sách DCor.
 * 
 * NGUYÊN TẮC:
 * - Các giá trị đã có căn cứ từ NGUỒN SỰ THẬT (1)-(10) được định nghĩa chính xác kèm chú thích nguồn.
 * - Các mục 'Chưa có quy định' được đặt là undefined; nội dung hiển thị sẽ tự động rơi về cách diễn đạt trung tính, không nêu con số cụ thể.
 * - Ngày cập nhật chính sách toàn hệ thống được đặt là 31/10/2026 theo yêu cầu mới nhất của Leader.
 */

// ============================================================================
// 1. CÁC HẰNG SỐ ĐÃ XÁC ĐỊNH CHÍNH XÁC TỪ NGUỒN SỰ THẬT
// ============================================================================

/**
 * Hotline hỗ trợ khách hàng
 * Căn cứ: NGUỒN SỰ THẬT (9) - Cửa hàng: hotline 1900 1234
 */
export const HOTLINE = '1900 1234';

/**
 * Hòm thư điện tử chính thức của DCor
 * Căn cứ: NGUỒN SỰ THẬT (9) - Cửa hàng: email dcorfurniture406@gmail.com
 */
export const EMAIL = 'dcorfurniture406@gmail.com';

/**
 * Địa chỉ showroom DCor
 * Căn cứ: NGUỒN SỰ THẬT (9) - Cửa hàng: địa chỉ 669 QL1A
 */
export const ADDRESS = '669 QL1A';

/**
 * Khung giờ làm việc / mở cửa showroom
 * Căn cứ: NGUỒN SỰ THẬT (9) - Cửa hàng: giờ 8:00 - 22:00 mọi ngày
 */
export const WORKING_HOURS = '8:00 - 22:00 mọi ngày';

/**
 * Ngày cập nhật chính sách toàn hệ thống (chỉ hiện trên 4 trang chính sách)
 * Căn cứ: Yêu cầu nhiệm vụ mục 5 (hằng số 31/10/2026)
 */
export const POLICY_LAST_UPDATED = '31/10/2026';

/**
 * Ngưỡng giá trị đơn hàng khóa phương thức COD và bắt buộc đặt cọc 30% bằng chuyển khoản
 * Căn cứ: NGUỒN SỰ THẬT (1) - "Đơn từ giá trị cao (Leader chốt: trên 50.000.000 VNĐ) bị khóa COD và bắt buộc đặt cọc 30% bằng chuyển khoản"
 * Căn cứ code: checkout.ts (this.totalAmount > 50000000)
 */
export const HIGH_VALUE_ORDER_THRESHOLD = 50000000;

/**
 * Tỷ lệ phần trăm đặt cọc cho đơn hàng giá trị cao (> 50.000.000 VNĐ)
 * Căn cứ: NGUỒN SỰ THẬT (1) - "bắt buộc đặt cọc 30% bằng chuyển khoản; phần còn lại thanh toán khi nhận hàng"
 */
export const HIGH_VALUE_DEPOSIT_PERCENT = 30;

/**
 * Ngưỡng giá trị sản phẩm/đơn hàng phân loại thẩm định hồ sơ đổi trả (50.000.000 VNĐ)
 * Căn cứ: NGUỒN SỰ THẬT (5) - "Đơn/sản phẩm dưới 50.000.000 VNĐ: duyệt hồ sơ trực tuyến qua minh chứng... Từ 50.000.000 VNĐ trở lên: kỹ thuật viên đến tận nhà giám định"
 */
export const RETURN_INSPECTION_THRESHOLD = 50000000;

/**
 * Thời gian phản hồi dự kiến duyệt hồ sơ đổi trả trực tuyến cho đơn/sản phẩm dưới 50.000.000 VNĐ
 * Căn cứ: NGUỒN SỰ THẬT (5) - "phản hồi dự kiến trong 24 giờ (trạng thái 'Chờ thẩm định hồ sơ trực tuyến')"
 */
export const ONLINE_RETURN_REVIEW_HOURS = 24;

/**
 * Thời hạn tối đa gửi yêu cầu đổi trả kể từ khi nhận hàng
 * Căn cứ: NGUỒN SỰ THẬT (5) - "tối đa 7 ngày kể từ khi nhận hàng; hệ thống chỉ hiện các đơn còn trong hạn"
 */
export const MAX_RETURN_DAYS = 7;

/**
 * Dung lượng file minh chứng tối đa khi gửi yêu cầu bảo hành
 * Căn cứ: NGUỒN SỰ THẬT (4) - "ảnh/video thực tế (tối đa 15MB)"
 */
export const MAX_WARRANTY_MEDIA_SIZE_MB = 15;

/**
 * Thời gian phản hồi báo giá đơn thiết kế riêng (Custom)
 * Căn cứ: NGUỒN SỰ THẬT (6) - "gửi yêu cầu -> phản hồi báo giá trong vòng 24 giờ"
 */
export const CUSTOM_QUOTE_RESPONSE_HOURS = 24;

/**
 * Tỷ lệ cọc thông thường cho hàng Custom
 * Căn cứ: NGUỒN SỰ THẬT (1) & (6) - "thường 30%-50%, theo báo giá và hợp đồng"
 */
export const CUSTOM_DEPOSIT_RANGE = '30% - 50%';

/**
 * Số sản phẩm tối đa cho phép so sánh cùng danh mục
 * Căn cứ: Code thực tế explore.ts (this.compareList.length >= 5 -> 'Tối đa 5 sản phẩm')
 */
export const MAX_COMPARE_PRODUCTS = 5;

// ============================================================================
// 2. CÁC HẰNG SỐ CHƯA CÓ QUY ĐỊNH (ĐẶT UNDEFINED ĐỂ TỰ RƠI VỀ CÂU TRUNG TÍNH)
// ============================================================================

/**
 * Số ngày giao hàng cụ thể theo từng khu vực
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (chỉ biết thời gian giao dự kiến ở màn hình thành công) -> để undefined
 */
export const SPECIFIC_SHIPPING_DAYS: string | undefined = undefined;

/**
 * Mức phí giao hàng cố định hoặc ngưỡng miễn phí vận chuyển
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (chỉ biết phí tính theo nội thành/liên tỉnh ở bước đặt hàng) -> để undefined
 */
export const FIXED_SHIPPING_FEE: number | undefined = undefined;

/**
 * Thời hạn đổi trả chính xác cố định (xung đột giữa 72 giờ và 7 ngày)
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (đặc tả ghi 'trong vòng 72 giờ đến 7 ngày', nguồn sự thật ghi 'tối đa 7 ngày') -> để undefined
 */
export const EXACT_RETURN_TIMEFRAME: string | undefined = undefined;

/**
 * Thời gian hoàn tiền cụ thể cho yêu cầu đổi trả
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (Đặc tả không nêu số ngày hoàn tiền) -> để undefined
 */
export const REFUND_PROCESSING_DAYS: number | undefined = undefined;

/**
 * Thời hạn bảo hành mặc định chung
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (NGUỒN SỰ THẬT 4 khẳng định rõ: "thời hạn bảo hành theo từng sản phẩm, KHÔNG có mặc định chung") -> để undefined
 */
export const DEFAULT_WARRANTY_MONTHS: number | undefined = undefined;

/**
 * Phí sửa chữa dịch vụ sau bảo hành
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (Đặc tả chỉ ghi "chuyển sang dịch vụ sửa chữa tính phí", không nêu mức phí) -> để undefined
 */
export const POST_WARRANTY_REPAIR_FEE: number | undefined = undefined;

/**
 * Số ngày đơn hàng tự động hoàn tất nếu khách không bấm nhận hàng
 * Căn cứ: CHƯA CÓ QUY ĐỊNH (Giao diện và đặc tả mới không có quy định tự hoàn tất) -> để undefined
 */
export const AUTO_COMPLETE_ORDER_DAYS: number | undefined = undefined;

// ============================================================================
// 3. CÁC HÀM TIỆN ÍCH TRỢ GIÚP HIỂN THỊ NỘI DUNG
// ============================================================================

/**
 * Định dạng tiền tệ VND chuẩn
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}
