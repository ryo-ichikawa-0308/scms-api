import { IsOptional, IsString } from 'class-validator';

/**
 * サービス契約 レスポンスDTO
 */
export class ContractsCreateResponseDto {
  /** ID */
  @IsOptional()
  @IsString()
  id?: string;
}
