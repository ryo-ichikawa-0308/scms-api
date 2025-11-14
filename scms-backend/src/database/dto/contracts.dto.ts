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
import { Contracts, Services, UserServices, Users } from '@prisma/client';

/**
 * 契約の標準検索用DTO
 */
export class SelectContractsDto {
  /// ユーザーID
  @IsOptional()
  @IsString({ message: 'ユーザーIDは文字列で入力してください。' })
  usersId?: string;

  /** サービス名 */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  serviceName?: string;

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
 * 契約の登録用DTO
 */
export class CreateContractsDto {
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

  /// ユーザー提供サービスID
  @IsUUID('4', {
    message: 'ユーザー提供サービスIDは文字列で入力してください。',
  })
  @MaxLength(36, {
    message: 'ユーザー提供サービスIDは36桁以下で入力してください。',
  })
  @IsString({ message: 'ユーザー提供サービスIDは文字列で入力してください。' })
  userServicesId: string;

  /// 契約数
  @IsInt({ message: '契約数は数値で入力してください。' })
  @Type(() => Number)
  quantity: number;

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

/** 契約取得の型 */
export type ContractsDetailDto = Contracts & {
  users: Users;
  userServices: UserServices & {
    users: Users;
    services: Services;
  };
};
