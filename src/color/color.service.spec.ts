import { Test, TestingModule } from '@nestjs/testing';
import { ColorService } from './color.service';

describe('ColorService', () => {
  let service: ColorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorService],
    }).compile();

    service = module.get<ColorService>(ColorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
