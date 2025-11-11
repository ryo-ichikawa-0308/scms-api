import { Injectable } from '@nestjs/common';
import type { PrismaTransaction } from 'src/prisma/prisma.type';
import { ContractsCreateRequestDto } from './dto/contracts-create-request.dto';
import { ContractsCancelQueryDto } from './dto/contracts-cancel-query.dto';
import { ContractsService } from '../../service/contracts/contracts.service';

/**
 * Contractsのオーケストレーションクラス
 */
@Injectable()
export class ContractsOrchestrator {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // サービス契約 (POST/create)
  /**
   * サービス契約
   * @param body ContractsCreateRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns 登録したリソースのID
   */
  async create(
    body: ContractsCreateRequestDto,
    userId: string,
  ): Promise<string> {
    // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
    await this.contractsService.isValidContract(body);
    const txDateTime = new Date();
    // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
    return this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        const result = await this.contractsService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );

        // 3. 結果を返却
        return result.id;
      },
    );
  }

  // サービス解約 (PATCH/cancel)
  /**
   * サービス解約
   * @param body ContractsCancelRequestDto
   * @param query ContractsCancelQueryDto
   * @param userId 認証情報から取得したユーザーID
   * @returns void
   */
  async cancel(query: ContractsCancelQueryDto, userId: string): Promise<void> {
    // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
    await this.contractsService.isValidCancel(query);

    // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, body, queryを渡す
    const txDateTime = new Date();
    await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        await this.contractsService.cancelWithTx(
          prismaTx,
          userId,
          txDateTime,
          query,
        );
      },
    );
  }
}
