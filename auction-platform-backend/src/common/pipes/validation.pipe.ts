import { ValidationPipe } from '@nestjs/common';

export const GlobalValidationPipe = new ValidationPipe({
  whitelist: true, // Strip properties that don't have decorators
  transform: true, // Transform payloads to DTO instances
  forbidNonWhitelisted: true, // Throw errors if non-whitelisted properties are present
  transformOptions: {
    enableImplicitConversion: true, // Automatically transform primitive types
  },
});
