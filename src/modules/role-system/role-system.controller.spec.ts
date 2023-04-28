import { Test, TestingModule } from '@nestjs/testing';
import { RoleSystemController } from './role-system.controller';
import { RoleSystemService } from './role-system.service';

describe('RoleSystemController', () => {
  let controller: RoleSystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleSystemController],
      providers: [RoleSystemService],
    }).compile();

    controller = module.get<RoleSystemController>(RoleSystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
