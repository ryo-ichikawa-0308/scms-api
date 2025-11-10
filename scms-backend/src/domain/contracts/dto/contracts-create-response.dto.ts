import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * サービス契約 レスポンスDTO
 */
export class ContractsCreateResponseDto {
  /** 契約ID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  id: string;
}
