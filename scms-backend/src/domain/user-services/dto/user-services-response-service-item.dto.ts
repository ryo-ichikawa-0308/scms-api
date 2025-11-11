import { IsOptional, IsString, IsNumber } from 'class-validator';

/**
 * サービスリスト要素 DTO
 */
export class UserServicesResponseServiceItemDto {
  /** ID */
  @IsOptional()
  @IsString()
  id?: string;

  /** ユーザーID */
  @IsOptional()
  @IsString()
  usersId?: string;

  /** サービスID */
  @IsOptional()
  @IsString()
  servicesId?: string;

  /** サービス名 */
  @IsOptional()
  @IsString()
  name?: string;

  /** 概要 */
  @IsOptional()
  @IsString()
  description?: string;

  /** 単価 */
  @IsOptional()
  @IsNumber()
  price?: number;

  /** 単位 */
  @IsOptional()
  @IsString()
  unit?: string;
}
