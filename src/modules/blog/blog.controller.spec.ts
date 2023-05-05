import { CacheSystemModule } from './../cache-system/cache-system.module';
import { PrismaModule } from './../../../prisma/prisma.module';
import { Test, TestingModule } from '@nestjs/testing';

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

describe('BlogController', () => {
  let controller: BlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [BlogService],
      imports: [PrismaModule, CacheSystemModule],
    }).compile();

    controller = module.get<BlogController>(BlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
