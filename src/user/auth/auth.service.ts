import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../..//redis/redis.service';
import { UpdateUserDTO } from './dot/auth.dto';
import { UserRole } from '@prisma/client';
interface RestPasswordBody {
  email: string;
  password: string;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  async validateUserFromEmailPassword(email: string, password: string) {
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
    if (!user) throw new ConflictException('User not found');
    else if (user && user.authType === 'EMAIL') {
      const doesPasswordMatch = await this.validatePassword(
        password,
        user.passwordHash,
      );
      if (!doesPasswordMatch)
        throw new ConflictException('Something went wrong');
      const token = await this.generateJwtToken(
        user.id,
        user.displayName,
        user.userRole,
      );
      return {
        access_token: token,
      };
    }
  }
  async signupWithEmailPassword(
    email: string,
    displayName: string,
    password: string,
  ) {
    const userExists = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (userExists) throw new ConflictException('Something went wrong');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: email,
        displayName: displayName,
        passwordHash: passwordHash,
        authType: 'EMAIL',
      },
    });
    const token = await this.generateJwtToken(
      user.id,
      user.displayName,
      user.userRole,
    );
    return {
      access_token: token,
    };
  }
  async generateJwtToken(
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
    const Cacheduser = await this.redis.getValueFromHash(userId, 'user');
    if (Cacheduser) {
      return Cacheduser;
    } else {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          userRole: true,
          avatarUrl: true,
        },
      });
      if (!user) throw new NotFoundException('User not found');
      await this.redis.setValueToHash(userId, 'user', JSON.stringify(user));
      return user;
    }
  }
  async updateUserInfo(data: UpdateUserDTO, userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        displayName: data.displayName,
        email: data.email,
        avatarUrl: data.avaterUrl,
      },
    });
    await this.redis.deleteValue(userId);
    return 'Information updated successfully';
  }
  async resetPassword(body: RestPasswordBody) {
    const keyfromRedis = await this.redis.getValueAsString(body.email);
    if (!keyfromRedis) throw new NotFoundException('Key not found');
    else if (keyfromRedis !== body.token)
      throw new ConflictException('Key not matched');
    const passwordHash = await bcrypt.hash(body.password, 10);
    const isUserExist = await this.isUserExist(body.email);
    if (!isUserExist) throw new NotFoundException('User not found');
    const user = await this.prisma.user.update({
      where: {
        email: body.email,
      },
      data: {
        passwordHash: passwordHash,
      },
    });
    await this.redis.deleteValue(user.id);
    return 'Password updated successfully';
  }
  async isUserExist(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
      },
    });
    if (user) return true;
    else return false;
  }
}
