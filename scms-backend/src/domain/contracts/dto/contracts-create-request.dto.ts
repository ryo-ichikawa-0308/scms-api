import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * サービス契約 リクエストDTO
 */
export class ContractsCreateRequestDto {
  /** ユーザーID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  userId: string;

  /** ユーザー提供サービスID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(63) // JSONの定義に従う
  @IsUUID()
  userServiceId: string;

  /** 契約数 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  quantity: number;
}
