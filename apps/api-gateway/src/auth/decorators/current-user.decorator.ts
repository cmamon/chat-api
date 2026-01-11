import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../interfaces/auth.interface';

export const CurrentUser = createParamDecorator((data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as JwtUser;

  return data ? user?.[data] : user;
});
