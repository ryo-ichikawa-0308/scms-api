import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * トークン
 */
export class AuthResponseTokenDto {
  /**
   * アクセストークン (JWTアクセストークン)
   */
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  /**
   * 有効期限
   */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  expiresIn: number;
}
