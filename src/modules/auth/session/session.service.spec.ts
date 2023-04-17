import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaModule } from '../../../../prisma/prisma.module';
import { PrismaService } from '../../../../prisma/prisma.service';

import { SessionManagerService } from './session.service';
import { SessionModule } from './session.module';

describe('SessionManagerService', () => {
  let service: SessionManagerService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SessionModule],
      providers: [
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );
    service = module.get<SessionManagerService>(SessionManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
