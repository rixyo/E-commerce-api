import { Test, TestingModule } from '@nestjs/testing';
import { RevenueController } from './revenue.controller';

describe('RevenueController', () => {
  let controller: RevenueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevenueController],
    }).compile();

    controller = module.get<RevenueController>(RevenueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
