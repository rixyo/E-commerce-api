import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async validateUserFromGoogle(
    id: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
  ) {
    try {
      let user = await this.prisma.user.findUnique({
        where: {
          googleId: id,
        },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId: id,
            email: email,
            displayName: displayName,
            userRole: 'USER',
            avatarUrl: avatarUrl,
            authType: 'GOOGLE',
          },
        });
        const token = await this.generateJwtToken(
          user.id,
          user.displayName,
          user.userRole,
        );
        return token;
      }
    } catch (error) {
      console.log(error);
    }
  }
  async validateUserFromEmailPassword(
    email: string,
    password: string,
  ): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          id: true,
          passwordHash: true,
          authType: true,
          displayName: true,
          userRole: true,
        },
      });

      if (
        user &&
        user.authType === 'EMAIL' &&
        (await this.validatePassword(password, user.passwordHash))
      ) {
        const token = this.generateJwtToken(
          user.id,
          user.displayName,
          user.userRole,
        );
        return token;
      }

      return null;
    } catch (error) {
      console.log(error);
    }
  }
  async signupWithEmailPassword(
    email: string,
    displayName: string,
    password: string,
  ) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: email,
        displayName: displayName,
        passwordHash: passwordHash,
        userRole: 'USER',
        authType: 'EMAIL',
      },
    });
    const token = await this.generateJwtToken(
      user.id,
      user.displayName,
      user.userRole,
    );
    return token;
  }
  private async generateJwtToken(
    userId: string,
    displayName: string,
    userRole: UserRole,
  ) {
    return jwt.sign({ userId, displayName, userRole }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION_TIME,
    });
  }
  private async validatePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
  async currentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        address: true,
      },
    });
  }
}
