import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * ユーザー登録 レスポンスDTO
 */
export class UsersCreateResponseDto {
  /** ユーザーID */
  @IsNotEmpty()
  @IsString()
  @MinLength(36)
  @MaxLength(36)
  @IsUUID()
  id: string;
}
