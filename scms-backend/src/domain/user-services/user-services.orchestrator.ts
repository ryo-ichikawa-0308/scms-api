import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { UserServicesCreateRequestDto } from './dto/user-services-create-request.dto';
import { UserServicesService } from 'src/service/user-services/user-services.service';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';

/**
 * UserServicesのオーケストレーションクラス
 */
@Injectable()
export class UserServicesOrchestrator {
  constructor(
    private readonly userServicesService: UserServicesService,
    @Inject(PRISMA_TRANSACTION)
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  /**
   * ユーザー提供サービス登録
   * @param body UserServicesCreateRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns 登録したリソースのID
   */
  async create(
    body: UserServicesCreateRequestDto,
    userId: string,
  ): Promise<string> {
    // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
    const isUserServiceExists =
      await this.userServicesService.isUserServiceExists(
        body.userId,
        body.serviceId,
      );
    if (isUserServiceExists) {
      throw new ConflictException('このサービスは登録できません');
    }

    // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, 各種dtoを渡す
    const txDateTime = new Date();
    const response = await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        const result = await this.userServicesService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
        return result;
      },
    );
    // 3. 登録したリソースのIDを返す
    return response;
  }
}
