import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  Min,
  IsEmail,
} from 'class-validator';

// --------------------------------------------------------------------------------
// Select DTO
// --------------------------------------------------------------------------------
/** ユーザーの標準検索用DTO */
export class SelectUsersDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  id?: string;

  /** ユーザー名 */
  @IsOptional()
  @IsString({ message: 'ユーザー名は文字列で入力してください。' })
  name?: string;

  /** メールアドレス */
  @IsOptional()
  @IsString({ message: 'メールアドレスは文字列で入力してください。' })
  @IsEmail()
  email?: string;

  /** パスワード */
  @IsOptional()
  @IsString({ message: 'パスワードは文字列で入力してください。' })
  password?: string;

  // 予約語のページングパラメータ
  /** オフセット */
  @IsOptional()
  @IsInt({ message: 'offsetは数値で入力してください。' })
  @Min(0, { message: 'offsetは0以上で入力してください。' })
  offset?: number;

  /** リミット */
  @IsOptional()
  @IsInt({ message: 'limitは数値で入力してください。' })
  @Min(1, { message: 'limitは1以上で入力してください。' })
  limit?: number;
}

// --------------------------------------------------------------------------------
// Create DTO
// --------------------------------------------------------------------------------
/** ユーザーの登録用DTO */
export class CreateUsersDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  @MaxLength(36, { message: 'IDは36桁以下で入力してください。' })
  id?: string;

  /** ユーザー名 */
  @IsDefined({ message: 'ユーザー名は必ず入力してください。' })
  @IsNotEmpty({ message: 'ユーザー名は必ず入力してください。' })
  @IsString({ message: 'ユーザー名は文字列で入力してください。' })
  @MaxLength(255, { message: 'ユーザー名は255桁以下で入力してください。' })
  name: string;

  /** メールアドレス */
  @IsDefined({ message: 'メールアドレスは必ず入力してください。' })
  @IsNotEmpty({ message: 'メールアドレスは必ず入力してください。' })
  @IsString({ message: 'メールアドレスは文字列で入力してください。' })
  @MaxLength(255, { message: 'メールアドレスは255桁以下で入力してください。' })
  @IsEmail()
  email: string;

  /** パスワード */
  @IsDefined({ message: 'パスワードは必ず入力してください。' })
  @IsNotEmpty({ message: 'パスワードは必ず入力してください。' })
  @IsString({ message: 'パスワードは文字列で入力してください。' })
  @MaxLength(255, { message: 'パスワードは255桁以下で入力してください。' })
  password: string;

  /** 登録日時 */
  @IsDefined({ message: '登録日時は必ず入力してください。' })
  @IsDateString({}, { message: '登録日時は日付で入力してください。' })
  registeredAt: string;

  /** 登録者 */
  @IsDefined({ message: '登録者は必ず入力してください。' })
  @IsNotEmpty({ message: '登録者は必ず入力してください。' })
  @IsString({ message: '登録者は文字列で入力してください。' })
  @MaxLength(36, { message: '登録者は36桁以下で入力してください。' })
  registeredBy: string;

  /** 更新日時 */
  @IsOptional()
  @IsDateString({}, { message: '更新日時は日付で入力してください。' })
  updatedAt?: string;

  /** 更新者 */
  @IsOptional()
  @IsString({ message: '更新者は文字列で入力してください。' })
  @MaxLength(36, { message: '更新者は36桁以下で入力してください。' })
  updatedBy?: string;

  /** 削除フラグ */
  @IsDefined({ message: '削除フラグは必ず入力してください。' })
  @IsInt({ message: '削除フラグは数値で入力してください。' })
  isDeleted: number;
}
