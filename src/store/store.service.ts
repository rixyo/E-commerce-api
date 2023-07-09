import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface CreateStore {
  name: string;
  userId: string;
}
@Injectable()
export class StoreService {
  constructor(private readonly Prisma: PrismaService) {}
  async createStore(data: CreateStore) {
    return await this.Prisma.store.create({
      data,
    });
  }
}
