export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface RefreshTokenMetadata {
  token: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface LoginMetadata {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
