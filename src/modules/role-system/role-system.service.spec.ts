import { PrismaService } from './../../../prisma/prisma.service';
import { PrismaModule } from './../../../prisma/prisma.module';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleSystemService } from './role-system.service';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('RoleSystemService', () => {
  let service: RoleSystemService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleSystemService, PrismaService],
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())

      .compile();

    service = module.get<RoleSystemService>(RoleSystemService);

    prismaMock = module.get(PrismaService);
  });

  describe('createRole', () => {});
});
