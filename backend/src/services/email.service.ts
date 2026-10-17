import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'dcorfurniture406@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'dcorfurniture.hhlnv406';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

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

export const emailService = {
  /**
   * Gửi email kích hoạt tài khoản quản trị viên / nhân viên
   */
  sendStaffInviteEmail: async ({ to, fullName, roleName, inviteUrl }: SendInviteEmailParams) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; color: #1c1c1e; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebebeb; }
        .header { background: #18181b; padding: 32px 24px; text-align: center; }
        .logo-text { color: #f59e0b; font-size: 26px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .tagline { color: #a1a1aa; font-size: 13px; margin-top: 6px; }
        .body-content { padding: 36px 32px; }
        .title { font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; }
        .greeting { font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 20px; }
        .role-highlight { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn-activate { display: inline-block; background-color: #f59e0b; color: #000000 !important; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35); }
        .note-box { background: #f3f4f6; border-left: 4px solid #f59e0b; padding: 14px 16px; font-size: 13px; color: #4b5563; border-radius: 4px; margin-top: 24px; }
        .footer { background: #fafafa; padding: 20px 32px; border-top: 1px solid #ebebeb; text-align: center; font-size: 12px; color: #9ca3af; }
        .url-backup { word-break: break-all; color: #6b7280; font-size: 12px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">DCOR FURNITURE</div>
          <div class="tagline">Hệ thống quản trị & điều hành nội bộ</div>
        </div>
        <div class="body-content">
          <h2 class="title">Thư mời kích hoạt tài khoản Quản trị</h2>
          <p class="greeting">Xin chào <strong>${fullName}</strong>,</p>
          <p class="greeting">
            Bạn vừa được quản trị viên cấp quyền tham gia vào hệ thống Quản trị DCor Furniture với vai trò:
            <span class="role-highlight">${roleName}</span>
          </p>
          <p class="greeting">
            Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu và kích hoạt tài khoản của bạn:
          </p>
          <div class="btn-wrapper">
            <a href="${inviteUrl}" target="_blank" class="btn-activate">KÍCH HOẠT TÀI KHOẢN NGAY</a>
          </div>
          <div class="note-box">
            <strong>Lưu ý:</strong> Liên kết kích hoạt này có hiệu lực trong vòng <strong>7 ngày</strong>. Vui lòng không chia sẻ liên kết này cho bất kỳ ai.
          </div>
          <p class="url-backup">
            Nếu nút kích hoạt không bấm được, bạn hãy sao chép đường dẫn này và dán vào trình duyệt:<br>
            <a href="${inviteUrl}" style="color: #d97706;">${inviteUrl}</a>
          </p>
        </div>
        <div class="footer">
          © 2026 DCor Furniture System. Mọi quyền được bảo lưu.<br>
          Email tự động được gửi từ hệ thống, vui lòng không phản hồi thư này.
        </div>
      </div>
    </body>
    </html>
    `;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Gửi thư kích hoạt tài khoản:`);
    console.log(`- Đến: ${to} (${fullName})`);
    console.log(`- Vai trò: ${roleName}`);
    console.log(`- Link kích hoạt: ${inviteUrl}`);
    console.log(`======================================================\n`);

    try {
      const info = await transporter.sendMail({
        from: `"DCor Furniture" <${EMAIL_USER}>`,
        to,
        subject: `[DCor Furniture] Thư mời kích hoạt tài khoản quản trị (${roleName})`,
        html: htmlContent
      });
      console.log(`[EMAIL SUCCESS] Thư kích hoạt đã được gửi thành công:`, info.messageId);
      return { success: true, messageId: info.messageId, inviteUrl };
    } catch (error: any) {
      console.warn(`[EMAIL WARNING] Không thể gửi qua SMTP Gmail (${error.message}).`);
      console.warn(`(Lưu ý: Nếu Google báo 535 BadCredentials, bạn cần tạo Mật khẩu ứng dụng 16 ký tự trong tài khoản Google để gửi thư thật).`);
      console.log(`[FALLBACK URL] Bạn vẫn có thể sử dụng link kích hoạt trực tiếp: ${inviteUrl}`);
      // Không ném lỗi ra ngoài để luồng tạo nhân sự DB vẫn thành công và admin có link copy
      return { 
        success: false, 
        error: error.message, 
        inviteUrl,
        hint: 'Cần App Password 16 ký tự của Google để gửi thư trực tiếp vào hòm thư.' 
      };
    }
  },

  /**
   * Gửi email khôi phục mật khẩu
   */
  sendPasswordResetEmail: async ({ to, fullName, resetUrl }: SendPasswordResetParams) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; color: #1c1c1e; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebebeb; }
        .header { background: #18181b; padding: 32px 24px; text-align: center; }
        .logo-text { color: #f59e0b; font-size: 26px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .body-content { padding: 36px 32px; }
        .title { font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; }
        .greeting { font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 20px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn-activate { display: inline-block; background-color: #f59e0b; color: #000000 !important; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 8px; text-decoration: none; }
        .footer { background: #fafafa; padding: 20px 32px; border-top: 1px solid #ebebeb; text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">DCOR FURNITURE</div>
        </div>
        <div class="body-content">
          <h2 class="title">Yêu cầu khôi phục mật khẩu</h2>
          <p class="greeting">Xin chào <strong>${fullName}</strong>,</p>
          <p class="greeting">
            Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản quản trị của bạn tại DCor Furniture.
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" target="_blank" class="btn-activate">ĐẶT LẠI MẬT KHẨU</a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư.</p>
        </div>
        <div class="footer">© 2026 DCor Furniture System</div>
      </div>
    </body>
    </html>
    `;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Gửi thư khôi phục mật khẩu:`);
    console.log(`- Đến: ${to}`);
    console.log(`- Link reset: ${resetUrl}`);
    console.log(`======================================================\n`);

    try {
      const info = await transporter.sendMail({
        from: `"DCor Furniture" <${EMAIL_USER}>`,
        to,
        subject: `[DCor Furniture] Khôi phục mật khẩu quản trị`,
        html: htmlContent
      });
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.warn(`[EMAIL WARNING] Lỗi gửi thư reset qua SMTP: ${error.message}`);
      return { success: false, error: error.message, resetUrl };
    }
  }
};
