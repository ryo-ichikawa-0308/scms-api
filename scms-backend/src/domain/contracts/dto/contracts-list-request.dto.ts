import { IsString, MaxLength } from 'class-validator';
import { ListRequestBase } from 'src/domain/common/common-paging.dto';

/**
 * 契約一覧 リクエストDTO
 */
export class ContractsListRequestDto extends ListRequestBase {
  /** サービス名 */
  @IsString()
  @MaxLength(100)
  serviceName?: string;
}
