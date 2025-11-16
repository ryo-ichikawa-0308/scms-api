import { UserServicesResponseServiceItemDto } from './user-services-response-service-item.dto';

/**
 * サービス詳細 レスポンスDTO
 */
export class UserServicesDetailResponseDto extends UserServicesResponseServiceItemDto {
  constructor(partial: Partial<UserServicesDetailResponseDto>) {
    super();
    Object.assign(this, partial);
  }
  // ユーザー提供サービスの明細と同じデータ構造
}
