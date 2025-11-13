import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

/**
 * ユーザー提供サービス登録のリクエストボディ
 */
export class UserServicesCreateRequestDto {
  /** ユーザーID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  userId: string;

  /** サービスID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  serviceId: string;

  /** 在庫数 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(999999)
  stock: number;
}
