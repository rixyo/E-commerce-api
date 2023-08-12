import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';

describe('App e2e', () => {
  let prismaService: PrismaService;
  let redisService: RedisService;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
  });
  afterAll(async () => {
    await app.close();
  });
  it.todo("should return 'Hello World!'");
});
