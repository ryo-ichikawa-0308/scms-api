import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { AuthResponseTokenDto } from './auth-response-token.dto';

/**
 * ログイン レスポンスボディ
 */
export class AuthLoginResponseDto {
  constructor(partial: Partial<AuthLoginResponseDto>) {
    Object.assign(this, partial);
  }
  /**
   * トークン
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => AuthResponseTokenDto)
  token: AuthResponseTokenDto;

  /**
   * ユーザーID
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * ユーザー名
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * リフレッシュトークン(レスポンスJSONには載せない)
   */
  @Exclude()
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  /**
   * リフレッシュトークン有効期限(レスポンスJSONには載せない)
   */
  @Exclude()
  @IsNotEmpty()
  @Type(() => Number)
  refreshTokenExpiresIn: number;
}
