import { Injectable, Inject } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.service'; // Assumed type

import { ContractsCreateRequestDto } from './dto/contracts-create-request.dto';
import { ContractsCancelQueryDto } from './dto/contracts-cancel-query.dto';
import { ContractsCancelRequestDto } from './contracts-cancel-request.dto';
import { ContractsService } from '../../service/contracts/contracts.service';

/**
 * Contractsのオーケストレーションクラス
 */
@Injectable()
export class ContractsOrchestrator {
  constructor(
    private readonly contractsService: ContractsService,
    // PrismaServiceから $transaction のみ公開するインターフェースをDI
    @Inject('PrismaTransaction') private readonly prismaTransaction: PrismaTransaction,
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
    userId: string
  ): Promise<string> {
    // 登録系Actionのオーケストレーションメソッドのテンプレート
    const txDateTime = new Date();

    return this.prismaTransaction.$transaction(async (prismaTx: PrismaTransaction) => {
      // 1. TODO: 項目間関連チェック(Service層のメソッドを呼び出す)
      // 2. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
      const result = await this.contractsService.createWithTx(prismaTx, userId, txDateTime, body);

      // 3. TODO: 結果を返却
      return result.id;
    });
  }

  // サービス解約 (PATCH/cancel)
  /**
   * サービス解約
   * @param body ContractsCancelRequestDto
   * @param query ContractsCancelQueryDto
   * @param userId 認証情報から取得したユーザーID
   * @returns void
   */
  async cancel(
    body: ContractsCancelRequestDto,
    query: ContractsCancelQueryDto,
    userId: string
  ): Promise<void> {
    // 更新系Actionのオーケストレーションメソッドのテンプレート
    const txDateTime = new Date();

    await this.prismaTransaction.$transaction(async (prismaTx: PrismaTransaction) => {
      // 1. TODO: 項目間関連チェック(Service層のメソッドを呼び出す)
      // 2. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, body, queryを渡す
      await this.contractsService.cancelWithTx(prismaTx, userId, txDateTime, body, query);
    });
  }
}