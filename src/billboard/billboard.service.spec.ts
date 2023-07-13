import { Test, TestingModule } from '@nestjs/testing';
import { BillboardService } from './billboard.service';

describe('BillboardService', () => {
  let service: BillboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillboardService],
    }).compile();

    service = module.get<BillboardService>(BillboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
