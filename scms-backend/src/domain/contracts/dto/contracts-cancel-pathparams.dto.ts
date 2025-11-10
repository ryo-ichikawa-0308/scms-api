import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * サービス解約 パスパラメータDTO
 */
export class ContractsCancelPathParamsDto {
  /** ID (契約ID) */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  id: string; // JSON: contractId, Name: id
}
