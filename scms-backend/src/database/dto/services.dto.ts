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

/**
 * サービスの登録用DTO
 */
export class CreateServicesDto {
  /// サービス名
  @MaxLength(256, { message: 'サービス名は256桁以下で入力してください。' })
  @IsString({ message: 'サービス名は文字列で入力してください。' })
  name: string;

  /// 概要
  @MaxLength(256, { message: '概要は256桁以下で入力してください。' })
  @IsString({ message: '概要は文字列で入力してください。' })
  description: string;

  /// 単価
  @IsInt({ message: '単価は数値で入力してください。' })
  @Type(() => Number)
  price: number;

  /// 単位
  @MaxLength(16, { message: '単位は16桁以下で入力してください。' })
  @IsString({ message: '単位は文字列で入力してください。' })
  unit: string;

  /// 登録日時
  @IsOptional()
  @IsDate({ message: '登録日時は日付で入力してください。' })
  registeredAt?: Date;

  /// 登録者
  @IsUUID('4', { message: '登録者はUUIDで入力してください。' })
  @MaxLength(36, { message: '登録者は36桁以下で入力してください。' })
  @IsString({ message: '登録者は文字列で入力してください。' })
  registeredBy: string;

  /// 更新日時
  @IsOptional()
  @IsDate({ message: '更新日時は日付で入力してください。' })
  updatedAt?: Date;

  /// 更新者
  @IsOptional()
  @IsUUID('4', { message: '更新者はUUIDで入力してください。' })
  @MaxLength(36, { message: '更新者は36桁以下で入力してください。' })
  updatedBy?: string;

  /// 削除フラグ
  @IsOptional()
  @IsBoolean({ message: '削除フラグは真偽値で入力してください。' })
  isDeleted?: boolean;
}
