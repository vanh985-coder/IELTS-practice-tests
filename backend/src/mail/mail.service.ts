import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor (private mailer: MailerService ){}
    async sendOtp(email: string, otp: string) {
        await this.mailer.sendMail({
        to: email,
        subject: 'Mã xác thực tài khoản',
        html: `
        <p>Mã xác thực của bạn:</p>
        <h1 style="letter-spacing:8px">${otp}</h1>
        <p>Mã có hiệu lực trong 5 phút.</p>
        `,
        });
    }
}
