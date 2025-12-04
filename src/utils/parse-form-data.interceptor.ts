import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Global interceptor để tự động parse tất cả các trường JSON string từ form-data
 * Tự động phát hiện và parse bất kỳ trường nào có format JSON
 */
@Injectable()
export class ParseFormDataJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body || typeof body !== 'object') {
      return next.handle();
    }

    for (const key in body) {
      if (
        Object.prototype.hasOwnProperty.call(body, key) &&
        typeof body[key] === 'string'
      ) {
        const value = body[key].trim();

        if (
          (value.startsWith('{') && value.endsWith('}')) ||
          (value.startsWith('[') && value.endsWith(']'))
        ) {
          try {
            body[key] = JSON.parse(value);
          } catch (error) {
            console.warn(
              `Failed to parse JSON for field "${key}":`,
              error.message,
            );
          }
        }
      }
    }
    return next.handle();
  }
}
