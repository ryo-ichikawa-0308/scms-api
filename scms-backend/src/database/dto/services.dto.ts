import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';

// --------------------------------------------------------------------------------
// Select DTO
// --------------------------------------------------------------------------------
/** サービスの標準検索用DTO */
export class SelectServicesDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  id?: string;

  /** サービス名 */
  @IsOptional()
  @IsString({ message: 'サービス名は文字列で入力してください。' })
  name?: string;

  /** 概要 */
  @IsOptional()
  @IsString({ message: '概要は文字列で入力してください。' })
  description?: string;

  /** 単価 */
  @IsOptional()
  @IsInt({ message: '単価は数値で入力してください。' })
  price?: number;

  /** 単位 */
  @IsOptional()
  @IsString({ message: '単位は文字列で入力してください。' })
  unit?: string;

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
/** サービスの登録用DTO */
export class CreateServicesDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  @MaxLength(36, { message: 'IDは36桁以下で入力してください。' })
  id?: string;

  /** サービス名 */
  @IsDefined({ message: 'サービス名は必ず入力してください。' })
  @IsNotEmpty({ message: 'サービス名は必ず入力してください。' })
  @IsString({ message: 'サービス名は文字列で入力してください。' })
  @MaxLength(255, { message: 'サービス名は255桁以下で入力してください。' })
  name: string;

  /** 概要 */
  @IsDefined({ message: '概要は必ず入力してください。' })
  @IsNotEmpty({ message: '概要は必ず入力してください。' })
  @IsString({ message: '概要は文字列で入力してください。' })
  @MaxLength(255, { message: '概要は255桁以下で入力してください。' })
  description: string;

  /** 単価 */
  @IsDefined({ message: '単価は必ず入力してください。' })
  @IsInt({ message: '単価は数値で入力してください。' })
  price: number;

  /** 単位 */
  @IsDefined({ message: '単位は必ず入力してください。' })
  @IsNotEmpty({ message: '単位は必ず入力してください。' })
  @IsString({ message: '単位は文字列で入力してください。' })
  @MaxLength(16, { message: '単位は16桁以下で入力してください。' })
  unit: string;

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
