import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * ユーザー登録 リクエストDTO
 */
export class UsersCreateRequestDto {
  /** ユーザー名 */
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  /** メールアドレス */
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(256)
  @IsEmail()
  email: string;

  /** パスワード */
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}
