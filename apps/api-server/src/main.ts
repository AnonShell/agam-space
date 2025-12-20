import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { runMigrations } from './database/migration';
import { patchNestJsSwagger } from 'nestjs-zod';

import type { FastifyCookieOptions } from '@fastify/cookie';
import fastifyCookie from '@fastify/cookie';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import helmet from 'helmet';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({
    logger: process.env.NODE_ENV === 'development',
    bodyLimit: 1024 * 1024 * 1024, // 1GB limit,
    trustProxy: true,
  });

  // Configure binary data handling
  fastifyAdapter
    .getInstance()
    .addContentTypeParser('application/octet-stream', (req, payload, done) => {
      payload.on('error', error => {
        done(error);
      });
      done(null, payload);
    });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter);

  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(AppConfigService);
  const config = configService.getConfig();
  const { APP_CONSTANTS } = await import('./config/config.schema');

  await app.register(fastifyCookie as any, {} as FastifyCookieOptions);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Run database migrations using the provider's connection
  await runMigrations(app);

  const corsOrigin = config.cors.origin;

  const resolvedOrigin =
    !corsOrigin || corsOrigin === '*' || corsOrigin === 'true' ? true : corsOrigin;

  // Enable CORS
  app.enableCors({
    origin: resolvedOrigin,
    credentials: config.cors.credentials,
  });

  // API prefix (from config)
  app.setGlobalPrefix(configService.getApiPrefix());

  // Swagger setup (if enabled)
  if (configService.isDocsEnabled()) {
    patchNestJsSwagger();

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Agam Space API')
      .setDescription('Self-hosted, end-to-end encrypted file storage platform API')
      .setVersion(APP_CONSTANTS.version)
      .addTag('health', 'Health check endpoints')
      .addTag('Authentication', 'User authentication and session management')
      .addTag('User', 'User profile and account management')
      .addTag('Files', 'File management and operations')
      .addTag('Folders', 'Folder management and navigation')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        name: 'Authorization',
        description: 'Enter the session token received from login',
        in: 'header',
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(config.docs.path, app, document);
  }

  // Start server
  const port = configService.getPort();
  const host = configService.getHost();

  await app.listen(port, host);

  console.log(`🚀 Agam Space API running on http://${host}:${port}`);
  console.log(`📋 API available at http://${host}:${port}/${configService.getApiPrefix()}`);

  if (configService.isDocsEnabled()) {
    console.log(`📚 API Documentation at http://${host}:${port}/${config.docs.path}`);
  }
}

bootstrap().catch(error => {
  console.error('❌ Failed to start server:', error);
  throw error; // Let the process manager handle the error
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason);
});
