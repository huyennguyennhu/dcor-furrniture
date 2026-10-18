import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.EMAIL_USER || 'zuven1232005@gmail.com';
  const pass = process.env.EMAIL_PASS || 'zpvd vnjt qyte wsso';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

export const transporter = getTransporter();

interface SendInviteEmailParams {
  to: string;
  fullName: string;
  roleName: string;
  inviteUrl: string;
}

interface SendPasswordResetParams {
  to: string;
  fullName: string;
  resetUrl: string;
}

export interface SendStaffOnboardingParams {
  to: string;
  fullName: string;
  roles: string[];
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  branchManager?: string;
  inviteUrl: string;
  subject?: string;
  adminNote?: string;
}

export const emailService = {
  /**
   * Gửi email bàn giao tài khoản quản trị & kích hoạt thiết lập mật khẩu cá nhân
   */
  sendStaffOnboardingEmail: async ({
    to,
    fullName,
    roles,
    branchName,
    branchAddress = 'Trụ sở chính DCor',
    branchPhone = '1900 8888',
    branchManager = 'Ban Giám Đốc DCor',
    inviteUrl,
    subject,
    adminNote
  }: SendStaffOnboardingParams) => {
    const emailSubject = subject || `[DCor Studio] Thư mời kích hoạt tài khoản & Bổ nhiệm công tác tại ${branchName}`;
    const rolesListHtml = roles.map(r => `<span style="display:inline-block;background:#FAF2EB;color:#765337;padding:4px 12px;border-radius:20px;font-weight:600;font-size:13px;border:1px solid #E8D7CA;margin-right:6px;margin-bottom:6px;">${r}</span>`).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${emailSubject}</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#FCF8F3;margin:0;padding:24px;color:#0A0A0A;">
      <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);border:1px solid #E0E0E0;">
        
        <!-- Header -->
        <div style="background:#765337;padding:28px 32px;color:#FFFFFF;text-align:center;">
          <div style="font-size:26px;font-weight:800;letter-spacing:4px;line-height:1;margin-bottom:6px;">DCOR</div>
          <div style="font-size:11px;letter-spacing:3px;opacity:0.85;">LUXURY FURNITURE & STUDIO</div>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:700;color:#0A0A0A;margin-top:0;margin-bottom:12px;">Thư Bổ nhiệm & Bàn giao Tài khoản Quản trị</h2>

          <!-- Lời chào + lời nhắn Admin -->
          ${adminNote ? `
          <div style="margin-bottom:22px;">
            <p style="font-size:15px;line-height:1.7;color:#424242;margin:0;white-space:pre-line;">${adminNote}</p>
          </div>
          ` : `
          <p style="font-size:15px;line-height:1.6;color:#424242;margin-bottom:22px;">
            Kính gửi <strong>${fullName}</strong>,
          </p>
          <p style="font-size:14px;line-height:1.6;color:#616161;margin-bottom:20px;">
            Ban Giám Đốc và Bộ phận Nhân sự DCor Studio trân trọng thông báo bạn đã được tiếp nhận và thiết lập tài khoản quản trị trên Cổng Quản trị DCor Studio.
          </p>
          `}

          <!-- Roles & Branch Card -->
          <div style="background:#FAF7F2;border:1.5px solid #E4DACF;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#765337;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">
              PHẠM VI NHIỆM VỤ & ĐỊA ĐIỂM CÔNG TÁC
            </div>
            <div style="margin-bottom:10px;">
              <span style="font-size:13px;color:#757575;">Vai trò được gán:</span>
              <div style="margin-top:6px;">${rolesListHtml}</div>
            </div>
            <div style="font-size:13px;color:#424242;margin-bottom:6px;">
              <strong>Chi nhánh phân công:</strong> ${branchName}
            </div>
            <div style="font-size:13px;color:#616161;margin-bottom:4px;">
              <strong>Địa chỉ làm việc:</strong> ${branchAddress}
            </div>
            <div style="font-size:13px;color:#616161;margin-bottom:4px;">
              <strong>Hotline chi nhánh:</strong> ${branchPhone}
            </div>
            <div style="font-size:13px;color:#616161;">
              <strong>Quản lý phụ trách:</strong> ${branchManager}
            </div>
          </div>

          <!-- Lời nhắn riAENG thiết lập - không còn show ở đây vì đã đưa lên đầu -->


          <!-- Security Callout (User sets password) -->
          <div style="background:#F5F5F5;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:#0A0A0A;margin-bottom:6px;">
              🔒 QUY ĐỊNH BẢO MẬT & TỰ KHỞI TẠO MẬT KHẨU CÁ NHÂN
            </div>
            <p style="font-size:13px;line-height:1.5;color:#616161;margin:0;">
              Theo quy chuẩn an toàn thông tin của DCor, Quản trị viên chỉ khởi tạo tài khoản và giám sát quyền hạn, <strong>tuyệt đối không nắm giữ hoặc tạo trước mật khẩu của bạn</strong>. Bạn là người duy nhất sở hữu quyền thiết lập và quản lý mật khẩu của chính mình thông qua liên kết bảo mật bên dưới.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteUrl}" target="_blank" style="display:inline-block;background-color:#765337;color:#FFFFFF !important;font-weight:700;font-size:15px;padding:15px 40px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(118,83,55,0.3);">
              KÍCH HOẠT & THIẾT LẬP MẬT KHẨU NGAY
            </a>
          </div>

          <p style="font-size:12px;color:#757575;text-align:center;margin-bottom:0;">
            Liên kết kích hoạt có hiệu lực trong 7 ngày.<br>
            Hoặc sao chép đường dẫn trực tiếp: <a href="${inviteUrl}" style="color:#BC5F13;word-break:break-all;">${inviteUrl}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#F0EDE8;padding:20px 32px;text-align:center;font-size:12px;color:#757575;border-top:1px solid #E0E0E0;">
          © 2026 DCOR LUXURY FURNITURE STUDIO • TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.<br>
          Email tự động được gửi từ Cổng Quản trị DCor. Vui lòng không phản hồi trực tiếp.
        </div>
      </div>
    </body>
    </html>
    `;

    const transport = getTransporter();
    const fromUser = process.env.EMAIL_USER || 'zuven1232005@gmail.com';

    console.log(`[EMAIL DISPATCH] Đang gửi thư bàn giao đến: ${to} (${fullName}) qua SMTP Gmail (${fromUser})...`);

    try {
      const info = await transport.sendMail({
        from: `"DCor Studio" <${fromUser}>`,
        to,
        subject: emailSubject,
        html: htmlContent
      });
      console.log(`[EMAIL SUCCESS] Thư bàn giao gửi thành công tới ${to}! MessageId:`, info.messageId);
      return { success: true, messageId: info.messageId, inviteUrl };
    } catch (error: any) {
      console.error(`[EMAIL ERROR] Lỗi khi gửi email qua Gmail SMTP:`, error.message);
      return { success: false, error: error.message, inviteUrl };
    }
  },

  /**
   * Gửi email kích hoạt tài khoản quản trị viên / nhân viên (Legacy)
   */
  sendStaffInviteEmail: async ({ to, fullName, roleName, inviteUrl }: SendInviteEmailParams) => {
    return emailService.sendStaffOnboardingEmail({
      to,
      fullName,
      roles: [roleName],
      branchName: 'Toàn hệ thống',
      inviteUrl
    });
  },

  /**
   * Gửi email khôi phục mật khẩu
   */
  sendPasswordResetEmail: async ({ to, fullName, resetUrl }: SendPasswordResetParams) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:sans-serif;background-color:#FCF8F3;padding:20px;">
      <div style="max-width:540px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:30px;border:1px solid #E0E0E0;">
        <h2 style="color:#765337;">Yêu cầu Đặt lại Mật khẩu DCor Studio</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản quản trị của bạn. Vui lòng bấm vào nút bên dưới:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetUrl}" style="background:#765337;color:#FFFFFF;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">ĐẶT LẠI MẬT KHẨU</a>
        </div>
        <p style="font-size:12px;color:#757575;">Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua thư này.</p>
      </div>
    </body>
    </html>
    `;

    const transport = getTransporter();
    const fromUser = process.env.EMAIL_USER || 'zuven1232005@gmail.com';

    try {
      const info = await transport.sendMail({
        from: `"DCor Studio" <${fromUser}>`,
        to,
        subject: `[DCor Studio] Yêu cầu đặt lại mật khẩu quản trị`,
        html: htmlContent
      });
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
