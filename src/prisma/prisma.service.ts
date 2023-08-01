import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DataBaseConnection } from 'src/databaseconnection';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private isConnecting = false;
  dataBaseConnection = new DataBaseConnection();

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connect() {
    try {
      if (!this.isConnecting) {
        this.isConnecting = true;
        await this.dataBaseConnection.connectToDatabase();
        console.log('Connected to the database.');
      }
    } catch (error) {
      this.isConnecting = false;
      console.error('Error connecting to the database:', error.message);
    }
  }
}
