import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

@Injectable()
export class MailService {
  private mailerSend: MailerSend;

  constructor(private configService: ConfigService) {
    this.mailerSend = new MailerSend({
      apiKey: this.configService.get('MAILERSEND_API_KEY'),
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const sentFrom = new Sender(
      this.configService.get('MAIL_USER'),
      'Cafe Management',
    );

    const recipients = [new Recipient(email, email.split('@')[0])];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Mã OTP khôi phục mật khẩu')
      .setHtml(
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Khôi phục mật khẩu</h2>
          <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản Cafe Management.</p>
          <p>Mã OTP của bạn là:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Mã OTP này có hiệu lực trong <strong>5 phút</strong>.</p>
          <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
      )
      .setText(`Mã OTP của bạn là: ${otp}. Hiệu lực: 5 phút.`);

    try {
      await this.mailerSend.email.send(emailParams);
      console.log('✅ Email sent successfully to:', email);
    } catch (error) {
      console.error('❌ MailerSend error:', error);
      throw new Error('Failed to send OTP email');
    }
  }
}
