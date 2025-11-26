import { IsOptional, IsString, IsNumber } from 'class-validator';

/**
 * 契約リスト要素 DTO
 */
export class ContractsResponseContractItemDto {
  /** ID */
  @IsOptional()
  @IsString()
  id?: string;

  /** ユーザー名 */
  @IsOptional()
  @IsString()
  usersName?: string;

  /** ユーザー提供サービスID */
  @IsOptional()
  @IsString()
  userServicesId?: string;

  /** サービス名 */
  @IsOptional()
  @IsString()
  name?: string;

  /** 単価 */
  @IsOptional()
  @IsNumber()
  price?: number;

  /** 単位 */
  @IsOptional()
  @IsString()
  unit?: string;

  /** 契約数 */
  @IsOptional()
  @IsNumber()
  quantity?: number;

  /** 在庫数 */
  @IsOptional()
  @IsNumber()
  stock?: number;
}
