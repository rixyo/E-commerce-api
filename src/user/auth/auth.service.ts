import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RedisService } from 'src/redis/redis.service';
import { UpdateUserDTO } from './dot/auth.dto';
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
      const token = this.generateJwtToken(
        user.id,
        user.displayName,
        user.userRole,
      );
      return token;
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
        userRole: 'ADMIN',
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
    if (Cacheduser) return Cacheduser;
    else {
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
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        displayName: data.displayName,
        email: data.email,
        avatarUrl: data.avaterUrl,
      },
    });
    Promise.all([this.redis.deleteValue(user.email)]);
    return 'Information updated successfully';
  }
}
