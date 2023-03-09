import { ForbiddenException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IMail } from './interface/mail.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendUserConfirmation(user: IMail, token: string) {
    const url = `http://localhost:3000/auth/confirm?token=${token}`;

    const newEmail = await this.mailer.sendMail({
      to: user.email,
      subject: 'Confirm the action',
      template: './confirmation',
      context: {
        name: user.name,
        url,
      },
    });

    if (!newEmail) {
      throw new ForbiddenException({
        message: 'email_not_sent',
      });
    }
  }
}
