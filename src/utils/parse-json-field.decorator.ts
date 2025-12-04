import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const ParseJsonField = createParamDecorator(
  (fieldName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (!body || !body[fieldName]) {
      return undefined;
    }

    const value = body[fieldName];
    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new BadRequestException(
          `Invalid JSON format for field "${fieldName}"`,
        );
      }
    }

    return value;
  },
);
