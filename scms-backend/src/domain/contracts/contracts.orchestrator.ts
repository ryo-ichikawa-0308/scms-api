import { Inject, Injectable } from '@nestjs/common';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { ContractsCreateRequestDto } from './dto/contracts-create-request.dto';
import { ContractsService } from '../../service/contracts/contracts.service';
import { ContractsCancelPathParamsDto } from './dto/contracts-cancel-pathparams.dto';

/**
 * Contractsのオーケストレーションクラス
 */
@Injectable()
export class ContractsOrchestrator {
  constructor(
    private readonly contractsService: ContractsService,
    @Inject(PRISMA_TRANSACTION)
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
        return result;
      },
    );
  }

  // サービス解約 (PATCH/cancel)
  /**
   * サービス解約
   * @param body ContractsCancelRequestDto
   * @param pathParams ContractsCancelPathParamsDto
   * @param userId 認証情報から取得したユーザーID
   * @returns void
   */
  async cancel(
    pathParams: ContractsCancelPathParamsDto,
    userId: string,
  ): Promise<void> {
    // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
    await this.contractsService.isValidCancel(pathParams.id);

    // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, body, pathParams
    const txDateTime = new Date();
    await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        await this.contractsService.cancelWithTx(
          prismaTx,
          userId,
          txDateTime,
          pathParams.id,
        );
      },
    );
  }
}
