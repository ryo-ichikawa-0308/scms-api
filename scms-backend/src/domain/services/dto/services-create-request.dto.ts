import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * サービス登録のリクエストボディ
 */
export class ServicesCreateRequestDto {
  /** サービス名 */
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  name: string;

  /** 概要 */
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  description: string;

  /** 単価 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(999999)
  price: number;

  /** 単位 */
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  unit: string;
}
