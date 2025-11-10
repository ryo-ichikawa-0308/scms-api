import { IsOptional, IsString } from 'class-validator';

/**
 * ログイン レスポンスDTO
 */
export class AuthLoginResponseDto {
  /** 認証トークン */
  @IsOptional()
  @IsString()
  token?: string;

  /** ユーザーID */
  @IsOptional()
  @IsString()
  id?: string;

  /** ユーザー名 */
  @IsOptional()
  @IsString()
  name?: string;
}
