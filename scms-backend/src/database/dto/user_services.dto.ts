import {
  IsString,
  IsOptional,
  IsDate,
  IsBoolean,
  IsInt,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Services, Users, UserServices } from '@prisma/client';

/**
 * ユーザー提供サービスの標準検索用DTO
 */
export class SelectUserServicesDto {
  /// サービス名
  @IsOptional()
  @IsString({ message: 'サービス名は文字列で入力してください。' })
  servicesName?: string;

  @IsOptional()
  @IsInt({ message: 'offsetは数値で入力してください。' })
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsInt({ message: 'limitは数値で入力してください。' })
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString({ message: 'sortByは文字列で入力してください。' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: 'sortOrderは文字列で入力してください。' })
  sortOrder?: 'asc' | 'desc';
}

/**
 * ユーザー提供サービスの登録用DTO
 */
export class CreateUserServicesDto {
  /// ID
  @IsOptional()
  @IsUUID('4', { message: 'IDは文字列で入力してください。' })
  @MaxLength(36, { message: 'IDは36桁以下で入力してください。' })
  id?: string;

  /// ユーザーID
  @IsUUID('4', { message: 'ユーザーIDは文字列で入力してください。' })
  @MaxLength(36, { message: 'ユーザーIDは36桁以下で入力してください。' })
  @IsString({ message: 'ユーザーIDは文字列で入力してください。' })
  usersId: string;

  /// サービスID
  @IsUUID('4', { message: 'サービスIDは文字列で入力してください。' })
  @MaxLength(36, { message: 'サービスIDは36桁以下で入力してください。' })
  @IsString({ message: 'サービスIDは文字列で入力してください。' })
  servicesId: string;

  /// 在庫数
  @IsInt({ message: '在庫数は数値で入力してください。' })
  @Type(() => Number)
  stock: number;

  /// 登録日時
  @IsOptional()
  @IsDate({ message: '登録日時は日付で入力してください。' })
  registeredAt?: Date;

  /// 登録者
  @IsUUID('4', { message: '登録者は文字列で入力してください。' })
  @MaxLength(36, { message: '登録者は36桁以下で入力してください。' })
  @IsString({ message: '登録者は文字列で入力してください。' })
  registeredBy: string;

  /// 更新日時
  @IsOptional()
  @IsDate({ message: '更新日時は日付で入力してください。' })
  updatedAt?: Date;

  /// 更新者
  @IsOptional()
  @IsUUID('4', { message: '更新者は文字列で入力してください。' })
  @MaxLength(36, { message: '更新者は36桁以下で入力してください。' })
  updatedBy?: string;

  /// 削除フラグ
  @IsOptional()
  @IsBoolean({ message: '削除フラグは真偽値で入力してください。' })
  isDeleted?: boolean;
}

/** ユーザー提供サービス取得の型 */
export type UserServicesDetailDto = UserServices & {
  users: Users;
  services: Services;
};
