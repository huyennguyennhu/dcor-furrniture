export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ISmsProvider {
  name: string;
  sendOtp(phone: string, otp: string): Promise<SmsSendResult>;
}

export class ConsoleSmsProvider implements ISmsProvider {
  name = 'Console';

  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    // Không log OTP ở production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS Dev - ${phone}] Mã OTP xác thực DCor của bạn là: ${otp}. Mã có hiệu lực trong 90 giây.`);
    }
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`
    };
  }
}

class SmsService {
  private provider: ISmsProvider;

  constructor() {
    const providerName = process.env.SMS_PROVIDER?.toUpperCase();
    switch (providerName) {
      // Có thể mở rộng tích hợp các dịch vụ SMS thật (Twilio, SpeedSMS, eSMS, v.v.)
      default:
        this.provider = new ConsoleSmsProvider();
        break;
    }
  }

  public setProvider(provider: ISmsProvider): void {
    this.provider = provider;
  }

  public async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    return this.provider.sendOtp(phone, otp);
  }
}

export const smsService = new SmsService();
