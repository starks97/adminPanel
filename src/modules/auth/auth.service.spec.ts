import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { UserModule } from './../user/user.module';
import { AuthService } from './auth.service';
import { SessionModule } from './session/session.module';
import { PrismaModule } from '../../../prisma/prisma.module';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        UserModule,
        JwtModule.register({
          secret: process.env.SECRET_JWT_KEY as string,
        }),
        ConfigModule,
        SessionModule,
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
