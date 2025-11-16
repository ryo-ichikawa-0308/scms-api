import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListResponseBase } from 'src/domain/common/common-paging.dto';
import { UserServicesResponseServiceItemDto } from './user-services-response-service-item.dto';

/**
 * サービス一覧 レスポンスDTO
 */
export class UserServicesListResponseDto extends ListResponseBase<UserServicesResponseServiceItemDto> {
  constructor(partial: Partial<UserServicesListResponseDto>) {
    super();
    Object.assign(this, partial);
  }
  /** サービスリスト */
  @ValidateNested({ each: true })
  @Type(() => UserServicesResponseServiceItemDto)
  userServices?: UserServicesResponseServiceItemDto[];
}
