import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListResponseBase } from 'src/domain/common/common-paging.dto';
import { ContractsResponseContractItemDto } from './contracts-response-contract-item.dto';

/**
 * 契約一覧 レスポンスDTO
 */
export class ContractsListResponseDto extends ListResponseBase<ContractsResponseContractItemDto> {
  /** 契約リスト */
  @ValidateNested({ each: true })
  @Type(() => ContractsResponseContractItemDto)
  contracts?: ContractsResponseContractItemDto[];
}
