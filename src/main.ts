import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  patchNestJsSwagger();

  const config = new DocumentBuilder()
    .setTitle('Admin Panel')
    .setDescription('ADMIN PANEL for skycode graphics')
    .setVersion('1.0.0')
    /*.addOAuth2({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'http://localhost:3000/auth/signin',
          tokenUrl: 'http://localhost:3000/auth/signin',
          scopes: {
            'read:users': 'read users',
            'write:users': 'write users',
          },
        },
      },
    })*/
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();

//IMPORTANT SET CORS
