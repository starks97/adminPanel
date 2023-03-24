import { Test, TestingModule } from '@nestjs/testing';

import { CacheSystemModule } from './../cache-system/cache-system.module';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CacheSystemModule, UserModule],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
