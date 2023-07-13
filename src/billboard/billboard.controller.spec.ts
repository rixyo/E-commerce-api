import { Test, TestingModule } from '@nestjs/testing';
import { BillboardController } from './billboard.controller';

describe('BillboardController', () => {
  let controller: BillboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillboardController],
    }).compile();

    controller = module.get<BillboardController>(BillboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
