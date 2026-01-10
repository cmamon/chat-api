import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refresh_token;

    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
