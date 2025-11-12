import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { AuthResponseTokenDto } from './auth-response-token.dto';

/**
 * トークンリフレッシュ レスポンスボディ
 */
export class AuthRefreshResponseDto {
  constructor(partial: Partial<AuthRefreshResponseDto>) {
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
