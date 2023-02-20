import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  patchNestJsSwagger();

  const config = new DocumentBuilder()
    .setTitle('Admin Panel')
    .setDescription('ADMIN PANEL for skycode graphics')
    .setVersion('1.0')
    .addTag('panel')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
