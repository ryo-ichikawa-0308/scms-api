import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * 契約詳細 パスパラメータDTO
 */
export class ContractsDetailPathParamsDto {
  /** ID (契約ID) */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  id: string;
}
