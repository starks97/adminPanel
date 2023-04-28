import { Test, TestingModule } from '@nestjs/testing';
import { RoleSystemService } from './role-system.service';

describe('RoleSystemService', () => {
  let service: RoleSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleSystemService],
    }).compile();

    service = module.get<RoleSystemService>(RoleSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
