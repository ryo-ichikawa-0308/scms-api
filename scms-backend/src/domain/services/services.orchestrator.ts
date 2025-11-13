import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ServicesCreateRequestDto } from './dto/services-create-request.dto';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { ServicesService } from 'src/service/services/services.service';

/**
 * Servicesのオーケストレーションクラス
 */
@Injectable()
export class ServicesOrchestrator {
  constructor(
    private readonly servicesService: ServicesService,
    @Inject(PRISMA_TRANSACTION)
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // 登録系Actionのオーケストレーションメソッド
  /**
   * サービス登録
   * @param body ServicesCreateRequestDto
   * @param query {}
   * @param userId 認証情報から取得したユーザーID
   * @returns 登録したリソースのID
   */
  async create(
    body: ServicesCreateRequestDto,
    userId: string, // authRequired === trueのため指定
  ): Promise<string> {
    const txDateTime = new Date();

    const result = await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
        const isServiceExists = await this.servicesService.isServiceExists(
          body.name,
        );
        if (isServiceExists) {
          throw new ConflictException('このサービスは登録できません');
        }
        // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, 各種dtoを渡す
        const response = await this.servicesService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
        // 3. 登録したリソースのIDを返す
        return response;
      },
    );

    return result;
  }
}
