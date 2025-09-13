/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('[CurrentUser] request.user =', request.user);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return request.user;
  },
);