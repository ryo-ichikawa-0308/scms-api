import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * サービス詳細 パスパラメータDTO
 */
export class UserServicesDetailPathParamsDto {
  /** ID (サービスID) */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  id: string; // JSON: serviceId, Name: id
}
