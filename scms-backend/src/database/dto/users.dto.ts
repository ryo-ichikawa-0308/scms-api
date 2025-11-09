import {
  IsString,
  IsOptional,
  IsDate,
  IsBoolean,
  IsInt,
  MaxLength,
  IsUUID,
  IsEmail,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ユーザーの標準検索用DTO
 */
export class SelectUsersDto {
  /// ID
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  id?: string;

  /// ユーザー名
  @IsOptional()
  @IsString({ message: 'ユーザー名は文字列で入力してください。' })
  name?: string;

  /// メールアドレス
  @IsOptional()
  @IsString({ message: 'メールアドレスは文字列で入力してください。' })
  @IsEmail(
    {},
    { message: 'メールアドレスはメールアドレスで入力してください。' },
  ) // TODO: 形式名: メールアドレス
  email?: string;

  /// パスワード
  @IsOptional()
  @IsString({ message: 'パスワードは文字列で入力してください。' })
  password?: string;

  /// 認証トークン
  @IsOptional()
  @IsString({ message: '認証トークンは文字列で入力してください。' })
  token?: string;

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
 * ユーザーの登録用DTO
 */
export class CreateUsersDto {
  /// ID
  @IsOptional()
  @IsUUID('4', { message: 'IDは文字列で入力してください。' })
  @Length(36, 36, { message: 'IDは36桁以下で入力してください。' })
  id?: string;

  /// ユーザー名
  @MaxLength(256, { message: 'ユーザー名は256桁以下で入力してください。' })
  @IsString({ message: 'ユーザー名は文字列で入力してください。' })
  name: string;

  /// メールアドレス
  @MaxLength(256, { message: 'メールアドレスは256桁以下で入力してください。' })
  @IsEmail(
    {},
    { message: 'メールアドレスはメールアドレスで入力してください。' },
  ) // TODO: 形式名: メールアドレス
  @IsString({ message: 'メールアドレスは文字列で入力してください。' })
  email: string;

  /// パスワード
  @MaxLength(256, { message: 'パスワードは256桁以下で入力してください。' })
  @IsString({ message: 'パスワードは文字列で入力してください。' })
  password: string;

  /// 認証トークン
  @IsOptional()
  @MaxLength(2048, { message: '認証トークンは2048桁以下で入力してください。' })
  @IsString({ message: '認証トークンは文字列で入力してください。' })
  token?: string;

  /// 登録日時
  @IsOptional()
  @IsDate({ message: '登録日時は日付で入力してください。' })
  registeredAt?: Date;

  /// 登録者
  @IsUUID('4', { message: '登録者は文字列で入力してください。' })
  @Length(36, 36, { message: '登録者は36桁以下で入力してください。' })
  @IsString({ message: '登録者は文字列で入力してください。' })
  registeredBy: string;

  /// 更新日時
  @IsOptional()
  @IsDate({ message: '更新日時は日付で入力してください。' })
  updatedAt?: Date;

  /// 更新者
  @IsOptional()
  @IsUUID('4', { message: '更新者は文字列で入力してください。' })
  @Length(36, 36, { message: '更新者は36桁以下で入力してください。' })
  updatedBy?: string;

  /// 削除フラグ
  @IsOptional()
  @IsBoolean({ message: '削除フラグは真偽値で入力してください。' })
  isDeleted?: boolean;
}
