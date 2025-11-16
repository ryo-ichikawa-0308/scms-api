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
  /** ユーザー提供サービスID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  userServiceId: string;

  /** 契約数 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  quantity: number;
}
