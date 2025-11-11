import { IsString, MaxLength } from 'class-validator';
import { ListRequestBase } from 'src/domain/common/common-paging.dto';

/**
 * サービス一覧 リクエストDTO
 */
export class UserServicesListRequestDto extends ListRequestBase {
  /** サービス名 */
  @IsString()
  @MaxLength(100)
  serviceName?: string;
}
