import { Test, TestingModule } from '@nestjs/testing';
import { CloudinarySystemService } from './cloudinary-system.service';

describe('CloudinarySystemService', () => {
  let service: CloudinarySystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinarySystemService],
    }).compile();

    service = module.get<CloudinarySystemService>(CloudinarySystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
