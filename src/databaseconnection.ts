import { PrismaClient } from '@prisma/client';

export class DataBaseConnection {
  prisma = new PrismaClient();
  constructor() {
    this.prisma = new PrismaClient();
  }
  async connectToDatabase() {
    try {
      await this.prisma.$connect();
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }
}
