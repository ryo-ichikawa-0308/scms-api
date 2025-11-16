import { ContractsResponseContractItemDto } from './contracts-response-contract-item.dto';

/**
 * 契約詳細 レスポンスDTO
 */
export class ContractsDetailResponseDto extends ContractsResponseContractItemDto {
  constructor(partial: Partial<ContractsDetailResponseDto>) {
    super();
    Object.assign(this, partial);
  }
  // 契約一覧の明細と同じデータ構造
}
