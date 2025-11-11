import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * ログイン リクエストDTO
 */
export class AuthLoginRequestDto {
  /** メールアドレス */
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @IsEmail()
  email: string;

  /** パスワード */
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}
