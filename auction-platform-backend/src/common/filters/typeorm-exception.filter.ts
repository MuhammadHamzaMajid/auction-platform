import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(EntityNotFoundError, QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError | QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof EntityNotFoundError) {
      response.status(404).json({
        statusCode: 404,
        timestamp: new Date().toISOString(),
        message: 'Entity not found',
        error: 'Not Found',
      });
    } else if (exception instanceof QueryFailedError) {
      // Handle unique constraint violations
      if ((exception as any).code === '23505') {
        response.status(409).json({
          statusCode: 409,
          timestamp: new Date().toISOString(),
          message: 'Duplicate entry',
          error: 'Conflict',
        });
      } else {
        response.status(500).json({
          statusCode: 500,
          timestamp: new Date().toISOString(),
          message: 'Database query failed',
          error: 'Internal Server Error',
        });
      }
    }
  }
}
