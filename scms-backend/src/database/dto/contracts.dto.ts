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
/** 契約の標準検索用DTO */
export class SelectContractsDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  id?: string;

  /** ユーザーID */
  @IsOptional()
  @IsString({ message: 'ユーザーIDは文字列で入力してください。' })
  usersId?: string;

  /** ユーザー提供サービスID */
  @IsOptional()
  @IsString({ message: 'ユーザー提供サービスIDは文字列で入力してください。' })
  userServicesId?: string;

  /** 契約数 */
  @IsOptional()
  @IsInt({ message: '契約数は数値で入力してください。' })
  quantity?: number;

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
/** 契約の登録用DTO */
export class CreateContractsDto {
  /** ID */
  @IsOptional()
  @IsString({ message: 'IDは文字列で入力してください。' })
  @MaxLength(36, { message: 'IDは36桁以下で入力してください。' })
  id?: string;

  /** ユーザーID */
  @IsDefined({ message: 'ユーザーIDは必ず入力してください。' })
  @IsNotEmpty({ message: 'ユーザーIDは必ず入力してください。' })
  @IsString({ message: 'ユーザーIDは文字列で入力してください。' })
  @MaxLength(36, { message: 'ユーザーIDは36桁以下で入力してください。' })
  usersId: string;

  /** ユーザー提供サービスID */
  @IsDefined({ message: 'ユーザー提供サービスIDは必ず入力してください。' })
  @IsNotEmpty({ message: 'ユーザー提供サービスIDは必ず入力してください。' })
  @IsString({ message: 'ユーザー提供サービスIDは文字列で入力してください。' })
  @MaxLength(36, {
    message: 'ユーザー提供サービスIDは36桁以下で入力してください。',
  })
  userServicesId: string;

  /** 契約数 */
  @IsDefined({ message: '契約数は必ず入力してください。' })
  @IsInt({ message: '契約数は数値で入力してください。' })
  quantity: number;

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
