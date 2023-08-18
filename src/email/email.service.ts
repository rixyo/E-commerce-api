import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as mailgen from 'mailgen';
import { RedisService } from '../redis/redis.service';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly redisService: RedisService;
  constructor(redisService: RedisService) {
    this.redisService = redisService;
    this.createTransporter();
  }
  private async createTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_HOST,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async sendEmail(email: string) {
    const key = await this.generateRandomToken();
    await this.redisService.setResetpassword(email, key);
    const mailgenerator = new mailgen({
      theme: 'default',
      product: {
        name: 'E-commerce',
        link: 'https://mailgen.js/',
      },
    });
    const response = {
      body: {
        name: email,
        intro:
          "You have received this Email because you've requested a password reset",
        action: {
          instructions: 'To rest your password, please click here:',
          button: {
            color: '#22BC66', // Optional action button color
            text: 'Reset your password',
            link: `https://e-commerce-ruby-two.vercel.app/resetpassword?validation=${key}`,
          },
        },
        outro:
          "If you didn't request this Email, please ignore it. This password reset link is only valid for the next 2 minutes.",
      },
    };
    const sendEmail = mailgenerator.generate(response);
    const message = {
      from: process.env.EMAIL_HOST,
      to: email,
      subject: 'Reset Password',
      html: sendEmail,
    };
    await this.transporter
      .sendMail(message)
      .then(() => {
        console.log('Email sent successfully');
      })
      .catch((err) => {
        console.log(err);
      });
  }
  async generateRandomToken() {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < 30; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      token += characters[randomIndex];
    }

    return token;
  }
}
