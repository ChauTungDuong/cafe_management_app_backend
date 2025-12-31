import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Action } from 'src/database/entity/log.entity';
import { sanitizeForLog } from './sanitize';
import { LogService } from './log.service';

function actionFromRequest(method: string, url: string): Action {
  const path = (url || '').toLowerCase();

  if (path.includes('/import')) return Action.IMPORT;
  if (path.includes('/export')) return Action.EXPORT;
  if (path.includes('/login')) return Action.LOGIN;
  if (path.includes('/logout')) return Action.LOGOUT;

  switch ((method || '').toUpperCase()) {
    case 'GET':
      return Action.READ;
    case 'POST':
      return Action.CREATE;
    case 'PUT':
    case 'PATCH':
      return Action.UPDATE;
    case 'DELETE':
      return Action.DELETE;
    default:
      return Action.UPDATE;
  }
}

function entityTypeFromBaseUrl(baseUrl?: string): string {
  const clean = (baseUrl || '').replace(/^\/+/, '');
  const first = clean.split('/')[0];
  return first || 'unknown';
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    // Non-HTTP contexts (e.g. cron/jobs) won't have req
    if (!req) return next.handle();

    const startedAt = Date.now();
    const method = req.method;
    const methodUpper = (method || '').toUpperCase();
    const isReadOnly =
      methodUpper === 'GET' ||
      methodUpper === 'HEAD' ||
      methodUpper === 'OPTIONS';

    // Don't persist logs for read-only requests (viewing/listing).
    if (isReadOnly) {
      return next.handle();
    }
    const url = req.originalUrl || req.url;
    const baseUrl = req.baseUrl;
    const user = req.user;

    const action = actionFromRequest(method, url);
    const entityType = entityTypeFromBaseUrl(baseUrl);
    const entityId = req.params?.id;

    const actorName = user?.name ?? user?.email ?? user?.id;
    const actorRole = user?.role;

    const writeLog = (status: 'success' | 'error', error?: any) => {
      const durationMs = Date.now() - startedAt;
      const message =
        status === 'success'
          ? `${actorName ?? 'anonymous'} ${action.toLowerCase()} ${entityType}${entityId ? ' id: ' + entityId : ''}`
          : `${actorName ?? 'anonymous'} ${action.toLowerCase()} ${entityType} failed`;

      return this.logService.write({
        userId: user?.id ?? 'anonymous',
        userName: user?.name,
        userRole: actorRole,
        action: status === 'error' ? Action.ERROR : action,
        entityType,
        entityId,
        message,
        metadata: {
          scope: 'request',
          status,
          durationMs,
          method,
          url,
          params: sanitizeForLog(req.params),
          query: sanitizeForLog(req.query),
          body: sanitizeForLog(req.body),
          error:
            status === 'error'
              ? sanitizeForLog({
                  name: error?.name,
                  message: error?.message,
                  response: (error as any)?.response,
                })
              : undefined,
        },
      });
    };

    return next.handle().pipe(
      tap(() => {
        void writeLog('success');
      }),
      catchError((err) => {
        void writeLog('error', err);
        return throwError(() => err);
      }),
    );
  }
}
