import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();
    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await service.$disconnect();
  });

  it('should can connect to the database', async () => {
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('should can avaible to disconnect properly', async () => {
    const app = {
      close: jest.fn(),
    } as unknown as INestApplication;

    await expect(service.enableShutdownHooks(app)).resolves.not.toThrow();
  });
});
