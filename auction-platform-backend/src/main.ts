import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import { WebsocketExceptionFilter } from './common/filters/websocket-exception.filter';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');
    
    // Enable CORS
    app.enableCors({
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global pipes and filters
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new TypeOrmExceptionFilter(),
      new WebsocketExceptionFilter(),
      new DatabaseExceptionFilter(),
    );

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Auction Platform API')
      .setDescription('The API documentation for the Online Auction Platform')
      .setVersion('1.0')
      .addTag('auctions', 'Auction management endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Start the server
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger documentation available at: http://localhost:${port}/api`);
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
