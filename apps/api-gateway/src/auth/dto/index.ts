import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  deviceId?: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12)
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
